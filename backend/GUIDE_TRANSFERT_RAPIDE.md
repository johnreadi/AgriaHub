# 🚀 Guide de Transfert Rapide - IONOS

## ⏱️ Transfert Express (15 minutes)

### 🎯 Fichiers Essentiels à Transférer

#### 1️⃣ **BASE DE DONNÉES** (2 minutes)
```
📁 À importer via phpMyAdmin IONOS :
├── database.sql (script principal - 436 lignes)
└── create_admin.sql (identifiants admin)
```

#### 2️⃣ **API BACKEND** (5 minutes)
```
📁 Destination : /api/
├── config.php ⭐ (MODIFIÉ - paramètres IONOS)
├── database.php ⭐ (MODIFIÉ - connexion sécurisée)
├── Security.php (classe sécurité)
├── auth.php (authentification)
├── users.php (gestion utilisateurs)
├── newsletter.php (newsletter)
├── conversations.php (messagerie)
├── menu.php (menus)
├── index.php ⭐ (CRÉÉ - page test)
└── .htaccess_ionos → renommer en .htaccess
```

#### 3️⃣ **FRONTEND WEB** (5 minutes)
```
📁 Destination : / (racine domaine)
├── index.html (application React compilée)
├── assets/ (tout le dossier CSS/JS/images)
└── .htaccess_ionos → renommer en .htaccess
```

#### 4️⃣ **DOCUMENTATION** (3 minutes)
```
📁 Destination : / (racine - pour référence)
├── README.md ⭐ (CRÉÉ)
├── GUIDE_DEPLOIEMENT.md ⭐ (CRÉÉ - guide complet)
├── GUIDE_IDENTIFIANTS_ADMIN.md ⭐ (CRÉÉ)
└── LISTE_FICHIERS_TRANSFERT.md ⭐ (CRÉÉ)
```

---

## 🔧 Procédure de Transfert FTP

### 📡 Connexion FTP IONOS
```
Serveur FTP : Voir panneau de contrôle IONOS
Utilisateur : Votre nom d'utilisateur IONOS
Mot de passe : Votre mot de passe IONOS
Port : 21 (FTP) ou 22 (SFTP)
```

### 📂 Structure de Dossiers sur IONOS
```
/ (racine du domaine)
├── index.html
├── assets/
├── .htaccess
├── api/
│   ├── config.php
│   ├── auth.php
│   ├── users.php
│   ├── [autres fichiers API]
│   └── .htaccess
└── [fichiers de documentation]
```

---

## ⚡ Commandes Rapides

### 🗄️ Import Base de Données
1. **Accès phpMyAdmin :** Panneau IONOS → Bases de données → phpMyAdmin
2. **Sélectionner la base :** `dbs14768810`
3. **Importer :** Onglet "Importer" → Choisir `database.sql`
4. **Exécuter :** Cliquer "Exécuter"
5. **Admin :** Exécuter le script `create_admin.sql`

### 🔐 Test de Connexion Admin
```
URL : https://votre-domaine.fr/
Email : admin@agria-rouen.fr
Mot de passe : Admin123!
```

### 🧪 URLs de Test
```
✅ Application : https://votre-domaine.fr/
✅ API Test : https://votre-domaine.fr/api/
✅ Auth API : https://votre-domaine.fr/api/auth
✅ Users API : https://votre-domaine.fr/api/users
```

---

## 🚨 Résolution Rapide des Problèmes

### ❌ Erreur 500 - Internal Server Error
```
🔧 Solution :
1. Vérifier que .htaccess_ionos est renommé en .htaccess
2. Tester sans .htaccess temporairement
3. Vérifier les permissions des fichiers (644 pour PHP, 755 pour dossiers)
```

### ❌ Erreur de Connexion Base de Données
```
🔧 Solution :
1. Vérifier config.php avec vos paramètres IONOS
2. Tester avec api/basic_test.php
3. Contacter support IONOS si nécessaire
```

### ❌ Application React Ne Se Charge Pas
```
🔧 Solution :
1. Vérifier que index.html est à la racine
2. Vérifier que le dossier assets/ est complet
3. Contrôler le .htaccess pour les routes SPA
```

---

## 📋 Checklist de Vérification

### ✅ Avant le Transfert
- [ ] Paramètres IONOS notés (host, database, user, password)
- [ ] Accès FTP configuré
- [ ] Sauvegarde locale effectuée

### ✅ Pendant le Transfert
- [ ] Base de données importée avec succès
- [ ] Fichiers API transférés dans /api/
- [ ] Fichiers frontend transférés à la racine
- [ ] Fichiers .htaccess renommés correctement

### ✅ Après le Transfert
- [ ] Test de l'application principale
- [ ] Test de connexion admin
- [ ] Test des endpoints API
- [ ] Vérification des logs d'erreur

---

## 🎯 Paramètres IONOS Pré-configurés

### 🗄️ Base de Données
```php
DB_HOST: 'db5018629781.hosting-data.io'
DB_NAME: 'dbs14768810'
DB_USER: 'dbu3279635'
DB_PASS: 'Resto.AgriaRouen76100'  # depuis panneau IONOS
```

### 🌐 URL API
```php
API_BASE_URL: 'https://mobile.agriarouen.fr/api/'
```

### 🔐 Identifiants Admin
```
Email: admin@agria-rouen.fr
Mot de passe: Admin123!
```

---

## 📞 Support Express

### 🆘 En cas de problème urgent :
1. **Consulter :** `RESOLUTION_ERREUR_500.md`
2. **Tester :** `api/debug_500.php`
3. **Logs :** Vérifier les logs d'erreur IONOS
4. **Support :** Contacter le support technique IONOS

### 📚 Documentation complète :
- `GUIDE_DEPLOIEMENT.md` - Guide détaillé (285 lignes)
- `README.md` - Vue d'ensemble du projet
- `GUIDE_IDENTIFIANTS_ADMIN.md` - Gestion des comptes admin

---

**⏰ Temps total estimé :** 15 minutes  
**🎯 Difficulté :** Facile  
**✅ Statut :** Prêt pour production IONOS