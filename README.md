# CA Mantraa — Platform Handover

Everything a developer new to this codebase needs to run it, understand it, and deploy it.

This folder holds the two halves of the CA Mantraa online CA-exam test-series platform:

| Folder | What it is | Stack |
|---|---|---|
| `ca-test-series-backend/` | REST API, data layer, payments, file storage, email | Node.js + Express 5 + MongoDB (Mongoose 8) |
| `ca-test-series-lms/` | Web app for all three user roles (student, evaluator, admin) | Vite + React 18 + TypeScript + Tailwind + shadcn/ui |

They are separate deployables that talk over HTTP only. Production: frontend at `https://camantraa.com`, backend at `https://api.camantraa.com`.

> **Read the "Before you push this anywhere" section at the bottom before committing this folder.** It contains live production secrets.

---

## 1. Prerequisites

- **Node.js 18+** (both projects; backend is CommonJS, frontend is ESM)
- **MongoDB 6+** running locally, or a connection string to a hosted cluster
- **npm** (both have `package-lock.json`; the frontend also has a `bun.lockb`, but npm is the lockfile that's kept current)
- Optional, for full functionality: a **Razorpay** account (payments) and a **Resend** API key (transactional email)

Neither project has `node_modules` in this copy — run `npm install` in each.

---

## 2. Quick start (local)

### Backend

```bash
cd ca-test-series-backend
npm install
# .env is already present in this copy — review it before use
npm run dev          # nodemon, http://localhost:3000
# or: npm start      # plain node src/server.js
```

On boot the server: connects to MongoDB → creates the `storage/` upload directories → seeds three default users → starts listening. `GET /health` returns `{"status":"ok"}`.

If `MONGODB_URI` is unset or unreachable, [`src/config/index.js`](ca-test-series-backend/src/config/index.js) silently falls back to `mongodb://127.0.0.1:27017/cahero`, then `mongodb://localhost:27017/cahero`. This fallback is convenient locally and dangerous in production — a typo'd URI does not fail the boot, it just connects you to an empty local database. Check the `MongoDB connected using: …` line in the logs.

### Frontend

```bash
cd ca-test-series-lms
npm install
npm run dev          # Vite, http://localhost:8080
npm run build        # outputs to dist/
npm run preview      # serve the built bundle
npm run lint
```

Vite dev server proxies `/api` → `http://localhost:3000`, so a local frontend can reach a local backend with no CORS setup. `@/` is aliased to `src/`.

### Seeded login credentials

[`src/utils/seedUsers.js`](ca-test-series-backend/src/utils/seedUsers.js) runs on **every** backend boot and creates these if missing:

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@camantraa.com` | `admin123456` |
| EVALUATOR | `evaluator@camantraa.com` | `evaluator123456` |
| STUDENTS | `student@camantraa.com` | `student123456` |

These are hardcoded in source and are created in production too. Change or gate this before any real launch.

---

## 3. Environment variables

### Backend (`ca-test-series-backend/.env`)

| Variable | Purpose | Notes |
|---|---|---|
| `PORT` | HTTP port | Defaults to `3000` |
| `MONGODB_URI` | Mongo connection string | Falls back to localhost `cahero` DB if missing — see warning above |
| `JWT_SECRET` | Signing key for auth tokens | **Defaults to the literal string `devsecret` if unset** ([`src/utils/token.js`](ca-test-series-backend/src/utils/token.js)) — any deploy missing this accepts forged tokens |
| `JWT_EXPIRES_IN` | Token lifetime | Defaults `7d` |
| `RAZORPAY_LIVE_KEY_ID` / `RAZORPAY_LIVE_KEY_SECRET` | Razorpay API credentials | Note the names say `LIVE`; there is no separate test-key path in code, so to use test keys you put test values in these same variables |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies webhook signatures | Without it, webhook signature checks cannot pass |
| `RESEND_API_KEY` | Resend (email) API key | |
| `RESEND_SENDER_EMAIL` / `MAIL_FROM` | From address | `MAIL_FROM` is what the code reads; defaults to `CA Mantraa <onboarding@resend.dev>` |
| `DISABLE_EMAIL` | Set `true` to skip all sending | Use this locally so signups don't email real people |
| `ADMIN_EMAIL` | Recipient of payment notifications | |
| `FRONTEND_URL` | Base URL used in email links | |
| `VERIFY_EMAIL_BASE_URL` | Base for email-verification links | |
| `POST_VERIFY_REDIRECT_URL` / `POST_VERIFY_REDIRECT_FAIL_URL` | Where `/api/auth/verify-email` redirects after success/failure | |
| `API_BASE_URL` / `API_BASE_ASSET_URL` | Absolute URLs used when building file URLs returned to clients | Get these wrong and uploaded images/PDFs 404 in the browser |
| `BRAND_NAME` / `BRAND_COLOR` | Email template branding | |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | Legacy SMTP values | Present in `.env` but the active mailer is Resend; only `SMTP_USER` is referenced anywhere |

### Frontend (`ca-test-series-lms/.env`)

| Variable | Purpose |
|---|---|
| `VITE_API_BASE` | API base URL, e.g. `http://localhost:3000/api` or `https://api.camantraa.com/api` |
| `VITE_RAZORPAY_KEY_ID` | Razorpay **public** key id for the checkout widget |

Caveats worth knowing: [`src/lib/api/client.ts`](ca-test-series-lms/src/lib/api/client.ts) resolves the base URL as `VITE_API_BASE` → `VITE_API_URL` → `API_BASE` → `http://localhost:3000/api`. The committed `.env.example` advertises `VITE_API_BASE_URL`, which **no code reads** — copying the example verbatim silently gives you the localhost default. Standardise on `VITE_API_BASE`.

All Vite env values are baked into the bundle at build time and are public. Never put a secret in a `VITE_*` variable.

---

## 4. Architecture

### Backend

Classic layered Express app, no TypeScript, no build step. Entry point [`src/server.js`](ca-test-series-backend/src/server.js).

```
src/
  server.js        bootstrap: DB → storage dirs → seed users → middleware → routes → listen
  config/          Mongo connection + Razorpay credential export
  constants/       ROLES (ADMIN | EVALUATOR | STUDENTS), SUBJECTS (canonical CA subject list)
  models/          15 Mongoose schemas
  routes/          one router per domain, mounted under /api/*
  controllers/     request handling + business logic (this is where the real logic lives)
  services/        razorpayService, emailService (Resend), invoiceService
  middleware/      auth.js — auth(required) and requireRoles(...)
  utils/           token (JWT), fileUpload (multer + sharp), errorHandler, seedUsers
```

Middleware chain: `helmet` (with `crossOriginResourcePolicy: cross-origin`) → `cors` → `compression` → `express.json({ limit: '50mb' })` → `morgan('dev')` → `/uploads` static → routes → `notFound` → `errorHandler`.

The 50 MB body limit exists because some clients post PDFs as base64 JSON; multer handles the multipart path separately with its own, smaller limits.

**Controllers are large and hold the business rules.** `paymentController.js` and `testSeriesController.js` in particular are where CA-level checks, validity windows, attempt limits, and draft/publish rules are enforced. Read them before changing anything purchase- or test-related.

### Frontend

```
src/
  pages/           route components, grouped: admin/ auth/ evaluator/ student/ test/ + public pages
  components/      admin/ auth/ evaluator/ student/ landing/ shared/ ui(shadcn)/
  lib/api/         axios client + per-domain modules (auth, students, testSeries, admin, payment, cart, …)
                   plus React Query hook files (*Hooks.ts)
  lib/store/       Zustand stores: useAuthStore, useUIStore, useStudentStore, useEvaluatorStore, useAdminStore
  lib/validation/  Zod schemas
  contexts/        CartContext
  hooks/           incl. use-role-session-guard
  types/ utils/ constants/ data/
```

- **Server state**: React Query (`@tanstack/react-query`). **Client state**: Zustand.
- **Auth token**: stored by `useAuthStore` under the `localStorage` key `ca-prep-auth-storage` (zustand `persist`). The axios request interceptor reads that key, parses the JSON, and sets `Authorization: Bearer <token>`. If you rename that key, every authenticated request breaks.
- **Route protection**: `ProtectedRoute` (logged in) and `RoleProtectedRoute roles={[...]}` (role gate) in [`src/App.tsx`](ca-test-series-lms/src/App.tsx). This is UI-level only; the backend re-checks every request.
- **Single-role sessions**: `useRoleSessionGuard` listens for cross-tab `storage` events and logs the current tab out if a different role signs in elsewhere.
- Rich text uses Quill, maths uses KaTeX, charts use Recharts, toasts come from both `sonner` and `react-hot-toast` (legacy overlap).

### Frontend route map

Public: `/`, `/landing`, `/about`, `/faq`, `/contact`, `/schedule`, `/resources`, `/blogs`, `/blogs/:slugOrId`, `/buy-now`, `/payment/checkout`, `/payment/cart-checkout`, `/terms`, `/privacy`, `/login`, `/register`, `/forgot-password`, `/reset-password`.

Logged-in (any role): `/test-series`, `/test-series/:id`, `/plans/:planId`, `/cart`.

`STUDENTS`: `/student/dashboard`, `/student/courses`, `/student/history`, `/student/analytics`, `/student/purchases`, `/student/profile`, `/student/settings`, `/student/resources`, `/student/free-resources`, `/student/contact-support`, `/student/test-series/:id`, `/student/test-status`, `/test/:id`, `/test/:id/analysis`.

`ADMIN`: `/admin/dashboard`, `/admin/tests`, `/admin/tests/create`, `/admin/tests/edit/:id`, `/admin/create-test`, `/admin/plans`, `/admin/plans/create`, `/admin/plans/:planId/edit`, `/admin/students`, `/admin/students/:id`, `/admin/evaluators`, `/admin/evaluators/:id`, `/admin/evaluations`, `/admin/evaluator-feedbacks`, `/admin/orders`, `/admin/support-tickets`, `/admin/enquiries`, `/admin/study-materials`, `/admin/schedule`, `/admin/analytics`, `/admin/settings`, `/admin/blogs`, `/admin/blogs/:action/:id`.

`EVALUATOR` (+ `ADMIN`): `/evaluator/dashboard`, `/evaluator/pending`, `/evaluator/completed`, `/evaluator/profile`, `/evaluator/settings`, `/evaluator/evaluate/:submissionId`.

---

## 5. Authentication and authorisation

- Stateless **JWT bearer tokens**, signed in [`src/utils/token.js`](ca-test-series-backend/src/utils/token.js), 7-day default expiry. No refresh tokens, no server-side session store, no revocation list — a leaked token is valid until it expires.
- `auth(true)` (default) rejects missing/invalid tokens with 401. `auth(false)` makes the route work signed-in or anonymous. `requireRoles(ROLES.ADMIN, …)` returns 403 on role mismatch.
- The three roles are exactly `ADMIN`, `EVALUATOR`, `STUDENTS` (plural — the string is `'STUDENTS'`, a frequent source of typo bugs).
- Students have a `caLevel` of `FOUNDATION | INTERMEDIATE | FINAL`; test series carry `FOUNDATION | INTERMEDIATE | FINAL | ALL`. Purchases are blocked unless they match or the series is `ALL`.
- Email verification, password reset, "set password" invites (used for evaluators), and mobile OTP all exist; tokens live on the `User` document with expiry fields.

---

## 6. Data model

MongoDB via Mongoose. 15 collections in [`src/models/`](ca-test-series-backend/src/models/):

| Model | Role in the system |
|---|---|
| `User` | All three roles in one collection, discriminated by `role`. Holds `caLevel`, `specializations` (evaluators), verification/reset tokens, `studentNumericId`, profile fields |
| `TestSeries` | The core product. Embeds a `tests[]` array; each test embeds `mcqQuestions[]` and/or PDF URLs. Carries `price`, `caLevel`, `validity`, `attempts`, `status` (`DRAFT`/`PUBLISHED`), `isActive` |
| `Plan` | A bundle of test series with per-item pricing and display order |
| `Enrollment` | Grants a student access to a test series. Created only by a verified payment |
| `Cart` | One doc per student with an `items[]` array of test series |
| `Payment` | A Razorpay order/payment pair: `razorpayOrderId` (unique), `razorpayPaymentId`, `razorpaySignature`, `amount`, `status`, `isVerified`, `webhookReceived` |
| `Invoice` | Generated invoice records with sequential `invoiceNumber`, tax fields, email-delivery status |
| `Counter` | Atomic sequence source for human-readable ids (invoices, student numbers) |
| `Submission` | A student's attempt at one test: `status` (`PENDING`/`ASSIGNED`/`IN_PROGRESS`/`COMPLETED`/`LOCKED`), marks, `evaluatorId`, attachments, evaluated-file URL, locking fields, student feedback |
| `StudyMaterial` | Paid or free downloadable material with `fileInfo`, pricing, download/purchase counters |
| `Purchase` | A study-material purchase, with `downloadCount`/`maxDownloads` and expiry |
| `Schedule` | Uploaded exam-schedule PDFs, by `examType`/`examSession`/`examYear` |
| `Blog` | CMS posts with slug, tags, status, view count, likes |
| `Contact` | Public contact-form enquiries |
| `SupportTicket` | Student tickets with category, priority, status, attachments, admin response |

Subjects are **not** free text: they're validated against the frozen list in [`src/constants/subjects.js`](ca-test-series-backend/src/constants/subjects.js) (Foundation, Intermediate and Final subjects, plus `Combo`). Adding a subject means editing that file.

Notable index: `Submission` has a unique compound index on `{ studentId, testSeriesId, testId }`, which is what enforces one submission record per student per test.

---

## 7. API surface

Base path `/api`. Mounted in [`src/server.js`](ca-test-series-backend/src/server.js):

| Mount | Router | Audience |
|---|---|---|
| `/api/auth` | `authRoutes` | Public: `signup`, `signin`, `evaluator/signin`, `verify-email`, `forgot-password`, `reset-password`, `resend-verification` |
| `/api/users` | `userRoutes` | Self-service profile (`GET/PATCH /me`, profile picture, mobile OTP) + admin user create/list |
| `/api/test-series` | `testSeriesRoutes` | Public catalogue reads; admin create/update/publish/delete, add tests, add MCQs, upload PDFs |
| `/api/plans` | `planRoutes` | Public plan reads; admin CRUD plus add/remove/price test series within a plan |
| `/api/cart` | `cartRoutes` | Student cart: get, count, add, remove one, clear |
| `/api/payments` | `paymentRoutes` | Student: `create-order`, `create-cart-order`, `verify`, `history`, `:paymentId`. Plus unauthenticated `POST /api/payments/webhook` |
| `/api/students` | `studentRoutes` | Dashboard, purchases, history, analytics, unattempted, profile, test detail, objective/subjective submission, suggested answers, support tickets, public study materials |
| `/api/evaluators` | `evaluatorRoutes` | Admin: create/list/update/toggle evaluators, assign submissions. Evaluator: `me/queue`, `me/profile`, submission detail, status update, upload evaluated PDF |
| `/api/admin` | `adminRoutes` | Dashboard, analytics, evaluations, evaluator feedback, students admin, support tickets, orders, study materials, schedules |
| `/api/schedules` | `scheduleRoutes` | Public schedule list and download |
| `/api` | `contactRoutes` | `POST /api/contact`, plus `/api/admin/enquiries` |
| `/api/blogs` | `blogRoutes` | Public list/detail, like; admin CRUD |
| `/health` | — | Liveness probe |
| `/uploads/*` | static | Serves the `storage/` directory |

Ready-made request collections for all of this are in [`ca-test-series-backend/postman/`](ca-test-series-backend/postman/) (Auth, Users, TestSeries, Students, Evaluators, Admin, Admin-Students, Contact, CAHero).

---

## 8. Key flows

### Purchase (the one to understand first)

1. Student hits `POST /api/payments/create-order` (single series) or `/create-cart-order` (whole cart).
2. The backend validates: series exists, is published/active, not expired, **CA level matches the student's level**, and no active enrollment already exists. It then creates a Razorpay order and a local `Payment` record.
3. Zero-amount orders short-circuit: the response is flagged `isFree: true` and the enrollment is created immediately, with no Razorpay round-trip.
4. The frontend opens Razorpay checkout with `VITE_RAZORPAY_KEY_ID`.
5. On success the frontend calls `POST /api/payments/verify` with `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`. The backend recomputes the HMAC signature, re-checks CA level, marks the payment verified, creates the `Enrollment`, optionally creates a Razorpay invoice, and emails the student and the admin.
6. `POST /api/payments/webhook` is a safety net for payments that the browser never reported back (closed tab, network drop). It verifies the webhook signature against `RAZORPAY_WEBHOOK_SECRET` and creates the enrollment if it doesn't exist. It is mounted **before** the auth middleware — deliberately, so Razorpay can reach it.

Historical note: `POST /api/students/purchases/:testSeriesId` once created enrollments with no payment at all. That hole is documented in [`docs/PAYMENT_SECURITY_FIX.md`](ca-test-series-backend/docs/PAYMENT_SECURITY_FIX.md). Do not reintroduce a path that creates an `Enrollment` without a verified `Payment`.

### Taking a test

Students fetch `GET /api/students/tests/:testSeriesId/:testId`, then submit to `…/objective-submission` or `…/subjective-submission`.

- **Subjective**: one submission only, ever.
- **Objective**: repeat attempts are allowed only when the admin enabled them on the series (`attempts`), and a retry **updates the existing `Submission` document** rather than inserting a new one — that's what the unique compound index guarantees. Background in [`docs/MULTIPLE_SUBMISSION_FIX.md`](ca-test-series-backend/docs/MULTIPLE_SUBMISSION_FIX.md).
- Admins can grant an extra attempt via `POST /api/admin/students/:id/grant-retake`.

### Evaluation

Subjective submissions start `PENDING`. An admin assigns one to an evaluator (`POST /api/evaluators/assign`), or an evaluator pulls from `GET /api/evaluators/me/queue` — matching is driven by the evaluator's `specializations` against the submission's `subject`. The evaluator moves the status along, uploads an annotated PDF to `…/submissions/:id/upload-evaluated`, and records marks. `lockedBy`/`lockedAt` prevent two evaluators grabbing the same script. Students can then read the evaluated file and leave feedback/rating.

### Draft and publish

New test series are created as `status: 'DRAFT'` and are invisible to students until `PATCH /api/test-series/:id/publish`. Publishing validates that the series is actually complete. Series created before this feature are treated as published — see the `Preserve legacy published series status` commit.

### Uploads and static files

[`src/utils/fileUpload.js`](ca-test-series-backend/src/utils/fileUpload.js) configures multer disk storage per asset type and creates these directories on boot:

```
storage/images/testseries   storage/pdfs/testseries
storage/images/profiles     storage/pdfs/submissions
storage/images/blogs        storage/pdfs/evaluated
                            storage/pdfs/study-materials
                            storage/pdfs/schedules
```

Limits: **5 MB for images**, **20 MB for PDFs**. Profile pictures are re-compressed with `sharp` in a quality loop until they fit under 500 KB. Everything is served read-only at `/uploads/...` with `Cross-Origin-Resource-Policy: cross-origin` so the frontend on another domain can display it.

Files live on the server's local disk, not in object storage. `storage/` is gitignored, and the `backups/` dump is a **database** dump only — it contains the URLs of these files, not the files themselves. So if the EC2 instance is lost, every uploaded PDF and image goes with it. Moving this to S3 is the single highest-value piece of infrastructure work outstanding.

---

## 9. Maintenance scripts

All in [`ca-test-series-backend/scripts/`](ca-test-series-backend/scripts/), all run from the backend project root, all load `.env` from that root regardless of your current directory. Full list in [`scripts/README.md`](ca-test-series-backend/scripts/README.md).

```bash
node scripts/health-check.js                        # data-integrity report
node scripts/cleanup-orphaned-enrollments.js        # enrollments pointing at deleted series
node scripts/ensure-thumbnails.js                   # regenerate missing thumbnails
node scripts/migration-add-submission-unique-index.js
node scripts/seedData.js                            # base data: plans, series, users
node scripts/seedPurchase.js                        # a purchase + enrollment
node scripts/seed-fake-air-data.js [users] [tests]  # fake rank/AIR data for demos
node scripts/test-email.js                          # verify Resend config
bash scripts/verify-razorpay-config.sh              # check Razorpay env vars are present
```

**`node scripts/flushData.js` wipes collections.** It takes no confirmation prompt. Never run it against a production `MONGODB_URI`.

---

## 10. Deployment

Production runs on a single AWS EC2 box in `ap-south-1`. The recorded procedure is in [`ca-test-series-lms/deploy.txt`](ca-test-series-lms/deploy.txt).

| Piece | Location |
|---|---|
| Host | `ec2-13-201-166-25.ap-south-1.compute.amazonaws.com` (Ubuntu) |
| Backend | `/home/ubuntu/ca-test-series-backend`, run under PM2 as `camantraa-api` |
| Frontend | static `dist/` served by nginx from `/var/www/camantraa/dist` |
| Reverse proxy | nginx; `api.camantraa.com` → `127.0.0.1:3000`, TLS via Certbot/Let's Encrypt |

Backend deploy: ship the changed files, then `pm2 restart camantraa-api && curl -fsS https://api.camantraa.com/health`.

Frontend deploy: `npm run build` locally, then rsync `dist/` to the server and into the nginx web root. There is no CI — deploys are manual file copies, so always take the backup step in `deploy.txt` first.

nginx needs `client_max_body_size 25M;` or 20 MB PDF uploads fail with **413 Request Entity Too Large** before Express ever sees them. The working config is [`ca-test-series-backend/nginx.conf.example`](ca-test-series-backend/nginx.conf.example); the symptom and one-line fix are in [`docs/FIX_413_ERROR.md`](ca-test-series-backend/docs/FIX_413_ERROR.md). To apply it: `bash scripts/deploy-nginx-cors-fix.sh` (needs sudo, run on the server).

---

## 11. Gotchas and known rough edges

Things that will cost you an afternoon if you don't know them:

1. **CORS is wide open.** [`src/server.js`](ca-test-series-backend/src/server.js) uses `origin: (origin, cb) => cb(null, true)` — every origin is allowed, with `credentials: true`. [`docs/CORS_FIX_DEPLOYMENT.md`](ca-test-series-backend/docs/CORS_FIX_DEPLOYMENT.md) describes an allow-list that is **not** what the current code does. Trust the code, not that doc, and tighten this.
2. **`JWT_SECRET` falls back to `devsecret`.** No warning, no crash. Confirm it is set in every environment.
3. **`MONGODB_URI` falls back to localhost.** A bad URI means "connected to an empty local DB", not an error.
4. **Role string is `STUDENTS`,** not `STUDENT`.
5. **Default users are seeded on every boot,** in production, with the passwords listed above.
6. **The frontend `.env.example` names a variable nothing reads** (`VITE_API_BASE_URL` vs the actual `VITE_API_BASE`).
7. **Two toast libraries** (`sonner` + `react-hot-toast`) and both `<Toaster />` components are mounted in `App.tsx`. Pick one when you touch notifications.
8. **The axios client logs tokens and request details to the browser console** on every call. Strip that before any security review.
9. **No automated tests in either project.** `npm test` in the backend is `echo "No tests yet"`. Verification is manual plus the Postman collections.
10. **`express.json({ limit: '50mb' })`** is global, so any endpoint will accept a 50 MB JSON body.
11. **Business logic lives in controllers, not services** — `paymentController.js` and `testSeriesController.js` are long. Read the whole function before editing a branch of it.
12. **`GET /api/payments/history` is currently broken.** In [`src/routes/paymentRoutes.js`](ca-test-series-backend/src/routes/paymentRoutes.js) the `/:paymentId` route is registered *before* `/history`, so Express matches `history` as a payment id and `getPaymentDetails` rejects it with `400 Invalid payment ID`. The frontend calls this endpoint from [`src/lib/api/payment.ts`](ca-test-series-lms/src/lib/api/payment.ts). Fix by moving the `/history` route above `/:paymentId`.
13. `graphify-out/` in the original workspace held a generated code graph; it is not part of this copy and nothing depends on it.

---

## 12. Documentation index

The backend carries detailed per-feature docs in [`ca-test-series-backend/docs/`](ca-test-series-backend/docs/) — start at [`docs/README.md`](ca-test-series-backend/docs/README.md). Highlights:

- Payments: `PAYMENT_SYSTEM_README.md`, `PAYMENT_FLOW.md`, `PAYMENT_SETUP_GUIDE.md`, `PAYMENT_SECURITY_FIX.md`, `RAZORPAY_INTEGRATION.md`, `RAZORPAY_INVOICE_GUIDE.md`
- Features: `EVALUATOR_APIS.md`, `THUMBNAIL_MANAGEMENT.md`, `FAKE_AIR_DATA_README.md`
- Incidents and fixes: `CA_LEVEL_RESTRICTION_FIX.md`, `MULTIPLE_SUBMISSION_FIX.md`, `FIX_413_ERROR.md`, `CORS_FIX_DEPLOYMENT.md`, `DEPLOYMENT_FIX.md`, `FIXES_SUMMARY.md`, `IMPLEMENTATION_SUMMARY.md`

Frontend: [`ca-test-series-lms/README.md`](ca-test-series-lms/README.md) (state/API/type-safety conventions) and `SECURITY_ROLE_SESSION_FIX.md` (single-role session guard).

Both projects were previously tracked as separate GitHub repos (`Manav-khadka/ca-test-series-backend`, `Manav-khadka/ca-test-series-lms`); in this folder their individual git histories have been removed and they sit inside one repo.

---

## 13. Before you push this anywhere

This folder is a verbatim copy of a working machine, and it currently contains **live production secrets and real user data**:

| Path | What's in it |
|---|---|
| `ca-test-series-backend/.env` | Live Razorpay key + secret, webhook secret, production MongoDB URI, `JWT_SECRET`, Resend API key |
| `ca-test-series-lms/.env` | Razorpay public key id (lower risk, but still environment-specific) |
| `ca-test-series-lms/camantraaF.pem` | **SSH private key for the production EC2 server** |
| `ca-test-series-backend/backups/` | ~22 MB production database dump: real users, payments, submissions |

Pushing this to a remote — even a private one — distributes all of the above to everyone with repo access, and git history keeps it after any later deletion.

Recommended before the first commit:

```bash
cd /Users/manavgenius/Desktop/camantrazip
cat > .gitignore <<'EOF'
node_modules/
dist/
.env
.env.*
!.env.example
*.pem
backups/
storage/
.DS_Store
EOF
```

Then add a `.env.example` to each project with the variable names and empty values, and hand the real values over through a password manager or secrets store rather than the repo. If any of this has already been pushed, treat the Razorpay secret, `JWT_SECRET`, Resend key, MongoDB credentials and the EC2 key pair as compromised and rotate all of them.
