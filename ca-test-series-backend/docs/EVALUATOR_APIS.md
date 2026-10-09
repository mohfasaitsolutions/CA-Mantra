# Evaluator APIs Documentation

## Overview

This document provides comprehensive information about the Evaluator APIs in the CA Mantraa platform. These APIs support evaluator authentication, profile management, and submission evaluation workflows.

## Authentication

### Evaluator Login

**Endpoint:** `POST /api/auth/evaluator/signin`  
**Description:** Dedicated login endpoint for evaluators with role-specific validation  
**Body:**

```json
{
  "email": "evaluator@example.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "evaluator_id",
    "fullName": "Evaluator Name",
    "email": "evaluator@example.com",
    "role": "EVALUATOR",
    "caLevel": "FOUNDATION",
    "specializations": ["Accounting", "Business Laws"],
    "isActive": true
  }
}
```

### General Login (All Roles)

**Endpoint:** `POST /api/auth/signin`  
**Description:** General login endpoint that works for all user roles

## Public Endpoints

### Get Subjects & CA Levels

**Endpoint:** `GET /api/evaluators/subjects`  
**Description:** Returns available subjects and CA levels for evaluator specializations  
**Response:**

```json
{
  "subjects": ["Accounting", "Business Laws", "Economics", "..."],
  "caLevels": ["FOUNDATION", "INTERMEDIATE", "FINAL"]
}
```

## Admin Endpoints (Evaluator Management)

### Create Evaluator

**Endpoint:** `POST /api/evaluators`  
**Role Required:** ADMIN  
**Description:** Create a new evaluator account with automatic email invitations

### List All Evaluators

**Endpoint:** `GET /api/evaluators`  
**Role Required:** ADMIN  
**Query Parameters:**

- `q`: Search by name or email
- `subject`: Filter by subject specialization
- `status`: Filter by submission status
- `active`: Filter by active status (true/false)

### Get Evaluator by ID

**Endpoint:** `GET /api/evaluators/:id`  
**Role Required:** ADMIN  
**Description:** Get detailed information about a specific evaluator

### Update Evaluator

**Endpoint:** `PATCH /api/evaluators/:id`  
**Role Required:** ADMIN  
**Description:** Update evaluator profile information

### Toggle Evaluator Status

**Endpoint:** `PATCH /api/evaluators/:id/toggle`  
**Role Required:** ADMIN  
**Description:** Activate or deactivate evaluator account

### Resend Invitation Email

**Endpoint:** `POST /api/evaluators/:id/resend-invite`  
**Role Required:** ADMIN  
**Description:** Resend set-password invitation email

### Resend Verification Email

**Endpoint:** `POST /api/evaluators/:id/resend-verification`  
**Role Required:** ADMIN  
**Description:** Resend email verification link

## Admin Endpoints (Submission Management)

### Assign Submissions

**Endpoint:** `POST /api/evaluators/assign`  
**Role Required:** ADMIN  
**Body:**

```json
{
  "evaluatorId": "evaluator_id",
  "submissionIds": ["submission_id_1", "submission_id_2"]
}
```

### Update Submission Status (Admin)

**Endpoint:** `POST /api/evaluators/submissions/:id/status`  
**Role Required:** ADMIN  
**Description:** Admin can reassign submissions or change their status

## Evaluator Endpoints (Personal Dashboard)

### Get My Profile

**Endpoint:** `GET /api/evaluators/me/profile`  
**Role Required:** EVALUATOR  
**Description:** Get evaluator's own profile with evaluation statistics  
**Response:**

```json
{
  "id": "evaluator_id",
  "fullName": "Evaluator Name",
  "email": "evaluator@example.com",
  "caLevel": "FOUNDATION",
  "specializations": ["Accounting", "Business Laws"],
  "isActive": true,
  "emailVerified": true,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "stats": {
    "assigned": 25,
    "pending": 5,
    "inProgress": 3,
    "completed": 17,
    "thisWeek": 8
  }
}
```

### Get My Queue

**Endpoint:** `GET /api/evaluators/me/queue`  
**Role Required:** EVALUATOR  
**Query Parameters:**

- `status`: Filter by status (ASSIGNED, IN_PROGRESS, COMPLETED)
  **Description:** Get submissions assigned to the logged-in evaluator

### Get Submission Details

**Endpoint:** `GET /api/evaluators/me/submissions/:id`  
**Role Required:** EVALUATOR  
**Description:** Get detailed information about a specific assigned submission

## Evaluator Endpoints (Submission Actions)

### Start Evaluation

**Endpoint:** `POST /api/evaluators/submissions/:id/status`  
**Role Required:** EVALUATOR  
**Body:**

```json
{
  "action": "start"
}
```

**Description:** Mark submission as IN_PROGRESS to start evaluation

### Complete Evaluation

**Endpoint:** `POST /api/evaluators/submissions/:id/status`  
**Role Required:** EVALUATOR  
**Body:**

```json
{
  "action": "complete",
  "awardedMarks": 78,
  "remarks": "Good work! Well-structured answers with clear explanations."
}
```

**Description:** Complete evaluation with marks and remarks

## Key Features

1. **Role-based Authentication**: Dedicated evaluator login with role validation
2. **Profile Management**: Evaluators can view their profile and statistics
3. **Queue Management**: Evaluators can view and filter their assigned submissions
4. **Evaluation Workflow**: Start and complete evaluations with marks and feedback
5. **Admin Controls**: Comprehensive admin tools for evaluator management
6. **Email Integration**: Automatic invitation and verification emails
7. **Specialization Matching**: Submissions are assigned based on evaluator specializations

## Postman Collection

The complete Postman collection includes:

- Automatic token management
- Pre-configured requests with examples
- Organized folders by functionality
- Environment variables for easy testing
- Test scripts for token extraction

Import the `Evaluators.postman_collection.json` file to get started with testing all evaluator APIs.
