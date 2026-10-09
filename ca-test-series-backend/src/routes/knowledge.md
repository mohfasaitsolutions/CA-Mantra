# Routes Knowledge

## /auth Routes

- POST /signup - User registration
- GET /verify-email?token= - Email verification
- POST /signin - User login
- POST /forgot-password - Password reset request
- POST /reset-password - Password reset completion
- POST /resend-verification - Resend verification email

## /users Routes

- GET /me (auth) - Get current user profile
- PATCH /me (auth) - Update user profile
- POST / (admin) - Create admin/evaluator users
- GET / (admin) - List all users

## /test-series Routes

### Overview

Complete REST API for test series management with proper authentication, authorization, and validation.

### Public Routes

- `GET /api/test-series` - Get all test series with filtering and pagination
  - Query params: page, limit, caLevel, isActive, search
  - Returns sanitized data excluding sensitive information

### Admin-Only Routes

All routes below require authentication and admin role:

#### Test Series Management

- `POST /api/test-series` - Create new test series

  - Supports multipart/form-data for thumbnail upload
  - Validates: title, price, caLevel, description (optional)
  - Returns: Sanitized test series data with file URLs

- `GET /api/test-series/:testSeriesId` - Get specific test series

  - Returns: Complete test series with all details
  - Includes: All tests, MCQ questions, file URLs

- `PUT /api/test-series/:testSeriesId` - Update test series

  - Validates: Same as create, plus isActive flag
  - Returns: Updated test series data

- `DELETE /api/test-series/:testSeriesId` - Delete test series
  - Performs: Hard delete with file cleanup
  - Returns: Success confirmation

#### Test Management

- `POST /api/test-series/:testSeriesId/tests` - Add test to series
  - Validates: title, testType, subject, duration (optional), instructions (optional)
  - Supports: Both OBJECTIVE and SUBJECTIVE test types
  - Returns: Created test data

#### MCQ Questions (Objective Tests)

- `POST /api/test-series/:testSeriesId/tests/:testId/mcq` - Add MCQ questions
  - Validates: Array of MCQ questions with all required fields
  - Auto-calculates: Total marks for the test
  - Returns: Question count and total marks

#### PDF Upload (Subjective Tests)

- `POST /api/test-series/:testSeriesId/tests/:testId/pdfs` - Upload PDFs
  - Supports: multipart/form-data with questionPaper and suggestedAnswer fields
  - Validates: PDF file types and size limits
  - Returns: File URLs for uploaded documents

### Route Parameters Validation

- `testSeriesId`: MongoDB ObjectId validation
- `testId`: MongoDB ObjectId validation
- Proper error responses for invalid IDs

### Middleware Chain

1. **Authentication** (`auth()`) - Verifies JWT token
2. **Authorization** (`requireRoles(ROLES.ADMIN)`) - Ensures admin access
3. **Validation** - express-validator rules for each endpoint
4. **Controller** - Business logic execution

### Error Handling

- 400: Validation errors, file upload errors
- 401: Authentication required
- 403: Admin role required
- 404: Resource not found
- 409: Duplicate resource (title conflicts)
- 500: Internal server errors

### File Upload Configuration

- **Thumbnails**: Single file, image types only, 5MB limit
- **PDFs**: Multiple files (question paper + suggested answer), PDF only, 10MB limit
- **Storage**: Organized directory structure with timestamps and UUIDs
- **Cleanup**: Automatic file deletion on errors or updates

### Security Features

- **Role-based access**: Only admins can modify test series
- **Input validation**: Comprehensive validation on all inputs
- **File validation**: Type and size checks for uploads
- **SQL injection protection**: MongoDB ObjectId validation
- **XSS protection**: Input sanitization via express-validator

### API Response Format

```json
{
  "message": "Success/Error message",
  "data": {...}, // Response data (optional)
  "errors": [...], // Validation errors (optional)
  "pagination": {...} // Pagination info (for list endpoints)
}
```

### Usage Examples

#### Create Test Series

```bash
POST /api/test-series
Content-Type: multipart/form-data
Authorization: Bearer <admin-jwt>

Form fields:
- title: "CA Foundation Mock Test Series"
- price: 999
- caLevel: "FOUNDATION"
- description: "Comprehensive mock tests"
- thumbnail: <image-file>
```

#### Add Objective Test

```bash
POST /api/test-series/507f1f77bcf86cd799439011/tests
Content-Type: application/json
Authorization: Bearer <admin-jwt>

{
  "title": "Accounting Fundamentals",
  "testType": "OBJECTIVE",
  "subject": "Accounting",
  "duration": 60,
  "instructions": "Choose the best answer"
}
```

#### Add MCQ Questions

```bash
POST /api/test-series/507f1f77bcf86cd799439011/tests/507f1f77bcf86cd799439012/mcq
Content-Type: application/json
Authorization: Bearer <admin-jwt>

{
  "mcqQuestions": [
    {
      "questionText": "What is the accounting equation?",
      "options": {
        "A": "Assets = Liabilities + Equity",
        "B": "Assets = Liabilities - Equity",
        "C": "Assets + Liabilities = Equity",
        "D": "None of the above"
      },
      "correctAnswer": "A",
      "marks": 2
    }
  ]
}
```

## /evaluators Routes (Admin unless noted)

- GET /evaluators/subjects (auth optional): Subjects enum and CA levels for UI
- POST /evaluators: Create evaluator (name, email, caLevel, specializations). Supports `{ convertIfStudent: true }` to convert an existing student.
- GET /evaluators: List evaluators with stats and emailVerified
- GET /evaluators/:id: Evaluator detail with stats
- PATCH /evaluators/:id: Update evaluator fields (name, specializations, caLevel, isActive)
- PATCH /evaluators/:id/toggle: Activate/deactivate
- POST /evaluators/:id/resend-invite: Resend set-password email
- POST /evaluators/:id/resend-verification: Resend email verification
- GET /evaluators/me/queue (Evaluator/Admin): My assigned submissions (filter by status)
- POST /evaluators/assign: Assign submissions to evaluator (validates subject specialization)
- POST /evaluators/submissions/:id/status (Evaluator/Admin): Start/complete/reassign submission
