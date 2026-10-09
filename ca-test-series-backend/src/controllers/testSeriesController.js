const TestSeries = require('../models/TestSeries');
const User = require('../models/User');
const SUBJECTS = require('../constants/subjects');
const ROLES = require('../constants/roles');
const { uploadThumbnail, uploadPDFs, getFileUrl, deleteFile, handleFileUploadError, optimizeImageFile } = require('../utils/fileUpload');
const { body, validationResult, param } = require('express-validator');
const mongoose = require('mongoose');
const path = require('path');
const multer = require('multer');

function formatValidityForResponse(validity) {
  if (!validity || validity.isUnlimited) {
    return { isUnlimited: true };
  }

  const normalized = { isUnlimited: false };
  if (validity.expiryDate) {
    const expiry = new Date(validity.expiryDate);
    if (!Number.isNaN(expiry.getTime())) {
      const diffMs = expiry.getTime() - Date.now();
      normalized.days = diffMs > 0 ? Math.ceil(diffMs / (1000 * 60 * 60 * 24)) : 0;
      normalized.expiryDate = expiry.toISOString();
      return normalized;
    }
  }

  normalized.days = Number.isFinite(Number(validity.days)) ? Number(validity.days) : 0;
  return normalized;
}

// Validation rules for test series creation
const createTestSeriesValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be between 1-200 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('caLevel')
    .isIn(['FOUNDATION', 'INTERMEDIATE', 'FINAL'])
    .withMessage('CA Level must be FOUNDATION, INTERMEDIATE, or FINAL'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters')
];

// Separate validation function for better error handling and testability
async function validateCreateTestSeriesInput(body) {
  const errors = [];
  const validatedData = {};

  const {
    title,
    price,
    originalPrice,
    discountedPrice,
    caLevel,
    description,
    planId,
    validityType,
    validityDays,
    validityExpiryDate,
    attemptsType,
    attemptsCount
  } = body;

  // Title validation
  if (!title || typeof title !== 'string') {
    errors.push({
      type: 'field',
      msg: 'Title is required',
      path: 'title',
      location: 'body'
    });
  } else {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0) {
      errors.push({
        type: 'field',
        msg: 'Title cannot be empty',
        path: 'title',
        location: 'body'
      });
    } else if (trimmedTitle.length > 200) {
      errors.push({
        type: 'field',
        msg: 'Title must not exceed 200 characters',
        path: 'title',
        location: 'body'
      });
    } else {
      validatedData.title = trimmedTitle;
    }
  }

  // Price validation
  const effectiveOriginalPrice = originalPrice !== undefined ? originalPrice : price;
  const effectiveDiscountedPrice = discountedPrice !== undefined ? discountedPrice : effectiveOriginalPrice;

  // Original price validation
  if (effectiveOriginalPrice === undefined || effectiveOriginalPrice === null) {
    errors.push({
      type: 'field',
      msg: 'Original price is required',
      path: 'originalPrice',
      location: 'body'
    });
  } else {
    const parsedOriginal = parseFloat(effectiveOriginalPrice);
    if (isNaN(parsedOriginal)) {
      errors.push({
        type: 'field',
        msg: 'Original price must be a valid number',
        path: 'originalPrice',
        location: 'body'
      });
    } else if (parsedOriginal < 0) {
      errors.push({
        type: 'field',
        msg: 'Original price cannot be negative',
        path: 'originalPrice',
        location: 'body'
      });
    } else {
      validatedData.originalPrice = parsedOriginal;
    }
  }

  // Discounted price validation
  if (effectiveDiscountedPrice === undefined || effectiveDiscountedPrice === null) {
    errors.push({
      type: 'field',
      msg: 'Discounted price is required',
      path: 'discountedPrice',
      location: 'body'
    });
  } else {
    const parsedDiscounted = parseFloat(effectiveDiscountedPrice);
    if (isNaN(parsedDiscounted)) {
      errors.push({
        type: 'field',
        msg: 'Discounted price must be a valid number',
        path: 'discountedPrice',
        location: 'body'
      });
    } else if (parsedDiscounted < 0) {
      errors.push({
        type: 'field',
        msg: 'Discounted price cannot be negative',
        path: 'discountedPrice',
        location: 'body'
      });
    } else {
      validatedData.discountedPrice = parsedDiscounted;
    }
  }

  // Cross-price validation
  if (validatedData.originalPrice !== undefined && validatedData.discountedPrice !== undefined) {
    if (validatedData.discountedPrice > validatedData.originalPrice) {
      errors.push({
        type: 'field',
        msg: 'Discounted price cannot be greater than original price',
        path: 'discountedPrice',
        location: 'body'
      });
    }
  }

  // Set final price (discounted price takes precedence)
  validatedData.price = validatedData.discountedPrice || validatedData.originalPrice || 0;

  // CA Level validation
  if (!caLevel) {
    errors.push({
      type: 'field',
      msg: 'CA Level is required',
      path: 'caLevel',
      location: 'body'
    });
  } else if (!['FOUNDATION', 'INTERMEDIATE', 'FINAL', 'ALL'].includes(caLevel)) {
    errors.push({
      type: 'field',
      msg: 'CA Level must be FOUNDATION, INTERMEDIATE, FINAL, or ALL',
      path: 'caLevel',
      location: 'body'
    });
  } else {
    validatedData.caLevel = caLevel;
  }

  // Description validation (optional)
  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.push({
        type: 'field',
        msg: 'Description must be a string',
        path: 'description',
        location: 'body'
      });
    } else if (description.length > 1000) {
      errors.push({
        type: 'field',
        msg: 'Description must not exceed 1000 characters',
        path: 'description',
        location: 'body'
      });
    } else {
      validatedData.description = description.trim();
    }
  }

  // Plan ID validation (optional)
  if (planId !== undefined && planId !== null && planId !== '') {
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      errors.push({
        type: 'field',
        msg: 'Invalid plan ID format',
        path: 'planId',
        location: 'body'
      });
    } else {
      validatedData.planId = planId;
    }
  }

  // Validity policy validation
  const vType = validityType || 'UNLIMITED';
  if (!['UNLIMITED', 'DAYS'].includes(String(vType).toUpperCase())) {
    errors.push({
      type: 'field',
      msg: 'validityType must be UNLIMITED or DAYS',
      path: 'validityType',
      location: 'body'
    });
  } else {
    const normalizedVType = String(vType).toUpperCase();
    if (normalizedVType === 'UNLIMITED') {
      validatedData.validity = { isUnlimited: true };
    } else {
      // DAYS validity
      let expiryDate = null;
      let days = null;

      if (validityExpiryDate) {
        const parsedExpiry = new Date(validityExpiryDate);
        if (isNaN(parsedExpiry.getTime())) {
          errors.push({
            type: 'field',
            msg: 'validityExpiryDate must be a valid date',
            path: 'validityExpiryDate',
            location: 'body'
          });
        } else {
          expiryDate = new Date(parsedExpiry);
          expiryDate.setHours(23, 59, 59, 999);
          days = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
        }
      } else if (validityDays !== undefined) {
        const parsedDays = parseInt(validityDays, 10);
        if (isNaN(parsedDays) || parsedDays <= 0) {
          errors.push({
            type: 'field',
            msg: 'validityDays must be a positive integer when validityType is DAYS',
            path: 'validityDays',
            location: 'body'
          });
        } else {
          days = parsedDays;
          expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + days);
          expiryDate.setHours(23, 59, 59, 999);
        }
      } else {
        errors.push({
          type: 'field',
          msg: 'Either validityExpiryDate or validityDays is required when validityType is DAYS',
          path: 'validityExpiryDate',
          location: 'body'
        });
      }

      if (days !== null && expiryDate) {
        validatedData.validity = { isUnlimited: false, days, expiryDate };
      }
    }
  }

  // Attempts policy validation
  const aType = attemptsType || 'UNLIMITED';
  if (!['UNLIMITED', 'LIMITED'].includes(String(aType).toUpperCase())) {
    errors.push({
      type: 'field',
      msg: 'attemptsType must be UNLIMITED or LIMITED',
      path: 'attemptsType',
      location: 'body'
    });
  } else {
    const normalizedAType = String(aType).toUpperCase();
    if (normalizedAType === 'UNLIMITED') {
      validatedData.attempts = { isUnlimited: true };
    } else {
      // LIMITED attempts
      if (attemptsCount !== undefined) {
        const parsedCount = parseInt(attemptsCount, 10);
        if (isNaN(parsedCount) || parsedCount <= 0) {
          errors.push({
            type: 'field',
            msg: 'attemptsCount must be a positive integer when attemptsType is LIMITED',
            path: 'attemptsCount',
            location: 'body'
          });
        } else {
          validatedData.attempts = { isUnlimited: false, count: parsedCount };
        }
      } else {
        errors.push({
          type: 'field',
          msg: 'attemptsCount is required when attemptsType is LIMITED',
          path: 'attemptsCount',
          location: 'body'
        });
      }
    }
  }

  return {
    isValid: errors.length === 0,
    data: validatedData,
    errors
  };
}

// Validation rules for test series updates (all fields optional)
const updateTestSeriesValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1-200 characters'),
  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('caLevel')
    .optional()
    .isIn(['FOUNDATION', 'INTERMEDIATE', 'FINAL'])
    .withMessage('CA Level must be FOUNDATION, INTERMEDIATE, or FINAL'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('validityType')
    .optional()
    .isIn(['UNLIMITED', 'DAYS'])
    .withMessage('validityType must be UNLIMITED or DAYS'),
  body('validityDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validityDays must be a positive integer'),
  body('attemptsType')
    .optional()
    .isIn(['UNLIMITED', 'LIMITED'])
    .withMessage('attemptsType must be UNLIMITED or LIMITED'),
  body('attemptsCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('attemptsCount must be a positive integer')
];

// Validation rules for adding tests
const addTestValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Test title is required and must be between 1-200 characters'),
  body('testType')
    .isIn(['OBJECTIVE', 'SUBJECTIVE'])
    .withMessage('Test type must be OBJECTIVE or SUBJECTIVE'),
  body('subject')
    .isIn(SUBJECTS)
    .withMessage('Subject must be one of the predefined subjects'),
  body('totalMarks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total marks must be a positive integer'),
  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Duration must be a positive integer in minutes'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Instructions must not exceed 2000 characters'),
  body('passingPercentage')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Passing percentage must be between 0 and 100')
];

// Validation rules for MCQ questions
const mcqValidation = [];

function normalizeAndValidateMcqQuestions(mcqQuestions = []) {
  if (!Array.isArray(mcqQuestions)) {
    return { errors: [{ msg: 'mcqQuestions must be an array', path: 'mcqQuestions' }], normalizedQuestions: [] };
  }

  const errors = [];
  const normalizedQuestions = [];

  mcqQuestions.forEach((question, index) => {
    const questionText = String(question?.questionText || '').trim();
    const options = {
      A: String(question?.options?.A || '').trim(),
      B: String(question?.options?.B || '').trim(),
      C: String(question?.options?.C || '').trim(),
      D: String(question?.options?.D || '').trim()
    };
    const correctAnswer = String(question?.correctAnswer || '').trim();
    const marks = Number(question?.marks);
    const negativeMarks = question?.negativeMarks === undefined || question?.negativeMarks === ''
      ? 0
      : Number(question.negativeMarks);

    const isBlank = !questionText && Object.values(options).every(value => !value) && !correctAnswer && !question?.marks;
    if (isBlank) return;

    if (!questionText || questionText.length > 1000) {
      errors.push({ msg: 'Question text is required and must not exceed 1000 characters', path: `mcqQuestions[${index}].questionText` });
    }
    ['A', 'B', 'C', 'D'].forEach((key) => {
      if (!options[key] || options[key].length > 200) {
        errors.push({ msg: `Option ${key} is required and must not exceed 200 characters`, path: `mcqQuestions[${index}].options.${key}` });
      }
    });
    if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
      errors.push({ msg: 'Correct answer must be A, B, C, or D', path: `mcqQuestions[${index}].correctAnswer` });
    }
    if (!Number.isInteger(marks) || marks < 1 || marks > 100) {
      errors.push({ msg: 'Marks must be between 1 and 100', path: `mcqQuestions[${index}].marks` });
    }
    if (Number.isNaN(negativeMarks) || negativeMarks < 0) {
      errors.push({ msg: 'Negative marks cannot be negative', path: `mcqQuestions[${index}].negativeMarks` });
    }

    normalizedQuestions.push({
      questionText,
      options,
      correctAnswer,
      marks: Number.isFinite(marks) ? marks : 1,
      negativeMarks: Number.isFinite(negativeMarks) ? negativeMarks : 0
    });
  });

  if (normalizedQuestions.length === 0) {
    errors.push({ msg: 'At least one valid MCQ question is required', path: 'mcqQuestions' });
  }

  return { errors, normalizedQuestions };
}

function normalizeAllowedEvaluatorIds(rawAllowedEvaluatorIds) {
  if (rawAllowedEvaluatorIds === undefined) return undefined;

  let parsed = rawAllowedEvaluatorIds;

  if (typeof parsed === 'string') {
    const trimmed = parsed.trim();
    if (!trimmed) return [];

    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      parsed = [trimmed];
    }
  }

  if (!Array.isArray(parsed)) {
    return null;
  }

  return [...new Set(parsed.map((value) => String(value).trim()).filter(Boolean))];
}

async function resolveAllowedEvaluatorIds(rawAllowedEvaluatorIds) {
  const normalizedAllowedEvaluatorIds = normalizeAllowedEvaluatorIds(rawAllowedEvaluatorIds);

  if (normalizedAllowedEvaluatorIds === undefined) {
    return { ids: undefined };
  }

  if (normalizedAllowedEvaluatorIds === null) {
    return { error: 'allowedEvaluatorIds must be an array of evaluator ids' };
  }

  if (normalizedAllowedEvaluatorIds.length === 0) {
    return { ids: [] };
  }

  const invalidId = normalizedAllowedEvaluatorIds.find((id) => !mongoose.Types.ObjectId.isValid(id));
  if (invalidId) {
    return { error: 'allowedEvaluatorIds contains an invalid evaluator id' };
  }

  const evaluators = await User.find({
    _id: { $in: normalizedAllowedEvaluatorIds },
    role: ROLES.EVALUATOR,
    isActive: true
  }).select('_id');

  if (evaluators.length !== normalizedAllowedEvaluatorIds.length) {
    return { error: 'One or more selected evaluator logins are invalid or inactive' };
  }

  return { ids: evaluators.map((evaluator) => evaluator._id) };
}

// Create new test series
const createTestSeries = async (req, res) => {
  let uploadedFilePath = null;

  try {
    // Multer must parse multipart/form-data before reading req.body. The admin
    // create form sends all fields as multipart data so it can include an
    // optional thumbnail.
    await new Promise((resolve, reject) => {
      uploadThumbnail(req, res, (err) => {
        if (err) {
          uploadedFilePath = req.file?.path || null;
          return reject(new Error(`File upload error: ${err.message}`));
        }
        resolve();
      });
    });

    // Store file path for cleanup if validation, image processing, or database
    // persistence fails after Multer has written the file.
    uploadedFilePath = req.file?.path || null;

    // Validate after Multer has populated req.body.
    const validationResult = await validateCreateTestSeriesInput(req.body || {});
    if (!validationResult.isValid) {
      if (uploadedFilePath) {
        deleteFile(uploadedFilePath);
      }
      return res.status(400).json({
        message: 'Validation error',
        errors: validationResult.errors
      });
    }

    const validatedData = validationResult.data;

    // Process and optimize the uploaded image
    if (req.file) {
      try {
        await optimizeImageFile(req.file.path, { maxWidth: 1200, maxHeight: 800, quality: 82 });
        validatedData.thumbnailUrl = getFileUrl(req, req.file.path);
      } catch (imageError) {
        console.error('Image optimization error:', imageError);
        // Continue without thumbnail rather than failing
        if (uploadedFilePath) {
          deleteFile(uploadedFilePath);
          uploadedFilePath = null;
        }
      }
    }

    // Attempt to create the test series with retry logic for race conditions
    const maxRetries = 3;
    let lastError = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Create test series document
        const testSeries = new TestSeries({
          ...validatedData,
          createdBy: req.user.id,
          status: 'DRAFT',
          tests: []
        });

        // Save with database-level duplicate checking
        await testSeries.save();

        // Success - return the created test series
        return res.status(201).json({
          message: 'Test series created successfully',
          testSeries: {
            id: testSeries._id,
            title: testSeries.title,
            description: testSeries.description,
            price: testSeries.price,
            originalPrice: testSeries.originalPrice,
            discountedPrice: testSeries.discountedPrice,
            caLevel: testSeries.caLevel,
            thumbnailUrl: testSeries.thumbnailUrl,
            validity: testSeries.validity,
            attempts: testSeries.attempts,
            status: testSeries.status,
            publishedAt: testSeries.publishedAt,
            totalTests: testSeries.totalTests,
            createdAt: testSeries.createdAt
          }
        });

      } catch (saveError) {
        lastError = saveError;

        // Handle duplicate key error (MongoDB error code 11000)
        if (saveError.code === 11000 && saveError.message.includes('title')) {
          // Clean up uploaded file
          if (uploadedFilePath) {
            deleteFile(uploadedFilePath);
          }

          return res.status(409).json({
            message: 'Test series with this title already exists',
            error: 'DUPLICATE_TITLE',
            suggestion: 'Please choose a different title or check if the test series already exists'
          });
        }

        // Handle other validation errors from mongoose
        if (saveError.name === 'ValidationError') {
          if (uploadedFilePath) {
            deleteFile(uploadedFilePath);
          }

          const validationErrors = Object.values(saveError.errors).map(err => ({
            type: 'field',
            msg: err.message,
            path: err.path,
            location: 'body'
          }));

          return res.status(400).json({
            message: 'Validation error',
            errors: validationErrors
          });
        }

        // For other errors, retry if we haven't exceeded max attempts
        if (attempt < maxRetries) {
          console.warn(`Test series creation attempt ${attempt} failed, retrying...`, saveError.message);
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 100 * attempt));
          continue;
        }

        // Max retries exceeded, break out of loop
        break;
      }
    }

    // If we get here, all retries failed
    console.error('Create test series failed after retries:', lastError);

    // Clean up uploaded file
    if (uploadedFilePath) {
      deleteFile(uploadedFilePath);
    }

    return res.status(500).json({
      message: 'Failed to create test series after multiple attempts',
      error: process.env.NODE_ENV === 'development' ? lastError?.message : 'Internal server error'
    });

  } catch (error) {
    // Clean up uploaded file on any error
    if (uploadedFilePath) {
      deleteFile(uploadedFilePath);
    }

    console.error('Create test series error:', error);

    // Handle specific error types
    if (error.message?.includes('File upload error')) {
      return res.status(400).json({
        message: 'File upload failed',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getPublishValidationErrors = (testSeries) => {
  const errors = [];

  if (!Array.isArray(testSeries.tests) || testSeries.tests.length === 0) {
    errors.push({ path: 'tests', msg: 'At least one test is required before publishing' });
    return errors;
  }

  testSeries.tests.forEach((test, index) => {
    if (test.testType === 'OBJECTIVE' && (!Array.isArray(test.mcqQuestions) || test.mcqQuestions.length === 0)) {
      errors.push({
        path: `tests[${index}].mcqQuestions`,
        msg: `Objective test "${test.title}" must have at least one MCQ question`
      });
    }

    if (test.testType === 'SUBJECTIVE' && !test.questionPaperUrl) {
      errors.push({
        path: `tests[${index}].questionPaperUrl`,
        msg: `Subjective test "${test.title}" must have a question paper PDF`
      });
    }
  });

  return errors;
};

// Publish a completed draft. Drafts remain private until this endpoint succeeds.
const publishTestSeries = async (req, res) => {
  try {
    const { testSeriesId } = req.params;
    const testSeries = await TestSeries.findById(testSeriesId);

    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found' });
    }

    const errors = getPublishValidationErrors(testSeries);
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Complete the draft before publishing',
        errors
      });
    }

    testSeries.status = 'PUBLISHED';
    testSeries.publishedAt = new Date();
    await testSeries.save();

    return res.status(200).json({
      message: 'Test series published successfully',
      testSeries: {
        id: testSeries._id,
        title: testSeries.title,
        status: testSeries.status,
        publishedAt: testSeries.publishedAt
      }
    });
  } catch (error) {
    console.error('Publish test series error:', error);
    return res.status(500).json({
      message: 'Failed to publish test series',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add test to test series
const addTest = async (req, res) => {
  try {
    const { testSeriesId } = req.params;
    const {
      title,
      testType,
      subject,
      duration,
      instructions,
      totalMarks,
      passingPercentage,
      allowedEvaluatorIds
    } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // For subjective tests, require totalMarks to be specified
    if (testType === 'SUBJECTIVE' && (!totalMarks || totalMarks <= 0)) {
      return res.status(400).json({
        message: 'Total marks must be specified for subjective tests and must be greater than 0'
      });
    }

    if (passingPercentage !== undefined) {
      const parsedPassingPercentage = Number(passingPercentage);
      if (!Number.isFinite(parsedPassingPercentage) || parsedPassingPercentage < 0 || parsedPassingPercentage > 100) {
        return res.status(400).json({
          message: 'Passing percentage must be between 0 and 100'
        });
      }
    }

    const {
      ids: normalizedAllowedEvaluatorIds,
      error: allowedEvaluatorError
    } = await resolveAllowedEvaluatorIds(allowedEvaluatorIds);

    if (allowedEvaluatorError) {
      return res.status(400).json({ message: allowedEvaluatorError });
    }

    // Find test series
    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found' });
    }

    // Check if test with same title exists in this test series
    const existingTest = testSeries.tests.find(test => test.title.trim() === title.trim());
    if (existingTest) {
      return res.status(409).json({
        message: `Test with this title already exists in this test series: "${title}"`,
        existingTestId: existingTest._id,
        duplicateTitle: title
      });
    }

    // Create new test
    const newTest = {
      title,
      testType,
      subject,
      duration: duration ? parseInt(duration) : undefined,
      instructions,
      passingPercentage: passingPercentage !== undefined ? Number(passingPercentage) : 40,
      totalMarks: testType === 'SUBJECTIVE' ? parseInt(totalMarks) : 0, // For objective tests, will be calculated when MCQs are added
      createdBy: req.user.id,
      mcqQuestions: [],
      questionPaperUrl: null,
      suggestedAnswerUrl: null,
      allowedEvaluatorIds: normalizedAllowedEvaluatorIds || []
    };

    testSeries.tests.push(newTest);
    await testSeries.save();

    const addedTest = testSeries.tests[testSeries.tests.length - 1];

    res.status(201).json({
      message: 'Test added successfully',
      test: {
        id: addedTest._id,
        title: addedTest.title,
        testType: addedTest.testType,
        subject: addedTest.subject,
        duration: addedTest.duration,
        instructions: addedTest.instructions,
        passingPercentage: addedTest.passingPercentage,
        totalMarks: addedTest.totalMarks,
        allowedEvaluatorIds: Array.isArray(addedTest.allowedEvaluatorIds)
          ? addedTest.allowedEvaluatorIds.map((id) => String(id))
          : [],
        createdAt: addedTest.createdAt
      }
    });

  } catch (error) {
    console.error('Add test error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add MCQ questions to objective test
const addMCQQuestions = async (req, res) => {
  try {
    const { testSeriesId, testId } = req.params;
    const { mcqQuestions } = req.body;

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation error',
        errors: errors.array()
      });
    }

    // Find test series
    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found' });
    }

    // Find test
    const test = testSeries.tests.id(testId);
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }

    // Check if test is objective type
    if (test.testType !== 'OBJECTIVE') {
      return res.status(400).json({
        message: 'MCQ questions can only be added to objective tests'
      });
    }

    const { errors: mcqErrors, normalizedQuestions } = normalizeAndValidateMcqQuestions(mcqQuestions);
    if (mcqErrors.length > 0) {
      return res.status(400).json({
        message: 'Validation error',
        errors: mcqErrors
      });
    }

    // Add questions to test
    test.mcqQuestions.push(...normalizedQuestions);

    // Automatically calculate totalMarks for objective tests
    const calculatedTotalMarks = test.mcqQuestions.reduce((sum, question) => {
      return sum + (question.marks || 1);
    }, 0);

    test.totalMarks = calculatedTotalMarks;

    await testSeries.save();

    res.status(200).json({
      message: 'MCQ questions added successfully',
      totalQuestions: test.mcqQuestions.length,
      totalMarks: test.totalMarks
    });

  } catch (error) {
    console.error('Add MCQ questions error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Upload PDFs for subjective test
const uploadSubjectivePDFs = async (req, res) => {
  try {
    const { testSeriesId, testId } = req.params;

    // Handle file upload
    uploadPDFs(req, res, async (err) => {
      if (err) {
        return handleFileUploadError(err, req, res, () => { });
      }

      try {
        // Find test series
        const testSeries = await TestSeries.findById(testSeriesId);
        if (!testSeries) {
          // Delete uploaded files if test series not found
          if (req.files) {
            Object.values(req.files).flat().forEach(file => deleteFile(file.path));
          }
          return res.status(404).json({ message: 'Test series not found' });
        }

        // Find test
        const test = testSeries.tests.id(testId);
        if (!test) {
          // Delete uploaded files if test not found
          if (req.files) {
            Object.values(req.files).flat().forEach(file => deleteFile(file.path));
          }
          return res.status(404).json({ message: 'Test not found' });
        }

        // Check if test is subjective type
        if (test.testType !== 'SUBJECTIVE') {
          // Delete uploaded files if wrong test type
          if (req.files) {
            Object.values(req.files).flat().forEach(file => deleteFile(file.path));
          }
          return res.status(400).json({
            message: 'PDF files can only be uploaded for subjective tests'
          });
        }

        // Check if at least question paper is uploaded
        if (!req.files || !req.files.questionPaper) {
          // Delete uploaded files if question paper is missing
          if (req.files) {
            Object.values(req.files).flat().forEach(file => deleteFile(file.path));
          }
          return res.status(400).json({
            message: 'Question paper PDF is required'
          });
        }

        // Update test with file URLs
        if (req.files.questionPaper) {
          // Delete old question paper if exists
          if (test.questionPaperUrl) {
            const oldPath = path.join(__dirname, '../../storage',
              test.questionPaperUrl.split('/uploads/')[1]);
            deleteFile(oldPath);
          }
          test.questionPaperUrl = getFileUrl(req, req.files.questionPaper[0].path);
        }

        if (req.files.suggestedAnswer) {
          // Delete old suggested answer if exists
          if (test.suggestedAnswerUrl) {
            const oldPath = path.join(__dirname, '../../storage',
              test.suggestedAnswerUrl.split('/uploads/')[1]);
            deleteFile(oldPath);
          }
          test.suggestedAnswerUrl = getFileUrl(req, req.files.suggestedAnswer[0].path);
        }

        await testSeries.save();

        res.status(200).json({
          message: 'PDF files uploaded successfully',
          questionPaperUrl: test.questionPaperUrl,
          suggestedAnswerUrl: test.suggestedAnswerUrl
        });

      } catch (error) {
        // Delete uploaded files if database operation fails
        if (req.files) {
          Object.values(req.files).flat().forEach(file => deleteFile(file.path));
        }

        console.error('Upload PDFs error:', error);
        res.status(500).json({
          message: 'Internal server error',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });

  } catch (error) {
    console.error('Upload subjective PDFs error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update an embedded test within a test series (Admin)
// Allowed fields: title, subject, duration, instructions, isActive
const updateTest = async (req, res) => {
  try {
    const { testSeriesId, testId } = req.params;
    const { title, subject, duration, instructions, isActive, passingPercentage, allowedEvaluatorIds } = req.body;

    // Basic validation
    if (!testSeriesId || !testId) return res.status(400).json({ message: 'Invalid params' });
    if (subject && !SUBJECTS.includes(subject)) {
      return res.status(400).json({ message: 'Invalid subject' });
    }
    if (duration !== undefined) {
      const d = parseInt(duration, 10);
      if (!(d > 0)) return res.status(400).json({ message: 'Duration must be a positive integer' });
    }
    if (instructions && instructions.length > 2000) {
      return res.status(400).json({ message: 'Instructions must not exceed 2000 characters' });
    }
    if (passingPercentage !== undefined) {
      const parsedPassingPercentage = Number(passingPercentage);
      if (!Number.isFinite(parsedPassingPercentage) || parsedPassingPercentage < 0 || parsedPassingPercentage > 100) {
        return res.status(400).json({ message: 'Passing percentage must be between 0 and 100' });
      }
    }

    const {
      ids: normalizedAllowedEvaluatorIds,
      error: allowedEvaluatorError
    } = await resolveAllowedEvaluatorIds(allowedEvaluatorIds);

    if (allowedEvaluatorError) {
      return res.status(400).json({ message: allowedEvaluatorError });
    }

    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) return res.status(404).json({ message: 'Test series not found' });
    const test = testSeries.tests.id(testId);
    if (!test) return res.status(404).json({ message: 'Test not found' });

    if (title) test.title = title;
    if (subject) test.subject = subject;
    if (duration !== undefined) test.duration = parseInt(duration, 10);
    if (instructions !== undefined) test.instructions = instructions;
    if (typeof isActive === 'boolean') test.isActive = isActive;
    if (passingPercentage !== undefined) test.passingPercentage = Number(passingPercentage);
    if (normalizedAllowedEvaluatorIds !== undefined) test.allowedEvaluatorIds = normalizedAllowedEvaluatorIds;

    await testSeries.save();

    return res.status(200).json({
      message: 'Test updated successfully',
      test: {
        id: test._id,
        title: test.title,
        subject: test.subject,
        testType: test.testType,
        duration: test.duration,
        instructions: test.instructions,
        isActive: test.isActive,
        passingPercentage: test.passingPercentage,
        totalMarks: test.totalMarks,
        allowedEvaluatorIds: Array.isArray(test.allowedEvaluatorIds)
          ? test.allowedEvaluatorIds.map((id) => String(id))
          : [],
        updatedAt: test.updatedAt,
      }
    });
  } catch (error) {
    console.error('Update test error:', error);
    res.status(500).json({ message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
  }
};

// Get all test series (with pagination and filtering)
const getTestSeries = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      caLevel,
      planId,
      isActive,
      search
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};

    // Public consumers only see published series. Legacy records without a
    // status field remain visible as published for backward compatibility.
    if (!req.includeDrafts) {
      filter.$or = [
        { status: 'PUBLISHED' },
        { status: { $exists: false } }
      ];
    }

    // Only add isActive filter if explicitly provided
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    if (caLevel) {
      filter.caLevel = caLevel;
    }
    if (planId) {
      // Mongoose will automatically convert valid string to ObjectId
      // For special case 'null' or 'none', filter for null/undefined planId
      if (planId === 'null' || planId === 'none') {
        filter.planId = null;
      } else if (mongoose.Types.ObjectId.isValid(planId)) {
        filter.planId = planId; // Mongoose auto-converts to ObjectId
      }
    }
    if (search) {
      filter.$text = { $search: search };
    }

    console.log('Filter being used:', filter); // Debug log

    // Get test series with pagination
    let testSeries = await TestSeries.find(filter)
      .populate('createdBy', 'fullName email')
      .select('-tests.mcqQuestions -tests.suggestedAnswerUrl') // Exclude sensitive data
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Normalize any backslashes in URLs for cross-platform consistency
    testSeries = testSeries.map(ts => {
      const doc = ts.toObject();
      if (doc.thumbnailUrl) doc.thumbnailUrl = String(doc.thumbnailUrl).replace(/\\/g, '/');
      doc.originalPrice = doc.originalPrice ?? doc.price;
      doc.discountedPrice = doc.discountedPrice ?? doc.price;
      doc.status = doc.status || 'PUBLISHED';
      if (Array.isArray(doc.tests)) {
        doc.tests = doc.tests.map(t => {
          if (t && t.allowedEvaluatorIds) delete t.allowedEvaluatorIds;
          if (t && t.questionPaperUrl) t.questionPaperUrl = String(t.questionPaperUrl).replace(/\\/g, '/');
          if (t && t.suggestedAnswerUrl) t.suggestedAnswerUrl = String(t.suggestedAnswerUrl).replace(/\\/g, '/');
          return t;
        });
      }
      doc.validity = formatValidityForResponse(doc.validity);
      return doc;
    });

    const total = await TestSeries.countDocuments(filter);

    console.log('Found test series:', testSeries.length, 'Total count:', total); // Debug log

    res.status(200).json({
      testSeries,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });

  } catch (error) {
    console.error('Get test series error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single test series with all details (public, sanitized)
const getTestSeriesById = async (req, res) => {
  try {
    const { testSeriesId } = req.params;

    const ts = await TestSeries.findById(testSeriesId)
      .populate('createdBy', 'fullName email');

    if (!ts) {
      return res.status(404).json({ message: 'Test series not found' });
    }

    if (!req.includeDrafts && ts.status === 'DRAFT') {
      return res.status(404).json({ message: 'Test series not found' });
    }

    // Build a sanitized response similar to list endpoint but with full series details
    const doc = ts.toObject();
    const normalizedThumbnail = doc.thumbnailUrl ? String(doc.thumbnailUrl).replace(/\\/g, '/') : undefined;
    const tests = Array.isArray(doc.tests) ? doc.tests.map(t => {
      const totalQuestions = Array.isArray(t.mcqQuestions) ? t.mcqQuestions.length : undefined;
      return {
        id: t._id,
        title: t.title,
        testType: t.testType,
        subject: t.subject,
        duration: t.duration,
        instructions: t.instructions,
        totalMarks: t.totalMarks,
        // For subjective tests these URLs help students download question papers; normalize slashes
        questionPaperUrl: t.questionPaperUrl ? String(t.questionPaperUrl).replace(/\\/g, '/') : undefined,
        suggestedAnswerUrl: undefined, // never expose suggested answers publicly
        totalQuestions
      };
    }) : [];

    const response = {
      id: doc._id,
      title: doc.title,
      description: doc.description,
      price: doc.price,
      originalPrice: doc.originalPrice ?? doc.price,
      discountedPrice: doc.discountedPrice ?? doc.price,
      caLevel: doc.caLevel,
      isActive: doc.isActive,
      validity: formatValidityForResponse(doc.validity),
      attempts: doc.attempts || { isUnlimited: true },
      status: doc.status || 'PUBLISHED',
      publishedAt: doc.publishedAt || null,
      thumbnailUrl: normalizedThumbnail,
      totalTests: doc.totalTests,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      tests
    };

    res.status(200).json({ testSeries: response });

  } catch (error) {
    console.error('Get test series by ID error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update test series
const updateTestSeries = (req, res) => {
  // Wrap with multer upload for thumbnail
  uploadThumbnail(req, res, async (err) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message || 'File upload error' });
    }

    try {
      const { testSeriesId } = req.params;
      const { title, description, price, originalPrice, discountedPrice, caLevel, isActive, planId, validityType, validityDays, validityExpiryDate, attemptsType, attemptsCount } = req.body;

      // Validate input
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        // Delete uploaded file if validation fails
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(400).json({
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const testSeries = await TestSeries.findById(testSeriesId);
      if (!testSeries) {
        // Delete uploaded file if test series not found
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(404).json({ message: 'Test series not found' });
      }

      // Update fields
      if (title) testSeries.title = title;
      if (description !== undefined) testSeries.description = description;
      if (originalPrice !== undefined) testSeries.originalPrice = parseFloat(originalPrice);
      if (discountedPrice !== undefined) testSeries.discountedPrice = parseFloat(discountedPrice);
      if (price !== undefined && originalPrice === undefined && discountedPrice === undefined) {
        testSeries.originalPrice = parseFloat(price);
        testSeries.discountedPrice = parseFloat(price);
      }
      if (caLevel) testSeries.caLevel = caLevel;
      if (isActive !== undefined) testSeries.isActive = isActive;
      if (planId !== undefined) testSeries.planId = planId || null; // Allow unsetting plan

      // Handle thumbnail update
      if (req.file) {
        // Delete old thumbnail ONLY if it's a local file (not external URL like Unsplash)
        if (testSeries.thumbnailUrl && testSeries.thumbnailUrl.includes('/uploads/')) {
          const oldThumbnailPath = path.join(__dirname, '../../storage',
            testSeries.thumbnailUrl.split('/uploads/')[1]);
          deleteFile(oldThumbnailPath);
        }
        await optimizeImageFile(req.file.path, { maxWidth: 1200, maxHeight: 800, quality: 82 });
        // Set new thumbnail URL
        testSeries.thumbnailUrl = getFileUrl(req, req.file.path);
      }
      // IMPORTANT: If no new file uploaded, preserve existing thumbnailUrl
      // Do not set thumbnailUrl to undefined/null if req.file is not present

      // Update validity & attempts policy if provided
      if (validityType) {
        const vUnlimited = String(validityType).toUpperCase() === 'UNLIMITED';
        if (vUnlimited) {
          testSeries.validity = { isUnlimited: true };
        } else {
          let expiryDate;
          let days;

          if (validityExpiryDate) {
            expiryDate = new Date(validityExpiryDate);
            if (Number.isNaN(expiryDate.getTime())) {
              return res.status(400).json({ message: 'validityExpiryDate must be a valid date' });
            }
            expiryDate.setHours(23, 59, 59, 999);
            days = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          } else {
            days = parseInt(validityDays, 10);
            if (!(days > 0)) {
              return res.status(400).json({ message: 'validityDays must be a positive integer' });
            }
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + days);
            expiryDate.setHours(23, 59, 59, 999);
          }

          testSeries.validity = { isUnlimited: false, days, expiryDate };
        }
      }
      if (attemptsType) {
        const aUnlimited = String(attemptsType).toUpperCase() === 'UNLIMITED';
        testSeries.attempts = aUnlimited ? { isUnlimited: true } : { isUnlimited: false, count: parseInt(attemptsCount, 10) };
      }

      await testSeries.save();

      res.status(200).json({
        message: 'Test series updated successfully',
        testSeries: {
          id: testSeries._id,
          title: testSeries.title,
          description: testSeries.description,
          price: testSeries.price,
          originalPrice: testSeries.originalPrice,
          discountedPrice: testSeries.discountedPrice,
          caLevel: testSeries.caLevel,
          validity: formatValidityForResponse(testSeries.validity),
          attempts: testSeries.attempts,
          isActive: testSeries.isActive,
          thumbnailUrl: testSeries.thumbnailUrl,
          updatedAt: testSeries.updatedAt
        }
      });

    } catch (error) {
      // Delete uploaded file if database operation fails
      if (req.file) {
        deleteFile(req.file.path);
      }
      console.error('Update test series error:', error);
      res.status(500).json({
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
};

// Delete test series
const deleteTestSeries = async (req, res) => {
  try {
    const { testSeriesId } = req.params;

    const testSeries = await TestSeries.findById(testSeriesId);
    if (!testSeries) {
      return res.status(404).json({ message: 'Test series not found' });
    }

    // Delete associated files
    // Only delete local thumbnail files, not external URLs (like Unsplash)
    if (testSeries.thumbnailUrl && testSeries.thumbnailUrl.includes('/uploads/')) {
      const thumbnailPath = path.join(__dirname, '../../storage',
        testSeries.thumbnailUrl.split('/uploads/')[1]);
      deleteFile(thumbnailPath);
    }

    // Delete PDF files for subjective tests
    testSeries.tests.forEach(test => {
      if (test.questionPaperUrl) {
        const questionPath = path.join(__dirname, '../../storage',
          test.questionPaperUrl.split('/uploads/')[1]);
        deleteFile(questionPath);
      }
      if (test.suggestedAnswerUrl) {
        const answerPath = path.join(__dirname, '../../storage',
          test.suggestedAnswerUrl.split('/uploads/')[1]);
        deleteFile(answerPath);
      }
    });

    await TestSeries.findByIdAndDelete(testSeriesId);

    res.status(200).json({ message: 'Test series deleted successfully' });

  } catch (error) {
    console.error('Delete test series error:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createTestSeries,
  addTest,
  updateTest,
  addMCQQuestions,
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
};
