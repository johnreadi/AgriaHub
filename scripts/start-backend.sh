#!/bin/sh
# Script de démarrage Backend PHP-FPM + Nginx
# AGRIA Hub Production

set -e

echo "🚀 Starting AGRIA Hub Backend..."

# Vérifier les variables d'environnement critiques
if [ -z "$DB_HOST" ]; then
    echo "⚠️  WARNING: DB_HOST not set, using default"
fi

if [ -z "$DB_PASS" ]; then
    echo "❌ ERROR: DB_PASS is required!"
    exit 1
fi

# Afficher la configuration (sans les secrets)
echo "📊 Configuration:"
echo "  - PHP_ENV: ${PHP_ENV:-production}"
echo "  - DB_HOST: ${DB_HOST}"
echo "  - DB_NAME: ${DB_NAME}"
echo "  - DB_USER: ${DB_USER}"

# Créer les répertoires nécessaires avec les bonnes permissions
mkdir -p /var/www/html/api/logs
mkdir -p /var/www/html/api/uploads
mkdir -p /var/www/html/api/cache
chmod -R 755 /var/www/html/api

# Tester la connexion à la base de données
echo "🔍 Testing database connection..."
php -r "
    try {
        \$pdo = new PDO(
            'mysql:host=${DB_HOST};port=${DB_PORT:-3306};dbname=${DB_NAME}',
            '${DB_USER}',
            '${DB_PASS}',
            [PDO::ATTR_TIMEOUT => 5]
        );
        echo '✅ Database connection successful\n';
    } catch (Exception \$e) {
        echo '❌ Database connection failed: ' . \$e->getMessage() . '\n';
        echo '⚠️  Backend will start but database features may not work\n';
    }
" || true

# Démarrer PHP-FPM en arrière-plan
echo "🔧 Starting PHP-FPM..."
php-fpm -D

# Démarrer Nginx en premier plan
echo "🌐 Starting Nginx..."
exec nginx -g 'daemon off;'
