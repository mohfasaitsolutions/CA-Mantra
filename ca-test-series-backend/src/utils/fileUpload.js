const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const sharp = require('sharp');

// Ensure storage directories exist
const ensureDirectoryExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Created directory: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw new Error(`Failed to create directory: ${dirPath}`);
  }
};

// Initialize all required storage directories
const initializeStorageDirectories = () => {
  const directories = [
    path.join(__dirname, '../../storage/images/testseries'),
    path.join(__dirname, '../../storage/images/profiles'),
    path.join(__dirname, '../../storage/images/blogs'),
    path.join(__dirname, '../../storage/pdfs/testseries'),
    path.join(__dirname, '../../storage/pdfs/submissions'),
    path.join(__dirname, '../../storage/pdfs/evaluated'),
    path.join(__dirname, '../../storage/pdfs/study-materials'),
    path.join(__dirname, '../../storage/pdfs/schedules')
  ];

  console.log('Initializing storage directories...');
  directories.forEach(dir => {
    ensureDirectoryExists(dir);
  });
  console.log('All storage directories initialized successfully.');
};

// Helper function to create custom directory if needed
const createCustomDirectory = (customPath) => {
  try {
    const fullPath = path.join(__dirname, '../../storage', customPath);
    ensureDirectoryExists(fullPath);
    return fullPath;
  } catch (error) {
    console.error(`Error creating custom directory ${customPath}:`, error);
    throw error;
  }
};

// Storage configuration for test series thumbnails
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../storage/images/testseries');
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = uuidv4().split('-')[0];
    const title = req.body.title ? req.body.title.replace(/[^a-zA-Z0-9]/g, '_') : 'thumbnail';
    const extension = path.extname(file.originalname);
    const filename = `thumbnail_testseries_${title}_${timestamp}_${randomId}${extension}`;
    cb(null, filename);
  }
});

// Storage configuration for PDF files
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../storage/pdfs/testseries');
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = uuidv4().split('-')[0];
    const testTitle = req.body.testTitle ? req.body.testTitle.replace(/[^a-zA-Z0-9]/g, '_') : 'test';
    const extension = path.extname(file.originalname);
    
    let prefix = 'question_paper';
    if (file.fieldname === 'suggestedAnswer') {
      prefix = 'suggested_answer';
    }
    
    const filename = `${prefix}_${testTitle}_${timestamp}_${randomId}${extension}`;
    cb(null, filename);
  }
});

// Storage configuration for student submission PDFs
const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../storage/pdfs/submissions');
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = uuidv4().split('-')[0];
    const base = 'answer_sheet';
    const extension = path.extname(file.originalname) || '.pdf';
    const filename = `${base}_${timestamp}_${randomId}${extension}`;
    cb(null, filename);
  }
});

// Storage configuration for evaluated submission PDFs (by evaluators)
const evaluatedSubmissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../storage/pdfs/evaluated');
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = uuidv4().split('-')[0];
    const base = 'evaluated_answer_sheet';
    const extension = path.extname(file.originalname) || '.pdf';
    const filename = `${base}_${timestamp}_${randomId}${extension}`;
    cb(null, filename);
  }
});

// Storage configuration for profile pictures (temporary - will be processed)
const profilePictureStorage = multer.memoryStorage();

// Storage configuration for study materials
const studyMaterialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../storage/pdfs/study-materials');
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = uuidv4().split('-')[0];
    const title = req.body.title ? req.body.title.replace(/[^a-zA-Z0-9]/g, '_') : 'study_material';
    const extension = path.extname(file.originalname);
    const filename = `study_material_${title}_${timestamp}_${randomId}${extension}`;
    cb(null, filename);
  }
});

// Storage configuration for schedules
const scheduleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../storage/pdfs/schedules');
    ensureDirectoryExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = uuidv4().split('-')[0];
    const title = req.body.title ? req.body.title.replace(/[^a-zA-Z0-9]/g, '_') : 'schedule';
    const extension = path.extname(file.originalname);
    const filename = `schedule_${title}_${timestamp}_${randomId}${extension}`;
    cb(null, filename);
  }
});

// Utility function to compress and save profile picture
const compressAndSaveProfilePicture = async (buffer, userId, userType = 'user') => {
  const dir = path.join(__dirname, '../../storage/images/profiles');
  ensureDirectoryExists(dir);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `profile_${userType}_${userId}_${timestamp}.jpg`;
  const filePath = path.join(dir, filename);
  
  // Compress image to ensure it's under 500KB
  let quality = 85;
  let compressedBuffer;
  let fileSize;
  
  do {
    compressedBuffer = await sharp(buffer)
      .resize(400, 400, { 
        fit: 'cover',
        position: 'center' 
      })
      .jpeg({ 
        quality: quality,
        progressive: true 
      })
      .toBuffer();
    
    fileSize = compressedBuffer.length;
    quality -= 10;
  } while (fileSize > 500 * 1024 && quality > 20); // 500KB limit
  
  // Save the compressed image
  fs.writeFileSync(filePath, compressedBuffer);
  
  return filePath;
};

const optimizeImageFile = async (filePath, options = {}) => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 82
  } = options;

  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.gif') {
    return filePath;
  }

  let pipeline = sharp(filePath).rotate().resize({
    width: maxWidth,
    height: maxHeight,
    fit: 'inside',
    withoutEnlargement: true
  });

  if (extension === '.png') {
    pipeline = pipeline.png({ quality, compressionLevel: 9 });
  } else if (extension === '.webp') {
    pipeline = pipeline.webp({ quality });
  } else {
    pipeline = pipeline.jpeg({ quality, mozjpeg: true });
  }

  const optimizedBuffer = await pipeline.toBuffer();
  fs.writeFileSync(filePath, optimizedBuffer);
  return filePath;
};

// File filter for images (thumbnails)
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

// File filter for PDFs
const pdfFileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Only PDF files are allowed. Received: ${file.mimetype}`), false);
  }
};

// Multer configurations
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit for images
  }
}).single('thumbnail');

const uploadPDFs = multer({
  storage: pdfStorage,
  fileFilter: pdfFileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit for PDFs
  }
}).fields([
  { name: 'questionPaper', maxCount: 1 },
  { name: 'suggestedAnswer', maxCount: 1 }
]);

// Multer for student submissions (single PDF)
const uploadSubmissionPDF = multer({
  storage: submissionStorage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
}).single('answerSheet');

// Multer for evaluated submissions by evaluators (single PDF)
const uploadEvaluatedPDF = multer({
  storage: evaluatedSubmissionStorage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
}).single('evaluatedFile');

// Multer for profile pictures (stored in memory for processing)
const uploadProfilePicture = multer({
  storage: profilePictureStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit before compression to 500KB
}).single('profilePicture');

// Multer for study materials (single PDF)
const uploadStudyMaterialPDF = multer({
  storage: studyMaterialStorage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for study materials
}).single('file');

// Multer for schedules (single PDF)
const uploadSchedulePDF = multer({
  storage: scheduleStorage,
  fileFilter: pdfFileFilter,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit for schedules
}).single('file');

// Helper function to get file URL (normalizes slashes and supports API_BASE_ASSET_URL)
const getFileUrl = (req, filePath) => {
  if (!filePath) return null;
  // Prefer explicit base from env (useful behind proxies) else fall back to request host
  const envBase = process.env.API_BASE_ASSET_URL ? String(process.env.API_BASE_ASSET_URL).replace(/\/+$/, '') : null;
  const baseUrl = envBase || `${req.protocol}://${req.get('host')}`;
  // Compute path relative to storage root and normalize to forward slashes for URLs
  const relativeFromStorage = path.relative(path.join(__dirname, '../../storage'), filePath)
    .replace(/\\/g, '/');
  return `${baseUrl}/uploads/${relativeFromStorage}`;
};

// Helper function to delete file
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
  return false;
};

// Middleware to handle file upload errors with better messages
const handleFileUploadError = (error, req, res, next) => {
  if (error) {
    console.error('File upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      const limitMB = error.limit ? (error.limit / (1024 * 1024)).toFixed(0) : '20';
      return res.status(413).json({
        error: 'File size too large',
        message: `File size exceeds ${limitMB}MB limit. Please upload a smaller PDF file.`,
        details: {
          limit: error.limit,
          limitMB: limitMB,
          fileType: 'PDF'
        }
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        message: 'Only one file is allowed per upload.',
        details: {
          limit: error.limit
        }
      });
    }
    
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: error.message,
        details: {
          allowedTypes: ['application/pdf']
        }
      });
    }
    
    return res.status(400).json({
      error: 'File upload failed',
      message: error.message || 'An error occurred during file upload'
    });
  }
  
  next();
};

module.exports = {
  uploadThumbnail,
  uploadPDFs,
  uploadSubmissionPDF,
  uploadEvaluatedPDF,
  uploadProfilePicture,
  uploadStudyMaterialPDF,
  uploadSchedulePDF,
  compressAndSaveProfilePicture,
  optimizeImageFile,
  getFileUrl,
  deleteFile,
  handleFileUploadError,
  ensureDirectoryExists,
  initializeStorageDirectories,
  createCustomDirectory
};
