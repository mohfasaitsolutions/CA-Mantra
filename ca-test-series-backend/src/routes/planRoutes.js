const express = require('express');
const {
    createPlan,
    getPlans,
    getPlanById,
    updatePlan,
    deletePlan,
    togglePlanStatus,
    addTestSeriesToPlan,
    removeTestSeriesFromPlan,
    updateTestSeriesPrice,
    createPlanValidation,
    updatePlanValidation
} = require('../controllers/planController');
const { auth, requireRoles, ROLES } = require('../middleware/auth');
const { param } = require('express-validator');

const router = express.Router();

// Validation for MongoDB ObjectId parameters
const validateObjectId = (paramName) => [
    param(paramName).isMongoId().withMessage(`Invalid ${paramName}`)
];

// Public routes
router.get('/', getPlans); // Get all active plans
router.get('/:planId', validateObjectId('planId'), getPlanById); // Get single plan

// Protected routes - course content managers
router.use(auth()); // All routes below require authentication
router.use(requireRoles(ROLES.ADMIN, ROLES.COURSE_UPLOADER)); // Admins and course uploaders

router.post('/', createPlanValidation, createPlan); // Create new plan
router.put('/:planId', validateObjectId('planId'), updatePlanValidation, updatePlan); // Update plan
router.put('/:planId/toggle-status', validateObjectId('planId'), togglePlanStatus); // Toggle plan status
router.delete('/:planId', requireRoles(ROLES.ADMIN), validateObjectId('planId'), deletePlan); // Delete plan (ADMIN only)

// Test series management within plans
router.post('/:planId/test-series', validateObjectId('planId'), addTestSeriesToPlan); // Add test series
router.delete('/:planId/test-series/:testSeriesId', validateObjectId('planId'), validateObjectId('testSeriesId'), removeTestSeriesFromPlan); // Remove test series
router.put('/:planId/test-series/:testSeriesId/price', validateObjectId('planId'), validateObjectId('testSeriesId'), updateTestSeriesPrice); // Update price

module.exports = router;

