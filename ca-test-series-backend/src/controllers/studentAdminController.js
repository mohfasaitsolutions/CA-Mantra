const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const TestSeries = require('../models/TestSeries');
const ROLES = require('../constants/roles');

function toUiCaLevel(level) {
  switch (level) {
    case 'FOUNDATION':
      return 'Foundation';
    case 'INTERMEDIATE':
      return 'Intermediate';
    case 'FINAL':
      return 'Final';
    default:
      return 'Foundation';
  }
}

function toUiStatus(isActive) {
  // Treat missing (undefined/null) as active for legacy records; only explicit false is inactive
  return isActive === false ? 'inactive' : 'active';
}

// GET /api/admin/students
// Query: q, purchased=all|yes|no, status=all|active|inactive, caLevel, page, pageSize, sortBy, sortOrder
exports.listStudents = async (req, res, next) => {
  try {
    const {
      q,
      purchased = 'all',
      status = 'all',
      caLevel,
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

    // Base match: students only
    const match = { role: ROLES.STUDENTS };
    if (q) {
      match.$or = [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }
    if (status === 'active') match.$or = [{ isActive: true }, { isActive: { $exists: false } }, { isActive: null }];
    if (status === 'inactive') match.isActive = false;
    if (caLevel && ['FOUNDATION', 'INTERMEDIATE', 'FINAL'].includes(caLevel)) {
      match.caLevel = caLevel;
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: match },
      // Lookup active Enrollments to determine purchase status
      {
        $lookup: {
          from: 'enrollments',
          let: { sid: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$studentId', '$$sid'] }, { $eq: ['$isActive', true] }] } } },
            { $project: { testSeriesId: 1 } }
          ],
          as: 'activeEnrollments'
        }
      },
      // Lookup TestSeries to count tests
      {
        $lookup: {
          from: 'testseries',
          localField: 'activeEnrollments.testSeriesId',
          foreignField: '_id',
          let: {},
          pipeline: [
            { $project: { testCount: { $size: { $ifNull: ['$tests', []] } } } }
          ],
          as: 'purchasedSeries'
        }
      },
      // Sum up the tests
      {
        $addFields: {
          purchasedCount: {
            $reduce: {
              input: '$purchasedSeries',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.testCount'] }
            }
          }
        }
      },
      { $project: { activeEnrollments: 0, purchasedSeries: 0 } },

      // Lookup and aggregate submissions
      {
        $lookup: {
          from: 'submissions',
          let: { sid: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$studentId', '$$sid'] }, { $eq: ['$status', 'COMPLETED'] }] } } },
            { $group: { _id: null, sumAwarded: { $sum: { $ifNull: ['$awardedMarks', 0] } }, sumTotal: { $sum: { $ifNull: ['$totalMarks', 0] } }, count: { $sum: 1 } } },
            { $project: { _id: 0, testsCompleted: '$count', averageScore: { $cond: [{ $gt: ['$sumTotal', 0] }, { $multiply: [{ $divide: ['$sumAwarded', '$sumTotal'] }, 100] }, 0] } } },
          ],
          as: 'agg',
        },
      },
      { $addFields: { testsCompleted: { $ifNull: [{ $arrayElemAt: ['$agg.testsCompleted', 0] }, 0] }, averageScore: { $ifNull: [{ $arrayElemAt: ['$agg.averageScore', 0] }, 0] } } },
      { $project: { agg: 0 } },
    ];

    // Purchased filter
    if (purchased === 'yes') {
      pipeline.push({ $match: { purchasedCount: { $gt: 0 } } });
    } else if (purchased === 'no') {
      pipeline.push({ $match: { purchasedCount: { $eq: 0 } } });
    }

    // Sorting
    const sortFields = new Set(['createdAt', 'fullName', 'testsPurchased', 'testsCompleted', 'averageScore']);
    let sField = sortFields.has(sortBy) ? sortBy : 'createdAt';
    const sOrder = sortOrder === 'asc' ? 1 : -1;

    // Handle testPurchased sort mapping to purchasedCount
    if (sField === 'testsPurchased') sField = 'purchasedCount';

    pipeline.push({ $sort: { [sField]: sOrder, _id: 1 } });

    // Facet for pagination and total
    pipeline.push({
      $facet: {
        data: [{ $skip: (pageNum - 1) * sizeNum }, { $limit: sizeNum }],
        meta: [{ $count: 'total' }],
      },
    });

    const result = await User.aggregate(pipeline);
    const docs = result[0]?.data || [];
    const total = result[0]?.meta?.[0]?.total || 0;

    const data = docs.map((u) => {
      return {
        id: String(u._id),
        studentId: u.studentNumericId || null,
        name: u.fullName,
        email: u.email,
        caLevel: toUiCaLevel(u.caLevel),
        registrationDate: u.createdAt,
        testsCompleted: u.testsCompleted || 0,
        averageScore: Math.round((u.averageScore || 0) * 100) / 100,
        status: toUiStatus(u.isActive),
        phone: u.mobile || '',
        location: u.address || '',
        testsPurchased: u.purchasedCount || 0,
      };
    });

    res.json({ data, page: pageNum, pageSize: sizeNum, total });
  } catch (err) { next(err); }
};

// GET /api/admin/students/:id
exports.getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const user = await User.findOne({ _id: id, role: ROLES.STUDENTS });
    if (!user) return res.status(404).json({ message: 'Student not found' });

    // Aggregate stats
    const [stats] = await Submission.aggregate([
      { $match: { studentId: user._id, status: 'COMPLETED' } },
      { $group: { _id: null, sumAwarded: { $sum: { $ifNull: ['$awardedMarks', 0] } }, sumTotal: { $sum: { $ifNull: ['$totalMarks', 0] } }, count: { $sum: 1 } } },
      { $project: { _id: 0, testsCompleted: '$count', averageScore: { $cond: [{ $gt: ['$sumTotal', 0] }, { $multiply: [{ $divide: ['$sumAwarded', '$sumTotal'] }, 100] }, 0] } } },
    ]);

    // Compute testsPurchased: count all active enrollments and sum tests in those series
    const enrollments = await Enrollment.find({ studentId: user._id, isActive: true });
    const seriesIds = enrollments.map(e => String(e.testSeriesId));
    let testsPurchased = 0;
    if (seriesIds.length > 0) {
      const seriesList = await TestSeries.find({ _id: { $in: seriesIds } }).select('tests');
      for (const s of seriesList) {
        if (Array.isArray(s.tests)) testsPurchased += s.tests.length;
      }
    }

    res.json({
      id: String(user._id),
      studentId: user.studentNumericId || null,
      name: user.fullName,
      email: user.email,
      caLevel: toUiCaLevel(user.caLevel),
      registrationDate: user.createdAt,
      testsCompleted: stats?.testsCompleted || 0,
      averageScore: Math.round((stats?.averageScore || 0) * 100) / 100,
      status: toUiStatus(user.isActive),
      phone: user.mobile || '',
      location: user.address || '',
      testsPurchased,
    });
  } catch (err) { next(err); }
};

// PATCH /api/admin/students/:id/status { status: 'active'|'inactive' }
exports.updateStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    if (!['active', 'inactive'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const user = await User.findOneAndUpdate(
      { _id: id, role: ROLES.STUDENTS },
      { isActive: status === 'active' },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'Student not found' });

    res.json({ id: String(user._id), status: toUiStatus(user.isActive) });
  } catch (err) { next(err); }
};

// GET /api/admin/students/:id/submissions
// Query: status (all|completed|pending|assigned|in_progress), page, pageSize
exports.listStudentSubmissions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'all', page = 1, pageSize = 20 } = req.query;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const studentId = new mongoose.Types.ObjectId(id);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const sizeNum = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

    const statusMap = {
      completed: 'COMPLETED',
      pending: 'PENDING',
      assigned: 'ASSIGNED',
      in_progress: 'IN_PROGRESS',
    };

    const match = { studentId };
    if (status !== 'all') {
      const mapped = statusMap[status];
      if (!mapped) return res.status(400).json({ message: 'Invalid status' });
      match.status = mapped;
    }

    const pipeline = [
      { $match: match },
      // Lookup evaluator for name
      { $lookup: { from: 'users', localField: 'evaluatorId', foreignField: '_id', as: 'evaluator' } },
      { $addFields: { evaluator: { $arrayElemAt: ['$evaluator', 0] } } },
      // Lookup test title from TestSeries.tests array
      {
        $lookup: {
          from: 'testseries',
          let: { tsid: '$testSeriesId', tid: '$testId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$tsid'] } } },
            { $unwind: '$tests' },
            { $match: { $expr: { $eq: ['$tests._id', '$$tid'] } } },
            { $project: { _id: 0, title: '$tests.title' } },
          ],
          as: 'testInfo',
        },
      },
      { $addFields: { testInfo: { $arrayElemAt: ['$testInfo', 0] } } },
      { $sort: { createdAt: -1, _id: 1 } },
      { $facet: { data: [{ $skip: (pageNum - 1) * sizeNum }, { $limit: sizeNum }], meta: [{ $count: 'total' }] } },
    ];

    const result = await Submission.aggregate(pipeline);
    const docs = result[0]?.data || [];
    const total = result[0]?.meta?.[0]?.total || 0;

    const data = docs.map((s) => ({
      id: String(s._id),
      submissionId: String(s._id),
      testName: s.testInfo?.title || s.subject,
      date: s.createdAt,
      evaluatorName: s.evaluator?.fullName || null,
      status: s.status,
      score: typeof s.awardedMarks === 'number' && typeof s.totalMarks === 'number' ? {
        awarded: s.awardedMarks,
        total: s.totalMarks,
      } : null,
    }));

    res.json({ data, page: pageNum, pageSize: sizeNum, total });
  } catch (err) { next(err); }
};

// GET /api/admin/students/:id/notes
exports.listStudentNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const user = await User.findOne({ _id: id, role: ROLES.STUDENTS }).select('meta');
    if (!user) return res.status(404).json({ message: 'Student not found' });
    const notes = (user.meta && Array.isArray(user.meta.adminNotes)) ? user.meta.adminNotes : [];
    const data = notes.map((n) => ({
      id: String(n._id || new mongoose.Types.ObjectId()),
      note: n.note || String(n),
      authorId: n.author || null,
      createdAt: n.createdAt || user.updatedAt || new Date(),
    }));
    res.json({ data });
  } catch (err) { next(err); }
};

// POST /api/admin/students/:id/notes { note: string }
exports.addStudentNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { note } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    if (!note || typeof note !== 'string' || note.trim().length < 2) return res.status(400).json({ message: 'Note is required' });
    const payload = { _id: new mongoose.Types.ObjectId(), note: note.trim(), author: req.user?.id || null, createdAt: new Date() };
    const updated = await User.findOneAndUpdate(
      { _id: id, role: ROLES.STUDENTS },
      { $push: { 'meta.adminNotes': payload } },
      { new: true, upsert: false }
    );
    if (!updated) return res.status(404).json({ message: 'Student not found' });
    res.status(201).json({ id: String(payload._id), note: payload.note, authorId: payload.author, createdAt: payload.createdAt });
  } catch (err) { next(err); }
};

// POST /api/admin/students/:id/email { subject, message }
// Simple utility to send an email to a student from admin panel.
// For now this stores a placeholder in adminNotes and logs; integrate real mailer later.
exports.emailStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subject, message } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    if (!subject || typeof subject !== 'string' || subject.trim().length < 2) {
      return res.status(400).json({ message: 'Subject is required' });
    }
    if (!message || typeof message !== 'string' || message.trim().length < 2) {
      return res.status(400).json({ message: 'Message is required' });
    }
    const user = await User.findOne({ _id: id, role: ROLES.STUDENTS });
    if (!user) return res.status(404).json({ message: 'Student not found' });
    // TODO: plug actual mailer (e.g., nodemailer / SES). For now just log.
    console.log('[ADMIN EMAIL STUDENT]', { to: user.email, subject, message });
    // Optionally store an admin note referencing the email
    const payload = { _id: new mongoose.Types.ObjectId(), note: `[EMAIL] ${subject}\n${message}`, author: req.user?.id || null, createdAt: new Date() };
    await User.updateOne(
      { _id: id, role: ROLES.STUDENTS },
      { $push: { 'meta.adminNotes': payload } }
    );
    res.status(202).json({ ok: true, queued: true });
  } catch (err) { next(err); }
};

// GET /api/admin/students/:id/purchases
exports.listStudentPurchases = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const enrollments = await Enrollment.find({ studentId: id, isActive: true })
      .populate('testSeriesId', 'title price')
      .sort({ createdAt: -1 });

    const data = enrollments.map(e => {
      const ts = e.testSeriesId || {};
      return {
        id: String(e.testSeriesId?._id || e._id), // Use TestSeries ID if available
        title: ts.title || 'Unknown Series',
        price: ts.price || 0,
        purchaseDate: e.createdAt,
        validUntil: e.validUntil,
        status: e.isActive ? 'active' : 'expired'
      };
    });

    res.json({ data });
  } catch (err) { next(err); }
};

// POST /api/admin/students/:id/grant-retake { testId }
// Deletes the submission so the student can take the test again.
exports.grantRetake = async (req, res, next) => {
  try {
    const { id } = req.params; // studentId
    const { testId, submissionId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid student id' });
    if (submissionId && !mongoose.Types.ObjectId.isValid(submissionId)) return res.status(400).json({ message: 'Invalid submission id' });
    if (!submissionId && !mongoose.Types.ObjectId.isValid(testId)) return res.status(400).json({ message: 'Invalid test id' });

    const deleteCriteria = submissionId
      ? { _id: submissionId, studentId: id }
      : { studentId: id, testId: testId };

    const result = await Submission.findOneAndDelete(deleteCriteria);

    if (!result) {
      return res.status(404).json({ message: 'Submission not found or already reset.' });
    }

    // Log action
    console.log(`[ADMIN] Granted retake for Student ${id}. Deleted submission ${result._id}`);

    // If we wanted to keep history, we would archive it instead of deleting.
    // But for "Retake", deleting the attempt is usually what's expected to clear the "Already Attempted" block.

    res.json({
      message: 'Retake granted successfully',
      deletedSubmissionId: result._id,
      deletedSubmissionNumber: result.submissionNumber || null
    });
  } catch (err) { next(err); }
};
