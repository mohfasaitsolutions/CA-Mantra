const express = require('express');
const { 
  createTestSeries,
  addTest,
  addMCQQuestions,
  updateTest,
  uploadSubjectivePDFs,
  getTestSeries,
  getTestSeriesById,
  updateTestSeries,
  deleteTestSeries,
  publishTestSeries,
  createTestSeriesValidation,
  updateTestSeriesValidation,
  addTestValidation,
  mcqValidation
} = require('../controllers/testSeriesController');
const { auth, requireRoles, ROLES } = require('../middleware/auth');
const { param } = require('express-validator');

const router = express.Router();

// Validation for MongoDB ObjectId parameters
const validateObjectId = (paramName) => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`)
];

// Public routes (for students to view test series)
router.get('/', getTestSeries); // Get all test series with filtering
router.get('/admin/all', auth(), requireRoles(ROLES.ADMIN), (req, res) => {
  req.includeDrafts = true;
  return getTestSeries(req, res);
});
router.get('/admin/:testSeriesId', auth(), requireRoles(ROLES.ADMIN), validateObjectId('testSeriesId'), (req, res) => {
  req.includeDrafts = true;
  return getTestSeriesById(req, res);
});
router.get('/:testSeriesId', validateObjectId('testSeriesId'), getTestSeriesById); // Get specific test series (sanitized)

// Protected routes - Admin only
router.use(auth()); // All routes below require authentication
router.use(requireRoles(ROLES.ADMIN)); // All routes below require admin role

// Test Series Management
router.post('/', createTestSeries); // Create new test series (validation handled inside controller due to multer)
router.put('/:testSeriesId', validateObjectId('testSeriesId'), updateTestSeriesValidation, updateTestSeries); // Update test series
router.patch('/:testSeriesId/publish', validateObjectId('testSeriesId'), publishTestSeries); // Publish a completed draft
router.delete('/:testSeriesId', validateObjectId('testSeriesId'), deleteTestSeries); // Delete test series

// Test Management within Test Series
router.post('/:testSeriesId/tests', 
  validateObjectId('testSeriesId'), 
  addTestValidation, 
  addTest
); // Add new test to test series

// Update an embedded test
router.put('/:testSeriesId/tests/:testId',
  validateObjectId('testSeriesId'),
  validateObjectId('testId'),
  updateTest
); // Update test metadata

// MCQ Questions Management (for objective tests)
router.post('/:testSeriesId/tests/:testId/mcq', 
  validateObjectId('testSeriesId'),
  validateObjectId('testId'),
  mcqValidation,
  addMCQQuestions
); // Add MCQ questions to objective test

// PDF Upload for Subjective Tests
router.post('/:testSeriesId/tests/:testId/pdfs', 
  validateObjectId('testSeriesId'),
  validateObjectId('testId'),
  uploadSubjectivePDFs
); // Upload question paper and suggested answer PDFs

module.exports = router;
