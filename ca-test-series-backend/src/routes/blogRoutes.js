const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { auth, requireRoles } = require('../middleware/auth');
const {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleLike,
  getAdminBlogs
} = require('../controllers/blogController');

// Validation middleware
const validateBlog = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Title must be between 5 and 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 50 })
    .withMessage('Content must be at least 50 characters long'),
  body('category')
    .optional()
    .isIn(['FOUNDATION', 'INTERMEDIATE', 'FINAL', 'GENERAL', 'TIPS', 'NEWS'])
    .withMessage('Invalid category'),
  body('status')
    .optional()
    .isIn(['PUBLISHED'])
    .withMessage('Invalid status')
];

// Public routes
router.get('/', getBlogs);
router.get('/public/:slugOrId', getBlog);

// Protected routes (Admin only)
router.get('/admin', auth(), requireRoles('ADMIN'), getAdminBlogs);
router.post('/', auth(), requireRoles('ADMIN'), validateBlog, createBlog);
router.put('/:id', auth(), requireRoles('ADMIN'), validateBlog, updateBlog);
router.delete('/:id', auth(), requireRoles('ADMIN'), deleteBlog);

// Student interaction routes
router.post('/:id/like', auth(), toggleLike);

// Get single blog for admin (includes drafts)
router.get('/:id', auth(), requireRoles('ADMIN'), async (req, res) => {
  try {
    const blog = await require('../models/Blog').findById(req.params.id)
      .populate('author', 'fullName profilePictureUrl bio');
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user can view this blog (Admin only)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this blog'
      });
    }
    
    res.json({
      success: true,
      data: blog
    });
  } catch (error) {
    console.error('Get admin blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blog'
    });
  }
});

module.exports = router;