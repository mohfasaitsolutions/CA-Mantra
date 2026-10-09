const User = require('../models/User');
const Submission = require('../models/Submission');
const SupportTicket = require('../models/SupportTicket');
const StudyMaterial = require('../models/StudyMaterial');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const ROLES = require('../constants/roles');
const mongoose = require('mongoose');

function monthNames() {
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
}

exports.getDashboard = async (req, res) => {
  const [totalStudents, totalEvaluators] = await Promise.all([
    User.countDocuments({ role: ROLES.STUDENTS }),
    User.countDocuments({ role: ROLES.EVALUATOR }),
  ]);

  const [pendingCount, inProgressCount, completedCount, thisWeekCount] = await Promise.all([
    Submission.countDocuments({ status: { $in: ['PENDING', 'ASSIGNED'] } }),
    Submission.countDocuments({ status: 'IN_PROGRESS' }),
    Submission.countDocuments({ status: 'COMPLETED' }),
    Submission.countDocuments({ status: 'COMPLETED', evaluatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }),
  ]);

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const monthlyAgg = await Payment.aggregate([
    { $match: { status: 'CAPTURED', createdAt: { $gte: yearStart } } },
    { $group: { _id: { m: { $month: '$createdAt' } }, value: { $sum: '$amount' } } },
    { $sort: { '_id.m': 1 } },
  ]);
  const months = monthNames();
  const testSeriesSales = months.map((name, idx) => {
    const found = monthlyAgg.find((d) => d._id.m === idx + 1);
    return { name, value: found ? found.value : 0 };
  });

  const evaluationStatus = [
    { name: 'Completed', value: completedCount, fill: '#10B981' },
    { name: 'In Progress', value: inProgressCount, fill: '#F59E0B' },
    { name: 'Pending', value: pendingCount, fill: '#EF4444' },
  ];

  res.json({
    totalStudents,
    totalEvaluators,
    pendingEvaluations: pendingCount,
    completedEvaluations: completedCount,
    totalEvaluationsThisWeek: thisWeekCount,
    testSeriesSales,
    evaluationStatus,
  });
};

// GET /api/admin/evaluator-feedbacks
// Get all feedback/ratings given by students to evaluators
exports.getEvaluatorFeedbacks = async (req, res) => {
  const { page = 1, pageSize = 20, evaluatorId, rating, sortBy = 'feedbackAt', sortOrder = 'desc' } = req.query;

  const p = Math.max(parseInt(page, 10) || 1, 1);
  const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const skip = (p - 1) * s;

  // Build match criteria
  const matchCriteria = {
    'feedback.rating': { $exists: true, $ne: null },
    status: 'COMPLETED'
  };

  if (evaluatorId) {
    matchCriteria.evaluatorId = new mongoose.Types.ObjectId(evaluatorId);
  }

  if (rating) {
    matchCriteria['feedback.rating'] = parseInt(rating, 10);
  }

  // Build sort criteria
  const sortCriteria = {};
  if (sortBy === 'feedbackAt') {
    sortCriteria['feedback.feedbackAt'] = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'rating') {
    sortCriteria['feedback.rating'] = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'evaluatedAt') {
    sortCriteria.evaluatedAt = sortOrder === 'asc' ? 1 : -1;
  }

  const pipeline = [
    { $match: matchCriteria },
    // Lookup evaluator details
    {
      $lookup: {
        from: 'users',
        localField: 'evaluatorId',
        foreignField: '_id',
        as: 'evaluator',
        pipeline: [
          { $project: { fullName: 1, email: 1, specializations: 1 } }
        ]
      }
    },
    // Lookup student details
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student',
        pipeline: [
          { $project: { fullName: 1, email: 1, caLevel: 1 } }
        ]
      }
    },
    // Lookup test series details
    {
      $lookup: {
        from: 'testseries',
        let: { tsid: '$testSeriesId', tid: '$testId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$tsid'] } } },
          { $unwind: '$tests' },
          { $match: { $expr: { $eq: ['$tests._id', '$$tid'] } } },
          { $project: { title: '$title', testTitle: '$tests.title' } }
        ],
        as: 'testInfo'
      }
    },
    { $sort: sortCriteria },
    { $skip: skip },
    { $limit: s },
    {
      $project: {
        _id: 1,
        subject: 1,
        totalMarks: 1,
        awardedMarks: 1,
        evaluatedAt: 1,
        feedback: 1,
        evaluator: { $arrayElemAt: ['$evaluator', 0] },
        student: { $arrayElemAt: ['$student', 0] },
        testInfo: { $arrayElemAt: ['$testInfo', 0] }
      }
    }
  ];

  const [feedbacks, totalCount] = await Promise.all([
    Submission.aggregate(pipeline),
    Submission.countDocuments(matchCriteria)
  ]);

  // Calculate summary statistics
  const stats = await Submission.aggregate([
    { $match: { 'feedback.rating': { $exists: true, $ne: null }, status: 'COMPLETED' } },
    {
      $group: {
        _id: null,
        totalFeedbacks: { $sum: 1 },
        averageRating: { $avg: '$feedback.rating' },
        ratingDistribution: {
          $push: '$feedback.rating'
        }
      }
    }
  ]);

  let summary = {
    totalFeedbacks: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };

  if (stats.length > 0) {
    const stat = stats[0];
    summary.totalFeedbacks = stat.totalFeedbacks;
    summary.averageRating = Math.round(stat.averageRating * 100) / 100;

    // Count rating distribution
    stat.ratingDistribution.forEach(rating => {
      summary.ratingDistribution[rating] = (summary.ratingDistribution[rating] || 0) + 1;
    });
  }

  res.json({
    data: feedbacks,
    pagination: {
      page: p,
      pageSize: s,
      total: totalCount,
      totalPages: Math.ceil(totalCount / s)
    },
    summary
  });
};

// GET /api/admin/evaluations
// Get all evaluations/submissions with detailed information
exports.getEvaluations = async (req, res) => {
  const { page = 1, pageSize = 20, status, evaluatorId, studentId, subject, sortBy = 'submittedAt', sortOrder = 'desc' } = req.query;

  const p = Math.max(parseInt(page, 10) || 1, 1);
  const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
  const skip = (p - 1) * s;

  // Build match criteria
  const matchCriteria = {};

  if (status && status !== 'all') {
    if (status === 'pending') {
      matchCriteria.status = { $in: ['PENDING', 'ASSIGNED'] };
    } else {
      matchCriteria.status = status.toUpperCase();
    }
  }

  if (evaluatorId) {
    matchCriteria.evaluatorId = new mongoose.Types.ObjectId(evaluatorId);
  }

  if (studentId) {
    matchCriteria.studentId = new mongoose.Types.ObjectId(studentId);
  }

  if (subject && subject !== 'all') {
    matchCriteria.subject = subject;
  }

  // Build sort criteria
  const sortCriteria = {};
  if (sortBy === 'submittedAt') {
    sortCriteria.createdAt = sortOrder === 'asc' ? 1 : -1; // submittedAt maps to createdAt
  } else if (sortBy === 'evaluatedAt') {
    sortCriteria.evaluatedAt = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'createdAt') {
    sortCriteria.createdAt = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'updatedAt') {
    sortCriteria.updatedAt = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'awardedMarks') {
    sortCriteria.awardedMarks = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'status') {
    sortCriteria.status = sortOrder === 'asc' ? 1 : -1;
  }

  const pipeline = [
    { $match: matchCriteria },
    // Lookup evaluator details
    {
      $lookup: {
        from: 'users',
        localField: 'evaluatorId',
        foreignField: '_id',
        as: 'evaluator',
        pipeline: [
          { $project: { fullName: 1, email: 1, specializations: 1 } }
        ]
      }
    },
    // Lookup student details
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student',
        pipeline: [
          { $project: { fullName: 1, email: 1, caLevel: 1, phone: 1, mobile: 1, studentNumericId: 1, profilePictureUrl: 1 } }
        ]
      }
    },
    // Lookup test series details
    {
      $lookup: {
        from: 'testseries',
        let: { tsid: '$testSeriesId', tid: '$testId' },
        pipeline: [
          { $match: { $expr: { $eq: ['$_id', '$$tsid'] } } },
          { $unwind: '$tests' },
          { $match: { $expr: { $eq: ['$tests._id', '$$tid'] } } },
          { $project: { title: '$title', testTitle: '$tests.title', category: '$category' } }
        ],
        as: 'testInfo'
      }
    },
    { $sort: sortCriteria },
    { $skip: skip },
    { $limit: s },
    {
      $project: {
        _id: 1,
        submissionId: { $toString: '$_id' },
        subject: 1,
        totalMarks: 1,
        awardedMarks: 1,
        status: 1,
        testId: { $toString: '$testId' },
        testSeriesId: { $toString: '$testSeriesId' },
        submittedAt: '$createdAt', // Use createdAt as submittedAt since that's when the submission was created
        assignedAt: 1,
        evaluatedAt: 1,
        createdAt: 1,
        updatedAt: 1,
        feedback: 1,
        attachments: 1,
        answerPdfUrl: { $arrayElemAt: ['$attachments.url', 0] }, // Get first attachment URL
        evaluatedFileUrl: 1,
        evaluator: { $arrayElemAt: ['$evaluator', 0] },
        student: { $arrayElemAt: ['$student', 0] },
        studentId: { $ifNull: [{ $arrayElemAt: ['$student.studentNumericId', 0] }, null] },
        testInfo: {
          $ifNull: [
            { $arrayElemAt: ['$testInfo', 0] },
            { title: null, testTitle: null, category: null }
          ]
        }
      }
    }
  ];

  const [evaluations, totalCount] = await Promise.all([
    Submission.aggregate(pipeline),
    Submission.countDocuments(matchCriteria)
  ]);

  // Calculate summary statistics
  const stats = await Submission.aggregate([
    {
      $group: {
        _id: null,
        totalSubmissions: { $sum: 1 },
        pendingCount: { $sum: { $cond: [{ $in: ['$status', ['PENDING', 'ASSIGNED']] }, 1, 0] } },
        inProgressCount: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
        completedCount: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] } },
        averageMarks: { $avg: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$awardedMarks', null] } },
        totalMarksAwarded: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$awardedMarks', 0] } },
        totalPossibleMarks: { $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, '$totalMarks', 0] } }
      }
    }
  ]);

  let summary = {
    totalSubmissions: 0,
    pendingCount: 0,
    inProgressCount: 0,
    completedCount: 0,
    averageMarks: 0,
    averagePercentage: 0
  };

  if (stats.length > 0) {
    const stat = stats[0];
    summary = {
      totalSubmissions: stat.totalSubmissions,
      pendingCount: stat.pendingCount,
      inProgressCount: stat.inProgressCount,
      completedCount: stat.completedCount,
      averageMarks: Math.round((stat.averageMarks || 0) * 100) / 100,
      averagePercentage: stat.totalPossibleMarks > 0
        ? Math.round((stat.totalMarksAwarded / stat.totalPossibleMarks) * 10000) / 100
        : 0
    };
  }

  res.json({
    data: evaluations,
    pagination: {
      page: p,
      pageSize: s,
      total: totalCount,
      totalPages: Math.ceil(totalCount / s)
    },
    summary
  });
};

// GET /api/admin/analytics
// Get comprehensive analytics data for admin dashboard
exports.getAnalytics = async (req, res) => {
  try {
    const { period = '30', startDate, endDate } = req.query;

    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else {
      const days = parseInt(period, 10) || 30;
      const periodStart = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      dateFilter = { createdAt: { $gte: periodStart } };
    }

    // User growth analytics
    const userGrowthPipeline = [
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ];

    const userGrowth = await User.aggregate([
      { $match: dateFilter },
      ...userGrowthPipeline
    ]);

    // Submission analytics by status
    const submissionStatusPipeline = [
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalMarks: { $sum: '$totalMarks' },
          awardedMarks: { $sum: '$awardedMarks' }
        }
      }
    ];

    const submissionsByStatus = await Submission.aggregate([
      { $match: dateFilter },
      ...submissionStatusPipeline
    ]);

    // Subject-wise performance analytics
    const subjectPerformance = await Submission.aggregate([
      { $match: { ...dateFilter, status: 'COMPLETED' } },
      {
        $group: {
          _id: '$subject',
          totalSubmissions: { $sum: 1 },
          averageMarks: { $avg: '$awardedMarks' },
          totalMarks: { $sum: '$totalMarks' },
          awardedMarks: { $sum: '$awardedMarks' },
          maxMarks: { $max: '$awardedMarks' },
          minMarks: { $min: '$awardedMarks' }
        }
      },
      {
        $addFields: {
          averagePercentage: {
            $cond: [
              { $gt: ['$totalMarks', 0] },
              { $multiply: [{ $divide: ['$awardedMarks', '$totalMarks'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { totalSubmissions: -1 } }
    ]);

    // Evaluator performance analytics
    const evaluatorPerformance = await Submission.aggregate([
      { $match: { ...dateFilter, status: 'COMPLETED', evaluatorId: { $exists: true } } },
      {
        $lookup: {
          from: 'users',
          localField: 'evaluatorId',
          foreignField: '_id',
          as: 'evaluator',
          pipeline: [
            { $project: { fullName: 1, email: 1, specializations: 1 } }
          ]
        }
      },
      {
        $group: {
          _id: '$evaluatorId',
          evaluator: { $first: { $arrayElemAt: ['$evaluator', 0] } },
          totalEvaluations: { $sum: 1 },
          averageRating: { $avg: '$feedback.rating' },
          totalRatings: {
            $sum: {
              $cond: [{ $ne: ['$feedback.rating', null] }, 1, 0]
            }
          },
          averageTimeToEvaluate: {
            $avg: {
              $cond: [
                { $and: ['$assignedAt', '$evaluatedAt'] },
                {
                  $cond: [
                    { $gt: [{ $subtract: ['$evaluatedAt', '$assignedAt'] }, 0] },
                    { $divide: [{ $subtract: ['$evaluatedAt', '$assignedAt'] }, 1000 * 60 * 60] }, // hours
                    0
                  ]
                },
                0
              ]
            }
          }
        }
      },
      { $sort: { totalEvaluations: -1 } },
      { $limit: 10 }
    ]);

    // Daily submission trends
    const dailyTrends = await Submission.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          submissions: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'COMPLETED'] }, 1, 0] }
          },
          pending: {
            $sum: { $cond: [{ $in: ['$status', ['PENDING', 'ASSIGNED']] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          date: {
            $dateFromParts: {
              year: '$_id.year',
              month: '$_id.month',
              day: '$_id.day'
            }
          }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Revenue analytics (if test series have pricing)
    const revenueAnalytics = await Submission.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: 'testseries',
          localField: 'testSeriesId',
          foreignField: '_id',
          as: 'testSeries'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSubmissions: { $sum: 1 },
          // Add revenue calculation if pricing field exists
          estimatedRevenue: { $sum: { $ifNull: [{ $arrayElemAt: ['$testSeries.price', 0] }, 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Performance metrics
    const performanceMetrics = await Submission.aggregate([
      { $match: { ...dateFilter, status: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          totalCompleted: { $sum: 1 },
          averageScore: { $avg: '$awardedMarks' },
          averagePercentage: {
            $avg: {
              $cond: [
                { $gt: ['$totalMarks', 0] },
                { $multiply: [{ $divide: ['$awardedMarks', '$totalMarks'] }, 100] },
                0
              ]
            }
          },
          highPerformers: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$totalMarks', 0] },
                    { $gte: [{ $divide: ['$awardedMarks', '$totalMarks'] }, 0.8] }
                  ]
                },
                1,
                0
              ]
            }
          },
          lowPerformers: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt: ['$totalMarks', 0] },
                    { $lt: [{ $divide: ['$awardedMarks', '$totalMarks'] }, 0.4] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Format response to match frontend expectations
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: ROLES.STUDENTS });
    const totalEvaluators = await User.countDocuments({ role: ROLES.EVALUATOR });
    const totalSubmissions = await Submission.countDocuments();
    const completedSubmissions = await Submission.countDocuments({ status: 'COMPLETED' });

    // Transform user growth data
    const userGrowthFormatted = [];
    const groupedUserGrowth = {};

    userGrowth.forEach(item => {
      const dateKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`;
      if (!groupedUserGrowth[dateKey]) {
        groupedUserGrowth[dateKey] = { date: dateKey, students: 0, evaluators: 0 };
      }
      if (item._id.role === ROLES.STUDENTS) {
        groupedUserGrowth[dateKey].students = item.count;
      } else if (item._id.role === ROLES.EVALUATOR) {
        groupedUserGrowth[dateKey].evaluators = item.count;
      }
    });

    Object.values(groupedUserGrowth).forEach(item => {
      userGrowthFormatted.push(item);
    });

    // Transform subject performance data
    const subjectPerformanceFormatted = subjectPerformance.map(item => ({
      subject: item._id,
      totalSubmissions: item.totalSubmissions,
      averageMarks: Math.round(item.averageMarks * 100) / 100,
      averagePercentage: Math.round(item.averagePercentage * 100) / 100
    }));

    // Transform submission trends data
    const submissionTrendsFormatted = dailyTrends.map(item => ({
      date: item.date.toISOString().split('T')[0],
      totalSubmissions: item.submissions,
      completedSubmissions: item.completed
    }));

    const analytics = {
      userGrowth: userGrowthFormatted,
      submissionsByStatus: submissionsByStatus.map(item => ({
        status: item._id,
        count: item.count,
        totalMarks: item.totalMarks,
        awardedMarks: item.awardedMarks
      })),
      subjectPerformance: subjectPerformanceFormatted,
      evaluatorPerformance: evaluatorPerformance,
      submissionTrends: submissionTrendsFormatted,
      summary: {
        totalUsers,
        totalStudents,
        totalEvaluators,
        totalSubmissions,
        totalRevenue: completedSubmissions * 500, // Mock revenue calculation
        completionRate: totalSubmissions > 0 ? Math.round((completedSubmissions / totalSubmissions) * 10000) / 100 : 0,
        averageRating: evaluatorPerformance.length > 0
          ? Math.round((evaluatorPerformance.reduce((sum, item) => sum + (item.averageRating || 0), 0) / evaluatorPerformance.length) * 100) / 100
          : 0,
        averageResponseTime: evaluatorPerformance.length > 0
          ? Math.round((evaluatorPerformance.reduce((sum, item) => sum + (item.averageTimeToEvaluate || 0), 0) / evaluatorPerformance.length) * 100) / 100
          : 0
      }
    };

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics data',
      message: error.message
    });
  }
};

// GET /api/admin/support-tickets
// Get all support tickets with filtering and pagination
exports.getSupportTickets = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, category, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const skip = (p - 1) * s;

    // Build match criteria
    const matchCriteria = {};

    if (status && status !== 'all') {
      matchCriteria.status = status.toUpperCase();
    }

    if (category && category !== 'all') {
      matchCriteria.category = category.toUpperCase();
    }

    if (priority && priority !== 'all') {
      matchCriteria.priority = priority.toUpperCase();
    }

    // Build sort criteria
    const sortCriteria = {};
    if (sortBy === 'createdAt') {
      sortCriteria.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'updatedAt') {
      sortCriteria.updatedAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'priority') {
      sortCriteria.priority = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'status') {
      sortCriteria.status = sortOrder === 'asc' ? 1 : -1;
    }

    const pipeline = [
      { $match: matchCriteria },
      // Lookup student details
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
          pipeline: [
            { $project: { fullName: 1, email: 1, caLevel: 1 } }
          ]
        }
      },
      // Lookup test series details if testId exists
      {
        $lookup: {
          from: 'testseries',
          localField: 'testId',
          foreignField: '_id',
          as: 'testSeries',
          pipeline: [
            { $project: { title: 1, subject: 1 } }
          ]
        }
      },
      // Lookup admin response details
      {
        $lookup: {
          from: 'users',
          localField: 'adminResponse.respondedBy',
          foreignField: '_id',
          as: 'respondedByAdmin',
          pipeline: [
            { $project: { fullName: 1, email: 1 } }
          ]
        }
      },
      { $sort: sortCriteria },
      { $skip: skip },
      { $limit: s },
      {
        $project: {
          _id: 1,
          ticketId: 1,
          subject: 1,
          category: 1,
          priority: 1,
          status: 1,
          description: 1,
          testId: 1,
          createdAt: 1,
          updatedAt: 1,
          resolvedAt: 1,
          adminResponse: 1,
          student: { $arrayElemAt: ['$student', 0] },
          testSeries: { $arrayElemAt: ['$testSeries', 0] },
          respondedByAdmin: { $arrayElemAt: ['$respondedByAdmin', 0] },
          needsAdminResponse: {
            $or: [
              { $eq: ['$status', 'OPEN'] },
              { $eq: ['$status', 'IN_PROGRESS'] }
            ]
          }
        }
      }
    ];

    const [tickets, totalCount] = await Promise.all([
      SupportTicket.aggregate(pipeline),
      SupportTicket.countDocuments(matchCriteria)
    ]);



    // Calculate summary statistics
    let summary = {
      totalTickets: 0,
      openTickets: 0,
      inProgressTickets: 0,
      resolvedTickets: 0,
      closedTickets: 0,
      urgentTickets: 0,
      highPriorityTickets: 0,
      needsAttention: 0
    };

    if (totalCount > 0) {
      const stats = await SupportTicket.aggregate([
        { $match: matchCriteria }, // Use same match criteria as main query
        {
          $group: {
            _id: null,
            totalTickets: { $sum: 1 },
            openTickets: { $sum: { $cond: [{ $eq: ['$status', 'OPEN'] }, 1, 0] } },
            inProgressTickets: { $sum: { $cond: [{ $eq: ['$status', 'IN_PROGRESS'] }, 1, 0] } },
            resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'RESOLVED'] }, 1, 0] } },
            closedTickets: { $sum: { $cond: [{ $eq: ['$status', 'CLOSED'] }, 1, 0] } },
            urgentTickets: { $sum: { $cond: [{ $eq: ['$priority', 'URGENT'] }, 1, 0] } },
            highPriorityTickets: { $sum: { $cond: [{ $eq: ['$priority', 'HIGH'] }, 1, 0] } }
          }
        }
      ]);

      if (stats.length > 0) {
        const stat = stats[0];
        summary = {
          totalTickets: stat.totalTickets,
          openTickets: stat.openTickets,
          inProgressTickets: stat.inProgressTickets,
          resolvedTickets: stat.resolvedTickets,
          closedTickets: stat.closedTickets,
          urgentTickets: stat.urgentTickets,
          highPriorityTickets: stat.highPriorityTickets,
          needsAttention: stat.openTickets + stat.urgentTickets + stat.highPriorityTickets
        };
      }
    }

    res.json({
      data: tickets,
      pagination: {
        page: p,
        pageSize: s,
        total: totalCount,
        totalPages: Math.ceil(totalCount / s)
      },
      summary
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    res.status(500).json({
      error: 'Failed to fetch support tickets',
      message: error.message
    });
  }
};

// GET /api/admin/support-tickets/:ticketId
// Get a specific support ticket details
exports.getSupportTicketDetails = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(ticketId) ? ticketId : null },
        { ticketId: ticketId }
      ]
    })
      .populate('studentId', 'fullName email caLevel mobile')
      .populate('testId', 'title subject')
      .populate('adminResponse.respondedBy', 'fullName email');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Update admin last viewed
    ticket.adminLastViewed = new Date();
    await ticket.save();

    res.json({
      id: ticket._id,
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      description: ticket.description,
      testId: ticket.testId?._id,
      testSeries: ticket.testId ? {
        id: ticket.testId._id,
        title: ticket.testId.title,
        subject: ticket.testId.subject
      } : null,
      attachments: ticket.attachments,
      adminResponse: ticket.adminResponse,
      student: ticket.studentId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      tags: ticket.tags,
      needsAdminResponse: ticket.needsAdminResponse
    });
  } catch (error) {
    console.error('Error getting support ticket details:', error);
    res.status(500).json({
      message: 'Failed to get support ticket details',
      error: error.message
    });
  }
};

// PUT /api/admin/support-tickets/:ticketId/respond
// Respond to a support ticket
exports.respondToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, status } = req.body;
    const adminId = req.user.id;

    if (!message) {
      return res.status(400).json({ message: 'Response message is required' });
    }

    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(ticketId) ? ticketId : null },
        { ticketId: ticketId }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Update ticket with admin response
    ticket.adminResponse = {
      message: message.trim(),
      respondedAt: new Date(),
      respondedBy: adminId
    };

    // Update status if provided
    if (status && ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status.toUpperCase())) {
      ticket.status = status.toUpperCase();

      // Set resolved date if status is RESOLVED or CLOSED
      if (status.toUpperCase() === 'RESOLVED' || status.toUpperCase() === 'CLOSED') {
        ticket.resolvedAt = new Date();
      }
    }

    await ticket.save();
    await ticket.populate('adminResponse.respondedBy', 'fullName email');

    res.json({
      message: 'Response sent successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        adminResponse: ticket.adminResponse,
        resolvedAt: ticket.resolvedAt
      }
    });
  } catch (error) {
    console.error('Error responding to ticket:', error);
    res.status(500).json({
      message: 'Failed to respond to ticket',
      error: error.message
    });
  }
};

// PUT /api/admin/support-tickets/:ticketId/status
// Update support ticket status
exports.updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!status || !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status.toUpperCase())) {
      return res.status(400).json({ message: 'Valid status is required' });
    }

    const ticket = await SupportTicket.findOne({
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(ticketId) ? ticketId : null },
        { ticketId: ticketId }
      ]
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    ticket.status = status.toUpperCase();

    // Set resolved date if status is RESOLVED or CLOSED
    if (status.toUpperCase() === 'RESOLVED' || status.toUpperCase() === 'CLOSED') {
      ticket.resolvedAt = new Date();
    } else {
      ticket.resolvedAt = undefined;
    }

    await ticket.save();

    res.json({
      message: 'Ticket status updated successfully',
      ticket: {
        id: ticket._id,
        ticketId: ticket.ticketId,
        status: ticket.status,
        resolvedAt: ticket.resolvedAt
      }
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({
      message: 'Failed to update ticket status',
      error: error.message
    });
  }
};

// Study Materials Management

// GET /api/admin/study-materials
// Get all study materials with pagination and filters
exports.getStudyMaterials = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      type = 'all', // 'all', 'FREE', 'PAID'
      category = 'all',
      subject = 'all',
      caLevel = 'all',
      search = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive = 'all'
    } = req.query;

    // Build filter query
    const filter = {};

    if (type !== 'all') {
      filter.type = type;
    }

    if (category !== 'all') {
      filter.category = category;
    }

    if (subject !== 'all') {
      filter.subject = subject;
    }

    if (caLevel !== 'all') {
      filter.caLevel = caLevel;
    }

    if (isActive !== 'all') {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(pageSize);
    const [materials, totalCount] = await Promise.all([
      StudyMaterial.find(filter)
        .populate('uploadedBy', 'fullName email')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(pageSize)),
      StudyMaterial.countDocuments(filter)
    ]);

    // Get summary statistics
    const [totalMaterials, freeMaterials, paidMaterials, activeMaterials] = await Promise.all([
      StudyMaterial.countDocuments(),
      StudyMaterial.countDocuments({ type: 'FREE' }),
      StudyMaterial.countDocuments({ type: 'PAID' }),
      StudyMaterial.countDocuments({ isActive: true })
    ]);

    res.json({
      materials,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(totalCount / parseInt(pageSize)),
        totalCount,
        hasNext: skip + parseInt(pageSize) < totalCount,
        hasPrev: parseInt(page) > 1
      },
      summary: {
        totalMaterials,
        freeMaterials,
        paidMaterials,
        activeMaterials,
        inactiveMaterials: totalMaterials - activeMaterials
      }
    });
  } catch (error) {
    console.error('Error fetching study materials:', error);
    res.status(500).json({
      message: 'Failed to fetch study materials',
      error: error.message
    });
  }
};

// POST /api/admin/study-materials
// Create a new study material
exports.createStudyMaterial = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      title,
      description,
      category,
      subject,
      caLevel,
      type,
      price,
      discountPrice,
      tags,
      featured,
      fileInfo
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !subject || !caLevel || !type || !fileInfo) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['title', 'description', 'category', 'subject', 'caLevel', 'type', 'fileInfo']
      });
    }

    // Validate price for paid materials
    if (type === 'PAID' && (!price || price <= 0)) {
      return res.status(400).json({
        message: 'Price is required and must be greater than 0 for paid materials'
      });
    }

    // Create study material
    const material = await StudyMaterial.create({
      title: title.trim(),
      description: description.trim(),
      category,
      subject,
      caLevel,
      type,
      price: type === 'PAID' ? price : 0,
      discountPrice: discountPrice || 0,
      tags: tags || [],
      featured: featured || false,
      fileInfo,
      uploadedBy: adminId
    });

    await material.populate('uploadedBy', 'fullName email');

    res.status(201).json({
      message: 'Study material created successfully',
      material
    });
  } catch (error) {
    console.error('Error creating study material:', error);
    res.status(500).json({
      message: 'Failed to create study material',
      error: error.message
    });
  }
};

// GET /api/admin/study-materials/:id
// Get study material details
exports.getStudyMaterialDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await StudyMaterial.findById(id)
      .populate('uploadedBy', 'fullName email');

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    // Get purchase statistics for paid materials
    let purchaseStats = null;
    if (material.type === 'PAID') {
      const [totalPurchases, completedPurchases, revenue] = await Promise.all([
        Purchase.countDocuments({ studyMaterialId: id }),
        Purchase.countDocuments({ studyMaterialId: id, status: 'COMPLETED' }),
        Purchase.aggregate([
          { $match: { studyMaterialId: new mongoose.Types.ObjectId(id), status: 'COMPLETED' } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      purchaseStats = {
        totalPurchases,
        completedPurchases,
        revenue: revenue[0]?.total || 0
      };
    }

    res.json({
      material,
      purchaseStats
    });
  } catch (error) {
    console.error('Error fetching study material details:', error);
    res.status(500).json({
      message: 'Failed to fetch study material details',
      error: error.message
    });
  }
};

// PUT /api/admin/study-materials/:id
// Update study material
exports.updateStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates._id;
    delete updates.uploadedBy;
    delete updates.createdAt;
    delete updates.downloadCount;
    delete updates.purchaseCount;

    const material = await StudyMaterial.findByIdAndUpdate(
      id,
      { ...updates, lastUpdated: new Date() },
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'fullName email');

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    res.json({
      message: 'Study material updated successfully',
      material
    });
  } catch (error) {
    console.error('Error updating study material:', error);
    res.status(500).json({
      message: 'Failed to update study material',
      error: error.message
    });
  }
};

// DELETE /api/admin/study-materials/:id
// Delete study material permanently
exports.deleteStudyMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await StudyMaterial.findByIdAndDelete(id);

    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    res.json({
      message: 'Study material deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting study material:', error);
    res.status(500).json({
      message: 'Failed to delete study material',
      error: error.message
    });
  }
};

// PUT /api/admin/study-materials/:id/toggle-status
// Toggle study material active status
exports.toggleStudyMaterialStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await StudyMaterial.findById(id);
    if (!material) {
      return res.status(404).json({ message: 'Study material not found' });
    }

    material.isActive = !material.isActive;
    material.lastUpdated = new Date();
    await material.save();

    res.json({
      message: `Study material ${material.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: material.isActive
    });
  } catch (error) {
    console.error('Error toggling study material status:', error);
    res.status(500).json({
      message: 'Failed to toggle study material status',
      error: error.message
    });
  }
};

// GET /api/admin/study-materials/analytics
// Get study materials analytics
exports.getStudyMaterialsAnalytics = async (req, res) => {
  try {
    // Basic counts
    const [
      totalMaterials,
      freeMaterials,
      paidMaterials,
      activeMaterials,
      featuredMaterials
    ] = await Promise.all([
      StudyMaterial.countDocuments(),
      StudyMaterial.countDocuments({ type: 'FREE' }),
      StudyMaterial.countDocuments({ type: 'PAID' }),
      StudyMaterial.countDocuments({ isActive: true }),
      StudyMaterial.countDocuments({ featured: true })
    ]);

    // Category distribution
    const categoryStats = await StudyMaterial.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Subject distribution
    const subjectStats = await StudyMaterial.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // CA Level distribution
    const levelStats = await StudyMaterial.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$caLevel', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top downloaded materials
    const topDownloaded = await StudyMaterial.find({ isActive: true })
      .sort({ downloadCount: -1 })
      .limit(10)
      .select('title downloadCount type')
      .populate('uploadedBy', 'fullName');

    // Revenue analytics for paid materials
    const revenueStats = await Purchase.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPurchases: { $sum: 1 },
          averageOrderValue: { $avg: '$amount' }
        }
      }
    ]);

    // Monthly revenue trend
    const monthlyRevenue = await Purchase.aggregate([
      { $match: { status: 'COMPLETED' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          purchases: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    res.json({
      overview: {
        totalMaterials,
        freeMaterials,
        paidMaterials,
        activeMaterials,
        featuredMaterials,
        inactiveMaterials: totalMaterials - activeMaterials
      },
      distribution: {
        categories: categoryStats,
        subjects: subjectStats,
        levels: levelStats
      },
      topDownloaded,
      revenue: {
        total: revenueStats[0]?.totalRevenue || 0,
        totalPurchases: revenueStats[0]?.totalPurchases || 0,
        averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
        monthlyTrend: monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Error fetching study materials analytics:', error);
    res.status(500).json({
      message: 'Failed to fetch analytics',
      error: error.message
    });
  }
};

// GET /api/admin/orders
exports.getOrders = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, search, startDate, endDate, sortBy = 'createdAt', sortOrder = 'desc', testSeriesId } = req.query;
    const p = Math.max(parseInt(page, 10) || 1, 1);
    const s = Math.min(Math.max(parseInt(pageSize, 10) || 20, 1), 100);
    const skip = (p - 1) * s;

    const matchCriteria = {};

    if (status && status !== 'all') {
      const requestedStatuses = String(status)
        .split(',')
        .map((value) => value.trim().toUpperCase())
        .filter(Boolean);
      if (requestedStatuses.length === 1) {
        matchCriteria.status = requestedStatuses[0];
      } else if (requestedStatuses.length > 1) {
        matchCriteria.status = { $in: requestedStatuses };
      }
    }

    if (testSeriesId && testSeriesId !== 'all' && testSeriesId !== 'undefined') {
      if (mongoose.Types.ObjectId.isValid(testSeriesId)) {
        matchCriteria.$or = [
          { testSeriesId: new mongoose.Types.ObjectId(testSeriesId) },
          { testSeriesIds: new mongoose.Types.ObjectId(testSeriesId) }
        ];
      } else {
        matchCriteria.testSeriesId = testSeriesId;
      }
    }

    if (startDate && endDate) {
      matchCriteria.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Build sort criteria
    const sortCriteria = {};
    if (sortBy === 'createdAt') {
      sortCriteria.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'amount') {
      sortCriteria.amount = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortCriteria.createdAt = -1;
    }

    const pipeline = [
      { $match: matchCriteria },
      // Lookup student
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student',
          pipeline: [
            { $project: { fullName: 1, email: 1, mobile: 1, phone: 1, studentNumericId: 1 } }
          ]
        }
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },

      // Lookup Test Series
      {
        $lookup: {
          from: 'testseries',
          localField: 'testSeriesId',
          foreignField: '_id',
          as: 'testSeries',
          pipeline: [
            { $project: { title: 1, originalPrice: 1, discountedPrice: 1, price: 1 } }
          ]
        }
      },
      {
        $lookup: {
          from: 'testseries',
          localField: 'testSeriesIds',
          foreignField: '_id',
          as: 'testSeriesList',
          pipeline: [
            { $project: { title: 1 } }
          ]
        }
      },
      { $unwind: { path: '$testSeries', preserveNullAndEmptyArrays: true } },

      // Search Filter
      ...(search ? [
        {
          $match: {
            $or: [
              { 'student.fullName': { $regex: search, $options: 'i' } },
              { 'student.email': { $regex: search, $options: 'i' } },
              { 'student.mobile': { $regex: search, $options: 'i' } },
              { 'student.studentNumericId': Number.isNaN(Number(search)) ? -1 : Number(search) },
              { 'receipt': { $regex: search, $options: 'i' } },
              { 'razorpayOrderId': { $regex: search, $options: 'i' } }
            ]
          }
        }
      ] : []),

      { $sort: sortCriteria },
      { $skip: skip },
      { $limit: s },
      {
        $project: {
          _id: 1,
          orderId: '$razorpayOrderId',
          receipt: 1,
          amount: 1,
          currency: 1,
          status: 1,
          createdAt: 1,
          studentName: '$student.fullName',
          studentEmail: '$student.email',
          studentMobile: { $ifNull: ['$student.mobile', '$student.phone'] },
          studentId: { $ifNull: ['$student.studentNumericId', { $toString: '$student._id' }] },
          testSeriesTitle: {
            $cond: [
              { $gt: [{ $size: '$testSeriesList' }, 0] },
              {
                $reduce: {
                  input: '$testSeriesList.title',
                  initialValue: '',
                  in: {
                    $concat: [
                      '$$value',
                      { $cond: [{ $eq: ['$$value', ''] }, '', ', '] },
                      '$$this'
                    ]
                  }
                }
              },
              '$testSeries.title'
            ]
          },
          paymentMethod: 1,
          originalPrice: '$testSeries.originalPrice',
          discountedPrice: '$testSeries.discountedPrice'
        }
      }
    ];

    // Count pipeline for pagination with search
    const countPipeline = [
      { $match: matchCriteria },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
      ...(search ? [
        {
          $match: {
            $or: [
              { 'student.fullName': { $regex: search, $options: 'i' } },
              { 'student.email': { $regex: search, $options: 'i' } },
              { 'student.mobile': { $regex: search, $options: 'i' } },
              { 'student.studentNumericId': Number.isNaN(Number(search)) ? -1 : Number(search) },
              { 'receipt': { $regex: search, $options: 'i' } },
              { 'razorpayOrderId': { $regex: search, $options: 'i' } }
            ]
          }
        }
      ] : []),
      { $count: 'total' }
    ];

    const [orders, countResult] = await Promise.all([
      Payment.aggregate(pipeline),
      Payment.aggregate(countPipeline)
    ]);

    const totalCount = countResult[0]?.total || 0;

    res.json({
      data: orders,
      pagination: {
        page: p,
        pageSize: s,
        total: totalCount,
        totalPages: Math.ceil(totalCount / s)
      },
      filters: {
        supportedStatuses: ['CREATED', 'CAPTURED']
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};
