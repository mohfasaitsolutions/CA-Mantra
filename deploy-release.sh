#!/usr/bin/env bash
# Deploys the security/bug-fix release + COURSE_UPLOADER role to production, following ca-test-series-lms/deploy.txt.
# Run from this folder:  bash deploy-release.sh
# Steps are ordered so nothing is changed until the server pre-checks and backup succeed.
set -euo pipefail

cd "$(dirname "$0")"
KEY="ca-test-series-lms/camantraaF.pem"
HOST="ubuntu@ec2-13-201-166-25.ap-south-1.compute.amazonaws.com"
SSH="ssh -i $KEY -o ConnectTimeout=15"
BE=/home/ubuntu/ca-test-series-backend
FILES=(
  # d77ab22 - security hardening / bug fixes
  src/server.js
  src/config/index.js
  src/utils/token.js
  src/utils/seedUsers.js
  src/routes/paymentRoutes.js
  # ba954ab - COURSE_UPLOADER role
  src/constants/roles.js
  src/controllers/adminController.js
  src/controllers/testSeriesController.js
  src/controllers/userController.js
  src/routes/adminRoutes.js
  src/routes/planRoutes.js
  src/routes/testSeriesRoutes.js
  src/routes/userRoutes.js
)

chmod 400 "$KEY"

echo "== 1. Pre-checks on server (read-only) =="
$SSH $HOST "pm2 status camantraa-api; cd $BE;
  for v in JWT_SECRET MONGODB_URI; do
    grep -q \"^\$v=.\\+\" .env || { echo \"ABORT: \$v is not set in server .env\"; exit 1; }
  done; echo 'JWT_SECRET and MONGODB_URI present'"

echo "== 2. Show diff between server and local files (review before continuing) =="
for f in "${FILES[@]}"; do
  echo "--- $f"
  $SSH $HOST "cat $BE/$f" | diff - "ca-test-series-backend/$f" | head -40 || true
done
read -r -p "Diff looks right (server only differs by this release)? [y/N] " ok
[ "$ok" = "y" ] || { echo "Aborted"; exit 1; }

echo "== 3. Backup =="
REL=$(date +%Y%m%d-%H%M%S)
$SSH $HOST "mkdir -p /home/ubuntu/deploy-backups/$REL/backend && \
  cd $BE && cp --parents ${FILES[*]} /home/ubuntu/deploy-backups/$REL/backend/ && \
  sudo cp -a /var/www/camantraa/dist /home/ubuntu/deploy-backups/$REL/frontend-dist"
echo "Backup: /home/ubuntu/deploy-backups/$REL"

echo "== 4. Backend: set NODE_ENV, upload files, restart =="
$SSH $HOST "grep -q '^NODE_ENV=' $BE/.env || echo 'NODE_ENV=production' >> $BE/.env"
for f in "${FILES[@]}"; do
  scp -i "$KEY" "ca-test-series-backend/$f" "$HOST:$BE/$f"
done
$SSH $HOST "pm2 restart camantraa-api --update-env && sleep 4 && curl -fsS https://api.camantraa.com/health" \
  || { echo "HEALTH CHECK FAILED - rolling back backend";
       $SSH $HOST "cp -a /home/ubuntu/deploy-backups/$REL/backend/src/. $BE/src/ && pm2 restart camantraa-api";
       exit 1; }

echo "== 5. Frontend =="
rsync -av --delete -e "ssh -i $KEY" ca-test-series-lms/dist/ "$HOST:/home/ubuntu/dist/"
$SSH $HOST "sudo rsync -av --delete /home/ubuntu/dist/ /var/www/camantraa/dist/ && sudo chmod -R 755 /var/www/camantraa/dist/"

echo "== Done. Smoke test =="
curl -fsS https://api.camantraa.com/health && echo
echo "Roll back with: ssh ... 'cp -a /home/ubuntu/deploy-backups/$REL/backend/src/. $BE/src/ && pm2 restart camantraa-api; sudo rsync -a --delete /home/ubuntu/deploy-backups/$REL/frontend-dist/ /var/www/camantraa/dist/'"
