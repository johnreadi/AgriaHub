# 🚀 Guide Configuration Dokploy - Solution Définitive

## ❌ Problème Persistant

Dokploy continue d'utiliser **Nixpacks** au lieu de **Docker Compose** à cause de la détection automatique du `package.json`.

## ✅ Solutions Appliquées (Nouvelles)

### 1. **Désactivation Complète de Nixpacks**

#### Fichier `nixpacks.toml` modifié :
```toml
# DÉSACTIVE la détection automatique
[providers]
node = false
npm = false

[phases.setup]
nixPkgs = ["docker", "docker-compose"]

[phases.start]
cmd = "docker-compose up -d --build"
```

#### `package.json` renommé temporairement :
- `package.json` → `package.json.bak`
- Empêche la détection automatique Node.js

### 2. **Configuration Dokploy Recommandée**

#### Option A : Application Docker Compose (RECOMMANDÉ)
```
Type d'Application : Docker Compose
Source : GitHub Repository
Repository URL : https://github.com/VOTRE_USERNAME/agria-hub.git
Branch : main
Build Path : /
Docker Compose File : docker-compose.yml
```

#### Option B : Application Docker
```
Type d'Application : Docker
Source : GitHub Repository  
Repository URL : https://github.com/VOTRE_USERNAME/agria-hub.git
Branch : main
Dockerfile : Dockerfile (nouveau fichier créé)
```

### 3. **Variables d'Environnement Dokploy**

Dans l'interface Dokploy, ajoutez :
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
JWT_SECRET=votre_jwt_secret_securise_aleatoire

# Docker
COMPOSE_PROJECT_NAME=agriahub
DOCKER_BUILDKIT=1
```

## 🔧 Étapes de Redéploiement

### 1. Commit des Changements
```bash
cd AgriaHub
git add .
git commit -m "fix: Force Docker Compose, désactive Nixpacks complètement"
git push origin main
```

### 2. Configuration dans Dokploy

#### Méthode 1 : Recréer l'Application (RECOMMANDÉ)
1. **Supprimer** l'application actuelle dans Dokploy
2. **Créer une nouvelle application** :
   - Nom : `agria-hub-production`
   - Type : **Docker Compose** (pas Nixpacks)
   - Source : GitHub Repository
   - URL : `https://github.com/VOTRE_USERNAME/agria-hub.git`

#### Méthode 2 : Modifier l'Application Existante
1. Aller dans **Settings** de votre application
2. Changer **Build Type** de `Nixpacks` vers `Docker Compose`
3. **Build Path** : `/`
4. **Docker Compose File** : `docker-compose.yml`

### 3. Vérification des Fichiers

Assurez-vous que ces fichiers sont présents :
- ✅ `docker-compose.yml` - Configuration principale
- ✅ `Dockerfile.backend` - Image PHP/Apache  
- ✅ `Dockerfile.frontend` - Image React/Nginx
- ✅ `Dockerfile` - Image principale (nouveau)
- ✅ `nixpacks.toml` - Configuration anti-Nixpacks
- ✅ `.dockerignore` - Optimisation build
- ✅ `Procfile` - Commande de démarrage
- ❌ `package.json` - Temporairement désactivé (`.bak`)

## 🎯 Résultat Attendu

Après ces modifications, Dokploy devrait :
1. ✅ **Ignorer** la détection Nixpacks/Node.js
2. ✅ **Utiliser** Docker Compose directement
3. ✅ **Construire** les images selon les Dockerfiles
4. ✅ **Démarrer** les services (backend, frontend, base de données)

## 🔍 Diagnostic en Cas d'Échec

### Si l'erreur persiste :

1. **Vérifiez le type d'application dans Dokploy**
   - Doit être `Docker Compose` et non `Nixpacks`

2. **Logs de déploiement**
   - Recherchez "Nixpacks" dans les logs
   - Si présent → le type n'est pas correctement configuré

3. **Fichiers détectés**
   - Dokploy ne devrait plus voir `package.json`
   - Devrait détecter `docker-compose.yml`

### Commandes de vérification :
```bash
# Vérifier la structure
ls -la docker-compose.yml Dockerfile* nixpacks.toml

# Vérifier que package.json est masqué
ls -la package.json*
```

## 📞 Support

Si le problème persiste après ces étapes :
1. Partagez les **logs complets** de Dokploy
2. Confirmez le **type d'application** configuré
3. Vérifiez la **branche GitHub** utilisée

---

**🎯 Cette configuration devrait définitivement résoudre l'erreur Nixpacks !**