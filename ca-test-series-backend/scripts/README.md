# Scripts

Run all of these from the repo root. Each loads `.env` from the repo root regardless of cwd.

## Seeding / data

- `node scripts/seedData.js` — seed base data (plans, test series, users)
- `node scripts/seedPurchase.js` — seed a purchase + enrollment
- `node scripts/seed-fake-air-data.js [users] [tests]` — fake AIR/rank data
- `node scripts/flushData.js` — wipe collections (destructive)
- `node scripts/cleanup-fake-data.js` — remove seeded fake data

## Maintenance

- `node scripts/health-check.js` — data integrity report
- `node scripts/cleanup-orphaned-enrollments.js` — drop enrollments with no test series
- `node scripts/migration-add-submission-unique-index.js` — add unique submission index
- `node scripts/update-evaluator-specializations.js` — backfill evaluator specializations

## Thumbnails

- `node scripts/ensure-thumbnails.js` — generate any missing thumbnails (preferred)
- `node scripts/add-thumbnails.js` — generate thumbnails
- `node scripts/check-thumbnails.js` — report thumbnail status

## Debug / verify

- `node scripts/check_student.js` — inspect a student's enrollments
- `node scripts/debug-evaluator-queue.js` — inspect evaluator queue
- `node scripts/test-email.js` — send a test email
- `bash scripts/verify-razorpay-config.sh` — check Razorpay env vars
- `bash scripts/deploy-nginx-cors-fix.sh` — deploy nginx CORS config (sudo, server only)
