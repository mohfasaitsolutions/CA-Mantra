const { validationResult } = require('express-validator');
const crypto = require('crypto');
const { sendSetPasswordEmail, sendVerificationEmail, sendRoleUpdatedEmail } = require('../services/emailService');
const User = require('../models/User');
const Submission = require('../models/Submission');
const TestSeries = require('../models/TestSeries');
const ROLES = require('../constants/roles');
const SUBJECTS = require('../constants/subjects');

function getStudentAnswerSheetUrl(submission) {
  const attachments = Array.isArray(submission?.attachments) ? submission.attachments : [];
  const preferredAttachment = attachments.find((attachment) =>
    ['answerSheet', 'subjectiveAnswerSheet'].includes(attachment?.label)
  );
  return preferredAttachment?.url || attachments[0]?.url || null;
}

async function getSubmissionTest(submission) {
  if (!submission?.testSeriesId || !submission?.testId) {
    return { testSeries: null, test: null };
  }

  const testSeriesId =
    typeof submission.testSeriesId === 'object' && submission.testSeriesId !== null && submission.testSeriesId._id
      ? submission.testSeriesId._id
      : submission.testSeriesId;

  const testSeries = await TestSeries.findById(testSeriesId).select('tests');
  const test = testSeries?.tests?.id(submission.testId) || null;

  return { testSeries, test };
}

function getAllowedEvaluatorIds(test) {
  return Array.isArray(test?.allowedEvaluatorIds)
    ? test.allowedEvaluatorIds.map((id) => String(id))
    : [];
}

function canEvaluatorAccessSubmission({ evaluatorId, evaluatorSpecializations = [], submission, test }) {
  const allowedEvaluatorIds = getAllowedEvaluatorIds(test);

  if (allowedEvaluatorIds.length > 0) {
    return allowedEvaluatorIds.includes(String(evaluatorId));
  }

  const subject = test?.subject || submission?.subject;
  return evaluatorSpecializations.includes(subject);
}

// Admin: create evaluator
exports.createEvaluator = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  const { fullName, email, password, caLevel, specializations, convertIfStudent } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    // If already an evaluator, bail out
    if (exists.role === ROLES.EVALUATOR) {
      return res.status(409).json({ message: 'Email already registered as evaluator' });
    }
    // If admin or other roles, do not allow implicit conversion
    if (exists.role === ROLES.ADMIN) {
      return res.status(409).json({ message: 'Email belongs to an admin account' });
    }
    // If student, support optional conversion
    if (exists.role === ROLES.STUDENTS) {
      if (!convertIfStudent) {
        return res.status(409).json({
          code: 'EMAIL_EXISTS_STUDENT',
          message: 'User exists as student. Convert to evaluator?'
        });
      }
      // Perform conversion
      exists.role = ROLES.EVALUATOR;
      if (Array.isArray(specializations) && specializations.length) {
        exists.specializations = specializations;
      }
      if (caLevel) exists.caLevel = caLevel;
      await exists.save();
      // Notify user; if not verified, send verification link as well
      Promise.allSettled([
        sendRoleUpdatedEmail(exists, 'EVALUATOR'),
        ...(exists.emailVerified ? [] : [sendVerificationEmail(exists, exists.emailVerificationToken || require('crypto').randomBytes(32).toString('hex'))])
      ]).catch(console.error);
      // Ensure a fresh verification token if needed
      if (!exists.emailVerified && !exists.emailVerificationToken) {
        const token = require('crypto').randomBytes(32).toString('hex');
        exists.emailVerificationToken = token;
        exists.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
        await exists.save();
      }
      return res.status(200).json({ id: exists._id, converted: true });
    }
    // Default: conflict
    return res.status(409).json({ message: 'Email already in use' });
  }

  // Prepare reset token to force evaluator to set password via email link
  const resetPasswordToken = crypto.randomBytes(32).toString('hex');
  const resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60); // 1h

  // Prepare email verification token
  const emailVerificationToken = crypto.randomBytes(32).toString('hex');
  const emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h

  const evaluator = await User.create({
    fullName,
    email,
    password,
    caLevel,
    role: ROLES.EVALUATOR,
    specializations,
    emailVerified: false,
    emailVerificationToken,
    emailVerificationExpires,
    resetPasswordToken,
    resetPasswordExpires
  });

  // Fire-and-forget the invitation + verification emails
  Promise.allSettled([
    sendSetPasswordEmail(evaluator, resetPasswordToken),
    sendVerificationEmail(evaluator, emailVerificationToken),
  ]).catch(console.error);

  res.status(201).json({ id: evaluator._id, invited: true });
};

// Admin: list evaluators with stats
exports.listEvaluators = async (req, res) => {
  const { q, subject, status, active } = req.query;

  const match = { role: ROLES.EVALUATOR };
  if (active === 'true') match.isActive = true;
  if (active === 'false') match.isActive = false;
  if (subject && SUBJECTS.includes(subject)) match.specializations = subject;
  if (q) match.$or = [
    { fullName: new RegExp(q, 'i') },
    { email: new RegExp(q, 'i') }
  ];

  const evaluators = await User.find(match).select('fullName email specializations isActive createdAt emailVerified');

  const ids = evaluators.map(e => e._id);
  const pipeline = [
    { $match: { evaluatorId: { $in: ids } } },
    { $group: {
      _id: '$evaluatorId',
      // Assigned = all currently in evaluator's queue historically doesn't exist, so use current states
      assigned: { $sum: { $cond: [
        { $in: ['$status', ['ASSIGNED','IN_PROGRESS','COMPLETED']] }, 1, 0
      ] } },
      // Pending = assigned but not started
      pending: { $sum: { $cond: [{ $eq: ['$status', 'ASSIGNED'] }, 1, 0] } },
      inProgress: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
      completed: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
      thisWeek: { $sum: { $cond: [
        { $and: [
          { $eq: ['$status', 'COMPLETED'] },
          { $gte: ['$evaluatedAt', new Date(new Date().setDate(new Date().getDate() - 7))] }
        ] }, 1, 0] } }
    } }
  ];
  const agg = ids.length ? await Submission.aggregate(pipeline) : [];
  const byId = Object.fromEntries(agg.map(a => [String(a._id), a]));

  const result = evaluators.map(e => ({
    id: e._id,
    fullName: e.fullName,
    email: e.email,
    specializations: e.specializations,
    isActive: e.isActive,
  emailVerified: !!e.emailVerified,
    stats: byId[String(e._id)] || { assigned: 0, pending: 0, inProgress: 0, completed: 0, thisWeek: 0 }
  }));

  // Optional filter by status based on aggregated counts
  if (status) {
    const key = status === 'IN_PROGRESS' ? 'inProgress' : status.toLowerCase();
    return res.json(result.filter(r => (r.stats[key] || 0) > 0));
  }

  res.json(result);
};

// Admin: get evaluator by id with stats
exports.getEvaluatorById = async (req, res) => {
  const { id } = req.params;
  const evaluator = await User.findOne({ _id: id, role: ROLES.EVALUATOR })
    .select('fullName email specializations isActive createdAt caLevel emailVerified');
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });

  const agg = await Submission.aggregate([
    { $match: { evaluatorId: evaluator._id } },
    { $group: {
      _id: '$evaluatorId',
      assigned: { $sum: { $cond: [ { $in: ['$status',['ASSIGNED','IN_PROGRESS','COMPLETED']] }, 1, 0 ] } },
      pending: { $sum: { $cond: [ { $eq: ['$status','ASSIGNED'] }, 1, 0 ] } },
      inProgress: { $sum: { $cond: [ { $eq: ['$status','IN_PROGRESS'] }, 1, 0 ] } },
      completed: { $sum: { $cond: [ { $eq: ['$status','COMPLETED'] }, 1, 0 ] } },
      thisWeek: { $sum: { $cond: [ { $and: [ { $eq: ['$status','COMPLETED'] }, { $gte: ['$evaluatedAt', new Date(new Date().setDate(new Date().getDate() - 7))] } ] }, 1, 0 ] } }
    } }
  ]);

  const stats = agg[0] || { assigned: 0, pending: 0, inProgress: 0, completed: 0, thisWeek: 0 };
  res.json({
    id: evaluator._id,
    fullName: evaluator.fullName,
    email: evaluator.email,
    caLevel: evaluator.caLevel,
    specializations: evaluator.specializations,
    isActive: evaluator.isActive,
  emailVerified: !!evaluator.emailVerified,
    stats
  });
};

// Admin: resend set-password invitation email
exports.resendInvite = async (req, res) => {
  const { id } = req.params;
  const evaluator = await User.findOne({ _id: id, role: ROLES.EVALUATOR });
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });
  const token = crypto.randomBytes(32).toString('hex');
  evaluator.resetPasswordToken = token;
  evaluator.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 60);
  await evaluator.save();
  sendSetPasswordEmail(evaluator, token).catch(console.error);
  res.json({ message: 'Invitation email resent' });
};

// Admin: resend verification email (if not verified)
exports.resendVerification = async (req, res) => {
  const { id } = req.params;
  const evaluator = await User.findOne({ _id: id, role: ROLES.EVALUATOR });
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });
  if (evaluator.emailVerified) return res.json({ message: 'Already verified' });
  const token = crypto.randomBytes(32).toString('hex');
  evaluator.emailVerificationToken = token;
  evaluator.emailVerificationExpires = new Date(Date.now() + 1000 * 60 * 60 * 24);
  await evaluator.save();
  sendVerificationEmail(evaluator, token).catch(console.error);
  res.json({ message: 'Verification email resent' });
};

// Admin: activate/deactivate evaluator
exports.toggleEvaluatorStatus = async (req, res) => {
  const { id } = req.params;
  const evaluator = await User.findOne({ _id: id, role: ROLES.EVALUATOR });
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });
  evaluator.isActive = !evaluator.isActive;
  await evaluator.save();
  res.json({ id: evaluator._id, isActive: evaluator.isActive });
};

// Admin: update evaluator profile / specializations
exports.updateEvaluator = async (req, res) => {
  const { id } = req.params;
  const updates = {};
  const allowed = ['fullName', 'specializations', 'caLevel', 'isActive'];
  for (const k of allowed) if (k in req.body) updates[k] = req.body[k];
  const evaluator = await User.findOneAndUpdate({ _id: id, role: ROLES.EVALUATOR }, updates, { new: true })
    .select('fullName email specializations isActive caLevel');
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });
  res.json(evaluator);
};

// Evaluator: my queue (only subjective tests that need manual evaluation)
exports.myQueue = async (req, res) => {
  const { status } = req.query;
  
  // Get evaluator's specializations
  const evaluator = await User.findById(req.user.id).select('specializations');
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });
  
  const match = {};

  // Apply status filter if provided
  if (status) {
    match.status = status;
    // For completed evaluations, only show submissions evaluated by this evaluator
    if (status === 'COMPLETED') {
      match.evaluatorId = req.user.id;
    }
  } else {
    // By default, show only submissions that need manual evaluation
    match.status = { $in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'LOCKED'] };
  }
  
  const items = await Submission.find(match)
    .populate('studentId', 'fullName email studentNumericId')
    .populate('testSeriesId', 'title')
    .populate('evaluatorId', 'fullName email') // Also populate evaluator info to show who's working on it
    .sort({ createdAt: -1 });
  
  // Enhance items with test information and filter for SUBJECTIVE tests only
  const enhancedItems = await Promise.all(items.map(async (item) => {
    const itemObj = item.toObject();
    let test = null;
    
    // Add submittedAt as alias for createdAt for backward compatibility
    itemObj.submittedAt = item.createdAt;
    
    // Ensure testId and testSeriesId are strings
    if (item.testId) {
      itemObj.testId = String(item.testId);
    }
    if (item.testSeriesId && typeof item.testSeriesId === 'object') {
      itemObj.testSeriesId = String(item.testSeriesId._id);
    }
    
    // Get test information from testSeries
    if (item.testSeriesId && item.testId) {
      try {
        const testResult = await getSubmissionTest(item);
        const testSeries = testResult.testSeries;
        test = testResult.test;
        if (testSeries) {
          if (test) {
            itemObj.testType = test.testType;
            itemObj.testName = test.title;
            itemObj.questionPaperUrl = test.questionPaperUrl;
            itemObj.suggestedAnswerUrl = test.suggestedAnswerUrl || null;
            // For completed submissions expose the evaluator-uploaded file; fall back to suggested answer
            itemObj.answerPdfUrl = (item.status === 'COMPLETED' ? item.evaluatedFileUrl : null) || test.suggestedAnswerUrl;
            itemObj.allowedEvaluatorIds = getAllowedEvaluatorIds(test);
          } else {
            console.log(`Test not found in testSeries for submission ${item._id}. TestId: ${item.testId}`);
            itemObj.testName = 'Test Not Found';
          }
        } else {
          console.log(`TestSeries not found for submission ${item._id}. TestSeriesId: ${item.testSeriesId}`);
          itemObj.testName = 'Test Series Not Found';
        }
      } catch (error) {
        console.error('Error fetching test info for submission:', item._id, error);
        itemObj.testName = 'Error Loading Test';
      }
    } else {
      console.log(`Missing testSeriesId or testId for submission ${item._id}`);
      itemObj.testName = 'Missing Test Info';
    }
    
    // Add student name for easier display
    itemObj.studentName = item.studentId?.fullName || 'Unknown Student';
    itemObj.studentIdNumber = item.studentId?.studentNumericId || null;
    itemObj.answerSheetUrl = getStudentAnswerSheetUrl(itemObj);
    itemObj.isEvaluatorAllowed = canEvaluatorAccessSubmission({
      evaluatorId: req.user.id,
      evaluatorSpecializations: evaluator.specializations || [],
      submission: item,
      test
    });
    
    return itemObj;
  }));
  
  // Filter to only include SUBJECTIVE tests (exclude OBJECTIVE and auto-evaluated tests)
  const subjectiveOnly = enhancedItems.filter(item => {
    if (!item.isEvaluatorAllowed) return false;
    // Only show SUBJECTIVE tests
    if (item.testType === 'OBJECTIVE') return false;
    
    // Exclude auto-evaluated tests
    if (item.meta?.isAutoEvaluated === true) return false;
    
    // For safety, if testType is not explicitly SUBJECTIVE, check if it's auto-evaluated
    if (item.testType !== 'SUBJECTIVE' && item.meta?.isAutoEvaluated === true) return false;
    
    return true;
  });
  
  res.json(subjectiveOnly);
};

// Admin: assign submission(s) to evaluator
exports.assignSubmissions = async (req, res) => {
  const { evaluatorId, submissionIds } = req.body;
  const evaluator = await User.findOne({ _id: evaluatorId, role: ROLES.EVALUATOR, isActive: true });
  if (!evaluator) return res.status(400).json({ message: 'Invalid evaluator' });

  const subs = await Submission.find({ _id: { $in: submissionIds } });
  const invalid = [];

  for (const submission of subs) {
    const { test } = await getSubmissionTest(submission);
    if (!canEvaluatorAccessSubmission({
      evaluatorId,
      evaluatorSpecializations: evaluator.specializations || [],
      submission,
      test
    })) {
      invalid.push(submission._id);
    }
  }

  if (invalid.length) {
    return res.status(400).json({ message: 'Evaluator is not allowed for some submissions', count: invalid.length });
  }

  await Submission.updateMany(
    { _id: { $in: submissionIds } },
    { $set: { evaluatorId, status: 'ASSIGNED' } }
  );
  res.json({ assigned: submissionIds.length });
};

// Admin: get unassigned submissions that match evaluator specialization
exports.getAssignableSubmissions = async (req, res) => {
  const { evaluatorId } = req.params;
  const { status = 'PENDING' } = req.query;
  
  // Get evaluator's specializations
  const evaluator = await User.findOne({ _id: evaluatorId, role: ROLES.EVALUATOR });
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });
  
  const match = {
    status: status
  };
  
  // If looking for unassigned submissions
  if (status === 'PENDING') {
    match.$or = [
      { evaluatorId: { $exists: false } },
      { evaluatorId: null }
    ];
  }
  
  const rawSubmissions = await Submission.find(match)
    .populate('studentId', 'fullName email studentNumericId')
    .populate('testSeriesId', 'title')
    .sort({ createdAt: -1 })
    .limit(50); // Limit to prevent large responses

  const submissions = [];
  for (const submission of rawSubmissions) {
    const { test } = await getSubmissionTest(submission);
    if (canEvaluatorAccessSubmission({
      evaluatorId,
      evaluatorSpecializations: evaluator.specializations || [],
      submission,
      test
    })) {
      submissions.push(submission);
    }
  }
  
  res.json({
    submissions,
    evaluatorSpecializations: evaluator.specializations,
    total: submissions.length
  });
};

// Evaluator: start and complete evaluation (with specialization check, allow taking ownership)
exports.updateSubmissionStatus = async (req, res) => {
  const { id } = req.params;
  const { action, awardedMarks, remarks } = req.body;
  const sub = await Submission.findById(id);
  if (!sub) return res.status(404).json({ message: 'Submission not found' });

  const isAdmin = req.user.role === ROLES.ADMIN;
  let evaluator = null;
  
  if (!isAdmin) {
    evaluator = await User.findById(req.user.id).select('specializations');
    if (!evaluator) {
      return res.status(404).json({ message: 'Evaluator not found' });
    }
  }
  
  // Get test information to check if it's objective (evaluators should only handle subjective)
  if (!isAdmin) {
    try {
      const { test } = await getSubmissionTest(sub);
      if (!canEvaluatorAccessSubmission({
        evaluatorId: req.user.id,
        evaluatorSpecializations: evaluator.specializations || [],
        submission: sub,
        test
      })) {
        return res.status(403).json({ message: 'This submission is not assigned to your evaluator login' });
      }

      if (test && test.testType === 'OBJECTIVE') {
        return res.status(403).json({ 
          message: 'Objective tests are automatically evaluated. Evaluators can only work on subjective tests.' 
        });
      }
    } catch (error) {
      console.error('Error checking test access for submission:', sub._id, error);
    }
    
    // Also check if submission is auto-evaluated
    if (sub.meta?.isAutoEvaluated === true) {
      return res.status(403).json({ 
        message: 'This submission has been automatically evaluated and cannot be modified.' 
      });
    }
  }

  // Check permissions based on action
  const isAssignedEvaluator = String(sub.evaluatorId) === String(req.user.id);
  const isUnassigned = !sub.evaluatorId;
  
  // For non-admin users:
  // - Can start unassigned submissions in their specialization
  // - Can continue working on submissions assigned to them
  // - Cannot work on submissions assigned to others
  if (!isAdmin && !isAssignedEvaluator && !isUnassigned) {
    return res.status(403).json({ message: 'This submission is already assigned to another evaluator' });
  }

  if (action === 'start') {
    if (sub.status === 'COMPLETED') return res.status(400).json({ message: 'Already completed' });
    // Assign to current evaluator if unassigned
    if (!sub.evaluatorId) sub.evaluatorId = req.user.id;
    sub.status = 'IN_PROGRESS';
  } else if (action === 'complete') {
    if (sub.status === 'COMPLETED') return res.status(400).json({ message: 'Already completed' });
    // For completing, must be assigned to current evaluator (or admin)
    if (!isAdmin && !isAssignedEvaluator) {
      return res.status(403).json({ message: 'Can only complete submissions assigned to you' });
    }
    if (typeof awardedMarks === 'number') {
      if (awardedMarks < 0) return res.status(400).json({ message: 'Marks cannot be negative' });
      if (typeof sub.totalMarks === 'number' && awardedMarks > sub.totalMarks) {
        return res.status(400).json({ message: 'Marks exceed total' });
      }
      sub.awardedMarks = awardedMarks;
    }
    if (remarks) sub.remarks = remarks;
    sub.status = 'COMPLETED';
    sub.evaluatedAt = new Date();
  } else if (action === 'claim') {
    // Allow evaluators to claim unassigned submissions in their specialization
    if (sub.evaluatorId) {
      return res.status(400).json({ message: 'Submission is already assigned to another evaluator' });
    }
    if (sub.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Submission is already completed' });
    }
    
    // Atomic check-and-set to prevent race conditions during claims
    const atomicUpdate = await Submission.findOneAndUpdate(
      { _id: id, evaluatorId: null, status: { $ne: 'COMPLETED' } },
      { $set: { evaluatorId: req.user.id, status: 'ASSIGNED' } },
      { new: true }
    );
    
    if (!atomicUpdate) {
      return res.status(400).json({ message: 'Race condition aborted: Submission was just claimed by someone else.' });
    }
    
    return res.json(atomicUpdate);
  } else if (action === 'lock') {
    // Allow evaluators to lock submissions to prevent others from claiming them
    if (sub.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot lock completed submissions' });
    }
    if (sub.status === 'LOCKED') {
      return res.status(400).json({ message: 'Submission is already locked' });
    }
    sub.status = 'LOCKED';
    sub.lockedBy = req.user.id;
    sub.lockedAt = new Date();
  } else if (action === 'unlock') {
    // Allow evaluators to unlock submissions they locked, or admins to unlock any
    if (sub.status !== 'LOCKED') {
      return res.status(400).json({ message: 'Submission is not locked' });
    }
    if (!isAdmin && String(sub.lockedBy) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Can only unlock submissions you locked' });
    }
    sub.status = sub.evaluatorId ? 'ASSIGNED' : 'PENDING';
    sub.lockedBy = undefined;
    sub.lockedAt = undefined;
  } else if (action === 'reassign' && isAdmin) {
    sub.evaluatorId = null;
    sub.status = 'PENDING';
  } else {
    return res.status(400).json({ message: 'Invalid action' });
  }

  await sub.save();
  res.json(sub);
};

// Upload evaluated file for a submission
exports.uploadEvaluatedFile = async (req, res) => {
  const { id } = req.params;
  const { marksAwarded, remarks } = req.body;
  
  console.log('Upload evaluated file request:', {
    submissionId: id,
    marksAwarded: marksAwarded,
    marksType: typeof marksAwarded,
    remarks: remarks,
    hasFile: !!req.file
  });
  
  const sub = await Submission.findById(id);
  if (!sub) return res.status(404).json({ message: 'Submission not found' });
  
  console.log('Submission details:', {
    totalMarks: sub.totalMarks,
    totalMarksType: typeof sub.totalMarks,
    currentAwardedMarks: sub.awardedMarks,
    status: sub.status
  });
  
  // Check if user has permission to upload evaluated file
  const isAdmin = req.user.role === ROLES.ADMIN;
  const isAssignedEvaluator = sub.evaluatorId && sub.evaluatorId.toString() === req.user.id;
  
  if (!isAdmin && !isAssignedEvaluator) {
    return res.status(403).json({ message: 'Not authorized to upload evaluated file for this submission' });
  }
  
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  const { getFileUrl } = require('../utils/fileUpload');
  
  // Update submission with evaluated file and complete the evaluation
  sub.evaluatedFileUrl = getFileUrl(req, req.file.path);
  
  // Update marks and remarks if provided
  if (typeof marksAwarded === 'string' && marksAwarded !== '') {
    const marks = parseInt(marksAwarded);
    console.log('Marks validation:', {
      originalMarksAwarded: marksAwarded,
      parsedMarks: marks,
      isNegative: marks < 0,
      totalMarks: sub.totalMarks,
      exceedsTotal: typeof sub.totalMarks === 'number' && marks > sub.totalMarks
    });
    
    if (marks < 0) {
      console.log('ERROR: Marks cannot be negative');
      return res.status(400).json({ message: 'Marks cannot be negative' });
    }
    if (typeof sub.totalMarks === 'number' && marks > sub.totalMarks) {
      console.log('ERROR: Marks exceed total');
      return res.status(400).json({ message: 'Marks exceed total' });
    }
    sub.awardedMarks = marks;
  }
  
  if (remarks) sub.remarks = remarks;
  
  // Mark as completed and set evaluation date
  sub.status = 'COMPLETED';
  sub.evaluatedAt = new Date();
  
  await sub.save();
  
  res.json({
    message: 'Evaluated file uploaded successfully',
    submission: sub
  });
};

// Evaluator: get my profile
exports.getMyProfile = async (req, res) => {
  const evaluator = await User.findById(req.user.id)
    .select('fullName email specializations isActive createdAt caLevel emailVerified phone experience bio profilePictureUrl');
  
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });

  // Calculate stats based on evaluator's specializations and assignment
  // Only count submissions that are manually evaluated by this evaluator
  // Exclude auto-evaluated submissions
  const agg = await Submission.aggregate([
    { 
      $match: { 
        evaluatorId: evaluator._id,  // Only count submissions actually assigned to this evaluator
        $or: [
          { "meta.isAutoEvaluated": { $ne: true } },  // Not auto-evaluated
          { "meta.isAutoEvaluated": { $exists: false } }  // Field doesn't exist (manual evaluation)
        ]
      } 
    },
    { $group: {
      _id: '$evaluatorId',
      assigned: { $sum: { $cond: [ { $in: ['$status',['ASSIGNED','IN_PROGRESS','COMPLETED']] }, 1, 0 ] } },
      pending: { $sum: { $cond: [ { $eq: ['$status','ASSIGNED'] }, 1, 0 ] } },
      inProgress: { $sum: { $cond: [ { $eq: ['$status','IN_PROGRESS'] }, 1, 0 ] } },
      completed: { $sum: { $cond: [ { $eq: ['$status','COMPLETED'] }, 1, 0 ] } },
      thisWeek: { $sum: { $cond: [ { $and: [ { $eq: ['$status','COMPLETED'] }, { $gte: ['$evaluatedAt', new Date(new Date().setDate(new Date().getDate() - 7))] } ] }, 1, 0 ] } }
    } }
  ]);

  const stats = agg[0] || { assigned: 0, pending: 0, inProgress: 0, completed: 0, thisWeek: 0 };
  
  console.log('Evaluator stats calculation:', {
    evaluatorId: evaluator._id,
    specializations: evaluator.specializations,
    aggregationResult: agg,
    finalStats: stats
  });
  
  res.json({
    id: evaluator._id,
    fullName: evaluator.fullName,
    email: evaluator.email,
    caLevel: evaluator.caLevel,
    specializations: evaluator.specializations,
    isActive: evaluator.isActive,
    emailVerified: !!evaluator.emailVerified,
    phone: evaluator.phone,
    experience: evaluator.experience,
    bio: evaluator.bio,
    profilePictureUrl: evaluator.profilePictureUrl,
    createdAt: evaluator.createdAt,
    stats
  });
};

// Evaluator: get submission details
// Evaluator: get submission details (any submission matching specialization)
exports.getSubmissionDetails = async (req, res) => {
  const { id } = req.params;
  
  // Get evaluator's specializations
  const evaluator = await User.findById(req.user.id).select('specializations');
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });
  
  const submission = await Submission.findById(id)
  .populate('studentId', 'fullName email studentNumericId')
  .populate('testSeriesId', 'title')
  .populate('evaluatorId', 'fullName email'); // Show who's currently assigned (if anyone)
  
  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }
  
  // Check if this is an objective test or auto-evaluated submission
  let resolvedTest = null;
  try {
    const testResult = await getSubmissionTest(submission);
    resolvedTest = testResult.test;
    const isAssignedEvaluator = submission.evaluatorId && String(submission.evaluatorId._id || submission.evaluatorId) === String(req.user.id);
    if (!isAssignedEvaluator && !canEvaluatorAccessSubmission({
      evaluatorId: req.user.id,
      evaluatorSpecializations: evaluator.specializations || [],
      submission,
      test: resolvedTest
    })) {
      return res.status(403).json({ message: 'Submission not found or outside your assigned evaluator logins' });
    }

    if (resolvedTest && resolvedTest.testType === 'OBJECTIVE') {
      return res.status(403).json({ 
        message: 'Objective tests are automatically evaluated. Evaluators can only access subjective tests.' 
      });
    }
  } catch (error) {
    console.error('Error checking test type for submission details:', submission._id, error);
  }
  
  // Also check if submission is auto-evaluated
  if (submission.meta?.isAutoEvaluated === true) {
    return res.status(403).json({ 
      message: 'This submission has been automatically evaluated and cannot be accessed by evaluators.' 
    });
  }
  
  // Enhance submission with test information
  const submissionObj = submission.toObject();
  
  // Get test information from testSeries
  if (submission.testSeriesId && submission.testId) {
    try {
      if (resolvedTest) {
        submissionObj.testType = resolvedTest.testType;
        submissionObj.testName = resolvedTest.title;
        submissionObj.totalMarks = resolvedTest.totalMarks; // Override the submission's totalMarks with test's totalMarks
        submissionObj.questionPaperUrl = resolvedTest.questionPaperUrl;
        submissionObj.suggestedAnswerUrl = resolvedTest.suggestedAnswerUrl || null;
        submissionObj.answerPdfUrl = resolvedTest.suggestedAnswerUrl;
        submissionObj.timeLimit = resolvedTest.timeLimit;
        submissionObj.instructions = resolvedTest.instructions;
        submissionObj.allowedEvaluatorIds = getAllowedEvaluatorIds(resolvedTest);
      }
    } catch (error) {
      console.error('Error fetching test info for submission details:', submission._id, error);
    }
  }
  
  // Add computed fields for better frontend display
  submissionObj.studentName = submission.studentId?.fullName;
  submissionObj.studentIdNumber = submission.studentId?.studentNumericId || null;
  submissionObj.submittedAt = submission.submittedAt || submission.createdAt;
  submissionObj.answerSheetUrl = getStudentAnswerSheetUrl(submissionObj);
  
  res.json(submissionObj);
};

// Evaluator: update my profile
exports.updateMyProfile = async (req, res) => {
  const updates = {};
  const allowed = ['fullName', 'phone', 'experience', 'bio'];
  
  // Only allow specific fields to be updated by evaluators themselves
  for (const k of allowed) {
    if (k in req.body) updates[k] = req.body[k];
  }
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }
  
  const evaluator = await User.findOneAndUpdate(
    { _id: req.user.id, role: ROLES.EVALUATOR }, 
    updates, 
    { new: true }
  ).select('fullName email specializations isActive caLevel phone experience bio emailVerified createdAt');
  
  if (!evaluator) return res.status(404).json({ message: 'Evaluator not found' });
  
  // Calculate stats like in getMyProfile
  const agg = await Submission.aggregate([
    { 
      $match: { 
        evaluatorId: evaluator._id,
        $or: [
          { "meta.isAutoEvaluated": false },
          { "meta.isAutoEvaluated": { $exists: false } }
        ]
      } 
    },
    { $group: {
      _id: '$evaluatorId',
      assigned: { $sum: { $cond: [ { $in: ['$status',['ASSIGNED','IN_PROGRESS','COMPLETED']] }, 1, 0 ] } },
      pending: { $sum: { $cond: [ { $eq: ['$status','ASSIGNED'] }, 1, 0 ] } },
      inProgress: { $sum: { $cond: [ { $eq: ['$status','IN_PROGRESS'] }, 1, 0 ] } },
      completed: { $sum: { $cond: [ { $eq: ['$status','COMPLETED'] }, 1, 0 ] } },
      thisWeek: { $sum: { $cond: [ { $and: [ { $eq: ['$status','COMPLETED'] }, { $gte: ['$evaluatedAt', new Date(new Date().setDate(new Date().getDate() - 7))] } ] }, 1, 0 ] } }
    } }
  ]);

  const stats = agg[0] || { assigned: 0, pending: 0, inProgress: 0, completed: 0, thisWeek: 0 };
  
  res.json({
    id: evaluator._id,
    fullName: evaluator.fullName,
    email: evaluator.email,
    caLevel: evaluator.caLevel,
    specializations: evaluator.specializations,
    isActive: evaluator.isActive,
    emailVerified: !!evaluator.emailVerified,
    phone: evaluator.phone,
    experience: evaluator.experience,
    bio: evaluator.bio,
    profilePictureUrl: evaluator.profilePictureUrl,
    createdAt: evaluator.createdAt,
    stats
  });
};

// Evaluator: upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { compressAndSaveProfilePicture, getFileUrl, deleteFile } = require('../utils/fileUpload');
    
    // Get current user
    const evaluator = await User.findById(req.user.id);
    if (!evaluator) {
      return res.status(404).json({ message: 'Evaluator not found' });
    }

    // Delete old profile picture if exists
    if (evaluator.profilePictureUrl) {
      try {
        // Extract the relative path from the URL
        const urlParts = evaluator.profilePictureUrl.split('/uploads/');
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
      'evaluator'
    );

    // Update user with new profile picture URL
    const profilePictureUrl = getFileUrl(req, filePath);
    evaluator.profilePictureUrl = profilePictureUrl;
    await evaluator.save();

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
