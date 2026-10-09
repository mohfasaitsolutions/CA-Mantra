const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { auth, requireRoles } = require('../middleware/auth');

// Public route - Contact form submission
router.post('/contact', contactController.submitContactForm);

// Admin routes - Enquiry management
router.get('/admin/enquiries', 
  auth(), 
  requireRoles('ADMIN'), 
  contactController.getEnquiries
);

router.get('/admin/enquiries/:id', 
  auth(), 
  requireRoles('ADMIN'), 
  contactController.getEnquiryDetails
);

router.delete('/admin/enquiries/:id', 
  auth(), 
  requireRoles('ADMIN'), 
  contactController.deleteEnquiry
);

module.exports = router;
