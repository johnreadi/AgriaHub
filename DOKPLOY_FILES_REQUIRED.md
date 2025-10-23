# 📋 Fichiers Requis pour Dokploy - Service Application

## 🎯 Fichiers OBLIGATOIRES pour Dokploy

### 📄 Fichiers de Configuration Principal
```
AgriaHub/
├── 📄 docker-compose.yml          ⭐ ESSENTIEL - Configuration des services
├── 📄 .env.example               ⭐ ESSENTIEL - Variables d'environnement
├── 📄 Dockerfile.backend         ⭐ ESSENTIEL - Image Docker backend
├── 📄 Dockerfile.frontend        ⭐ ESSENTIEL - Image Docker frontend
└── 📄 package.json               ⭐ ESSENTIEL - Scripts de build
```

### 🗂️ Dossiers OBLIGATOIRES
```
├── 🗂️ backend/                   ⭐ ESSENTIEL - API PHP complète
├── 🗂️ frontend/                  ⭐ ESSENTIEL - Application React PWA
├── 🗂️ config/                    ⭐ ESSENTIEL - Configurations serveur
└── 🗂️ scripts/                   🔧 RECOMMANDÉ - Scripts d'automatisation
```

## 🚀 Configuration dans Dokploy

### 1. Service Application - Paramètres
- **Type :** `Docker Compose`
- **Source :** `GitHub Repository`
- **Repository URL :** `https://github.com/VOTRE_USERNAME/agria-hub.git`
- **Branch :** `main`
- **Build Path :** `/` (racine du projet)

### 2. Fichiers Détectés Automatiquement
Dokploy détectera automatiquement :
- ✅ `docker-compose.yml` → Configuration des services
- ✅ `Dockerfile.backend` → Build de l'API PHP
- ✅ `Dockerfile.frontend` → Build de l'app React
- ✅ `package.json` → Scripts npm disponibles

### 3. Variables d'Environnement à Configurer
Basées sur `.env.example` :

```env
# Base de données
DB_HOST=db5018629781.hosting-data.io
DB_NAME=dbs14768810
DB_USER=dbu3279635
DB_PASS=Resto.AgriaRouen76100

# Domaine
DOMAIN=mobile.agriarouen.fr
SSL_EMAIL=admin@agria-rouen.fr

# IA
GEMINI_API_KEY=AIzaSyAKMJDkoitiEgTGGWQC6z5VLr9re7NhiQs

# Sécurité
JWT_SECRET=votre_jwt_secret_securise
```

## 📁 Structure Complète Requise

### Backend (API PHP)
```
backend/
├── 📄 database.sql               ⭐ Base de données
├── 🗂️ api/                       ⭐ Endpoints API
│   ├── auth.php                  → Authentification
│   ├── gemini.php                → Intelligence artificielle
│   ├── menu.php                  → Gestion menus
│   └── config.php                → Configuration
├── 🗂️ public/                    ⭐ Point d'entrée web
└── 📄 .htaccess                  → Règles Apache
```

### Frontend (React PWA)
```
frontend/
├── 📄 package.json               ⭐ Dépendances React
├── 📄 vite.config.ts             ⭐ Configuration Vite
├── 📄 index.html                 ⭐ Point d'entrée
├── 🗂️ src/                       ⭐ Code source React
├── 🗂️ public/                    ⭐ Assets statiques
│   ├── manifest.json             → Configuration PWA
│   ├── sw.js                     → Service Worker
│   └── icons/                    → Icônes PWA
└── 📄 tsconfig.json              → Configuration TypeScript
```

### Configuration Serveur
```
config/
├── 📄 nginx.conf                 ⭐ Configuration Nginx
├── 📄 nginx-backend.conf         ⭐ Proxy backend
├── 📄 supervisord.conf           ⭐ Gestion processus
├── 📄 mysql.cnf                  → Configuration MySQL
├── 📄 traefik.yml                → Load balancer
└── 📄 dokploy.config.yml         → Config Dokploy
```

## ⚠️ Fichiers à NE PAS Inclure

### Exclus par .gitignore
```
❌ .env                           → Secrets locaux
❌ node_modules/                  → Dépendances npm
❌ vendor/                        → Dépendances PHP
❌ *.log                          → Fichiers de logs
❌ database.db                    → Base SQLite locale
❌ uploads/                       → Fichiers uploadés
```

## 🔧 Scripts Disponibles

### Via package.json
```json
{
  "scripts": {
    "build": "./scripts/build.sh",
    "deploy": "./scripts/deploy.sh",
    "backup": "./scripts/backup.sh",
    "monitor": "./scripts/monitor.sh"
  }
}
```

### Scripts Shell
```
scripts/
├── 📄 build.sh                  → Build complet
├── 📄 deploy.sh                 → Déploiement
├── 📄 backup.sh                 → Sauvegarde
└── 📄 monitor.sh                → Monitoring
```

## 🎯 Résumé pour Dokploy

### Fichiers Minimum Requis
1. **`docker-compose.yml`** - Configuration des services
2. **`Dockerfile.backend`** - Image PHP/Apache
3. **`Dockerfile.frontend`** - Image Node.js/Nginx
4. **`.env.example`** - Template des variables
5. **`backend/`** - Code API PHP complet
6. **`frontend/`** - Code React PWA complet
7. **`config/`** - Configurations serveur

### Total : ~89 fichiers
- **Backend :** ~45 fichiers (API, config, docs)
- **Frontend :** ~35 fichiers (React, PWA, assets)
- **Config :** ~6 fichiers (serveur, Docker)
- **Scripts :** ~4 fichiers (automatisation)

## 📞 Vérification

Avant le déploiement, vérifiez que ces fichiers sont présents :
```bash
# Fichiers essentiels
ls -la docker-compose.yml
ls -la Dockerfile.*
ls -la .env.example
ls -la package.json

# Dossiers essentiels
ls -la backend/
ls -la frontend/
ls -la config/
```

---

**💡 Conseil :** Dokploy utilisera automatiquement `docker-compose.yml` comme point d'entrée et construira les images selon les Dockerfiles spécifiés.