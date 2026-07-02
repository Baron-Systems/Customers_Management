#!/bin/bash
set -e

# ============================================
# سكربت نشر تلقائي — يُشغل من الجهاز المحلي
# ============================================

# عدل هذه القيم قبل التشغيل:
SERVER_USER="root"
SERVER_IP="YOUR_SERVER_IP"
DOMAIN="yourdomain.com"
APP_DIR="/var/www/customers-management"

# ── 1. نسخ الملفات إلى السيرفر ──
echo "==> 1/5  نسخ الملفات إلى السيرفر..."
rsync -avz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  --exclude=data \
  ./ \
  ${SERVER_USER}@${SERVER_IP}:${APP_DIR}/

# ── 2. تشغيل الإعداد على السيرفر ──
echo "==> 2/5  تثبيت المتطلبات وبناء المشروع..."
ssh ${SERVER_USER}@${SERVER_IP} bash -s << REMOTE_SCRIPT
set -e
APP_DIR="${APP_DIR}"
DOMAIN="${DOMAIN}"

# تثبيت Node.js 22
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
fi

# تثبيت PM2 و Nginx
npm install -g pm2
apt-get update && apt-get install -y nginx

cd \$APP_DIR

# تثبيت Dependencies و بناء
npm install
npm run build

# إنشاء ملف .env إذا لم يكن موجوداً
if [ ! -f "\$APP_DIR/.env" ]; then
    echo "JWT_SECRET=\$(openssl rand -hex 32)" > \$APP_DIR/.env
    echo "NODE_ENV=production" >> \$APP_DIR/.env
    echo "==>  .env created with random JWT_SECRET"
fi

# ── 3. إعداد Nginx ──
echo "==> 3/5  إعداد Nginx..."
cat > /etc/nginx/sites-available/customers-management << 'NGINX_EOF'
server {
    listen 80;
    server_name DOMAIN_PLACEHOLDER;

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

sed -i "s/DOMAIN_PLACEHOLDER/\$DOMAIN/g" /etc/nginx/sites-available/customers-management

ln -sf /etc/nginx/sites-available/customers-management /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ── 4. تشغيل التطبيق بـ PM2 ──
echo "==> 4/5  تشغيل التطبيق..."
pm2 delete customers-management 2>/dev/null || true
cd \$APP_DIR && pm2 start "npm start" --name customers-management
pm2 save
pm2 startup systemd -u \$(whoami) --hp \$(eval echo ~\$(whoami)) 2>/dev/null || true

REMOTE_SCRIPT

# ── 5. انتهاء ──
echo ""
echo "=========================================="
echo "  ✅ النشر اكتمل!"
echo "  🌐 http://${DOMAIN}"
echo "  🔑 تسجيل الدخول الافتراضي: admin / admin123"
echo "=========================================="
