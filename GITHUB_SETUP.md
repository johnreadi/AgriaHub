# 🚀 Guide de Publication sur GitHub - AGRIA HUB

## 📋 Étapes de Configuration

### 1. Créer le Dépôt sur GitHub
1. Allez sur [github.com](https://github.com) et connectez-vous
2. Cliquez sur **"New"** ou **"+"** → **"New repository"**
3. Configurez :
   - **Nom :** `agria-hub`
   - **Description :** `🍽️ AGRIA HUB - Restaurant Administratif PWA avec IA intégrée`
   - **Visibilité :** Public ou Private
   - ⚠️ **NE PAS** cocher "Add README" (déjà présent)
4. Cliquez sur **"Create repository"**

### 2. Commandes à Exécuter

Après création du dépôt GitHub, exécutez ces commandes dans PowerShell :

```powershell
# Naviguer vers le dossier AgriaHub (si pas déjà fait)
cd C:\Users\READI\Desktop\agria1\AgriaHub

# Ajouter l'origine GitHub (remplacez VOTRE_USERNAME par votre nom d'utilisateur GitHub)
git remote add origin https://github.com/VOTRE_USERNAME/agria-hub.git

# Renommer la branche principale en 'main' (standard GitHub)
git branch -M main

# Pousser le code vers GitHub
git push -u origin main
```

### 3. Exemple Complet

Si votre nom d'utilisateur GitHub est `monusername`, les commandes seraient :

```powershell
git remote add origin https://github.com/monusername/agria-hub.git
git branch -M main
git push -u origin main
```

## 🔐 Authentification GitHub

### Option 1 : Token Personnel (Recommandé)
1. Allez dans **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Cliquez **"Generate new token (classic)"**
3. Sélectionnez les permissions : `repo`, `workflow`
4. Copiez le token généré
5. Utilisez le token comme mot de passe lors du push

### Option 2 : GitHub CLI
```powershell
# Installer GitHub CLI (si pas déjà fait)
winget install GitHub.cli

# Se connecter
gh auth login

# Pousser avec GitHub CLI
gh repo create agria-hub --public --source=. --remote=origin --push
```

## 📁 Structure du Dépôt

Votre dépôt GitHub contiendra :

```
agria-hub/
├── 📄 README.md                    # Documentation principale
├── 📄 DEPLOYMENT.md                # Guide de déploiement
├── 📄 IDENTIFIANTS_ADMIN.md        # Identifiants par défaut
├── 📄 .gitignore                   # Fichiers à ignorer
├── 📄 .env.example                 # Variables d'environnement
├── 📄 docker-compose.yml           # Configuration Docker
├── 📄 package.json                 # Scripts npm
├── 🗂️ backend/                     # API PHP
├── 🗂️ frontend/                    # Application React PWA
├── 🗂️ config/                      # Configurations serveur
├── 🗂️ scripts/                     # Scripts d'automatisation
└── 🗂️ docs/                        # Documentation technique
```

## ✅ Vérification

Après le push, vérifiez sur GitHub :
1. **Tous les fichiers** sont présents
2. **README.md** s'affiche correctement
3. **Pas de fichiers sensibles** (.env, secrets)
4. **Badges et description** sont visibles

## 🔄 Commandes Futures

Pour les mises à jour futures :

```powershell
# Ajouter les modifications
git add .

# Commit avec message
git commit -m "✨ Nouvelle fonctionnalité ou correction"

# Pousser vers GitHub
git push
```

## 🏷️ Tags et Releases

Pour créer une release :

```powershell
# Créer un tag
git tag -a v1.0.0 -m "🚀 Version 1.0.0 - Release initiale"

# Pousser le tag
git push origin v1.0.0
```

## 🛡️ Sécurité

### Fichiers Protégés par .gitignore
- ✅ `.env` et variants
- ✅ `node_modules/`
- ✅ `vendor/`
- ✅ `*.log`
- ✅ `database.db`
- ✅ `uploads/`

### À Vérifier
- 🔍 Aucun mot de passe en dur
- 🔍 Aucune clé API exposée
- 🔍 Fichiers de configuration sensibles exclus

---

**📞 Support :** En cas de problème, consultez la [documentation GitHub](https://docs.github.com/fr) ou les logs d'erreur.