# Guide de Déploiement Dokploy - AGRIA Hub

## 🎯 Objectif

Ce guide vous accompagne pas à pas pour déployer AGRIA Hub sur votre instance Dokploy.

## 📋 Prérequis

### Côté serveur
- Instance Dokploy fonctionnelle
- Docker et Docker Compose installés
- Domaine configuré (ex: mobile.agriarouen.fr)
- Certificats SSL (Let's Encrypt recommandé)

### Côté développement
- Dossier AgriaHub préparé
- Variables d'environnement configurées
- Build de l'application effectué

## 🔐 Configuration des Identifiants

### Identifiants par Défaut
Après le déploiement, vous pouvez vous connecter avec :
- **Email :** `admin@agria-rouen.fr`
- **Mot de passe :** `admin123`

> ⚠️ **SÉCURITÉ CRITIQUE :** Changez immédiatement ces identifiants après votre première connexion !

### Configuration IA
L'application intègre l'intelligence artificielle Gemini :
- **API Key :** Configurée via `GEMINI_API_KEY` dans les variables d'environnement
- **Modèle :** `gemini-2.5-flash` (par défaut)
- **Fonctionnalités :** Chatbot, assistance contextuelle, historique de conversation

### Fonctionnalités PWA
L'application est une **Progressive Web App** avec :
- Design responsive (mobile, tablette, desktop)
- Installation native possible
- Mode hors-ligne avec cache intelligent
- Notifications push
- Service Worker pour les performances

## 🚀 Étapes de Déploiement

### 1. Préparation de l'environnement

#### 1.1 Configuration des variables d'environnement

```bash
# Copiez le fichier d'exemple
cp .env.example .env

# Éditez avec vos valeurs
nano .env
```

**Variables critiques à configurer :**

```bash
# Base de données
DB_NAME=agria_production
DB_USER=agria_user
DB_PASS=VotreMotDePasseSecurise123!

# Sécurité
JWT_SECRET=VotreCleJWTTresLongueEtSecurisee456!

# Domaine
DOMAIN=mobile.agriarouen.fr
SSL_EMAIL=admin@agriarouen.fr

# API Gemini (optionnel)
GEMINI_API_KEY=votre_cle_api_gemini
```

#### 1.2 Build de l'application

```bash
# Build complet
npm run build:all

# Ou avec le script bash
./scripts/build.sh all
```

### 2. Upload vers GitHub

#### 2.1 Initialisation du repository

```bash
# Dans le dossier AgriaHub
git init
git add .
git commit -m "Initial commit - AGRIA Hub production ready"

# Ajout du remote GitHub
git remote add origin https://github.com/votre-username/agria-hub.git
git push -u origin main
```

#### 2.2 Vérification du repository

Assurez-vous que tous les fichiers sont présents :
- ✅ `docker-compose.yml`
- ✅ `Dockerfile.frontend`
- ✅ `Dockerfile.backend`
- ✅ `.env.example`
- ✅ `config/dokploy.config.yml`
- ✅ Dossiers `frontend/` et `backend/`

### 3. Configuration dans Dokploy

#### 3.1 Création du projet

1. Connectez-vous à votre interface Dokploy
2. Cliquez sur **"Nouveau Projet"**
3. Remplissez les informations :
   - **Nom** : `agria-hub`
   - **Description** : `Application AGRIA Hub - Gestion agricole`
   - **Repository** : `https://github.com/votre-username/agria-hub.git`
   - **Branche** : `main`

#### 3.2 Configuration des applications

**Frontend :**
- **Type** : Static/Docker
- **Dockerfile** : `Dockerfile.frontend`
- **Port** : `8080`
- **Domaine** : `mobile.agriarouen.fr`

**Backend :**
- **Type** : Docker
- **Dockerfile** : `Dockerfile.backend`
- **Port** : `9000`
- **Path** : `/api`

#### 3.3 Configuration de la base de données

1. Allez dans **"Bases de données"**
2. Créez une nouvelle base MySQL :
   - **Nom** : `agria-database`
   - **Version** : `8.0`
   - **Base** : `agria_production`
   - **Utilisateur** : `agria_user`
   - **Mot de passe** : (celui de votre .env)

#### 3.4 Configuration des variables d'environnement

Dans Dokploy, ajoutez les variables suivantes :

```
NODE_ENV=production
PHP_ENV=production
DB_HOST=agria-database
DB_NAME=agria_production
DB_USER=agria_user
DB_PASS=VotreMotDePasseSecurise123!
JWT_SECRET=VotreCleJWTTresLongueEtSecurisee456!
DOMAIN=mobile.agriarouen.fr
GEMINI_API_KEY=votre_cle_api_gemini
```

### 4. Déploiement

#### 4.1 Premier déploiement

1. Dans Dokploy, allez sur votre projet
2. Cliquez sur **"Déployer"**
3. Attendez la fin du build (5-10 minutes)
4. Vérifiez les logs en cas d'erreur

#### 4.2 Configuration SSL

1. Allez dans **"Domaines"**
2. Ajoutez votre domaine : `mobile.agriarouen.fr`
3. Activez **Let's Encrypt**
4. Attendez la génération du certificat

#### 4.3 Vérification du déploiement

```bash
# Test de l'application
curl https://mobile.agriarouen.fr

# Test de l'API
curl https://mobile.agriarouen.fr/api/health

# Vérification SSL
curl -I https://mobile.agriarouen.fr
```

### 5. Configuration avancée

#### 5.1 Monitoring

Activez le monitoring dans Dokploy :
- **Métriques** : CPU, Mémoire, Disque
- **Alertes** : Email, Slack
- **Logs** : Centralisation et rétention

#### 5.2 Sauvegardes

Configurez les sauvegardes automatiques :
- **Fréquence** : Quotidienne à 3h00
- **Rétention** : 30 jours
- **Destination** : S3 (optionnel)

#### 5.3 Scaling

Configuration du scaling automatique :
- **Frontend** : 1-3 instances
- **Backend** : 1-5 instances
- **Seuil CPU** : 70-80%

### 6. Maintenance

#### 6.1 Mise à jour de l'application

```bash
# Sur votre machine de développement
git add .
git commit -m "Update: nouvelle fonctionnalité"
git push origin main

# Dans Dokploy, cliquez sur "Redéployer"
```

#### 6.2 Sauvegarde manuelle

```bash
# Depuis votre serveur
./scripts/backup.sh all
```

#### 6.3 Monitoring

```bash
# Vérification du statut
./scripts/monitor.sh status

# Vérification de la santé
./scripts/monitor.sh health
```

## 🚨 Dépannage

### Problèmes courants

#### 1. Erreur de build Docker

**Symptôme** : Le build échoue dans Dokploy

**Solution** :
```bash
# Vérifiez les Dockerfiles localement
docker build -f Dockerfile.frontend -t test-frontend .
docker build -f Dockerfile.backend -t test-backend .
```

#### 2. Base de données inaccessible

**Symptôme** : Erreur de connexion DB

**Solution** :
1. Vérifiez les variables d'environnement
2. Vérifiez que la base de données est démarrée
3. Testez la connectivité réseau

#### 3. Certificat SSL non généré

**Symptôme** : Site accessible en HTTP uniquement

**Solution** :
1. Vérifiez la configuration DNS
2. Vérifiez que le port 80 est accessible
3. Relancez la génération Let's Encrypt

#### 4. Application lente

**Symptôme** : Temps de réponse élevés

**Solution** :
1. Vérifiez les ressources (CPU/RAM)
2. Activez le cache Redis
3. Optimisez les requêtes DB

### Logs utiles

```bash
# Logs de l'application
docker logs agria-hub_frontend
docker logs agria-hub_backend

# Logs de la base de données
docker logs agria-hub_database

# Logs Nginx/Traefik
docker logs traefik
```

## 📞 Support

### En cas de problème

1. **Vérifiez les logs** dans Dokploy
2. **Consultez la documentation** : README.md
3. **Testez localement** avec Docker Compose
4. **Contactez le support** : admin@agriarouen.fr

### Ressources utiles

- [Documentation Dokploy](https://dokploy.com/docs)
- [Guide Docker](https://docs.docker.com/)
- [Configuration Nginx](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/docs/)

## ✅ Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Build de l'application réussi
- [ ] Repository GitHub créé et pushé
- [ ] Projet Dokploy créé
- [ ] Applications configurées
- [ ] Base de données créée
- [ ] Variables d'environnement ajoutées
- [ ] Premier déploiement réussi
- [ ] SSL configuré et fonctionnel
- [ ] Tests de fonctionnement OK
- [ ] Monitoring activé
- [ ] Sauvegardes configurées

---

**Félicitations !** 🎉 Votre application AGRIA Hub est maintenant déployée en production avec Dokploy.