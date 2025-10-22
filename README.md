# 🍽️ AGRIA HUB - Restaurant Administratif

Application web moderne **PWA (Progressive Web App)** pour la gestion d'un restaurant administratif avec interface utilisateur intuitive, intelligence artificielle intégrée et système de gestion complet.

## ✨ Fonctionnalités Principales

### 📱 Progressive Web App (PWA)
- **Responsive Design** : Optimisé pour mobile, tablette et desktop
- **Installation Native** : Peut être installée comme une application
- **Mode Hors-ligne** : Fonctionne sans connexion internet
- **Notifications Push** : Alertes en temps réel
- **Cache Intelligent** : Performance optimisée

### 🤖 Intelligence Artificielle
- **Chatbot Intégré** : Assistant IA avec Gemini API
- **Assistance Contextuelle** : Aide personnalisée pour les utilisateurs
- **Historique de Conversation** : Mémorisation des interactions
- **Instructions Système** : Comportement personnalisable de l'IA

### 🍽️ Gestion Restaurant
- **Interface Utilisateur Moderne** : Design responsive et intuitif
- **Gestion des Menus** : Création et modification des menus quotidiens
- **Système d'Actualités** : Publication et gestion des actualités
- **Gestion des Utilisateurs** : Système d'authentification et de rôles
- **API REST** : Interface de programmation complète
- **Base de Données** : Stockage sécurisé des données

## 🔐 Identifiants de Connexion par Défaut

### Administrateur Principal
- **Email :** `admin@agria-rouen.fr`
- **Mot de passe :** `admin123`
- **Rôle :** Administrateur complet

> ⚠️ **Important :** Changez ces identifiants immédiatement après le premier déploiement pour des raisons de sécurité.

### Configuration IA (Gemini)
- **API Key :** Configurée dans les variables d'environnement
- **Modèle :** `gemini-2.5-flash`
- **Endpoint :** `/api/gemini.php?action=chat`

Pour plus de détails, consultez <mcfile name="IDENTIFIANTS_ADMIN.md" path="c:\Users\READI\Desktop\agria1\AgriaHub\IDENTIFIANTS_ADMIN.md"></mcfile>

## 📋 Vue d'ensemble

AGRIA Hub est une application web moderne pour la gestion agricole, composée de :
- **Frontend** : React + TypeScript + Vite
- **Backend** : PHP 8.1 + API REST
- **Base de données** : MySQL 8.0
- **Infrastructure** : Docker + Dokploy

## 🏗️ Architecture

```
AGRIA Hub
├── Frontend (React/Vite) → Port 8080
├── Backend (PHP-FPM) → Port 9000
├── Database (MySQL) → Port 3306
├── Redis (Cache) → Port 6379
└── Traefik (Reverse Proxy) → Ports 80/443
```

## 🚀 Déploiement Rapide

### Prérequis
- Docker & Docker Compose installés
- Accès à une instance Dokploy
- Domaine configuré (ex: mobile.agriarouen.fr)

### Étapes de déploiement

1. **Configuration des variables d'environnement**
   ```bash
   cp .env.example .env
   # Éditez .env avec vos valeurs
   ```

2. **Build de l'application**
   ```bash
   npm run build:all
   # ou
   ./scripts/build.sh all
   ```

3. **Tests pré-déploiement**
   ```bash
   npm run test:production
   ```

4. **Déploiement vers Dokploy**
   ```bash
   npm run deploy:production
   # ou
   ./scripts/deploy.sh production
   ```

## 📁 Structure du Projet

```
AgriaHub/
├── frontend/                 # Application React
│   ├── src/                 # Code source
│   ├── public/              # Assets statiques
│   ├── package.json         # Dépendances npm
│   └── vite.config.ts       # Configuration Vite
├── backend/                 # API PHP
│   ├── api/                 # Endpoints API
│   ├── config/              # Configuration PHP
│   └── composer.json        # Dépendances PHP
├── config/                  # Configurations
│   ├── nginx.conf           # Configuration Nginx
│   ├── mysql.cnf            # Configuration MySQL
│   ├── dokploy.config.yml   # Configuration Dokploy
│   └── traefik.yml          # Configuration Traefik
├── scripts/                 # Scripts d'automatisation
│   ├── build.sh             # Script de build
│   ├── deploy.sh            # Script de déploiement
│   ├── backup.sh            # Script de sauvegarde
│   └── monitor.sh           # Script de monitoring
├── docker-compose.yml       # Configuration Docker
├── Dockerfile.frontend      # Image Docker frontend
├── Dockerfile.backend       # Image Docker backend
└── .env.example            # Variables d'environnement
```

## ⚙️ Configuration

### Variables d'environnement essentielles

```bash
# Base de données
DB_HOST=database
DB_NAME=agria_production
DB_USER=agria_user
DB_PASS=votre_mot_de_passe_securise

# Sécurité
JWT_SECRET=votre_jwt_secret_tres_long

# Domaine
DOMAIN=mobile.agriarouen.fr
SSL_EMAIL=admin@agriarouen.fr

# API externes
GEMINI_API_KEY=votre_cle_api_gemini
```

### Configuration Dokploy

Le fichier `config/dokploy.config.yml` contient toute la configuration nécessaire pour Dokploy :
- Applications (frontend/backend)
- Base de données MySQL
- Certificats SSL automatiques
- Monitoring et alertes
- Stratégie de déploiement

## 🐳 Docker

### Images Docker

- **Frontend** : Multi-stage build (Node.js → Nginx)
- **Backend** : PHP 8.1-FPM + Nginx + Supervisor
- **Database** : MySQL 8.0 avec configuration optimisée

### Commandes Docker utiles

```bash
# Build des images
docker-compose build

# Démarrage des services
docker-compose up -d

# Vérification des logs
docker-compose logs -f

# Arrêt des services
docker-compose down
```

## 📊 Monitoring

### Scripts de monitoring

```bash
# Statut général
./scripts/monitor.sh status

# Santé de l'application
./scripts/monitor.sh health

# Métriques détaillées
./scripts/monitor.sh metrics

# Vérification des alertes
./scripts/monitor.sh alerts
```

### Endpoints de santé

- Frontend : `https://mobile.agriarouen.fr/health`
- Backend : `https://mobile.agriarouen.fr/api/health`

## 💾 Sauvegardes

### Sauvegarde automatique

```bash
# Sauvegarde complète
./scripts/backup.sh all

# Sauvegarde base de données uniquement
./scripts/backup.sh database

# Sauvegarde fichiers uniquement
./scripts/backup.sh files
```

### Configuration S3 (optionnel)

```bash
BACKUP_S3_BUCKET=agria-backups
BACKUP_S3_ACCESS_KEY=votre_access_key
BACKUP_S3_SECRET_KEY=votre_secret_key
BACKUP_S3_REGION=eu-central-1
```

## 🔧 Scripts NPM

```json
{
  "scripts": {
    "build:frontend": "./scripts/build.sh frontend",
    "build:backend": "./scripts/build.sh backend",
    "build:all": "./scripts/build.sh all",
    "deploy:staging": "./scripts/deploy.sh staging",
    "deploy:production": "./scripts/deploy.sh production",
    "backup": "./scripts/backup.sh all",
    "monitor": "./scripts/monitor.sh status",
    "logs": "./scripts/monitor.sh logs"
  }
}
```

## 🚨 Dépannage

### Problèmes courants

1. **Erreur de connexion base de données**
   ```bash
   # Vérifier les variables d'environnement
   docker-compose exec backend env | grep DB_
   
   # Vérifier la connectivité
   docker-compose exec backend ping database
   ```

2. **Frontend non accessible**
   ```bash
   # Vérifier les logs Nginx
   docker-compose logs frontend
   
   # Vérifier la configuration
   docker-compose exec frontend nginx -t
   ```

3. **API non fonctionnelle**
   ```bash
   # Vérifier PHP-FPM
   docker-compose logs backend
   
   # Tester l'endpoint
   curl https://mobile.agriarouen.fr/api/health
   ```

### Logs importants

```bash
# Logs de tous les services
docker-compose logs -f

# Logs spécifiques
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f database
```

## 🔐 Sécurité

### Mesures de sécurité implémentées

- Certificats SSL automatiques (Let's Encrypt)
- Headers de sécurité HTTP
- Utilisateurs non-root dans les conteneurs
- Secrets chiffrés dans Dokploy
- Rate limiting sur Traefik
- Firewall et restrictions d'accès

### Bonnes pratiques

1. Changez tous les mots de passe par défaut
2. Utilisez des secrets forts (JWT, DB, etc.)
3. Activez les sauvegardes automatiques
4. Surveillez les logs régulièrement
5. Mettez à jour les dépendances

## 📞 Support

### Contacts

- **Administrateur** : admin@agriarouen.fr
- **Support technique** : support@agriarouen.fr

### Ressources

- [Documentation Dokploy](https://dokploy.com/docs)
- [Guide Docker Compose](https://docs.docker.com/compose/)
- [Configuration Nginx](https://nginx.org/en/docs/)

## 📝 Changelog

### Version 1.0.0 (2024)
- Déploiement initial
- Architecture Docker complète
- Intégration Dokploy
- Scripts d'automatisation
- Monitoring et alertes
- Sauvegardes automatiques

---

**Note** : Ce guide suppose une installation sur un serveur Linux avec Docker. Pour Windows, adaptez les chemins et commandes selon votre environnement.