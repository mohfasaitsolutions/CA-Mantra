# Fix for 413 Request Entity Too Large Error

## Quick Fix (Do this now!)

### Step 1: Edit nginx config
```bash
sudo nano /etc/nginx/sites-available/api.camantraa.com
```

### Step 2: Add this ONE line after `server_name api.camantraa.com;`
```nginx
client_max_body_size 25M;
```

Your config should look like:
```nginx
server {
    server_name api.camantraa.com;
    
    # Add this line:
    client_max_body_size 25M;
    
    location / {
        # ... rest of your config
```

### Step 3: Test and reload
```bash
sudo nginx -t
sudo systemctl reload nginx
```

**Done!** Your 413 error is fixed.

---

## Complete Minimal Configuration

See `nginx.conf.example` for the full configuration that matches your current setup.
