# 📁 Liste des Fichiers à Transférer sur IONOS

## 🎯 Résumé Exécutif

**Total des fichiers à transférer :** ~25 fichiers principaux  
**Taille estimée :** ~5-10 MB  
**Temps de transfert estimé :** 10-15 minutes via FTP

---

## 📂 1. FICHIERS FRONTEND 

### 🎯 **IMPORTANT : Utiliser le dossier `dist/` (PAS `public/`)**

⚠️ **Attention :** Il y a 3 dossiers différents :
- `agria1/public/` - Fichiers statiques de développement (❌ NE PAS UTILISER)
- `agria1/IONOS/public/` - Copie de travail (❌ NE PAS UTILISER) 
- `agria1/dist/` - **✅ FICHIERS COMPILÉS À TRANSFÉRER**

### 🌐 Application Web Compilée (Dossier `dist/`)
- **📄 `index.html`** - Page principale de l'application React compilée
- **📁 `assets/`** - Dossier contenant tous les fichiers CSS, JS et images compilés et optimisés
- **📁 `icons/`** - Icônes de l'application (PWA)
- **📄 `favicon.ico`** - Icône du site
- **📄 `robots.txt`** - Configuration SEO
- **📄 `sitemap.xml`** - Plan du site
- **📄 `browserconfig.xml`** - Configuration navigateur
- **📄 `performance.js`** - Script de performance

**📍 Destination IONOS :** Racine du domaine (`/` ou `/public_html/`)

---

## 🔧 2. FICHIERS API (Dossier `IONOS/api/`)

⚠️ **Important :** Les fichiers API se trouvent dans `agria1/IONOS/api/` (pas à la racine)

### 🔑 Fichiers de Configuration
- **⚙️ `config.php`** - Configuration base de données et sécurité (MODIFIÉ)
- **🛡️ `Security.php`** - Classe de sécurité et validation
- **🗄️ `database.php`** - Fonctions de base de données (MODIFIÉ)

### 🌐 Endpoints API
- **🔐 `auth.php`** - Authentification (login, register, logout) ✅ **CORRIGÉ - Fonctions SQLite**
- **👥 `users.php`** - Gestion des utilisateurs et cartes de fidélité
- **📧 `newsletter.php`** - Gestion newsletter et campagnes
- **💬 `conversations.php`** - Système de messagerie
- **🍽️ `menu.php`** - Gestion des menus et plats

### 🛠️ Fichiers de Support
- **📄 `index.php`** - Page de test API (CRÉÉ)
- **⚙️ `.htaccess`** - Configuration API et routage (MODIFIÉ)

### 🧪 Fichiers de Test (Optionnels)
- **🔍 `hello.php`** - Test ultra-simple (CRÉÉ)
- **ℹ️ `info.php`** - Configuration PHP (CRÉÉ)
- **🔧 `basic_test.php`** - Test complet (CRÉÉ)
- **🚨 `debug_500.php`** - Debug erreur 500 (CRÉÉ)

**📍 Source :** `agria1/IONOS/api/`  
**📍 Destination IONOS :** Sous-dossier `/api/`

---

## 🗄️ 3. BASE DE DONNÉES

### 📊 Script SQL Principal
- **🗃️ `database.sql`** - Script complet de création de base de données (436 lignes)
  - Tables utilisateurs, menus, newsletter, conversations
  - Index et optimisations
  - Données de démonstration

### 👤 Scripts Administrateur
- **🔐 `create_admin.sql`** - Script d'insertion admin ✅ **CRÉÉ**
- **🧪 `test_password.php`** - Test des mots de passe (CRÉÉ)

**📍 Destination IONOS :** À importer via phpMyAdmin

---

## 📋 4. DOCUMENTATION ET GUIDES

### 📖 Guides de Déploiement
- **📘 `GUIDE_DEPLOIEMENT.md`** - Guide complet (285 lignes) (CRÉÉ)
- **📗 `README.md`** - Documentation principale (137 lignes) (CRÉÉ)
- **🔐 `GUIDE_IDENTIFIANTS_ADMIN.md`** - Guide admin (142 lignes) (CRÉÉ)

### 🚨 Résolution de Problèmes
- **🛠️ `RESOLUTION_ERREUR_500.md`** - Guide erreur 500 (88 lignes) (CRÉÉ)
- **📋 `LISTE_FICHIERS_TRANSFERT.md`** - Ce fichier (CRÉÉ)

**📍 Destination IONOS :** Dossier racine (pour référence)

---

## ⚙️ 5. FICHIERS DE CONFIGURATION

### 🔧 Configuration Apache
- **📄 `api/.htaccess_ionos`** - Version compatible IONOS (CRÉÉ)
- **📄 `public/.htaccess_ionos`** - Version compatible IONOS (CRÉÉ)
- **📄 `router.php`** - Routeur PHP ✅ **CORRIGÉ - Redirection auth.php**

**📍 Source :** `agria1/IONOS/`  
**📍 Destination IONOS :** Racine et sous-dossier `/api/`

### 🔒 Fichiers de Sécurité
- **🛡️ `.htaccess_backup`** - Sauvegarde configuration originale
- **⚙️ `.htaccess_minimal`** - Configuration minimale

**📍 Destination IONOS :** Renommer en `.htaccess` après test

---

## 🚀 ORDRE DE TRANSFERT RECOMMANDÉ

### 1️⃣ **Phase 1 : Base de Données**
```
1. database.sql → Importer via phpMyAdmin
2. create_admin.sql → Exécuter après l'import principal
```

### 2️⃣ **Phase 2 : API Backend (Dossier `IONOS/api/`)**
```
1. IONOS/api/config.php
2. IONOS/api/database.php
3. IONOS/api/Security.php
4. IONOS/api/auth.php ✅ CORRIGÉ
5. IONOS/api/users.php
6. IONOS/api/newsletter.php
7. IONOS/api/conversations.php
8. IONOS/api/menu.php
9. IONOS/api/index.php (test)
10. IONOS/router.php ✅ CORRIGÉ
```

### 3️⃣ **Phase 3 : Configuration Apache**
```
1. api/.htaccess_ionos → Renommer en .htaccess
2. Tester les endpoints API
```

### 4️⃣ **Phase 4 : Frontend (Dossier `dist/`)**
```
1. dist/index.html → Racine IONOS
2. dist/assets/ → Copier tout le dossier vers /assets/
3. dist/icons/ → Copier tout le dossier vers /icons/
4. dist/favicon.ico
5. dist/robots.txt
6. dist/sitemap.xml
7. dist/browserconfig.xml
8. dist/performance.js
9. Créer .htaccess pour SPA (voir guide)
```

### 5️⃣ **Phase 5 : Documentation**
```
1. README.md
2. GUIDE_DEPLOIEMENT.md
3. GUIDE_IDENTIFIANTS_ADMIN.md
4. Autres guides (optionnel)
```

---

## ⚠️ FICHIERS À NE PAS TRANSFÉRER

### 🚫 Fichiers de Développement
- `node_modules/` - Dépendances Node.js
- `src/` - Code source React non compilé
- `.env` - Variables d'environnement (déjà intégrées dans config.php)
- `package.json` - Configuration Node.js
- `vite.config.js` - Configuration Vite

### 🚫 Fichiers Système
- `.git/` - Historique Git
- `.gitignore` - Configuration Git
- `*.log` - Fichiers de logs locaux

---

## 🔍 VÉRIFICATIONS POST-TRANSFERT

### ✅ Tests à Effectuer
1. **Base de données** : Connexion via test-db.php
2. **API** : Test des endpoints principaux
3. **Frontend** : Chargement de l'application
4. **Authentification** : Login admin
5. **Sécurité** : Vérification des .htaccess

### 📊 URLs de Test
```
https://votre-domaine.fr/ → Application principale
https://votre-domaine.fr/api/ → Page de test API
https://votre-domaine.fr/api/auth → Endpoint authentification
https://votre-domaine.fr/api/users → Endpoint utilisateurs
```

---

## 📞 Support

En cas de problème lors du transfert :
1. Consultez `GUIDE_DEPLOIEMENT.md` pour les instructions détaillées
2. Vérifiez `RESOLUTION_ERREUR_500.md` pour les erreurs courantes
3. Contactez le support IONOS si nécessaire

---

**📅 Créé le :** $(date)  
**🔄 Version :** 1.0  
**✅ Statut :** Prêt pour transfert IONOS