# Guide de Déploiement AGRIA ROUEN sur IONOS

## 📋 Prérequis

- Compte d'hébergement mutualisé IONOS avec support PHP 7.4+ et MySQL/MariaDB
- Accès FTP ou gestionnaire de fichiers IONOS
- Accès au panneau de contrôle de base de données IONOS

## 🗂️ Structure des Fichiers

```
IONOS/
├── public/                 # Dossier racine du site web
│   ├── index.html         # Application React compilée
│   ├── assets/            # Ressources statiques (CSS, JS, images)
│   └── .htaccess          # Configuration Apache
├── api/                   # API PHP
│   ├── config.php         # Configuration de base de données
│   ├── auth.php           # Authentification
│   ├── users.php          # Gestion des utilisateurs
│   ├── newsletter.php     # Gestion newsletter
│   ├── conversations.php  # Gestion des conversations
│   ├── database.php       # Fonctions de base de données
│   └── .htaccess          # Configuration API
├── database.sql           # Script de création de base de données
└── GUIDE_DEPLOIEMENT.md   # Ce guide
```

## 🚀 Étapes de Déploiement

### 1. Configuration de la Base de Données

#### 1.1 Créer la Base de Données
1. Connectez-vous au panneau de contrôle IONOS
2. Accédez à "Bases de données MySQL"
3. Créez une nouvelle base de données :
   - Nom : `agria_db` (ou selon votre préférence)
   - Utilisateur : créez un utilisateur dédié
   - Mot de passe : générez un mot de passe sécurisé

#### 1.2 Importer le Schéma
1. Accédez à phpMyAdmin depuis le panneau IONOS
2. Sélectionnez votre base de données
3. Importez le fichier `database.sql`
4. Vérifiez que toutes les tables ont été créées

### 2. Configuration de l'API PHP

#### 2.1 Modifier config.php
Le fichier `api/config.php` a déjà été configuré avec vos informations de base de données :

```php
// Configuration de la base de données (depuis .env)
define('DB_HOST', 'db5018629781.hosting-data.io');
define('DB_NAME', 'dbs14768810');
define('DB_USER', 'dbu3279635');
define('DB_PASS', 'Resto.AgriaRouen76100'); // Confirmez que ces infos viennent de votre panneau IONOS
define('DB_CHARSET', 'utf8mb4');

// URL de base de l'API (depuis .env)
define('API_BASE_URL', 'https://mobile.agriarouen.fr/api/');

// Clé API Gemini (depuis .env - pour les fonctionnalités IA)
define('GEMINI_API_KEY', 'AIzaSyDZWoAvgpc78Fnu3T64s1kG0O6CdMfp6nE');
```

⚠️ **Important** : Ces informations proviennent de votre fichier `.env` et sont déjà configurées. Vérifiez que ces paramètres correspondent bien à votre environnement IONOS.

#### 2.2 Tester la Configuration
Créez un fichier temporaire `test-db.php` :

```php
<?php
require_once 'api/config.php';
try {
    echo "Connexion à la base de données réussie !";
} catch (Exception $e) {
    echo "Erreur : " . $e->getMessage();
}
?>
```

### 3. Upload des Fichiers

#### 3.1 Via FTP
1. Connectez-vous à votre FTP IONOS
2. Naviguez vers le dossier racine de votre domaine (généralement `/`)
3. Uploadez le contenu du dossier `public/` vers la racine
4. Créez un dossier `api/` et uploadez le contenu du dossier `api/`

#### 3.2 Via Gestionnaire de Fichiers IONOS
1. Accédez au gestionnaire de fichiers dans le panneau IONOS
2. Suivez la même structure que pour FTP

### 4. Configuration des Permissions

Assurez-vous que les permissions suivantes sont définies :
- Dossiers : 755
- Fichiers PHP : 644
- Fichiers .htaccess : 644

### 5. Configuration du Domaine

#### 5.1 Domaine Principal
Si vous utilisez votre domaine principal, les fichiers doivent être dans le dossier racine.

#### 5.2 Sous-domaine
Si vous utilisez un sous-domaine (ex: app.votre-domaine.com) :
1. Créez le sous-domaine dans le panneau IONOS
2. Pointez-le vers le dossier contenant vos fichiers

### 6. Configuration SSL

1. Activez le certificat SSL dans le panneau IONOS
2. Forcez la redirection HTTPS en ajoutant au début du `.htaccess` :

```apache
# Redirection HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

## 🔧 Configuration Avancée

### Variables d'Environnement

Les variables d'environnement ont déjà été intégrées depuis votre fichier `.env`. Voici un exemple de fichier `api/.env.php` si vous souhaitez externaliser la configuration :

```php
<?php
// Configuration depuis le fichier .env original
return [
    'DB_HOST' => 'db5018629781.hosting-data.io',
    'DB_NAME' => 'dbs14768810',
    'DB_USER' => 'dbu3279635',
    'DB_PASS' => 'Resto.AgriaRouen76100',
    'API_BASE_URL' => 'https://mobile.agriarouen.fr/api/',
    'JWT_SECRET' => 'agria_rouen_jwt_secret_key_2024_secure',
    'GEMINI_API_KEY' => 'AIzaSyDZWoAvgpc78Fnu3T64s1kG0O6CdMfp6nE',
    'SMTP_HOST' => 'smtp.ionos.fr',
    'SMTP_USER' => 'noreply@mobile.agriarouen.fr',
    'SMTP_PASS' => 'votre-mot-de-passe-email'
];
?>
```

⚠️ **Sécurité** : Ne commitez jamais ce fichier dans un dépôt public !

### Logs et Monitoring

1. Créez un dossier `logs/` (en dehors du dossier public)
2. Configurez les logs dans `config.php`
3. Surveillez les fichiers de logs régulièrement

## 🧪 Tests Post-Déploiement

### 1. Test de l'Application
- Accédez à `https://votre-domaine.com`
- Vérifiez que l'interface React se charge correctement
- Testez la navigation entre les pages

### 2. Test de l'API
- Testez l'endpoint : `https://votre-domaine.com/api/auth/login`
- Vérifiez les réponses JSON
- Testez l'authentification

### 3. Test de la Base de Données
- Créez un compte utilisateur
- Testez la connexion
- Vérifiez les données dans phpMyAdmin

## 🔒 Sécurité

### Recommandations
1. **Mots de passe forts** : Utilisez des mots de passe complexes
2. **Mise à jour régulière** : Maintenez PHP et les dépendances à jour
3. **Sauvegarde** : Configurez des sauvegardes automatiques
4. **Monitoring** : Surveillez les logs d'erreur
5. **HTTPS** : Forcez toujours HTTPS

### Fichiers à Protéger
Ajoutez ces règles au `.htaccess` principal :

```apache
# Protection des fichiers sensibles
<FilesMatch "\.(env|log|sql|bak)$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

## 🐛 Dépannage

### Problèmes Courants

#### 1. Erreur 500 - Internal Server Error
- Vérifiez les logs d'erreur PHP
- Contrôlez les permissions des fichiers
- Vérifiez la syntaxe des fichiers .htaccess

#### 2. Connexion Base de Données Échoue
- Vérifiez les paramètres dans `config.php`
- Testez la connexion avec un script simple
- Contactez le support IONOS si nécessaire

#### 3. API Non Accessible
- Vérifiez la configuration .htaccess dans le dossier api
- Testez les URLs directement
- Contrôlez les headers CORS

#### 4. Interface React Ne Se Charge Pas
- Vérifiez que tous les fichiers sont uploadés
- Contrôlez le .htaccess pour les routes SPA
- Vérifiez la console du navigateur

### Logs Utiles
- Logs Apache : `/logs/error.log`
- Logs PHP : `/logs/php_errors.log`
- Logs API : `/logs/api_errors.log`

## 📞 Support

### Ressources IONOS
- Documentation : https://www.ionos.fr/aide
- Support technique : Via le panneau de contrôle
- Community : Forums IONOS

### Commandes Utiles

#### Test de Connexion Base de Données
```bash
mysql -h votre-serveur-mysql.ionos.com -u votre_utilisateur -p votre_nom_de_base
```

#### Vérification des Permissions
```bash
find . -type f -name "*.php" -exec chmod 644 {} \;
find . -type d -exec chmod 755 {} \;
```

## 📈 Optimisation

### Performance
1. **Cache** : Configuré via .htaccess
2. **Compression** : GZIP activé
3. **CDN** : Considérez un CDN pour les ressources statiques
4. **Base de données** : Indexez les colonnes fréquemment utilisées

### Monitoring
1. **Google Analytics** : Ajoutez le tracking
2. **Uptime Monitoring** : Surveillez la disponibilité
3. **Performance** : Utilisez Google PageSpeed Insights

## ✅ Checklist de Déploiement

- [ ] Base de données créée et configurée
- [ ] Fichiers uploadés via FTP/gestionnaire
- [ ] Configuration `config.php` mise à jour
- [ ] Permissions des fichiers définies
- [ ] SSL activé et configuré
- [ ] Tests de l'application effectués
- [ ] Tests de l'API effectués
- [ ] Logs configurés et accessibles
- [ ] Sauvegardes configurées
- [ ] Monitoring mis en place

## 🔄 Maintenance

### Tâches Régulières
- Vérifier les logs d'erreur
- Mettre à jour les dépendances
- Sauvegarder la base de données
- Surveiller les performances
- Tester les fonctionnalités critiques

### Mises à Jour
Pour mettre à jour l'application :
1. Compilez la nouvelle version React (`npm run build`)
2. Uploadez les nouveaux fichiers
3. Mettez à jour l'API si nécessaire
4. Testez en environnement de staging d'abord

---

**Note** : Ce guide est spécifique à l'hébergement mutualisé IONOS. Adaptez les configurations selon votre environnement spécifique.