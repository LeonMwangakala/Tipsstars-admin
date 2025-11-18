# Deployment Guide for Tipsstars Admin Panel
## Subdomain: core.tipsstars.com

This is a manual step-by-step guide to deploy the React admin panel to your production server.

---

## Prerequisites

- SSH access to server: `root@64.23.136.250`
- Domain DNS configured: `core.tipsstars.com` → `64.23.136.250`
- Basic knowledge of Linux commands

---

## Step 1: Connect to Server

```bash
ssh root@64.23.136.250
```

---

## Step 2: Install Node.js and npm

```bash
# Update system packages
apt-get update

# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

Expected output:
- Node.js version: v20.x.x or higher
- npm version: 10.x.x or higher

---

## Step 3: Install PM2 (Process Manager)

```bash
# Install PM2 globally
npm install -g pm2

# Verify installation
pm2 --version
```

---

## Step 4: Create Application Directory

```bash
# Create directory for the admin panel
mkdir -p /var/www/tipsstars-admin
cd /var/www/tipsstars-admin
```

---

## Step 5: Clone Repository

```bash
# Clone the repository
git clone https://github.com/LeonMwangakala/Tipsstars-admin.git .

# Verify files are cloned
ls -la
```

---

## Step 6: Install Dependencies

```bash
# Install npm dependencies
npm install

# If you encounter peer dependency issues, use:
# npm install --legacy-peer-deps
```

This may take a few minutes. Wait for it to complete.

---

## Step 7: Configure Environment Variables

```bash
# Check if .env file exists
ls -la .env*

# If .env.example exists, copy it
cp .env.example .env

# Edit the .env file (if needed)
nano .env
```

Update the API URL if needed:
```
VITE_API_BASE_URL=https://api.tipsstars.com
```

---

## Step 8: Build the React Application

```bash
# Build the production version
npm run build

# Verify build output
ls -la dist/
```

The `dist/` folder should contain the built files.

---

## Step 9: Configure Nginx

```bash
# Create Nginx configuration file
nano /etc/nginx/sites-available/tipsstars-admin
```

Add the following configuration:

```nginx
# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name core.tipsstars.com;

    # Allow Let's Encrypt verification
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS Configuration (SSL will be added by Certbot)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name core.tipsstars.com;
    root /var/www/tipsstars-admin/dist;

    # SSL Certificate Configuration (will be set up by Certbot)
    # ssl_certificate /etc/letsencrypt/live/core.tipsstars.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/core.tipsstars.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/core-tipsstars-access.log;
    error_log /var/log/nginx/core-tipsstars-error.log;

    # Index file
    index index.html;

    # Character set
    charset utf-8;

    # Main location block - serve React app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
}
```

Save and exit (Ctrl+X, then Y, then Enter).

---

## Step 10: Enable Nginx Site

```bash
# Create symbolic link to enable the site
ln -sf /etc/nginx/sites-available/tipsstars-admin /etc/nginx/sites-enabled/tipsstars-admin

# Remove default site if it exists
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t
```

If the test passes, you should see:
```
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

---

## Step 11: Set File Permissions

```bash
# Set proper ownership
chown -R www-data:www-data /var/www/tipsstars-admin

# Set proper permissions
chmod -R 755 /var/www/tipsstars-admin
```

---

## Step 12: Restart Nginx

```bash
# Restart Nginx
systemctl restart nginx

# Check Nginx status
systemctl status nginx
```

---

## Step 13: Test HTTP Access

```bash
# Test if the site is accessible via HTTP
curl -I http://core.tipsstars.com

# Or test from your browser
# http://core.tipsstars.com
```

---

## Step 14: Set Up SSL Certificate

```bash
# Install Certbot if not already installed
apt-get update
apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
certbot --nginx -d core.tipsstars.com --non-interactive --agree-tos --email admin@tipsstars.com --redirect
```

Certbot will:
- Obtain the SSL certificate
- Automatically update Nginx configuration
- Set up HTTP to HTTPS redirect

---

## Step 15: Verify SSL Setup

```bash
# Test HTTPS access
curl -I https://core.tipsstars.com

# Check SSL certificate
certbot certificates
```

---

## Step 16: Test the Application

Open in your browser:
```
https://core.tipsstars.com
```

You should see the admin panel login page.

---

## Updating the Application

When you need to update the application:

```bash
# Navigate to application directory
cd /var/www/tipsstars-admin

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Restart Nginx (if needed)
systemctl restart nginx
```

---

## Troubleshooting

### Issue: npm install fails
```bash
# Try with legacy peer deps
npm install --legacy-peer-deps

# Or clear npm cache
npm cache clean --force
npm install
```

### Issue: Build fails
```bash
# Check Node.js version (should be 18+)
node --version

# Check for errors in build output
npm run build 2>&1 | tee build.log
```

### Issue: 404 errors on page refresh
- Make sure Nginx config has `try_files $uri $uri/ /index.html;`
- This is required for React Router to work

### Issue: API calls fail
- Check browser console for CORS errors
- Verify API URL in `.env` file
- Check Laravel CORS configuration on backend

### Issue: Nginx 502 Bad Gateway
```bash
# Check Nginx error logs
tail -f /var/log/nginx/core-tipsstars-error.log

# Verify file permissions
ls -la /var/www/tipsstars-admin/dist
```

### Issue: SSL certificate fails
```bash
# Check DNS resolution
dig core.tipsstars.com +short

# Should return: 64.23.136.250

# Check if port 80 is open
netstat -tuln | grep :80
```

---

## File Structure

After deployment, your structure should look like:

```
/var/www/tipsstars-admin/
├── dist/              # Built React app (served by Nginx)
├── node_modules/      # npm dependencies
├── src/               # Source code
├── public/            # Public assets
├── package.json       # npm configuration
└── .env               # Environment variables
```

---

## Nginx Configuration Location

- Configuration file: `/etc/nginx/sites-available/tipsstars-admin`
- Enabled site: `/etc/nginx/sites-enabled/tipsstars-admin`
- Logs: 
  - Access: `/var/log/nginx/core-tipsstars-access.log`
  - Error: `/var/log/nginx/core-tipsstars-error.log`

---

## Useful Commands

```bash
# View Nginx logs
tail -f /var/log/nginx/core-tipsstars-error.log
tail -f /var/log/nginx/core-tipsstars-access.log

# Test Nginx configuration
nginx -t

# Reload Nginx (without downtime)
systemctl reload nginx

# Restart Nginx
systemctl restart nginx

# Check Nginx status
systemctl status nginx

# View SSL certificate info
certbot certificates

# Renew SSL certificate (manual)
certbot renew

# Test SSL certificate renewal
certbot renew --dry-run
```

---

## Security Recommendations

1. **Firewall**: Ensure ports 80 and 443 are open
2. **SSL**: Always use HTTPS in production
3. **Updates**: Keep Node.js and npm updated
4. **Backups**: Regularly backup the `dist/` folder
5. **Monitoring**: Set up monitoring for the application

---

## Next Steps

After successful deployment:

1. ✅ Test all admin panel features
2. ✅ Verify API connectivity
3. ✅ Test login functionality
4. ✅ Check all pages load correctly
5. ✅ Verify SSL certificate auto-renewal

---

## Support

If you encounter issues:
- Check Nginx error logs
- Verify file permissions
- Check DNS configuration
- Review build output for errors

