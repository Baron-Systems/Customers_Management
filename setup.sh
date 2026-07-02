#!/bin/bash
set -e

APP_DIR="/var/www/customers-management"
DOMAIN="yourdomain.com"

echo "==> 1/7  تثبيت Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

echo "==> 2/7  تثبيت PM2 و Nginx..."
npm install -g pm2
apt-get update
apt-get install -y nginx

echo "==> 3/7  نقل المشروع..."
mkdir -p "$APP_DIR"
rsync -av --exclude=node_modules --exclude=.next --exclude=.git --exclude=data ./ "$APP_DIR/"

cd "$APP_DIR"

echo "==> 4/7  تثبيت المتطلبات وبناء المشروع..."
npm install
npm run build

echo "==> 5/7  إعداد البيئة..."
if [ ! -f "$APP_DIR/.env" ]; then
    JWT_SECRET=$(openssl rand -hex 32)
    echo "JWT_SECRET=$JWT_SECRET" > "$APP_DIR/.env"
    echo "NODE_ENV=production" >> "$APP_DIR/.env"
    echo ".env created"
fi

echo "==> 6/7  إعداد Nginx..."
cat > /etc/nginx/sites-available/customers-management << NGINX_EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/customers-management /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "==> 7/7  تشغيل التطبيق..."
pm2 delete customers-management 2>/dev/null || true
pm2 start "npm start" --name customers-management
pm2 save
pm2 startup systemd -u $(whoami) --hp $(eval echo ~$(whoami)) 2>/dev/null || true

echo ""
echo "=========================================="
echo "  done"
echo "  http://$DOMAIN"
echo "  admin / admin123"
echo "=========================================="
