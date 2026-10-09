const mongoose = require('mongoose');
const User = require('../models/User');
const TestSeries = require('../models/TestSeries');
const Submission = require('../models/Submission');
const Enrollment = require('../models/Enrollment');
const SupportTicket = require('../models/SupportTicket');
const StudyMaterial = require('../models/StudyMaterial');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const ROLES = require('../constants/roles');
const { uploadSubmissionPDF, getFileUrl, handleFileUploadError } = require('../utils/fileUpload');

// Helper: map server CA level to UI label
function toUiCaLevel(level) {
  switch (level) {
    case 'FOUNDATION': return 'Foundation';
    case 'INTERMEDIATE': return 'Intermediate';
    case 'FINAL': return 'Final';
    default: return 'Foundation';
  }
}

function formatValidityForResponse(validity) {
  if (!validity || validity.isUnlimited) {
    return { isUnlimited: true };
  }

  const normalized = { isUnlimited: false };
  if (validity.expiryDate) {
    const expiry = new Date(validity.expiryDate);
    if (!Number.isNaN(expiry.getTime())) {
      const diffMs = expiry.getTime() - Date.now();
      normalized.days = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
      normalized.expiryDate = expiry.toISOString();
      return normalized;
    }
  }

  normalized.days = Number.isFinite(Number(validity.days)) ? Number(validity.days) : 0;
  return normalized;
}

function isSeriesExpired(validity) {
  if (!validity || validity.isUnlimited) return false;
  if (!validity.expiryDate) return false;
  const expiry = new Date(validity.expiryDate);
  if (Number.isNaN(expiry.getTime())) return false;
  return expiry.getTime() < Date.now();
}

// GET /api/students/dashboard
// Returns summary metrics for the logged-in student
exports.getDashboard = async (req, res) => {
  const studentId = req.user.id;

  // Parallel fetches for performance
  const [user, enrollCount, submittedTestsAgg, evaluatedAgg, submissionsCount] = await Promise.all([
    User.findById(studentId).select('fullName email caLevel mobile address meta createdAt'),
    Enrollment.countDocuments({ studentId, isActive: true }),
    // Count all submitted tests (regardless of evaluation status)
    Submission.countDocuments({ studentId }),
    // Count only evaluated tests and calculate average score
    Submission.aggregate([
      {
        $match: {
          studentId: new mongoose.Types.ObjectId(studentId),
          status: 'COMPLETED',
          awardedMarks: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          sumAwarded: { $sum: { $ifNull: ['$awardedMarks', 0] } },
          sumTotal: { $sum: { $ifNull: ['$totalMarks', 0] } },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          evaluatedTests: '$count',
          averageScore: {
            $cond: [
              { $gt: ['$sumTotal', 0] },
              { $multiply: [{ $divide: ['$sumAwarded', '$sumTotal'] }, 100] },
              0
            ]
          }
        }
      },
    ]),
    Submission.countDocuments({ studentId }),
  ]);

  const evaluatedStats = evaluatedAgg?.[0] || { evaluatedTests: 0, averageScore: 0 };

  // Parse address to extract city and state
  const parseAddress = (address) => {
    if (!address) return { city: '', state: '' };

    // Try to extract components from address like "Street, City, State - Pincode"
    const parts = address.split(',').map(part => part.trim());
    if (parts.length < 2) return { city: '', state: '' };

    // Work backwards: last part usually contains "State - Pincode"
    const lastPart = parts[parts.length - 1];
    const stateMatch = lastPart.match(/^(.+?)\s*-\s*\d{6}$/);
    const state = stateMatch ? stateMatch[1].trim() : '';

    // Second last part is usually city
    const city = parts.length > 1 ? parts[parts.length - 2].trim() : '';

    return { city, state };
  };

  const addressParts = parseAddress(user?.address);

  return res.json({
    profile: {
      name: user?.fullName,
      email: user?.email,
      phone: user?.mobile || '',
      caLevel: toUiCaLevel(user?.caLevel),
      city: addressParts.city,
      state: addressParts.state,
      country: 'India',
      isProfileComplete: Boolean(user?.mobile && user?.address),
    },
    metrics: {
      purchasedSeries: enrollCount,
      completedTests: submittedTestsAgg, // All submitted tests (what student sees as "completed")
      averageScore: Math.round((evaluatedStats.averageScore || 0) * 100) / 100,
      totalSubmissions: submissionsCount,
    },
  });
};

// GET /api/students/analytics
// Returns analytics data for the logged-in student
exports.getAnalytics = async (req, res) => {
  const studentId = req.user.id;

  // Get current student info for location-based ranking
  const currentStudent = await User.findById(studentId).select('address meta');

  // Logic to compute ranks, performance, and subject strengths
  // Only include submissions that have been evaluated (have awardedMarks)
  const performanceData = await Submission.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId),
        awardedMarks: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: '$subject',
        averageScore: { $avg: '$awardedMarks' },
        totalAttempts: { $sum: 1 },
        averagePercentage: {
          $avg: {
            $cond: [
              { $gt: ['$totalMarks', 0] },
              { $multiply: [{ $divide: ['$awardedMarks', '$totalMarks'] }, 100] },
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        subject: '$_id',
        averageScore: { $round: ['$averageScore', 2] },
        averagePercentage: { $round: ['$averagePercentage', 2] },
        totalAttempts: 1
      }
    },
  ]);

  // Calculate overall student performance
  const overallStats = await Submission.aggregate([
    {
      $match: {
        studentId: new mongoose.Types.ObjectId(studentId),
        awardedMarks: { $exists: true, $ne: null }
      }
    },
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        averagePercentage: {
          $avg: {
            $cond: [
              { $gt: ['$totalMarks', 0] },
              { $multiply: [{ $divide: ['$awardedMarks', '$totalMarks'] }, 100] },
              0
            ]
          }
        }
      }
    }
  ]);

  const studentOverallPercentage = overallStats[0]?.averagePercentage || 0;

  // Get all active students
  const allStudents = await User.find({ role: ROLES.STUDENTS, isActive: true }).select('_id');
  const totalStudents = allStudents.length;

  // Get all students' average percentages
  const allStudentPercentages = await Submission.aggregate([
    { $match: { awardedMarks: { $exists: true, $ne: null } } },
    {
      $group: {
        _id: '$studentId',
        averagePercentage: {
          $avg: {
            $cond: [
              { $gt: ['$totalMarks', 0] },
              { $multiply: [{ $divide: ['$awardedMarks', '$totalMarks'] }, 100] },
              0
            ]
          }
        }
      }
    }
  ]);

  // Map studentId to averagePercentage
  const percentageMap = new Map();
  allStudentPercentages.forEach(s => {
    percentageMap.set(String(s._id), s.averagePercentage);
  });

  // Build ranking list for all students
  const rankingList = allStudents.map(s => ({
    _id: s._id,
    averagePercentage: percentageMap.get(String(s._id)) || 0
  }));

  // Sort by averagePercentage descending
  rankingList.sort((a, b) => b.averagePercentage - a.averagePercentage);

  // Find this student's rank
  let allIndiaRank = null;
  let percentile = 0;
  for (let i = 0; i < rankingList.length; i++) {
    if (String(rankingList[i]._id) === String(studentId)) {
      allIndiaRank = i + 1;
      percentile = Math.round(((totalStudents - allIndiaRank) / totalStudents) * 100);
      break;
    }
  }

  // For state and city ranks, we'll use simplified logic (in real app, this would use proper geo data)
  const stateRank = allIndiaRank ? Math.max(1, Math.floor(allIndiaRank * 0.3)) : null;
  const cityRank = allIndiaRank ? Math.max(1, Math.floor(allIndiaRank * 0.1)) : null;

  return res.json({
    performanceData,
    rankings: {
      allIndiaRank,
      stateRank,
      cityRank,
      percentile,
      totalStudents,
      overallPercentage: Math.round(studentOverallPercentage * 100) / 100
    }
  });
};
// GET /api/students/purchases
// List purchased test series with shallow details
exports.getPurchasedSeries = async (req, res) => {
  const studentId = req.user.id;

  // Fetch enrollments with their associated payments
  const enrollments = await Enrollment.find({ studentId, isActive: true })
    .sort({ createdAt: -1 });

  const seriesIds = enrollments.map(e => e.testSeriesId);

  // Fetch test series data
  const series = await TestSeries.find({ _id: { $in: seriesIds } })
    .select('title description price caLevel thumbnailUrl tests createdAt validity attempts');

  // Fetch payment data for these enrollments
  const payments = await Payment.find({
    studentId,
    testSeriesId: { $in: seriesIds },
    status: 'CAPTURED',
    isVerified: true
  }).select('testSeriesId amount razorpayPaymentId razorpayOrderId createdAt paymentMethod');

  const seriesMap = new Map(series.map(s => [String(s._id), s]));
  const paymentMap = new Map(payments.map(p => [String(p.testSeriesId), p]));

  // Filter out enrollments where test series no longer exists and map to response format
  const data = enrollments
    .map(e => {
      const s = seriesMap.get(String(e.testSeriesId));
      // Skip if test series doesn't exist
      if (!s) {
        console.warn(`Test series ${e.testSeriesId} not found for enrollment ${e._id}`);
        return null;
      }

      const payment = paymentMap.get(String(e.testSeriesId));

      return {
        id: String(e.testSeriesId),
        title: s.title || 'Test Series',
        description: s.description || '',
        thumbnail: s.thumbnailUrl || '',
        price: s.price || 0,
        level: toUiCaLevel(s.caLevel),
        isPurchased: true,
        attemptsUsed: 0, // Placeholder, can compute from attempts meta later
        attemptsTotal: s.attempts?.isUnlimited ? Infinity : (s.attempts?.count || 0),
        evaluationStatus: undefined,
        validity: formatValidityForResponse(s.validity),
        purchaseDate: e.createdAt ? e.createdAt.toISOString() : null,
        // Payment details
        paymentInfo: payment ? {
          amount: payment.amount,
          paymentId: payment.razorpayPaymentId,
          orderId: payment.razorpayOrderId,
          paymentMethod: payment.paymentMethod,
          paymentDate: payment.createdAt ? payment.createdAt.toISOString() : null
        } : null
      };
    })
    .filter(item => item !== null); // Remove null entries

  res.json({ data });
};

// GET /api/students/history
// Returns submission history for the student
exports.getTestHistory = async (req, res) => {
  const studentId = req.user.id;
  const { page = 1, pageSize = 20 } = req.query;
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

  const pipeline = [
    { $match: { studentId: new mongoose.Types.ObjectId(studentId) } },
    // Lookup test title and type
    {
      $lookup: {
        from: 'testseries',
        let: { tsid: '$testSeriesId', tid: '$testId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$tsid'] } } },
          { $unwind: '$tests' },
          { $match: { $expr: { $eq: ['$tests._id', '$$tid'] } } },
          {
            $project: {
              _id: 0,
              title: '$tests.title',
              testType: '$tests.testType',
              subject: '$tests.subject',
              totalMarks: '$tests.totalMarks',
              answerPdfUrl: '$tests.suggestedAnswerUrl',
              questionPaperUrl: '$tests.questionPaperUrl'
            }
          },
        ],
        as: 'testInfo',
      },
    },
    // Lookup evaluator information
    {
      $lookup: {
        from: 'users',
        localField: 'evaluatorId',
        foreignField: '_id',
        as: 'evaluatorInfo',
      },
    },
    {
      $addFields: {
        testInfo: { $arrayElemAt: ['$testInfo', 0] },
        evaluatorInfo: { $arrayElemAt: ['$evaluatorInfo', 0] }
      }
    },
    { $sort: { createdAt: -1, _id: 1 } },
    { $facet: { data: [{ $skip: (p - 1) * s }, { $limit: s }], meta: [{ $count: 'total' }] } },
  ];

  const result = await Submission.aggregate(pipeline);
  const docs = result[0]?.data || [];
  const total = result[0]?.meta?.[0]?.total || 0;

  const data = docs.map(d => ({
    id: String(d._id),
    submissionNumber: d.submissionNumber, // Numeric submission ID
    testId: String(d.testId),
    testName: d.testInfo?.title || d.subject || 'Unknown Test',
    date: d.submittedAt || d.createdAt,
    score: typeof d.awardedMarks === 'number' ? d.awardedMarks : undefined,
    maxScore: typeof d.totalMarks === 'number' ? d.totalMarks : (d.testInfo?.totalMarks || 0),
    status: d.status === 'COMPLETED' ? 'completed' : (d.status === 'PENDING' ? 'pending' : 'pending'),
    type: d.testInfo?.testType === 'OBJECTIVE' ? 'objective' : (d.testInfo?.testType === 'SUBJECTIVE' ? 'subjective' : 'mixed'),
    subject: d.testInfo?.subject || d.subject || '',
    evaluatorName: d.evaluatorInfo?.fullName || undefined,
    hasRated: Boolean(d.meta?.hasRated),
    answerPdfUrl: d.testInfo?.answerPdfUrl,
    questionPaperUrl: d.testInfo?.questionPaperUrl,
    evaluatedFileUrl: d.evaluatedFileUrl
  }));

  res.json({ data, page: p, pageSize: s, total });
};

// POST /api/students/purchases/:testSeriesId
// DEPRECATED: Direct purchase without payment is not allowed
// Users must go through payment gateway (POST /api/payments/create-order)
exports.purchaseSeries = async (req, res) => {
  return res.status(403).json({
    message: 'Direct purchase is not allowed. Please use the payment gateway to purchase test series.',
    requiresPayment: true
  });
};

// GET /api/students/profile-complete
exports.isProfileComplete = async (req, res) => {
  const user = await User.findById(req.user.id).select('mobile address');
  const complete = Boolean(user?.mobile && user?.address);
  res.json({ isComplete: complete });
};

// GET /api/students/unattempted
// Returns tests from purchased series that the student hasn't attempted yet
exports.getUnattemptedTests = async (req, res) => {
  const studentId = req.user.id;
  const { page = 1, pageSize = 100 } = req.query;
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const s = Math.min(Math.max(parseInt(pageSize, 10) || 100, 1), 200);

  const pipeline = [
    { $match: { studentId: new mongoose.Types.ObjectId(studentId), isActive: true } },
    {
      $lookup: {
        from: 'testseries',
        localField: 'testSeriesId',
        foreignField: '_id',
        as: 'series',
      },
    },
    { $unwind: '$series' },
    { $unwind: '$series.tests' },
    {
      $lookup: {
        from: 'submissions',
        let: { sid: '$studentId', tsid: '$series._id', tid: '$series.tests._id' },
        pipeline: [
          { $match: { $expr: { $and: [{ $eq: ['$studentId', '$$sid'] }, { $eq: ['$testSeriesId', '$$tsid'] }, { $eq: ['$testId', '$$tid'] }] } } },
          { $limit: 1 },
        ],
        as: 'attempts',
      },
    },
    {
      $addFields: {
        attempted: { $gt: [{ $size: '$attempts' }, 0] },
        // For mixed tests, check if both parts are completed
        isMixed: { $eq: ['$series.tests.testType', 'MIXED'] },
        submission: { $arrayElemAt: ['$attempts', 0] }
      }
    },
    {
      $addFields: {
        // For mixed tests, only consider fully attempted if both objective and subjective are done
        fullyAttempted: {
          $cond: [
            '$isMixed',
            {
              $and: [
                { $gt: [{ $size: '$attempts' }, 0] },
                { $eq: ['$submission.meta.objectiveSubmitted', true] },
                { $eq: ['$submission.meta.subjectiveSubmitted', true] }
              ]
            },
            '$attempted'
          ]
        }
      }
    },
    { $match: { fullyAttempted: false } },
    {
      $project: {
        _id: 0,
        seriesId: '$series._id',
        testId: '$series.tests._id',
        title: '$series.tests.title',
        subject: '$series.tests.subject',
        testType: '$series.tests.testType',
        price: '$series.price',
        level: '$series.caLevel',
        thumbnail: '$series.thumbnailUrl',
        description: '$series.description',
        validity: '$series.validity',
        attempts: '$series.attempts',
        purchaseDate: '$purchasedAt',
        // Include partial completion info for mixed tests
        objectiveCompleted: {
          $cond: [
            '$isMixed',
            { $ifNull: ['$submission.meta.objectiveSubmitted', false] },
            null
          ]
        },
        subjectiveCompleted: {
          $cond: [
            '$isMixed',
            { $ifNull: ['$submission.meta.subjectiveSubmitted', false] },
            null
          ]
        }
      },
    },
    { $sort: { purchaseDate: -1, seriesId: 1, testId: 1 } },
    { $facet: { data: [{ $skip: (p - 1) * s }, { $limit: s }], meta: [{ $count: 'total' }] } },
  ];

  const result = await mongoose.model('Enrollment').aggregate(pipeline);
  const docs = result[0]?.data || [];
  const total = result[0]?.meta?.[0]?.total || 0;

  const data = docs.map(d => ({
    seriesId: String(d.seriesId),
    testId: String(d.testId),
    title: d.title,
    subject: d.subject,
    testType: d.testType === 'OBJECTIVE' ? 'objective' :
      d.testType === 'SUBJECTIVE' ? 'subjective' : 'mixed',
    price: d.price || 0,
    level: toUiCaLevel(d.level),
    thumbnail: d.thumbnail || '',
    description: d.description || '',
    purchaseDate: d.purchaseDate || null,
    objectiveCompleted: d.objectiveCompleted,
    subjectiveCompleted: d.subjectiveCompleted
  }));

  res.json({ data, page: p, pageSize: s, total });
};

// GET /api/students/tests/:testSeriesId/:testId
// Returns minimal test metadata for starting a test
exports.getTestDetail = async (req, res) => {
  const { testSeriesId, testId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(testSeriesId) || !mongoose.Types.ObjectId.isValid(testId)) {
    return res.status(400).json({ message: 'Invalid ids' });
  }
  // Ensure student has enrollment
  const has = await Enrollment.findOne({ studentId: req.user.id, testSeriesId, isActive: true });
  if (!has) return res.status(403).json({ message: 'You have not purchased this series' });
  const ts = await TestSeries.findById(testSeriesId).select('title caLevel description tests validity');
  if (!ts) return res.status(404).json({ message: 'Test series not found' });
  if (isSeriesExpired(ts.validity)) return res.status(403).json({ message: 'This test series validity has expired' });
  const test = ts.tests.id(testId);
  if (!test) return res.status(404).json({ message: 'Test not found' });
  const data = {
    seriesId: String(ts._id),
    testId: String(test._id),
    title: test.title,
    testType: test.testType,
    subject: test.subject,
    duration: test.duration || null,
    totalMarks: test.totalMarks || 0,
    questionPaperUrl: test.questionPaperUrl || null,
    instructions: test.instructions || '',
    objectiveMarks: test.objectiveMarks || 0,
    subjectiveMarks: test.subjectiveMarks || 0
  };
  if (test.testType === 'OBJECTIVE' || test.testType === 'MIXED') {
    data.mcqQuestions = (test.mcqQuestions || []).map((q, idx) => ({
      index: idx,
      questionText: q.questionText,
      options: q.options,
      marks: q.marks,
      negativeMarks: q.negativeMarks || 0
    }));
  }
  return res.json({ test: data, series: { title: ts.title, caLevel: ts.caLevel, description: ts.description || '' } });
};

// POST /api/students/tests/:testSeriesId/:testId/objective-submission
// Body: { answers: Array<{ questionIndex: number, answer: 'A'|'B'|'C'|'D' }>} - Automatic evaluation and scoring
exports.submitObjective = async (req, res) => {
  const { testSeriesId, testId } = req.params;
  const { answers } = req.body || {};
  if (!Array.isArray(answers)) return res.status(400).json({ message: 'answers array is required' });

  const ts = await TestSeries.findById(testSeriesId).select('tests attempts validity');
  if (!ts) return res.status(404).json({ message: 'Test series not found' });
  if (isSeriesExpired(ts.validity)) return res.status(403).json({ message: 'This test series validity has expired' });

  const test = ts.tests.id(testId);
  if (!test || (test.testType !== 'OBJECTIVE' && test.testType !== 'MIXED')) {
    return res.status(400).json({ message: 'Invalid objective or mixed test' });
  }

  // Check if student has enrollment for this test series
  const enrollment = await Enrollment.findOne({ studentId: req.user.id, testSeriesId, isActive: true });
  if (!enrollment) return res.status(403).json({ message: 'You have not purchased this series' });

  // For objective tests: Check if submission exists and handle accordingly
  const existingSubmission = await Submission.findOne({
    studentId: req.user.id,
    testSeriesId,
    testId
  });

  // Check if multiple attempts are allowed
  const attemptsPolicy = ts.attempts || { isUnlimited: true };
  let attemptNumber = 1;

  if (existingSubmission) {
    // For mixed tests, check if objective part already submitted
    if (test.testType === 'MIXED' && existingSubmission.meta?.objectiveSubmitted) {
      return res.status(400).json({
        message: 'Objective part already submitted for this mixed test'
      });
    }

    // Check if multiple attempts are allowed for pure objective tests
    if (test.testType === 'OBJECTIVE') {
      const currentAttempts = existingSubmission.meta?.attemptNumber || 1;
      const isMultipleAttemptsAllowed = attemptsPolicy.isUnlimited ||
        (attemptsPolicy.count && currentAttempts < attemptsPolicy.count);

      if (!isMultipleAttemptsAllowed) {
        return res.status(400).json({
          message: 'Maximum attempts reached for this test',
          attemptsUsed: currentAttempts,
          maxAttempts: attemptsPolicy.count || 'Unlimited'
        });
      }

      attemptNumber = currentAttempts + 1;
    }
  }

  // Automatic evaluation for objective tests
  let awardedMarks = 0;
  const questionAnalysis = [];
  const correctAnswers = [];

  // Process each question for scoring
  const mcqQuestions = test.mcqQuestions || [];

  for (let i = 0; i < mcqQuestions.length; i++) {
    const question = mcqQuestions[i];
    const studentAnswer = answers.find(a => a.questionIndex === i);
    const correctAnswer = question.correctAnswer;
    const isCorrect = studentAnswer && studentAnswer.answer === correctAnswer;

    // Award marks if correct, deduct if wrong
    if (isCorrect) {
      awardedMarks += Number(question.marks) || 1;
    } else if (studentAnswer && studentAnswer.answer) {
      // Deduct negative marks for wrong answer (not for unanswered)
      const negMarks = Number(question.negativeMarks) || 0;
      awardedMarks -= negMarks;
      console.log(`Question ${i}: Wrong answer. Deducting ${negMarks} marks. Current total: ${awardedMarks}`);
    }

    // Store correct answers for review
    correctAnswers.push({
      questionIndex: i,
      correctAnswer: correctAnswer,
      studentAnswer: studentAnswer?.answer || null,
      isAttempted: Boolean(studentAnswer?.answer), // Explicit flag for attempted questions
      isCorrect: isCorrect,
      marks: isCorrect ? (question.marks || 1) : (studentAnswer?.answer ? -(question.negativeMarks || 0) : 0),
      maxMarks: question.marks || 1,
      negativeMarks: question.negativeMarks || 0
    });

    // Store question analysis
    questionAnalysis.push({
      questionIndex: i,
      questionText: question.questionText,
      options: question.options,
      correctAnswer: correctAnswer,
      studentAnswer: studentAnswer?.answer || null,
      isAttempted: Boolean(studentAnswer?.answer), // Explicit flag for attempted questions
      isCorrect: isCorrect,
      marksAwarded: isCorrect ? (question.marks || 1) : (studentAnswer?.answer ? -(question.negativeMarks || 0) : 0),
      maxMarks: question.marks || 1,
      negativeMarks: question.negativeMarks || 0
    });
  }

  // Ensure marks don't go below 0
  awardedMarks = Math.max(0, awardedMarks);

  // Calculate Pass/Fail
  const totalMarks = test.testType === 'MIXED' ? (test.objectiveMarks || 0) : (test.totalMarks || 0);
  const passingPercent = test.passingPercentage || 40;
  const passingMarks = (totalMarks * passingPercent) / 100;
  // For mixed tests, we only mark objective passing here, final pass/fail is determined after subjective eval
  // But for purely objective tests, this is the final result
  const isPassed = awardedMarks >= passingMarks;

  let sub;
  let message = '';
  let status = 'COMPLETED';

  if (test.testType === 'MIXED') {
    // For mixed tests, only objective part is completed
    status = 'PENDING'; // Still pending subjective submission
  }

  if (existingSubmission) {
    if (test.testType === 'MIXED') {
      // Update existing submission with objective results
      existingSubmission.meta = existingSubmission.meta || {};
      existingSubmission.meta.objectiveAnswers = answers;
      existingSubmission.meta.objectiveCorrectAnswers = correctAnswers;
      existingSubmission.meta.objectiveQuestionAnalysis = questionAnalysis;
      existingSubmission.meta.objectiveMarks = awardedMarks;
      existingSubmission.meta.objectiveSubmitted = true;
      existingSubmission.meta.objectiveSubmittedAt = new Date();

      // Don't update awardedMarks until subjective is also evaluated
      existingSubmission.remarks = `Objective section completed. Score: ${awardedMarks}/${test.objectiveMarks || 0}. Awaiting subjective submission.`;

      await existingSubmission.save();
      sub = existingSubmission;
      message = 'Objective section submitted successfully. Please submit subjective section to complete the test.';
    } else {
      // Update existing submission for multiple attempts (pure objective)
      existingSubmission.awardedMarks = awardedMarks;
      existingSubmission.isPassed = isPassed;
      existingSubmission.evaluatedAt = new Date();
      existingSubmission.remarks = `Automatically evaluated (Attempt ${attemptNumber}). Score: ${awardedMarks}/${test.totalMarks || 0}. Result: ${isPassed ? 'PASSED' : 'FAILED'}`;
      existingSubmission.meta = {
        answers: answers,
        correctAnswers: correctAnswers,
        questionAnalysis: questionAnalysis,
        isAutoEvaluated: true,
        attemptNumber: attemptNumber,
        previousAttempts: attemptNumber - 1
      };

      await existingSubmission.save();
      sub = existingSubmission;
      message = `Test re-submitted and automatically evaluated (Attempt ${attemptNumber}). Result: ${isPassed ? 'PASSED' : 'FAILED'}`;
    }
  } else {
    // Create new submission
    const submissionData = {
      testSeriesId,
      testId,
      studentId: req.user.id,
      subject: test.subject,
      status: status,
      totalMarks: test.totalMarks || 0,
      meta: {}
    };

    if (test.testType === 'MIXED') {
      submissionData.meta = {
        objectiveAnswers: answers,
        objectiveCorrectAnswers: correctAnswers,
        objectiveQuestionAnalysis: questionAnalysis,
        objectiveMarks: awardedMarks,
        objectiveSubmitted: true,
        objectiveSubmittedAt: new Date()
      };
      submissionData.remarks = `Objective section completed. Score: ${awardedMarks}/${test.objectiveMarks || 0}. Awaiting subjective submission.`;
      message = 'Objective section submitted successfully. Please submit subjective section to complete the test.';
    } else {
      submissionData.awardedMarks = awardedMarks;
      submissionData.isPassed = isPassed;
      submissionData.evaluatedAt = new Date();
      submissionData.remarks = `Automatically evaluated. Score: ${awardedMarks}/${test.totalMarks || 0}. Result: ${isPassed ? 'PASSED' : 'FAILED'}`;
      submissionData.meta = {
        answers: answers,
        correctAnswers: correctAnswers,
        questionAnalysis: questionAnalysis,
        isAutoEvaluated: true,
        attemptNumber: 1
      };
      message = `Test submitted and automatically evaluated. Result: ${isPassed ? 'PASSED' : 'FAILED'}`;
    }

    sub = await Submission.create(submissionData);
  }

  return res.status(201).json({
    message: message,
    submissionId: String(sub._id),
    submissionNumber: sub.submissionNumber, // Numeric submission ID
    score: test.testType === 'MIXED' ? awardedMarks : sub.awardedMarks,
    isPassed: sub.isPassed,
    totalMarks: test.testType === 'MIXED' ? (test.objectiveMarks || 0) : (test.totalMarks || 0),
    status: status,
    testType: test.testType,
    attemptNumber: attemptNumber,
    attemptsUsed: attemptNumber,
    maxAttempts: attemptsPolicy.isUnlimited ? 'Unlimited' : attemptsPolicy.count
  });
};

// POST /api/students/tests/:testSeriesId/:testId/subjective-submission (multipart form-data with field 'answerSheet')
exports.submitSubjective = async (req, res) => {
  const { testSeriesId, testId } = req.params;
  const ts = await TestSeries.findById(testSeriesId).select('tests validity');
  if (!ts) return res.status(404).json({ message: 'Test series not found' });
  if (isSeriesExpired(ts.validity)) return res.status(403).json({ message: 'This test series validity has expired' });
  const test = ts.tests.id(testId);
  if (!test || (test.testType !== 'SUBJECTIVE' && test.testType !== 'MIXED')) {
    return res.status(400).json({ message: 'Invalid subjective or mixed test' });
  }

  // Check if student has enrollment for this test series
  const enrollment = await Enrollment.findOne({ studentId: req.user.id, testSeriesId, isActive: true });
  if (!enrollment) return res.status(403).json({ message: 'You have not purchased this series' });

  // Check for existing submission
  const existingSubmission = await Submission.findOne({
    studentId: req.user.id,
    testSeriesId,
    testId
  });

  if (test.testType === 'SUBJECTIVE') {
    // For pure subjective tests, only allow one submission
    if (existingSubmission) {
      return res.status(400).json({
        message: 'You have already submitted this subjective test. Multiple submissions are not allowed.',
        submissionId: String(existingSubmission._id),
        submittedAt: existingSubmission.createdAt
      });
    }
  } else if (test.testType === 'MIXED') {
    // For mixed tests, check if subjective part already submitted
    if (existingSubmission && existingSubmission.meta?.subjectiveSubmitted) {
      return res.status(400).json({
        message: 'Subjective part already submitted for this mixed test'
      });
    }

    // For mixed tests, objective must be submitted first
    if (!existingSubmission || !existingSubmission.meta?.objectiveSubmitted) {
      return res.status(400).json({
        message: 'Please complete the objective section first before submitting subjective answers'
      });
    }
  }

  // handle upload
  uploadSubmissionPDF(req, res, async (err) => {
    if (err) return handleFileUploadError(err, req, res, () => { });
    if (!req.file) return res.status(400).json({ message: 'answerSheet PDF is required' });

    try {
      const url = getFileUrl(req, req.file.path);

      let sub;
      let message = '';

      if (test.testType === 'MIXED' && existingSubmission) {
        // Update existing submission with subjective part
        existingSubmission.meta = existingSubmission.meta || {};
        existingSubmission.meta.subjectiveSubmitted = true;
        existingSubmission.meta.subjectiveSubmittedAt = new Date();
        existingSubmission.attachments = existingSubmission.attachments || [];
        existingSubmission.attachments.push({ url, label: 'subjectiveAnswerSheet' });
        existingSubmission.status = 'PENDING'; // Still pending evaluation for subjective part
        existingSubmission.remarks = `Mixed test completed. Objective: ${existingSubmission.meta.objectiveMarks || 0}/${test.objectiveMarks || 0}. Subjective part submitted for evaluation.`;

        await existingSubmission.save();
        sub = existingSubmission;
        message = 'Mixed test completed. Subjective section submitted for evaluation.';
      } else {
        // Create new submission for pure subjective test
        sub = await Submission.create({
          testSeriesId,
          testId,
          studentId: req.user.id,
          subject: test.subject,
          status: 'PENDING',
          totalMarks: test.totalMarks || 0,
          attachments: [{ url, label: 'answerSheet' }]
        });
        message = 'Submission received';
      }

      return res.status(201).json({
        message: message,
        submissionId: String(sub._id),
        fileUrl: url,
        testType: test.testType,
        status: sub.status
      });
    } catch (dbError) {
      // Handle duplicate submission error
      if (dbError.code === 11000) {
        return res.status(400).json({
          message: 'You have already submitted this test. Multiple submissions are not allowed.',
          error: 'Duplicate submission'
        });
      }
      throw dbError;
    }
  });
};

// GET /api/students/tests/:testSeriesId/statuses
// Returns per-test submission status for the logged-in student within a series
exports.getTestStatuses = async (req, res) => {
  const { testSeriesId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(testSeriesId)) {
    return res.status(400).json({ message: 'Invalid testSeriesId' });
  }
  // Ensure student has enrollment
  const has = await Enrollment.findOne({ studentId: req.user.id, testSeriesId, isActive: true });
  if (!has) return res.status(403).json({ message: 'You have not purchased this series' });

  const ts = await TestSeries.findById(testSeriesId).select('tests attempts validity');
  if (!ts) return res.status(404).json({ message: 'Test series not found' });
  if (isSeriesExpired(ts.validity)) return res.status(403).json({ message: 'This test series validity has expired' });

  const testIds = (ts.tests || []).map(t => t._id);
  if (testIds.length === 0) return res.json({ statuses: [] });

  const subs = await Submission.find({
    studentId: req.user.id,
    testSeriesId,
    testId: { $in: testIds }
  }).sort({ createdAt: -1 }).lean();

  const byTest = new Map();
  for (const s of subs) {
    const key = String(s.testId);
    if (!byTest.has(key)) byTest.set(key, s);
  }

  const attemptsPolicy = ts.attempts || { isUnlimited: true };

  const statuses = testIds.map(tid => {
    const test = ts.tests.find(t => String(t._id) === String(tid));
    const s = byTest.get(String(tid));

    if (!s) {
      return {
        testId: String(tid),
        testType: test?.testType || 'OBJECTIVE',
        status: 'not_attempted',
        attemptsUsed: 0,
        maxAttempts: attemptsPolicy.isUnlimited ? 'Unlimited' : attemptsPolicy.count,
        canRetake: true
      };
    }

    const currentAttempts = s.meta?.attemptNumber || 1;
    let canRetake = false;
    let status = 'submitted';

    // Determine status and retake eligibility based on test type
    if (test?.testType === 'OBJECTIVE') {
      canRetake = attemptsPolicy.isUnlimited || (attemptsPolicy.count && currentAttempts < attemptsPolicy.count);
      status = s.status === 'COMPLETED' ? 'completed' : 'submitted';
    } else if (test?.testType === 'MIXED') {
      const objectiveCompleted = s.meta?.objectiveSubmitted;
      const subjectiveCompleted = s.meta?.subjectiveSubmitted;

      if (objectiveCompleted && subjectiveCompleted) {
        status = s.status === 'COMPLETED' ? 'completed' : 'submitted';
        canRetake = false; // Mixed tests don't allow retakes
      } else if (objectiveCompleted && !subjectiveCompleted) {
        status = 'objective_completed';
        canRetake = false;
      } else {
        status = 'not_attempted';
        canRetake = true;
      }
    } else { // SUBJECTIVE
      status = s.status === 'COMPLETED' ? 'completed' : 'submitted';
      canRetake = false; // Subjective tests don't allow retakes
    }

    return {
      testId: String(tid),
      testType: test?.testType || 'OBJECTIVE',
      status: status,
      attemptsUsed: currentAttempts,
      maxAttempts: attemptsPolicy.isUnlimited ? 'Unlimited' : attemptsPolicy.count,
      canRetake: canRetake,
      score: s.awardedMarks,
      totalMarks: s.totalMarks,
      submittedAt: s.createdAt,
      objectiveScore: s.meta?.objectiveMarks,
      objectiveCompleted: s.meta?.objectiveSubmitted || false,
      subjectiveCompleted: s.meta?.subjectiveSubmitted || false
    };
  });

  return res.json({ statuses, attemptsPolicy });
};

// GET /api/students/tests/:testSeriesId/:testId/suggested-answer
// Returns suggested answer URL if the student has submitted this subjective test
exports.getSuggestedAnswer = async (req, res) => {
  const { testSeriesId, testId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(testSeriesId) || !mongoose.Types.ObjectId.isValid(testId)) {
    return res.status(400).json({ message: 'Invalid ids' });
  }
  const has = await Enrollment.findOne({ studentId: req.user.id, testSeriesId, isActive: true });
  if (!has) return res.status(403).json({ message: 'You have not purchased this series' });

  const submitted = await Submission.findOne({ studentId: req.user.id, testSeriesId, testId }).lean();
  if (!submitted) return res.status(403).json({ message: 'Submit your answer sheet to view suggested answers' });

  const ts = await TestSeries.findById(testSeriesId).select('tests validity');
  if (!ts) return res.status(404).json({ message: 'Test series not found' });
  if (isSeriesExpired(ts.validity)) return res.status(403).json({ message: 'This test series validity has expired' });
  const test = ts.tests.id(testId);
  if (!test) return res.status(404).json({ message: 'Test not found' });
  if (!test.suggestedAnswerUrl) return res.status(404).json({ message: 'Suggested answer not available' });

  return res.json({ url: test.suggestedAnswerUrl });
};

// GET /api/students/submissions/:submissionId
// Get detailed submission information for review
exports.getSubmissionDetails = async (req, res) => {
  const studentId = req.user.id;
  const { submissionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(submissionId)) {
    return res.status(400).json({ message: 'Invalid submission ID' });
  }

  const pipeline = [
    {
      $match: {
        _id: new mongoose.Types.ObjectId(submissionId),
        studentId: new mongoose.Types.ObjectId(studentId)
      }
    },
    // Lookup test information
    {
      $lookup: {
        from: 'testseries',
        let: { tsid: '$testSeriesId', tid: '$testId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$tsid'] } } },
          { $unwind: '$tests' },
          { $match: { $expr: { $eq: ['$tests._id', '$$tid'] } } },
          {
            $project: {
              _id: 0,
              title: '$tests.title',
              testType: '$tests.testType',
              subject: '$tests.subject',
              totalMarks: '$tests.totalMarks',
              answerPdfUrl: '$tests.suggestedAnswerUrl',
              questionPaperUrl: '$tests.questionPaperUrl',
              timeLimit: '$tests.timeLimit',
              instructions: '$tests.instructions'
            }
          },
        ],
        as: 'testInfo',
      },
    },
    // Lookup evaluator information
    {
      $lookup: {
        from: 'users',
        localField: 'evaluatorId',
        foreignField: '_id',
        as: 'evaluatorInfo',
      },
    },
    {
      $addFields: {
        testInfo: { $arrayElemAt: ['$testInfo', 0] },
        evaluatorInfo: { $arrayElemAt: ['$evaluatorInfo', 0] }
      }
    }
  ];

  const result = await Submission.aggregate(pipeline);
  const submission = result[0];

  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  const response = {
    id: String(submission._id),
    submissionNumber: submission.submissionNumber, // Numeric submission ID
    testId: String(submission.testId),
    testSeriesId: String(submission.testSeriesId),
    testName: submission.testInfo?.title || 'Unknown Test',
    subject: submission.testInfo?.subject || submission.subject || '',
    testType: submission.testInfo?.testType || 'MIXED',
    totalMarks: submission.testInfo?.totalMarks || submission.totalMarks || 0,
    timeLimit: submission.testInfo?.timeLimit,
    instructions: submission.testInfo?.instructions,

    // Submission details
    submittedAt: submission.submittedAt || submission.createdAt,
    status: submission.status,
    score: typeof submission.awardedMarks === 'number' ? submission.awardedMarks : undefined,
    remarks: submission.remarks,
    evaluatedAt: submission.evaluatedAt,

    // Files
    submissionFileUrl: submission.submissionFileUrl,
    answerPdfUrl: submission.testInfo?.answerPdfUrl,
    questionPaperUrl: submission.testInfo?.questionPaperUrl,
    evaluatedFileUrl: submission.evaluatedFileUrl,

    // Evaluator info
    evaluatorName: submission.evaluatorInfo?.fullName,
    evaluatorEmail: submission.evaluatorInfo?.email,

    // Meta
    hasRated: Boolean(submission.meta?.hasRated),
    isAutoEvaluated: Boolean(submission.meta?.isAutoEvaluated),

    // For objective tests - answers and analysis
    answers: submission.meta?.answers || [], // Array of student answers from meta
    correctAnswers: submission.meta?.correctAnswers || [], // Array of correct answers from meta
    questionAnalysis: submission.meta?.questionAnalysis || [], // Detailed question-wise analysis from meta

    // For mixed tests - objective section
    objectiveAnswers: submission.meta?.objectiveAnswers || [],
    objectiveCorrectAnswers: submission.meta?.objectiveCorrectAnswers || [],
    objectiveQuestionAnalysis: submission.meta?.objectiveQuestionAnalysis || [],
    objectiveMarks: submission.meta?.objectiveMarks,
    objectiveSubmitted: submission.meta?.objectiveSubmitted || false,

    // Attempt tracking
    attemptNumber: submission.meta?.attemptNumber || 1,

    // Summary statistics
    attemptSummary: (() => {
      const analysis = submission.meta?.questionAnalysis || submission.meta?.objectiveQuestionAnalysis || [];
      const totalQuestions = analysis.length;
      const attemptedQuestions = analysis.filter(q => q.studentAnswer !== null && q.studentAnswer !== undefined).length;
      const correctQuestions = analysis.filter(q => q.isCorrect === true).length;
      const incorrectQuestions = analysis.filter(q => q.isCorrect === false && q.studentAnswer !== null).length;
      const unattemptedQuestions = totalQuestions - attemptedQuestions;

      return {
        totalQuestions,
        attemptedQuestions,
        unattemptedQuestions,
        correctQuestions,
        incorrectQuestions,
        attemptRate: totalQuestions > 0 ? Math.round((attemptedQuestions / totalQuestions) * 100) : 0,
        accuracyRate: attemptedQuestions > 0 ? Math.round((correctQuestions / attemptedQuestions) * 100) : 0
      };
    })()
  };

  res.json(response);
};

// Student: get my profile
exports.getMyProfile = async (req, res) => {
  const student = await User.findById(req.user.id)
    .select('fullName email mobile address street city state pincode dob caLevel phone experience bio profilePictureUrl isActive createdAt emailVerified');

  console.log('getMyProfile - Retrieved student data:', {
    id: student?._id,
    address: student?.address,
    street: student?.street,
    city: student?.city,
    state: student?.state,
    pincode: student?.pincode,
    mobile: student?.mobile,
    fullName: student?.fullName
  });

  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Calculate some basic stats
  const enrollCount = await Enrollment.countDocuments({ studentId: req.user.id, isActive: true });
  const submittedTestsCount = await Submission.countDocuments({ studentId: req.user.id });
  const completedAgg = await Submission.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(req.user.id), status: 'COMPLETED', awardedMarks: { $exists: true } } },
    {
      $group: {
        _id: null,
        sumAwarded: { $sum: { $ifNull: ['$awardedMarks', 0] } },
        sumTotal: { $sum: { $ifNull: ['$totalMarks', 0] } },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        evaluatedTests: '$count',
        averageScore: {
          $cond: [
            { $gt: ['$sumTotal', 0] },
            { $multiply: [{ $divide: ['$sumAwarded', '$sumTotal'] }, 100] },
            0
          ]
        }
      }
    },
  ]);

  const stats = completedAgg?.[0] || { evaluatedTests: 0, averageScore: 0 };

  res.json({
    id: student._id,
    fullName: student.fullName,
    email: student.email,
    caLevel: student.caLevel,
    mobile: student.mobile,
    phone: student.phone,
    address: student.address,
    street: student.street,
    city: student.city,
    state: student.state,
    pincode: student.pincode,
    dob: student.dob,
    experience: student.experience,
    bio: student.bio,
    profilePictureUrl: student.profilePictureUrl,
    isActive: student.isActive,
    emailVerified: !!student.emailVerified,
    createdAt: student.createdAt,
    stats: {
      enrolledSeries: enrollCount,
      completedTests: submittedTestsCount,
      evaluatedTests: stats.evaluatedTests,
      averageScore: Math.round((stats.averageScore || 0) * 100) / 100
    }
  });
};

// Student: update my profile
exports.updateMyProfile = async (req, res) => {
  console.log('updateMyProfile received body:', req.body);

  const updates = {};
  const allowed = ['fullName', 'mobile', 'phone', 'address', 'street', 'city', 'state', 'pincode', 'dob', 'experience', 'bio', 'caLevel'];

  // Only allow specific fields to be updated by students themselves
  for (const k of allowed) {
    if (k in req.body) updates[k] = req.body[k];
  }

  console.log('Updates to be applied:', updates);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  const student = await User.findOneAndUpdate(
    { _id: req.user.id, role: ROLES.STUDENTS },
    updates,
    { new: true }
  ).select('fullName email mobile address street city state pincode dob caLevel phone experience bio profilePictureUrl isActive createdAt emailVerified');

  console.log('Updated student data:', {
    address: student.address,
    street: student.street,
    city: student.city,
    state: student.state,
    pincode: student.pincode,
    mobile: student.mobile,
    fullName: student.fullName
  });

  if (!student) return res.status(404).json({ message: 'Student not found' });

  // Calculate stats like in getMyProfile
  const enrollCount = await Enrollment.countDocuments({ studentId: req.user.id, isActive: true });
  const submittedTestsCount = await Submission.countDocuments({ studentId: req.user.id });
  const completedAgg = await Submission.aggregate([
    { $match: { studentId: new mongoose.Types.ObjectId(req.user.id), status: 'COMPLETED', awardedMarks: { $exists: true } } },
    {
      $group: {
        _id: null,
        sumAwarded: { $sum: { $ifNull: ['$awardedMarks', 0] } },
        sumTotal: { $sum: { $ifNull: ['$totalMarks', 0] } },
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        _id: 0,
        evaluatedTests: '$count',
        averageScore: {
          $cond: [
            { $gt: ['$sumTotal', 0] },
            { $multiply: [{ $divide: ['$sumAwarded', '$sumTotal'] }, 100] },
            0
          ]
        }
      }
    },
  ]);

  const stats = completedAgg?.[0] || { evaluatedTests: 0, averageScore: 0 };

  res.json({
    id: student._id,
    fullName: student.fullName,
    email: student.email,
    caLevel: student.caLevel,
    mobile: student.mobile,
    phone: student.phone,
    address: student.address,
    street: student.street,
    city: student.city,
    state: student.state,
    pincode: student.pincode,
    dob: student.dob,
    experience: student.experience,
    bio: student.bio,
    profilePictureUrl: student.profilePictureUrl,
    isActive: student.isActive,
    emailVerified: !!student.emailVerified,
    createdAt: student.createdAt,
    stats: {
      enrolledSeries: enrollCount,
      completedTests: submittedTestsCount,
      evaluatedTests: stats.evaluatedTests,
      averageScore: Math.round((stats.averageScore || 0) * 100) / 100
    }
  });
};

// Student: upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { compressAndSaveProfilePicture, getFileUrl, deleteFile } = require('../utils/fileUpload');
    const ROLES = require('../constants/roles');

    // Get current user
    const student = await User.findById(req.user.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Delete old profile picture if exists
    if (student.profilePictureUrl) {
      try {
        // Extract the relative path from the URL
        const urlParts = student.profilePictureUrl.split('/uploads/');
        if (urlParts.length > 1) {
          const relativePath = urlParts[1];
          const fullOldPath = require('path').join(__dirname, '../../storage', relativePath);
          deleteFile(fullOldPath);
        }
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Compress and save new profile picture
    const filePath = await compressAndSaveProfilePicture(
      req.file.buffer,
      req.user.id,
      'student'
    );

    // Update user with new profile picture URL
    const profilePictureUrl = getFileUrl(req, filePath);
    student.profilePictureUrl = profilePictureUrl;
    await student.save();

    res.json({
      message: 'Profile picture uploaded successfully',
      profilePictureUrl
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({
      message: 'Failed to upload profile picture',
      error: error.message
    });
  }
};

// POST /api/students/submissions/:submissionId/feedback
// Submit feedback/rating for an evaluator
exports.submitFeedback = async (req, res) => {
  const studentId = req.user.id;
  const { submissionId } = req.params;
  const { rating, comment } = req.body;

  // Validate input
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' });
  }

  try {
    // Find the submission and verify it belongs to the student
    const submission = await Submission.findOne({
      _id: submissionId,
      studentId: new mongoose.Types.ObjectId(studentId),
      status: 'COMPLETED'
    });

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found or not completed' });
    }

    // Check if feedback already exists
    if (submission.feedback && submission.feedback.rating) {
      return res.status(400).json({ message: 'Feedback already submitted for this evaluation' });
    }

    // Update submission with feedback
    submission.feedback = {
      rating: parseInt(rating, 10),
      comment: comment || '',
      feedbackAt: new Date()
    };

    await submission.save();

    res.json({
      message: 'Feedback submitted successfully',
      feedback: submission.feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
};

// POST /api/students/support-tickets
// Create a new support ticket
exports.createSupportTicket = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subject, category, priority, description, tags, testId } = req.body;

    // Validate required fields
    if (!subject || !description) {
      return res.status(400).json({ message: 'Subject and description are required' });
    }

    // Validate testId if provided (for evaluation category, testId should be provided)
    if (testId && !mongoose.Types.ObjectId.isValid(testId)) {
      return res.status(400).json({ message: 'Invalid test ID format' });
    }

    // If category is EVALUATION, strongly suggest providing testId
    if (category === 'EVALUATION' && !testId) {
      return res.status(400).json({
        message: 'Test ID is required for evaluation-related tickets. Please provide the test ID for better assistance.'
      });
    }

    // Create support ticket data
    const ticketData = {
      studentId,
      subject: subject.trim(),
      category: category || 'GENERAL',
      priority: priority || 'MEDIUM',
      description: description.trim(),
      tags: tags || []
    };

    // Add testId if provided
    if (testId) {
      ticketData.testId = testId;
    }

    // Create support ticket
    const ticket = await SupportTicket.create(ticketData);

    await ticket.populate('studentId', 'fullName email');

    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        description: ticket.description,
        testId: ticket.testId,
        createdAt: ticket.createdAt,
        hasUnreadResponse: ticket.hasUnreadResponse
      }
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({
      message: 'Failed to create support ticket',
      error: error.message
    });
  }
};

// GET /api/students/support-tickets
// Get all support tickets for the logged-in student
exports.getSupportTickets = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { page = 1, pageSize = 20, status, category } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);

    // Build query
    const query = { studentId };
    if (status && status !== 'all') {
      query.status = status.toUpperCase();
    }
    if (category && category !== 'all') {
      query.category = category.toUpperCase();
    }

    // Get tickets
    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .select('ticketId subject category priority status description testId createdAt updatedAt adminResponse studentLastViewed')
        .sort({ createdAt: -1 })
        .skip((p - 1) * s)
        .limit(s)
        .lean(),
      SupportTicket.countDocuments(query)
    ]);

    // Add virtual fields manually since we're using lean()
    const enrichedTickets = tickets.map(ticket => ({
      ...ticket,
      id: ticket._id,
      hasUnreadResponse: ticket.adminResponse &&
        ticket.adminResponse.respondedAt &&
        (!ticket.studentLastViewed || ticket.adminResponse.respondedAt > ticket.studentLastViewed)
    }));

    res.json({
      data: enrichedTickets,
      pagination: {
        page: p,
        pageSize: s,
        total,
        totalPages: Math.ceil(total / s)
      }
    });
  } catch (error) {
    console.error('Error getting support tickets:', error);
    res.status(500).json({
      message: 'Failed to get support tickets',
      error: error.message
    });
  }
};

// GET /api/students/support-tickets/:ticketId
// Get a specific support ticket details
exports.getSupportTicketDetails = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(ticketId) ? ticketId : null },
        { ticketId: ticketId }
      ],
      studentId
    }).populate('adminResponse.respondedBy', 'fullName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Update student last viewed
    ticket.studentLastViewed = new Date();
    await ticket.save();

    res.json({
      id: ticket._id,
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description,
      testId: ticket.testId,
      attachments: ticket.attachments,
      adminResponse: ticket.adminResponse,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      tags: ticket.tags,
      hasUnreadResponse: false // Now false since we just viewed it
    });
  } catch (error) {
    console.error('Error getting support ticket details:', error);
    res.status(500).json({
      message: 'Failed to get support ticket details',
      error: error.message
    });
  }
};

// PUBLIC ENDPOINTS - No authentication required

// GET /api/students/public/study-materials
// Get public study materials (no authentication required)
exports.getPublicStudyMaterials = async (req, res) => {
  try {
    const {
      type,
      category,
      subject,
      caLevel,
      search,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      pageSize = 12
    } = req.query;

    // Build filter criteria
    const filter = { isActive: true }; // Only show active materials

    if (type && type !== 'all') {
      filter.type = type;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (subject && subject !== 'all') {
      filter.subject = subject;
    }

    if (caLevel && caLevel !== 'all') {
      filter.caLevel = caLevel;
    }

    if (featured) {
      filter.featured = true;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    // Execute query with aggregation for stats
    const [materials, totalCount, summary] = await Promise.all([
      StudyMaterial.find(filter)
        .select('title description category subject caLevel type price discountPrice featured tags purchaseCount fileSize createdAt updatedAt')
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(),

      StudyMaterial.countDocuments(filter),

      StudyMaterial.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalMaterials: { $sum: 1 },
            freeMaterials: {
              $sum: { $cond: [{ $eq: ['$type', 'FREE'] }, 1, 0] }
            },
            paidMaterials: {
              $sum: { $cond: [{ $eq: ['$type', 'PAID'] }, 1, 0] }
            },
            featuredMaterials: {
              $sum: { $cond: ['$featured', 1, 0] }
            }
          }
        }
      ])
    ]);

    // Format materials for public consumption
    const formattedMaterials = materials.map(material => ({
      _id: material._id,
      title: material.title,
      description: material.description,
      category: material.category,
      subject: material.subject,
      caLevel: material.caLevel,
      type: material.type,
      price: material.price,
      discountPrice: material.discountPrice,
      featured: material.featured,
      tags: material.tags || [],
      purchaseCount: material.purchaseCount || 0,
      readableFileSize: formatFileSize(material.fileSize),
      createdAt: material.createdAt,
      updatedAt: material.updatedAt
    }));

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    const summaryData = summary[0] || {
      totalMaterials: 0,
      freeMaterials: 0,
      paidMaterials: 0,
      featuredMaterials: 0
    };

    res.json({
      materials: formattedMaterials,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalPages,
        totalItems: totalCount,
        hasNextPage,
        hasPrevPage
      },
      summary: summaryData
    });

  } catch (error) {
    console.error('Error getting public study materials:', error);
    res.status(500).json({
      message: 'Failed to get study materials',
      error: error.message
    });
  }
};

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// GET /api/students/study-materials/:id/download
// Download study material file (requires authentication)
exports.downloadStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id; // Get authenticated student ID

    const material = await StudyMaterial.findById(id);

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    // Check if material is active
    if (!material.isActive) {
      return res.status(403).json({ message: 'This study material is not available' });
    }

    // For PAID materials, verify purchase
    if (material.type === 'PAID') {
      const purchase = await Purchase.findOne({
        studentId: new mongoose.Types.ObjectId(studentId),
        studyMaterialId: new mongoose.Types.ObjectId(id),
        status: 'COMPLETED'
      });

      if (!purchase) {
        return res.status(403).json({
          message: 'You need to purchase this study material before downloading',
          requiresPurchase: true
        });
      }

      // Check if purchase has expired
      if (purchase.expiryDate && new Date() > purchase.expiryDate) {
        return res.status(403).json({
          message: 'Your access to this study material has expired',
          requiresPurchase: true
        });
      }

      // Check download limit
      if (purchase.maxDownloads && purchase.downloadCount >= purchase.maxDownloads) {
        return res.status(403).json({
          message: 'You have reached the maximum download limit for this material',
        });
      }

      // Increment purchase download count
      purchase.downloadCount = (purchase.downloadCount || 0) + 1;
      await purchase.save();
    }

    // Increment material download count
    material.downloadCount = (material.downloadCount || 0) + 1;
    await material.save();

    // Get the file path
    const path = require('path');
    const fs = require('fs');

    // The file URL is stored in material.fileInfo.url
    // Extract the file path from the URL (e.g., /uploads/study-materials/filename.pdf)
    let filePath;
    if (material.fileInfo && material.fileInfo.url) {
      // Remove the /uploads prefix to get the actual path in storage
      const urlPath = material.fileInfo.url.replace('/uploads/', '');
      filePath = path.join(__dirname, '../../storage', urlPath);
    } else {
      return res.status(404).json({ message: 'File not found' });
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error('File not found at path:', filePath);
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set headers for file download
    const fileName = material.fileInfo.originalName || `${material.title}.pdf`;
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', material.fileInfo.mimetype || 'application/pdf');
    res.setHeader('Content-Length', material.fileInfo.size);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error downloading file' });
      }
    });

  } catch (error) {
    console.error('Error downloading study material:', error);
    res.status(500).json({
      message: 'Failed to download study material',
      error: error.message
    });
  }
};
