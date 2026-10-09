const Blog = require('../models/Blog');
const { validationResult } = require('express-validator');

function sanitizePublicBlog(blogDoc) {
  const blog = blogDoc.toObject ? blogDoc.toObject() : { ...blogDoc };
  delete blog.viewCount;
  if (blog.author) {
    blog.author = {
      profilePictureUrl: blog.author.profilePictureUrl || null
    };
  }
  return blog;
}

// @desc    Get all blogs with pagination and filters
// @route   GET /api/blogs
// @access  Public
const getBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { status: 'PUBLISHED' };
    
    // Add category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }
    
    // Add author filter
    if (req.query.author) {
      filter.author = req.query.author;
    }
    
    // Add tag filter
    if (req.query.tag) {
      filter.tags = { $in: [req.query.tag] };
    }
    
    // Add search filter
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { content: { $regex: req.query.search, $options: 'i' } },
        { tags: { $in: [new RegExp(req.query.search, 'i')] } }
      ];
    }
    
    const blogs = await Blog.find(filter)
      .populate('author', 'profilePictureUrl')
      .sort({ publishedAt: -1 })
      .limit(limit)
      .skip(skip)
      .select('-content'); // Exclude full content for list view
    
    const total = await Blog.countDocuments(filter);
    const sanitizedBlogs = blogs.map(sanitizePublicBlog);
    
    res.json({
      success: true,
      data: {
        blogs: sanitizedBlogs,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blogs'
    });
  }
};

// @desc    Get single blog by slug or ID
// @route   GET /api/blogs/:slugOrId
// @access  Public
const getBlog = async (req, res) => {
  try {
    const { slugOrId } = req.params;
    
    // Try to find by slug first, then by ID
    let blog = await Blog.findOne({ slug: slugOrId })
      .populate('author', 'profilePictureUrl');
    
    if (!blog) {
      blog = await Blog.findById(slugOrId)
        .populate('author', 'profilePictureUrl');
    }
    
    if (!blog || blog.status !== 'PUBLISHED') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Increment view count
    blog.viewCount += 1;
    await blog.save();
    
    res.json({
      success: true,
      data: sanitizePublicBlog(blog)
    });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blog'
    });
  }
};

// @desc    Create new blog
// @route   POST /api/blogs
// @access  Private (Admin only)
const createBlog = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const { title, content, excerpt, tags, category, status } = req.body;
    
    const blog = new Blog({
      title,
      content,
      excerpt,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      category,
      status: 'PUBLISHED',
      author: req.user.id
    });
    
    await blog.save();
    await blog.populate('author', 'fullName profilePictureUrl');
    
    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (error) {
    console.error('Create blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating blog'
    });
  }
};

// @desc    Update blog
// @route   PUT /api/blogs/:id
// @access  Private (Admin only)
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, tags, category, status } = req.body;
    
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user can edit this blog (Admin only)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to edit blogs'
      });
    }
    
    // Update fields
    if (title) blog.title = title;
    if (content) blog.content = content;
    if (excerpt) blog.excerpt = excerpt;
    if (tags) blog.tags = tags.split(',').map(tag => tag.trim());
    if (category) blog.category = category;
    if (status) blog.status = status;
    
    await blog.save();
    await blog.populate('author', 'fullName profilePictureUrl');
    
    res.json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (error) {
    console.error('Update blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating blog'
    });
  }
};

// @desc    Delete blog
// @route   DELETE /api/blogs/:id
// @access  Private (Admin only)
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    // Check if user can delete this blog (Admin only)
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete blogs'
      });
    }
    
    await Blog.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Blog deleted successfully'
    });
  } catch (error) {
    console.error('Delete blog error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting blog'
    });
  }
};

// @desc    Toggle blog like
// @route   POST /api/blogs/:id/like
// @access  Private (Students)
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const blog = await Blog.findById(id);
    
    if (!blog || blog.status !== 'PUBLISHED') {
      return res.status(404).json({
        success: false,
        message: 'Blog not found'
      });
    }
    
    const likedIndex = blog.likes.indexOf(userId);
    
    if (likedIndex > -1) {
      // Unlike
      blog.likes.splice(likedIndex, 1);
    } else {
      // Like
      blog.likes.push(userId);
    }
    
    await blog.save();
    
    res.json({
      success: true,
      message: likedIndex > -1 ? 'Blog unliked' : 'Blog liked',
      data: {
        likeCount: blog.likeCount,
        isLiked: likedIndex === -1
      }
    });
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while toggling like'
    });
  }
};

// @desc    Get admin blogs (admin only)
// @route   GET /api/blogs/admin
// @access  Private (Admin only)
const getAdminBlogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = {};
    
    // Add status filter
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    const blogs = await Blog.find(filter)
      .populate('author', 'fullName profilePictureUrl')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Blog.countDocuments(filter);
    
    res.json({
      success: true,
      data: {
        blogs,
        pagination: {
          page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get admin blogs error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching blogs'
    });
  }
};

module.exports = {
  getBlogs,
  getBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleLike,
  getAdminBlogs
};
