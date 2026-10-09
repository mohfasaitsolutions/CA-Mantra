# Controllers Knowledge

## authController.js

- signup: Create student user, send verification email.
- verifyEmail: Validates token and marks user verified.
- signin: Validates credentials & email verification then returns JWT.
- requestPasswordReset: Generates reset token & email.
- resetPassword: Validates token & updates password.
- resendVerification: Re-issues verification token.

## userController.js

- getProfile: Current user details.
- updateProfile: Limited field updates.
- adminCreateUser: Admin creates ADMIN/EVALUATOR (emailVerified=true).
- listUsers: Admin list of users.

## testSeriesController.js

### Overview

Comprehensive controller for managing test series creation and management. Handles both objective (MCQ) and subjective (PDF-based) tests with robust file upload capabilities.

### Main Functions

#### createTestSeries

- Creates new test series with thumbnail image upload
- Validates all input fields with express-validator
- Handles file upload errors and cleanup
- Prevents duplicate titles
- Returns sanitized response with file URLs

#### addTest

- Adds new test to existing test series
- Supports both objective and subjective test types
- Validates test uniqueness within series
- Handles duration, instructions, and subject metadata

#### addMCQQuestions

- Adds multiple MCQ questions to objective tests
- Validates all question components (text, options, correct answer, marks)
- Auto-calculates total marks for the test
- Prevents adding MCQs to subjective tests

#### uploadSubjectivePDFs

- Handles PDF uploads for subjective tests
- Supports question paper (required) and suggested answer (optional)
- Implements file naming convention with timestamps and UUIDs
- Cleans up old files when uploading new ones
- Validates file types and sizes

#### getTestSeries

- Public endpoint with pagination and filtering
- Supports search functionality with text indexes
- Filters by CA level and active status
- Excludes sensitive data (MCQ answers, suggested answers)

#### getTestSeriesById

- Admin-only endpoint returning full test series details
- Includes all MCQ questions and file URLs
- Populates creator information

#### updateTestSeries & deleteTestSeries

- Full CRUD operations with proper validation
- File cleanup on deletion
- Soft delete capability with isActive flag

### File Upload Features

#### Storage Structure

- Thumbnails: `storage/images/testseries/thumbnail_testseries_{title}_{timestamp}_{randid}.{ext}`
- PDFs: `storage/pdfs/testseries/{type}_{testtitle}_{timestamp}_{randid}.pdf`

#### File Validation

- Images: JPEG, PNG, GIF, WebP (max 5MB)
- PDFs: PDF only (max 10MB)
- Automatic file cleanup on errors or updates

#### URL Generation

- Dynamic URL generation based on request protocol and host
- Served via static middleware at `/uploads/` route

### Security Features

#### Access Control

- All write operations require admin role
- JWT authentication for protected routes
- Input validation with express-validator

#### File Security

- Type validation for uploads
- Size limits to prevent abuse
- Unique filenames to prevent conflicts
- Automatic cleanup of orphaned files

#### Data Protection

- Sensitive data excluded from public endpoints
- Suggested answers hidden until test submission
- Proper error handling without data leaks

### Error Handling

- Comprehensive error catching and logging
- Proper HTTP status codes
- File cleanup on transaction failures
- Development vs production error messages

### Validation Rules

- Title: 1-200 characters, unique per test series
- Price: Positive numbers only
- CA Level: Enum validation
- MCQ Options: All 4 required, 1-200 characters each
- Marks: 1-100 range validation
- File types: Strict MIME type checking

## Security Notes

- Password hashing via bcrypt pre-save.
- JWT secret in env; rotate periodically.
- Future: Add audit logging & rate limiting.
