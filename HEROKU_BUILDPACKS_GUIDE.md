# Guide de Configuration Heroku Buildpacks pour AgriaHub

## 🎯 Problème Résolu

Heroku Buildpacks ne peut pas gérer Docker Compose avec plusieurs services (frontend, backend, base de données). Cette solution transforme AgriaHub en une application Node.js monolithique compatible avec Heroku Buildpacks.

## 🔧 Solution Implémentée

### 1. Architecture Simplifiée

- **Serveur Node.js** (`server.js`) : Sert les fichiers React et proxie l'API
- **Frontend React** : Build statique servi par Express
- **Backend PHP** : Optionnel via proxy ou API mock

### 2. Fichiers Modifiés/Créés

#### ✅ `package.json`
```json
{
  "scripts": {
    "start": "node server.js",
    "heroku-postbuild": "npm run build:frontend"
  },
  "dependencies": {
    "express": "^4.18.2",
    "http-proxy-middleware": "^2.0.6"
  }
}
```

#### ✅ `server.js` (Nouveau)
- Serveur Express qui sert les fichiers React
- Proxy pour l'API PHP (si configurée)
- API mock pour les tests
- Health check endpoint

#### ✅ `Procfile`
```
web: node server.js
```

#### ✅ `app.json` (Nouveau)
Configuration Heroku avec variables d'environnement et addons.

## 🚀 Déploiement avec Heroku Buildpacks

### Étapes dans Dokploy

1. **Type de Build** : Sélectionnez `Heroku Buildpacks`
2. **Variables d'environnement** :
   ```
   NODE_ENV=production
   NPM_CONFIG_PRODUCTION=false
   PHP_API_URL=https://votre-api-php.com (optionnel)
   REACT_APP_API_URL=/api
   ```

3. **Port** : Dokploy assignera automatiquement le port via `process.env.PORT`

### Commandes de Déploiement

```bash
# Commit des changements
git add .
git commit -m "Configure for Heroku Buildpacks deployment"

# Push vers votre repository
git push origin main
```

## 🔍 Fonctionnement

### Avec Backend PHP Configuré
```
Utilisateur → Node.js Server → Proxy → Backend PHP
                ↓
            Fichiers React (statiques)
```

### Sans Backend PHP (Mode Mock)
```
Utilisateur → Node.js Server → API Mock (réponses de test)
                ↓
            Fichiers React (statiques)
```

## 📊 Endpoints Disponibles

- `/` : Application React
- `/api/*` : Proxy vers PHP ou API mock
- `/health` : Status de l'application

## ⚙️ Variables d'Environnement

| Variable | Description | Requis |
|----------|-------------|---------|
| `PORT` | Port du serveur (auto-assigné) | ✅ |
| `NODE_ENV` | Environment (production) | ✅ |
| `PHP_API_URL` | URL du backend PHP | ❌ |
| `REACT_APP_API_URL` | URL API pour React | ✅ |

## 🔧 Configuration Dokploy Recommandée

### Build Type
- ✅ **Heroku Buildpacks** (sélectionné)
- ❌ Docker Compose (ne fonctionne pas)
- ❌ Dockerfile (complexe pour multi-services)

### Resources
- **Memory** : 512MB minimum
- **CPU** : 0.5 vCPU minimum

## 🐛 Diagnostic

### Si le site ne se charge pas :

1. **Vérifiez les logs** :
   ```bash
   # Dans Dokploy, consultez les logs de l'application
   ```

2. **Testez le health check** :
   ```
   https://votre-app.dokploy.com/health
   ```

3. **Vérifiez les variables d'environnement** dans Dokploy

### Erreurs Communes

#### "Application not available"
- Le build React a échoué
- Vérifiez que `frontend/dist` existe après le build

#### "API temporarily unavailable"
- `PHP_API_URL` configurée mais inaccessible
- Laissez vide pour utiliser l'API mock

#### "Cannot GET /"
- Le serveur Node.js ne démarre pas
- Vérifiez les dépendances dans `package.json`

## 🎯 Résultat Attendu

✅ **Déploiement réussi** avec Heroku Buildpacks
✅ **Site accessible** sur l'URL Dokploy
✅ **Frontend React** fonctionnel
✅ **API mock** pour les tests (si pas de backend PHP)

## 🔄 Migration vers Docker Compose

Si vous voulez revenir à Docker Compose plus tard :

1. Changez le type de build vers `Docker Compose`
2. Restaurez les fichiers Docker originaux
3. Utilisez le guide `DOKPLOY_CONFIGURATION_GUIDE.md`

## 📝 Notes Importantes

- Cette solution est **monolithique** (tout dans Node.js)
- **Idéale pour les déploiements simples** avec Heroku Buildpacks
- **Évolutive** : peut être étendue avec une vraie API
- **Compatible** avec les limitations de Dokploy Heroku Buildpacks