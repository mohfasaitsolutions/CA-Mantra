const express = require('express');
const { body } = require('express-validator');
const { auth, requireRoles, ROLES } = require('../middleware/auth');
const ctrl = require('../controllers/scheduleController');

const router = express.Router();

// PUBLIC ROUTES - No authentication required
router.get('/public', ctrl.getPublicSchedules);
router.get('/:id/download', ctrl.downloadSchedule);

module.exports = router;
