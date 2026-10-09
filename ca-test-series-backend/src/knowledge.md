# Project Knowledge (Backend)

Purpose: Authentication & user management for CA Mantraa platform.

Key Concepts:

- Roles: ADMIN, EVALUATOR, STUDENTS.
- Students self-signup with email verification.
- Admin bootstrap account auto-created.
- Admin can create ADMIN/EVALUATOR accounts (already verified).
- JWT auth (payload: id, email, role).
- Email flows: verification & password reset.

Structure Overview:

- config/: DB connection.
- constants/: enums like roles.
- controllers/: request handling logic.
- middleware/: auth & role guards.
- models/: Mongoose schemas.
- routes/: Express routers.
- services/: external integrations (emailService).
- utils/: helper utilities (token, error handling).

Extensibility Tips:

- Add new domain modules under models/controllers/services with their own knowledge file.
- Use centralized validation via express-validator.
- Consider adding rate limiting (e.g., express-rate-limit) for auth endpoints.
- For production: configure secure SMTP, HTTPS, monitoring.
