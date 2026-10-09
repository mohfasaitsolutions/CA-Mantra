# CA Mantraa Backend

Auth & User management service.

## Endpoints

Base: `http://localhost:3000/api`

Auth:
POST /auth/signup
GET /auth/verify-email?token=...
POST /auth/signin
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/resend-verification

Users:
GET /users/me (auth)
PATCH /users/me (auth)
POST /users (admin) create admin/evaluator
GET /users (admin)

## Env Vars

```
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/cahero
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=no-reply@cahero.com
FRONTEND_URL=http://localhost:3000
```

## Notes

- Default admin auto-created (admin@cahero.com / 123456)
- Students self-register. Admins manage elevated roles.
