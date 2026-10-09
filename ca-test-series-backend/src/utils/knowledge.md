# Utils Knowledge

## token.js

- signJwt: Creates JWT tokens with user payload
- verifyJwt: Validates and decodes JWT tokens
- Uses JWT_SECRET from environment variables

## errorHandler.js

- notFound: 404 middleware for unmatched routes
- errorHandler: Centralized error handling with proper status codes
- Development vs production error responses

## fileUpload.js

### Overview

Comprehensive file upload utility using multer for handling test series thumbnails and PDF documents with robust validation and security features.

### Storage Configurations

#### Thumbnail Storage

- **Destination**: `storage/images/testseries/`
- **Filename Format**: `thumbnail_testseries_{title}_{timestamp}_{randid}.{ext}`
- **Supported Types**: JPEG, JPG, PNG, GIF, WebP
- **Size Limit**: 5MB
- **Validation**: MIME type checking

#### PDF Storage

- **Destination**: `storage/pdfs/testseries/`
- **Filename Formats**:
  - Question Paper: `question_paper_{testtitle}_{timestamp}_{randid}.pdf`
  - Suggested Answer: `suggested_answer_{testtitle}_{timestamp}_{randid}.pdf`
- **Supported Types**: PDF only
- **Size Limit**: 10MB
- **Validation**: MIME type checking

### File Naming Convention

- **Timestamp**: ISO string with special characters replaced
- **Random ID**: First 8 characters of UUID v4
- **Title Sanitization**: Non-alphanumeric characters replaced with underscores
- **Unique Filenames**: Prevents conflicts and overwrites

### Multer Configurations

#### uploadThumbnail

- Single file upload for test series thumbnails
- Field name: 'thumbnail'
- Image validation and size limits
- Auto-directory creation

#### uploadPDFs

- Multiple file upload for subjective tests
- Fields: 'questionPaper' (required), 'suggestedAnswer' (optional)
- PDF validation and size limits
- Auto-directory creation

### Helper Functions

#### getFileUrl(req, filePath)

- Generates public URL for uploaded files
- Uses request protocol and host for dynamic base URL
- Returns null for invalid file paths
- Format: `{protocol}://{host}/uploads/{relativePath}`

#### deleteFile(filePath)

- Safe file deletion with error handling
- Checks file existence before deletion
- Returns boolean success status
- Logs errors without throwing

#### ensureDirectoryExists(dirPath)

- Creates directory structure recursively
- Similar to `mkdir -p` command
- Used internally for upload destinations

### Security Features

#### File Type Validation

- **Images**: Strict MIME type checking for thumbnails
- **PDFs**: PDF-only validation for documents
- **Error Handling**: Clear error messages for invalid types

#### Size Limits

- **Images**: 5MB maximum to prevent abuse
- **PDFs**: 10MB maximum for reasonable document sizes
- **Multer Integration**: Built-in size validation

#### Filename Security

- **Sanitization**: Special characters removed from titles
- **Uniqueness**: Timestamp + UUID prevents conflicts
- **Path Safety**: No directory traversal vulnerabilities

#### Directory Management

- **Auto-creation**: Directories created as needed
- **Organized Structure**: Separate folders for different file types
- **Storage Isolation**: Files stored outside web root

### Error Handling

- **Upload Errors**: Caught and reported with specific messages
- **File System Errors**: Logged and handled gracefully
- **Validation Errors**: Clear user-facing error messages
- **Cleanup**: Failed uploads are automatically cleaned up

### Usage Patterns

#### Single File Upload (Thumbnails)

```javascript
uploadThumbnail(req, res, (err) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  // req.file contains uploaded file info
  const fileUrl = getFileUrl(req, req.file.path);
});
```

#### Multiple File Upload (PDFs)

```javascript
uploadPDFs(req, res, (err) => {
  if (err) {
    return res.status(400).json({ error: err.message });
  }
  // req.files.questionPaper[0] - required
  // req.files.suggestedAnswer[0] - optional
});
```

### File URL Structure

- **Base URL**: Dynamic based on request (supports different environments)
- **Public Path**: `/uploads/{relativePath}`
- **Full URL**: `http://localhost:3000/uploads/images/testseries/thumbnail_...`

### Cleanup Strategies

1. **Error Cleanup**: Files deleted if database operations fail
2. **Update Cleanup**: Old files deleted when new ones uploaded
3. **Deletion Cleanup**: All associated files deleted when test series removed
4. **Validation Cleanup**: Files deleted if post-upload validation fails

### Integration Points

- **Controllers**: Used in testSeriesController for file handling
- **Routes**: Integrated with express routes for upload endpoints
- **Static Serving**: Files served via express.static middleware
- **Database**: File URLs stored in MongoDB documents

## Future Enhancements

Add more helpers here (logging, rate limiting config, etc.).
