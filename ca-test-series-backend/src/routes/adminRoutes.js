const express = require('express');
const { auth, requireRoles, ROLES } = require('../middleware/auth');
const ctrl = require('../controllers/adminController');
const students = require('../controllers/studentAdminController');
const scheduleCtrl = require('../controllers/scheduleController');

const router = express.Router();

router.get('/dashboard', auth(), requireRoles(ROLES.ADMIN), ctrl.getDashboard);
router.get('/analytics', auth(), requireRoles(ROLES.ADMIN), ctrl.getAnalytics);
router.get('/evaluations', auth(), requireRoles(ROLES.ADMIN), ctrl.getEvaluations);
router.get('/evaluator-feedbacks', auth(), requireRoles(ROLES.ADMIN), ctrl.getEvaluatorFeedbacks);

// Students management (admin)
router.get('/students', auth(), requireRoles(ROLES.ADMIN), students.listStudents);
router.get('/students/:id', auth(), requireRoles(ROLES.ADMIN), students.getStudentById);
router.patch('/students/:id/status', auth(), requireRoles(ROLES.ADMIN), students.updateStudentStatus);
router.get('/students/:id/submissions', auth(), requireRoles(ROLES.ADMIN), students.listStudentSubmissions);
router.get('/students/:id/notes', auth(), requireRoles(ROLES.ADMIN), students.listStudentNotes);
router.post('/students/:id/notes', auth(), requireRoles(ROLES.ADMIN), students.addStudentNote);
router.get('/students/:id/purchases', auth(), requireRoles(ROLES.ADMIN), students.listStudentPurchases);
router.post('/students/:id/email', auth(), requireRoles(ROLES.ADMIN), students.emailStudent);
router.post('/students/:id/grant-retake', auth(), requireRoles(ROLES.ADMIN), students.grantRetake);

// Support tickets management
router.get('/support-tickets', auth(), requireRoles(ROLES.ADMIN), ctrl.getSupportTickets);
router.get('/support-tickets/:ticketId', auth(), requireRoles(ROLES.ADMIN), ctrl.getSupportTicketDetails);
router.put('/support-tickets/:ticketId/respond', auth(), requireRoles(ROLES.ADMIN), ctrl.respondToTicket);
router.put('/support-tickets/:ticketId/status', auth(), requireRoles(ROLES.ADMIN), ctrl.updateTicketStatus);

// Orders management
router.get('/orders', auth(), requireRoles(ROLES.ADMIN), ctrl.getOrders);

// Study materials management
router.get('/study-materials', auth(), requireRoles(ROLES.ADMIN), ctrl.getStudyMaterials);
router.post('/study-materials', auth(), requireRoles(ROLES.ADMIN), ctrl.createStudyMaterial);
router.get('/study-materials/analytics', auth(), requireRoles(ROLES.ADMIN), ctrl.getStudyMaterialsAnalytics);
router.get('/study-materials/:id', auth(), requireRoles(ROLES.ADMIN), ctrl.getStudyMaterialDetails);
router.put('/study-materials/:id', auth(), requireRoles(ROLES.ADMIN), ctrl.updateStudyMaterial);
router.delete('/study-materials/:id', auth(), requireRoles(ROLES.ADMIN), ctrl.deleteStudyMaterial);
router.put('/study-materials/:id/toggle-status', auth(), requireRoles(ROLES.ADMIN), ctrl.toggleStudyMaterialStatus);

// Schedules management
router.get('/schedules', auth(), requireRoles(ROLES.ADMIN), scheduleCtrl.getSchedules);
router.post('/schedules', auth(), requireRoles(ROLES.ADMIN), scheduleCtrl.createSchedule);
router.get('/schedules/:id', auth(), requireRoles(ROLES.ADMIN), scheduleCtrl.getScheduleDetails);
router.put('/schedules/:id', auth(), requireRoles(ROLES.ADMIN), scheduleCtrl.updateSchedule);
router.delete('/schedules/:id', auth(), requireRoles(ROLES.ADMIN), scheduleCtrl.deleteSchedule);

module.exports = router;
