# CORS Fix Deployment Guide

## Issue
CORS errors preventing frontend (https://camantraa.com) from accessing backend API (https://api.camantraa.com).

## Changes Made

### 1. Updated Express CORS Configuration
File: `src/server.js`
- Changed from wildcard `origin: '*'` to specific allowed origins
- Enabled credentials support
- Added localhost origins for development
- Improved error handling for CORS validation

### 2. Updated Nginx Configuration  
File: `nginx.conf.example`
- Changed CORS origin from `*` to `https://camantraa.com`
- Enabled credentials in CORS headers
- Added `always` flag to ensure headers are sent even on error responses
- Improved preflight OPTIONS handling
- Reduced Max-Age to 24 hours (86400 seconds) for better cache control

## Deployment Steps

### Step 1: Update Backend Code
```bash
cd /path/to/ca-test-series-backend
git pull  # or copy the updated src/server.js
npm install  # if needed
pm2 restart all  # or your process manager command
```

### Step 2: Update Nginx Configuration
```bash
# SSH into your server
ssh your-server

# Backup current nginx config
sudo cp /etc/nginx/sites-available/api.camantraa.com /etc/nginx/sites-available/api.camantraa.com.backup

# Copy the new configuration
sudo nano /etc/nginx/sites-available/api.camantraa.com
# Paste the contents from nginx.conf.example

# Test nginx configuration
sudo nginx -t

# If test passes, reload nginx
sudo systemctl reload nginx
```

### Step 3: Verify the Fix
Open your browser console and test:
```javascript
// Should work without CORS errors
fetch('https://api.camantraa.com/health')
  .then(r => r.json())
  .then(console.log);
```

## Testing Checklist

- [ ] Backend server restarted with new CORS config
- [ ] Nginx configuration updated and reloaded
- [ ] `/health` endpoint returns response with CORS headers
- [ ] Login works without CORS errors
- [ ] Student profile loads without CORS errors
- [ ] Cart API calls work without CORS errors
- [ ] OPTIONS preflight requests return 204 status

## Troubleshooting

### If CORS errors persist:

1. **Check Nginx Headers**
   ```bash
   curl -I -X OPTIONS https://api.camantraa.com/api/students/profile \
     -H "Origin: https://camantraa.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization, Content-Type"
   ```
   Should return:
   - `Access-Control-Allow-Origin: https://camantraa.com`
   - `Access-Control-Allow-Credentials: true`

2. **Check Express Server Logs**
   ```bash
   pm2 logs
   ```
   Look for any CORS-related errors

3. **Verify Nginx is Running**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t
   ```

4. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   - Or open in incognito mode

5. **Check if WWW subdomain is being used**
   If users access `https://www.camantraa.com`, the origin whitelist already includes it.

## Notes

- The CORS configuration now requires specific origins for security
- Credentials (cookies, authorization headers) are now properly supported
- Both nginx and Express handle CORS to ensure compatibility
- The `always` flag in nginx ensures CORS headers are sent even on error responses (400, 500, etc.)

## Rollback Plan

If issues occur, restore the previous nginx configuration:
```bash
sudo cp /etc/nginx/sites-available/api.camantraa.com.backup /etc/nginx/sites-available/api.camantraa.com
sudo systemctl reload nginx
```

And revert src/server.js using git:
```bash
git checkout HEAD~1 src/server.js
pm2 restart all
```
