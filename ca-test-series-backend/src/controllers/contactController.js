const mongoose = require('mongoose');
const Contact = require('../models/Contact');

// PUBLIC ENDPOINTS

// POST /api/contact
// Submit contact form (public endpoint)
exports.submitContactForm = async (req, res) => {
  try {
    const { fullName, email, mobile, message, subject } = req.body;

    // Validate required fields
    if (!fullName || !email || !mobile || !message) {
      return res.status(400).json({
        message: 'Full name, email, mobile number, and message are required'
      });
    }

    // Validate email format
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: 'Please enter a valid email address'
      });
    }

    // Validate mobile format (10 digits)
    const mobileRegex = /^[0-9]{10}$/;
    if (!mobileRegex.test(mobile)) {
      return res.status(400).json({
        message: 'Please enter a valid 10-digit mobile number'
      });
    }

    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                     (req.connection.socket ? req.connection.socket.remoteAddress : null);
    const userAgent = req.get('User-Agent');

    // Create contact entry
    const contact = new Contact({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile.trim(),
      message: message.trim(),
      subject: subject ? subject.trim() : undefined,
      ipAddress,
      userAgent
    });

    await contact.save();

    res.status(201).json({
      message: 'Thank you for contacting us! We will get back to you soon.',
      contactId: contact._id
    });

  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      message: 'Failed to submit contact form. Please try again later.',
      error: error.message
    });
  }
};

// ADMIN ENDPOINTS

// GET /api/admin/enquiries
// Get all contact enquiries for admin
exports.getEnquiries = async (req, res) => {
  try {
    const {
      search,
      startDate,
      endDate,
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter criteria
    const filter = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { fullName: searchRegex },
        { email: searchRegex },
        { mobile: searchRegex },
        { message: searchRegex },
        { subject: searchRegex }
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    // Execute query
    const [enquiries, totalCount] = await Promise.all([
      Contact.find(filter)
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(),
      
      Contact.countDocuments(filter)
    ]);

    // Format enquiries
    const formattedEnquiries = enquiries.map(enquiry => ({
      id: enquiry._id,
      fullName: enquiry.fullName,
      email: enquiry.email,
      mobile: enquiry.mobile,
      message: enquiry.message,
      subject: enquiry.subject,
      source: enquiry.source,
      createdAt: enquiry.createdAt,
      updatedAt: enquiry.updatedAt
    }));

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Simple statistics
    const totalEnquiries = await Contact.countDocuments();

    res.json({
      enquiries: formattedEnquiries,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalPages,
        totalItems: totalCount,
        hasNextPage,
        hasPrevPage
      },
      statistics: {
        totalEnquiries
      }
    });

  } catch (error) {
    console.error('Error getting enquiries:', error);
    res.status(500).json({
      message: 'Failed to get enquiries',
      error: error.message
    });
  }
};

// GET /api/admin/enquiries/:id
// Get specific enquiry details
exports.getEnquiryDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid enquiry ID' });
    }

    const enquiry = await Contact.findById(id);

    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.json({
      id: enquiry._id,
      fullName: enquiry.fullName,
      email: enquiry.email,
      mobile: enquiry.mobile,
      message: enquiry.message,
      subject: enquiry.subject,
      source: enquiry.source,
      ipAddress: enquiry.ipAddress,
      userAgent: enquiry.userAgent,
      createdAt: enquiry.createdAt,
      updatedAt: enquiry.updatedAt
    });

  } catch (error) {
    console.error('Error getting enquiry details:', error);
    res.status(500).json({
      message: 'Failed to get enquiry details',
      error: error.message
    });
  }
};

// DELETE /api/admin/enquiries/:id
// Delete enquiry (admin only)
exports.deleteEnquiry = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid enquiry ID' });
    }

    const enquiry = await Contact.findById(id);
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    await Contact.findByIdAndDelete(id);

    res.json({ message: 'Enquiry deleted successfully' });

  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({
      message: 'Failed to delete enquiry',
      error: error.message
    });
  }
};
