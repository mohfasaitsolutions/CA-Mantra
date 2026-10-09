const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { uploadSchedulePDF, deleteFile, handleFileUploadError } = require('../utils/fileUpload');
const path = require('path');
const fs = require('fs').promises;

// ADMIN ENDPOINTS

// GET /api/admin/schedules
// Get all schedules for admin management
exports.getSchedules = async (req, res) => {
  try {
    const {
      examType,
      examSession,
      examYear,
      search,
      isActive,
      page = 1,
      pageSize = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter criteria
    const filter = {};

    if (examType && examType !== 'all') {
      filter.examType = examType;
    }

    if (examSession && examSession !== 'all') {
      filter.examSession = examSession;
    }

    if (examYear) {
      filter.examYear = parseInt(examYear);
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { fileName: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    // Execute query
    const [schedules, totalCount] = await Promise.all([
      Schedule.find(filter)
        .populate('uploadedBy', 'fullName email')
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(),
      
      Schedule.countDocuments(filter)
    ]);

    // Format schedules
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule._id,
      title: schedule.title,
      description: schedule.description,
      fileName: schedule.fileName,
      filePath: schedule.filePath,
      fileSize: schedule.fileSize,
      readableFileSize: formatFileSize(schedule.fileSize),
      mimeType: schedule.mimeType,
      examType: schedule.examType,
      examSession: schedule.examSession,
      examYear: schedule.examYear,
      isActive: schedule.isActive,
      downloadCount: schedule.downloadCount,
      uploadedBy: schedule.uploadedBy,
      tags: schedule.tags,
      priority: schedule.priority,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt
    }));

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      schedules: formattedSchedules,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalPages,
        totalItems: totalCount,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error getting schedules:', error);
    res.status(500).json({ 
      message: 'Failed to get schedules',
      error: error.message 
    });
  }
};

// POST /api/admin/schedules
// Create new schedule
exports.createSchedule = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Handle file upload
    uploadSchedulePDF(req, res, async (err) => {
      if (err) {
        return handleFileUploadError(err, req, res, () => {});
      }

      try {
        const {
          title,
          description,
          examType = 'ALL',
          examSession,
          examYear,
          tags,
          priority = 0
        } = req.body;

        // Validate required fields
        if (!title || !examSession || !examYear) {
          return res.status(400).json({ 
            message: 'Title, exam session, and exam year are required' 
          });
        }

        if (!req.file) {
          return res.status(400).json({ 
            message: 'Schedule PDF file is required' 
          });
        }

        // Parse tags if provided
        let parsedTags = [];
        if (tags) {
          try {
            parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
          } catch (e) {
            parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
          }
        }

        // Create schedule
        const schedule = new Schedule({
          title: title.trim(),
          description: description ? description.trim() : '',
          fileName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          examType,
          examSession,
          examYear: parseInt(examYear),
          uploadedBy: adminId,
          tags: parsedTags,
          priority: parseInt(priority) || 0
        });

        await schedule.save();

        // Populate uploadedBy for response
        await schedule.populate('uploadedBy', 'fullName email');

        res.status(201).json({
          message: 'Schedule created successfully',
          schedule: {
            id: schedule._id,
            title: schedule.title,
            description: schedule.description,
            fileName: schedule.fileName,
            filePath: schedule.filePath,
            fileSize: schedule.fileSize,
            readableFileSize: formatFileSize(schedule.fileSize),
            mimeType: schedule.mimeType,
            examType: schedule.examType,
            examSession: schedule.examSession,
            examYear: schedule.examYear,
            isActive: schedule.isActive,
            downloadCount: schedule.downloadCount,
            uploadedBy: schedule.uploadedBy,
            tags: schedule.tags,
            priority: schedule.priority,
            createdAt: schedule.createdAt,
            updatedAt: schedule.updatedAt
          }
        });

      } catch (error) {
        // Delete uploaded file if schedule creation fails
        if (req.file && req.file.path) {
          try {
            await fs.unlink(req.file.path);
          } catch (unlinkError) {
            console.error('Error deleting file:', unlinkError);
          }
        }

        console.error('Error creating schedule:', error);
        res.status(500).json({ 
          message: 'Failed to create schedule',
          error: error.message 
        });
      }
    });

  } catch (error) {
    console.error('Error in createSchedule:', error);
    res.status(500).json({ 
      message: 'Failed to create schedule',
      error: error.message 
    });
  }
};

// PUT /api/admin/schedules/:id
// Update schedule
exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      examType,
      examSession,
      examYear,
      isActive,
      tags,
      priority
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid schedule ID' });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Parse tags if provided
    let parsedTags;
    if (tags !== undefined) {
      try {
        parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (e) {
        parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()) : [];
      }
    }

    // Update fields
    if (title !== undefined) schedule.title = title.trim();
    if (description !== undefined) schedule.description = description.trim();
    if (examType !== undefined) schedule.examType = examType;
    if (examSession !== undefined) schedule.examSession = examSession;
    if (examYear !== undefined) schedule.examYear = parseInt(examYear);
    if (isActive !== undefined) schedule.isActive = isActive;
    if (parsedTags !== undefined) schedule.tags = parsedTags;
    if (priority !== undefined) schedule.priority = parseInt(priority) || 0;

    await schedule.save();
    await schedule.populate('uploadedBy', 'fullName email');

    res.json({
      message: 'Schedule updated successfully',
      schedule: {
        id: schedule._id,
        title: schedule.title,
        description: schedule.description,
        fileName: schedule.fileName,
        filePath: schedule.filePath,
        fileSize: schedule.fileSize,
        readableFileSize: formatFileSize(schedule.fileSize),
        mimeType: schedule.mimeType,
        examType: schedule.examType,
        examSession: schedule.examSession,
        examYear: schedule.examYear,
        isActive: schedule.isActive,
        downloadCount: schedule.downloadCount,
        uploadedBy: schedule.uploadedBy,
        tags: schedule.tags,
        priority: schedule.priority,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ 
      message: 'Failed to update schedule',
      error: error.message 
    });
  }
};

// DELETE /api/admin/schedules/:id
// Delete schedule
exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid schedule ID' });
    }

    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Delete the file
    try {
      await fs.unlink(schedule.filePath);
    } catch (fileError) {
      console.error('Error deleting file:', fileError);
      // Continue with database deletion even if file deletion fails
    }

    await Schedule.findByIdAndDelete(id);

    res.json({ message: 'Schedule deleted successfully' });

  } catch (error) {
    console.error('Error deleting schedule:', error);
    res.status(500).json({ 
      message: 'Failed to delete schedule',
      error: error.message 
    });
  }
};

// GET /api/admin/schedules/:id
// Get schedule details
exports.getScheduleDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid schedule ID' });
    }

    const schedule = await Schedule.findById(id).populate('uploadedBy', 'fullName email');
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    res.json({
      id: schedule._id,
      title: schedule.title,
      description: schedule.description,
      fileName: schedule.fileName,
      filePath: schedule.filePath,
      fileSize: schedule.fileSize,
      readableFileSize: formatFileSize(schedule.fileSize),
      mimeType: schedule.mimeType,
      examType: schedule.examType,
      examSession: schedule.examSession,
      examYear: schedule.examYear,
      isActive: schedule.isActive,
      downloadCount: schedule.downloadCount,
      uploadedBy: schedule.uploadedBy,
      tags: schedule.tags,
      priority: schedule.priority,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt
    });

  } catch (error) {
    console.error('Error getting schedule details:', error);
    res.status(500).json({ 
      message: 'Failed to get schedule details',
      error: error.message 
    });
  }
};

// PUBLIC ENDPOINTS - No authentication required

// GET /api/schedules/public
// Get public schedules (no authentication required)
exports.getPublicSchedules = async (req, res) => {
  try {
    const {
      examType,
      examSession,
      examYear,
      search,
      page = 1,
      pageSize = 10,
      sortBy = 'priority',
      sortOrder = 'desc'
    } = req.query;

    // Build filter criteria - only active schedules
    const filter = { isActive: true };

    if (examType && examType !== 'all') {
      filter.$or = [
        { examType: examType },
        { examType: 'ALL' }
      ];
    }

    if (examSession && examSession !== 'all') {
      filter.$or = [
        ...(filter.$or || []),
        { examSession: examSession },
        { examSession: 'BOTH' }
      ];
    }

    if (examYear) {
      filter.examYear = parseInt(examYear);
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      filter.$or = [
        ...(filter.$or || []),
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    // Sort configuration - prioritize by priority first, then by selected field
    const sortConfig = {};
    if (sortBy === 'priority') {
      sortConfig.priority = -1;
      sortConfig.createdAt = -1;
    } else {
      sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limit = parseInt(pageSize);
    const skip = (pageNum - 1) * limit;

    // Execute query
    const [schedules, totalCount, summary] = await Promise.all([
      Schedule.find(filter)
        .select('title description fileName fileSize examType examSession examYear tags priority')
        .sort(sortConfig)
        .skip(skip)
        .limit(limit)
        .lean(),
      
      Schedule.countDocuments(filter),
      
      Schedule.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalSchedules: { $sum: 1 },
            foundationSchedules: {
              $sum: { $cond: [{ $eq: ['$examType', 'FOUNDATION'] }, 1, 0] }
            },
            intermediateSchedules: {
              $sum: { $cond: [{ $eq: ['$examType', 'INTERMEDIATE'] }, 1, 0] }
            },
            finalSchedules: {
              $sum: { $cond: [{ $eq: ['$examType', 'FINAL'] }, 1, 0] }
            },
            allLevelSchedules: {
              $sum: { $cond: [{ $eq: ['$examType', 'ALL'] }, 1, 0] }
            }
          }
        }
      ])
    ]);

    // Format schedules for public consumption
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule._id,
      title: schedule.title,
      description: schedule.description,
      fileName: schedule.fileName,
      readableFileSize: formatFileSize(schedule.fileSize),
      examType: schedule.examType,
      examSession: schedule.examSession,
      examYear: schedule.examYear,
      tags: schedule.tags || [],
      priority: schedule.priority
    }));

    // Pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    const summaryData = summary[0] || {
      totalSchedules: 0,
      foundationSchedules: 0,
      intermediateSchedules: 0,
      finalSchedules: 0,
      allLevelSchedules: 0
    };

    res.json({
      schedules: formattedSchedules,
      pagination: {
        page: pageNum,
        pageSize: limit,
        totalPages,
        totalItems: totalCount,
        hasNextPage,
        hasPrevPage
      },
      summary: summaryData
    });

  } catch (error) {
    console.error('Error getting public schedules:', error);
    res.status(500).json({ 
      message: 'Failed to get schedules',
      error: error.message 
    });
  }
};

// GET /api/schedules/:id/download
// Download schedule file (public endpoint)
exports.downloadSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid schedule ID' });
    }

    const schedule = await Schedule.findOne({ _id: id, isActive: true });
    
    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if file exists
    try {
      await fs.access(schedule.filePath);
    } catch (error) {
      return res.status(404).json({ message: 'Schedule file not found' });
    }

    // Increment download count
    schedule.downloadCount += 1;
    await schedule.save();

    // Set headers for file download
    res.setHeader('Content-Type', schedule.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${schedule.fileName}"`);
    
    // Stream the file
    const path = require('path');
    res.download(schedule.filePath, schedule.fileName);

  } catch (error) {
    console.error('Error downloading schedule:', error);
    res.status(500).json({ 
      message: 'Failed to download schedule',
      error: error.message 
    });
  }
};

// Helper function to format file size
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
