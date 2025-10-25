# AGRIA ROUEN - Package de Déploiement IONOS

## 📦 Contenu du Package

Ce dossier contient tous les fichiers nécessaires pour déployer l'application AGRIA ROUEN sur un hébergement mutualisé IONOS standard (non compatible Node.js).

### Structure des Fichiers

```
IONOS/
├── public/                    # 🌐 Application web (à placer à la racine du domaine)
│   ├── index.html            # Page principale React compilée
│   ├── assets/               # Ressources statiques (CSS, JS, images)
│   └── .htaccess             # Configuration Apache pour SPA et sécurité
│
├── api/                      # 🔧 API PHP (backend)
│   ├── config.php            # Configuration base de données et sécurité
│   ├── auth.php              # Authentification (login, register, logout)
│   ├── users.php             # Gestion des utilisateurs et cartes
│   ├── newsletter.php        # Gestion newsletter et campagnes
│   ├── conversations.php     # Système de messagerie
│   ├── database.php          # Fonctions de base de données
│   └── .htaccess             # Configuration API et routage
│
├── database.sql              # 🗄️ Script de création de base de données
├── GUIDE_DEPLOIEMENT.md      # 📖 Guide complet de déploiement
└── README.md                 # 📋 Ce fichier
```

## 🚀 Déploiement Rapide

### 1. Prérequis IONOS
- Hébergement mutualisé avec PHP 7.4+ et MySQL/MariaDB
- Accès FTP ou gestionnaire de fichiers
- Accès au panneau de base de données

### 2. Étapes Essentielles

1. **Base de données** : Importez `database.sql` dans phpMyAdmin
2. **Configuration** : Modifiez `api/config.php` avec vos paramètres de BDD
3. **Upload** : 
   - Contenu de `public/` → racine de votre domaine
   - Dossier `api/` → créez un dossier `api/` sur votre serveur
4. **Test** : Accédez à votre domaine pour vérifier le fonctionnement

#### Correctifs de schéma (migrations)
Pour éviter des erreurs 500 sur `menu.php` et `settings.php`, exécutez aussi les migrations du dossier `api/migrations/` sur votre base de données IONOS :
- `2025_10_14_update_weekly_menus.sql` (assure le schéma complet de `weekly_menus`)
- `2025_10_14_create_appearance_settings.sql` (crée `appearance_settings` si absente)

Importez ces fichiers via phpMyAdmin ou la CLI `mysql`.

### 3. Configuration Pré-configurée

Le fichier `api/config.php` a déjà été configuré avec vos informations de base de données depuis le fichier `.env` :

```php
define('DB_HOST', 'db5018629781.hosting-data.io');
define('DB_NAME', 'dbs14768810');
define('DB_USER', 'dbu3279635');
define('DB_PASS', 'Resto.AgriaRouen76100'); // Utiliser uniquement en environnement serveur IONOS
define('API_BASE_URL', 'https://mobile.agriarouen.fr/api/');
```

✅ **Aucune modification nécessaire** - Les paramètres sont déjà configurés !

## 📖 Documentation Complète

Pour des instructions détaillées, consultez le **[GUIDE_DEPLOIEMENT.md](GUIDE_DEPLOIEMENT.md)** qui contient :

- Instructions pas à pas
- Configuration avancée
- Dépannage des problèmes courants
- Optimisations de performance
- Conseils de sécurité
- Maintenance et mises à jour

## 🔧 Fonctionnalités Incluses

### Frontend (React)
- ✅ Interface utilisateur moderne et responsive
- ✅ Authentification et gestion de profil
- ✅ Système de carte et rechargement
- ✅ Newsletter et communication
- ✅ Panel d'administration
- ✅ Optimisé pour mobile

### Backend (PHP)
- ✅ API REST complète
- ✅ Authentification JWT
- ✅ Gestion des utilisateurs et rôles
- ✅ Système de messagerie
- ✅ Newsletter et campagnes
- ✅ Sécurité et validation des données

### Base de Données (MySQL)
- ✅ Schéma optimisé avec index
- ✅ Relations et contraintes
- ✅ Données de démonstration
- ✅ Compatible MySQL/MariaDB

## 🛡️ Sécurité

- Protection CORS configurée
- Headers de sécurité (XSS, CSRF)
- Validation et sanitisation des données
- Hachage sécurisé des mots de passe
- Protection des fichiers sensibles

## 📞 Support

### En cas de problème :
1. Consultez le guide de dépannage dans `GUIDE_DEPLOIEMENT.md`
2. Vérifiez les logs d'erreur de votre hébergement
3. Contactez le support technique IONOS si nécessaire

### Ressources utiles :
- [Documentation IONOS](https://www.ionos.fr/aide)
- [Support PHP](https://www.php.net/docs.php)
- [Documentation MySQL](https://dev.mysql.com/doc/)

## 🔄 Versions

- **Frontend** : React 18.3.1 + Vite
- **Backend** : PHP 7.4+ compatible
- **Base de données** : MySQL 5.7+ / MariaDB 10.2+
- **Serveur web** : Apache avec mod_rewrite

## 📝 Notes Importantes

1. **Première connexion admin** :
   - Email : `admin@agria-rouen.fr`
   - Mot de passe : `password` (à changer immédiatement)

2. **Configuration SSL** : Activez HTTPS dans votre panneau IONOS

3. **Sauvegarde** : Configurez des sauvegardes automatiques de votre base de données

4. **Mise à jour** : Pour les futures mises à jour, recompilez le frontend et remplacez les fichiers

---

**Développé pour AGRIA ROUEN** - Application de gestion de restaurant universitaire  
Compatible avec l'hébergement mutualisé IONOS standard