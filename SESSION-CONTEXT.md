# Session context — COURSE_UPLOADER role

Handoff notes for picking this work up cold. Written 2026-10-27.

Repo: `camantrazip/` containing two apps.

| Path | Stack |
|---|---|
| `ca-test-series-backend/` | Express + Mongoose + JWT, pm2 on EC2 |
| `ca-test-series-lms/` | React + Vite + TypeScript + shadcn/ui |

Production: frontend `https://camantraa.com`, API `https://api.camantraa.com`,
host `ubuntu@ec2-13-201-166-25.ap-south-1.compute.amazonaws.com`, pm2 app `camantraa-api`.

---

## 1. What was built

A fourth role, `COURSE_UPLOADER`, for staff who manage course content but must not
reach the admin console. Lower-trust than admin — intended for contractors and
junior content staff.

**Can:** create/edit/publish test series and their tests, upload question-paper and
answer PDFs, add MCQ questions, create/edit plans, set prices on test series and
plans, upload/edit study materials.

**Cannot:** admin dashboard, orders, students, evaluators, evaluator feedbacks,
evaluations, support tickets, enquiries, schedule, blogs, analytics, settings; any
revenue figures; deleting test series, plans or study materials.

Roles are `ADMIN`, `EVALUATOR`, `COURSE_UPLOADER`, `STUDENTS` (note the plural) in
`ca-test-series-backend/src/constants/roles.js`. `User.role`'s enum is
`Object.values(ROLES)`, so adding to that file is enough for the model.

---

## 2. Architecture — read this before adding routes

Course management pages are **shared** between admin and uploader. Rather than
duplicating ~8 pages, the same components are mounted under two prefixes and the
pages navigate through a base path.

```
useRoleBasePath()  ->  "/admin" for ADMIN, "/uploader" for COURSE_UPLOADER
```
`ca-test-series-lms/src/hooks/use-role-base-path.ts`

**Invariant:** every `/uploader/*` path segment must mirror its `/admin/*`
counterpart exactly, because the shared pages navigate via
`` `${basePath}/<segment>` `` and only the prefix is swapped.

```
/admin/tests          <->  /uploader/tests
/admin/tests/create   <->  /uploader/tests/create
/admin/tests/edit/:id <->  /uploader/tests/edit/:id
/admin/create-test    <->  /uploader/create-test
/admin/plans          <->  /uploader/plans
/admin/plans/create   <->  /uploader/plans/create
/admin/plans/:planId/edit  <->  /uploader/plans/:planId/edit
/admin/study-materials     <->  /uploader/study-materials
```

This invariant was broken once already: the uploader routes were first registered
as `/uploader/test-series/*` while the pages navigated to `${basePath}/tests`,
producing four separate 404 bugs from one naming mismatch. A comment in
`App.tsx` records the rule.

**Sidebars.** ~25 admin pages hardcode `<Sidebar role="admin" />`. Instead of
editing them all, `Sidebar.tsx` and `MobileSidebar.tsx` let the *signed-in* role win
when it is `COURSE_UPLOADER`, rendering `courseUploaderMenuItems` (3 entries).

**Client-side guards are cosmetic.** `RoleProtectedRoute`, the sidebar swap and the
hidden delete buttons exist so uploaders don't see dead controls. Every rule is
enforced independently server-side.

---

## 3. Files changed

Both feature commits are pushed: `d77ab22` (security hardening, prior work) and
`ba954ab` (this role).

**Backend (8)** — `constants/roles.js`, `routes/{testSeries,plan,admin,user}Routes.js`,
`controllers/{user,testSeries,admin}Controller.js`.

**Frontend (15)** — `App.tsx`, `constants/roles.ts`, `hooks/use-role-base-path.ts` (new),
`hooks/index.ts`, `components/{Sidebar,MobileSidebar}.tsx`, `lib/menu-items.ts`,
`lib/api/{auth,users}.ts`, `lib/validation/schemas.ts`, `types/index.ts`,
`pages/auth/Login.tsx`, and the shared pages `pages/admin/{TestSeriesManagement,
PlansManagement,CreateTestSeries,CreateTest,EditTestSeries,CreatePlan,
StudyMaterialManagement}.tsx`.

**Uncommitted:** `deploy-release.sh` (see §5).

---

## 4. Authorization map (server-side, authoritative)

Both `testSeriesRoutes.js` and `planRoutes.js` use a blanket
`router.use(requireRoles(ROLES.ADMIN, ROLES.COURSE_UPLOADER))`, with destructive
routes **re-guarded individually below it**:

```js
router.delete('/:testSeriesId', requireRoles(ROLES.ADMIN), ...)  // testSeriesRoutes.js
router.delete('/:planId',       requireRoles(ROLES.ADMIN), ...)  // planRoutes.js
```

In `adminRoutes.js` only the study-material block is open to uploaders, and two of
those are admin-only: `GET /study-materials/analytics` (returns revenue) and
`DELETE /study-materials/:id`. Per-item `purchaseStats` in `getStudyMaterialDetails`
is also gated on `req.user.role === ROLES.ADMIN`.

**If you add a route under testSeriesRoutes or planRoutes, it is uploader-accessible
by default.** Re-guard it if it shouldn't be.

Three scope decisions were made by the product owner, not derived from code:
delete = admin only; revenue = admin only; **pricing = allowed for uploaders**
(the create and edit forms make both price fields mandatory, so removing it would
break the uploader's core flow).

---

## 5. Deployment

Deployed to production 2026-10-26. `deploy-release.sh` at the repo root handles it:
pre-checks, server-vs-local diff, backup, upload, pm2 restart, health check with
automatic rollback, then frontend rsync.

**The script's `FILES` array was stale** — it listed only the 5 security-fix files
and none of the 8 role files, so running it unchanged would have shipped the uploader
UI against a backend with no uploader support. All 13 are now listed. **Keep that
array in sync when you touch new backend files.**

Its review gate is an interactive `read -r -p`, so it cannot run unattended.

Backup of the last deploy: `/home/ubuntu/deploy-backups/20261026-181506`.

```bash
# rollback
ssh -i ca-test-series-lms/camantraaF.pem ubuntu@ec2-13-201-166-25.ap-south-1.compute.amazonaws.com \
  'cp -a /home/ubuntu/deploy-backups/20261026-181506/backend/src/. /home/ubuntu/ca-test-series-backend/src/ && pm2 restart camantraa-api'
```

---

## 6. Running locally

**`ca-test-series-backend/.env` points at the production Atlas cluster and holds live
Razorpay keys.** Running the backend as-is writes into the real customer database.
Always override. `ca-test-series-lms/.env` likewise points at `api.camantraa.com`;
`.env.local` (gitignored, already created) overrides it to the local API.

```bash
docker run -d --name camantraa-local-mongo -p 27017:27017 mongo:7

cd ca-test-series-backend
MONGODB_URI="mongodb://127.0.0.1:27017/camantraa_local" NODE_ENV=development \
DISABLE_EMAIL=true RAZORPAY_LIVE_KEY_ID="rzp_test_LOCALDUMMY000" \
RAZORPAY_LIVE_KEY_SECRET="localdummysecret000000" \
RAZORPAY_WEBHOOK_SECRET="localdummywebhook" PORT=3000 node src/server.js

cd ../ca-test-series-lms && npx vite --port 8080
```

App on `http://localhost:8080`, API on `http://localhost:3000`. Everyone signs in at
`/login` and is redirected by role; there is no separate admin login.

Seed logins (local throwaway DB only, from `seedUsers.js` — **not** production
credentials): `admin@camantraa.com` / `admin123456`,
`evaluator@camantraa.com` / `evaluator123456`.

Add `SEED_DEFAULT_USERS=true` on first run only — but see the crash in §8.

---

## 7. Verification status

Tested end-to-end against the local stack: admin creates an uploader (201);
uploader logs in; uploader reaches test series, plans and study materials (200);
uploader blocked on all 10 admin endpoints (403); uploader creates a test series
(201, price correctly derived 800 from discounted / 1000 original); uploader cannot
delete it (403) but admin can (200).

A security review (identification pass plus two adversarial verification passes)
produced **no findings**. Two candidates were raised and both rejected: an alleged
business-wide revenue leak (false — `Purchase.studyMaterialId` is `required: true`,
so that collection is study-material-only; business revenue lives in `Payment`,
still admin-only), and alleged privilege escalation via pricing/delete (intended
role scope, no trust boundary crossed, no path from student to uploader).

**Not tested:** the production uploader flow. Nobody has created an uploader on the
live system, and the set-password/verification email path is unproven there.

---

## 8. Open items

1. **Seeding crashes the server.** The student seed uses mobile `+91-9876543212`
   but `models/User.js:61` requires exactly 10 digits. `seedDefaultUsers` throws and
   takes down boot; admin and evaluator are created first so they survive. Anyone
   running `SEED_DEFAULT_USERS=true` on a fresh DB hits a crash loop. Fix: drop the
   `+91-` prefix on all three seed users.

2. **New staff accounts cannot log in.** `adminCreateUser` sets
   `emailVerified: false` and signin returns `403 Email not verified`. Confirm the
   verification email actually sends in production or new uploaders are locked out.

3. **Production admin password unverified.** If the seeded default
   `admin@camantraa.com` / `admin123456` still exists on the live site, that is an
   admin account with a trivially guessable password on a payment-processing system.
   Confirm and rotate. Passwords are bcrypt-hashed so they cannot be read back.

4. **`deleteTestSeries` has no purchase guard** — hard-deletes a series and its PDFs
   from disk even when students have bought it. Pre-existing, affects admins too.
   Decide between blocking it and switching to soft-delete.

5. **Razorpay invoice failures in the production log:**
   `Failed to create invoice: undefined` at `razorpayService.js:190`, reached from
   `verifyPayment`. Pre-existing and in the live payment path — a customer may have
   paid without an invoice being generated. Worth investigating.

6. **Pre-existing `tsc` errors** in `components/ErrorBoundary.tsx:1` (unused React
   import) and `pages/student/Resources.tsx:556,656` (`downloadCount` missing on
   `PublicStudyMaterial`). Untouched by this work; the build still succeeds.

7. **Mongoose duplicate-index warnings** on `email` and `studentNumericId` — both
   declared via `index: true` and `schema.index()`. Harmless noise, one-line cleanup.

8. ~~No admin UI for creating uploaders.~~ **Done** — see §9.

---

## 9. Course Uploader management UI

Admin page at `/admin/course-uploaders`
(`ca-test-series-lms/src/pages/admin/CourseUploadersManagement.tsx`), linked from the
admin sidebar under Evaluators. Lists uploaders with active/verified badges, debounced
name/email search, and per-row actions: activate/deactivate, resend verification,
resend set-password invite. Creation dialog takes name, email and a temporary password.

Backend endpoints added to `userController.js` / `userRoutes.js`, all admin-only:

```
GET    /users?role=&q=&active=     listUsers, now filterable (back-compatible)
PATCH  /users/:id/toggle           toggleStaffStatus
POST   /users/:id/resend-verification
POST   /users/:id/resend-invite
```

These act only on `STAFF_ROLES` (ADMIN, EVALUATOR, COURSE_UPLOADER) — students stay
with `/admin/students`, which has its own rules. Self-toggle is refused so an admin
cannot lock themselves out.

Verified locally: create (201), role filter, search filter, toggle both ways, both
resends, self-toggle refused (400), invalid role refused (400), and an authenticated
uploader blocked (403) on list, toggle, resend and — importantly — on creating an
ADMIN account, so there is no escalation path.
