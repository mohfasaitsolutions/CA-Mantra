# Models Knowledge

## User Model (`User.js`)

### Fields:

- fullName, email (unique), password (hashed, bcrypt 10 rounds)
- caLevel: FOUNDATION | INTERMEDIATE | FINAL
- role: ADMIN | EVALUATOR | STUDENTS (default STUDENTS)
- emailVerified + verification tokens
- reset password token & expiry
- optional profile fields: mobile, address, dob, meta

### Indexes:

- email unique & indexed.

### Extending:

- Add additional indexes for queries.
- Use discriminators for specialized user types if needed.

## TestSeries Model (`TestSeries.js`)

### Overview

This model represents the complete test series structure with embedded tests. It supports both objective (MCQ) and subjective (PDF-based) tests.

### Schema Structure

#### TestSeries (Main Document)

- `title`: String (required, unique) - Test series title
- `description`: String (optional) - Test series description
- `price`: Number (required, min: 0) - Price in rupees
- `thumbnailUrl`: String (optional) - Thumbnail image URL
- `caLevel`: Enum ['FOUNDATION', 'INTERMEDIATE', 'FINAL'] (required)
- `tests`: Array of Test subdocuments
- `totalTests`: Number (auto-calculated) - Count of active tests
- `isActive`: Boolean (default: true) - Soft delete flag
- `createdBy`: ObjectId (ref: User, required) - Admin who created
- `meta`: Mixed - Additional metadata
- `timestamps`: true (createdAt, updatedAt)

#### Test (Subdocument)

- `title`: String (required) - Test title
- `testType`: Enum ['OBJECTIVE', 'SUBJECTIVE'] (required)
- `subject`: String (required) - Subject name
- `mcqQuestions`: Array of MCQQuestion subdocuments (for objective tests)
- `questionPaperUrl`: String (optional) - PDF URL for subjective question paper
- `suggestedAnswerUrl`: String (optional) - PDF URL for suggested answers
- `totalMarks`: Number (auto-calculated) - Total marks for the test
- `duration`: Number (optional) - Duration in minutes
- `instructions`: String (optional) - Test instructions
- `createdBy`: ObjectId (ref: User, required)
- `isActive`: Boolean (default: true)
- `timestamps`: true

#### MCQQuestion (Subdocument)

- `questionText`: String (required) - The question text
- `options`: Object with A, B, C, D properties (all required)
- `correctAnswer`: Enum ['A', 'B', 'C', 'D'] (required)
- `marks`: Number (required, min: 1, default: 1)

### Features

#### Automatic Calculations

- `totalTests`: Calculated on save as count of active tests
- `totalMarks`: Calculated for each test based on MCQ questions marks

#### Indexes

- `{ caLevel: 1, isActive: 1 }` - For filtering by CA level and active status
- `{ createdBy: 1 }` - For finding tests by creator
- `{ title: 'text', description: 'text' }` - For text search

### Usage Patterns

#### Creating Test Series

1. Create main test series document with basic info
2. Add tests one by one using the tests array
3. For objective tests: Add MCQ questions
4. For subjective tests: Upload PDF files

#### File Management

- Thumbnail images stored in `storage/images/testseries/`
- PDF files stored in `storage/pdfs/testseries/`
- File URLs are generated and stored in the database

### Security Considerations

- Only admins can create/modify test series
- Suggested answers are hidden from students until test submission
- File uploads are validated for type and size
- Unique constraints prevent duplicate titles

### Validation Rules

- Title: 1-200 characters, required, unique
- Price: Positive number, required
- CA Level: Must be valid enum value
- MCQ options: All 4 options required, 1-200 characters each
- Marks: 1-100 per question
- File types: Images (JPEG, PNG, GIF, WebP) for thumbnails, PDF for documents
