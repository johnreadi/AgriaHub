# Instructions de Déploiement IONOS

## Résultats du Diagnostic

✅ **Extensions PHP** : Toutes les extensions nécessaires sont disponibles (PDO, MySQL, JSON, etc.)

⚠️ **Configuration Actuelle** : Détectée comme SQLite locale, maintenant corrigée pour MySQL IONOS

✅ **Identifiants IONOS** : Détectés et configurés
 $host_name = 'db5018629781.hosting-data.io';
  $database = 'dbs14768810';
  $user_name = 'dbu3279635';
  $password = 'Resto.AgriaRouen76100';


## Actions Effectuées

1. ✅ **Configuration corrigée** dans `config.php` et `database.php`
2. ✅ **Scripts de diagnostic** créés (`test_db_ionos.php`, `verify_admin.php`)

## Actions Requises

### 1. Vérifier le Mot de Passe
Le mot de passe détecté est "YES" - vous devez le remplacer par le vrai mot de passe IONOS dans :
- `config.php` ligne 21
- `database.php` ligne 28

### 2. Importer la Base de Données
```sql
-- Connectez-vous à phpMyAdmin IONOS et exécutez :
-- 1. Importez database.sql
-- 2. Exécutez create_admin.sql
```

### 3. Tester la Connexion
Après avoir corrigé le mot de passe, testez avec :
```
https://votre-domaine.com/api/test_db_ionos.php
```

### 4. Créer l'Utilisateur Admin
```
https://votre-domaine.com/api/verify_admin.php
```

### 5. Tester l'Authentification
```
POST https://votre-domaine.com/api/auth.php
{
  "email": "admin@agria-rouen.fr",
  "password": "admin123"
}
```

## Identifiants Admin par Défaut
- **Email** : `admin@agria-rouen.fr`
- **Mot de passe** : `admin123`

## Prochaines Étapes
1. Récupérez le vrai mot de passe MySQL depuis le panneau IONOS
2. Mettez à jour la configuration
3. Importez la base de données
4. Testez l'authentification

## Support
Si vous rencontrez des problèmes, vérifiez :
- Les logs d'erreur IONOS
- La configuration MySQL dans le panneau IONOS
- Les permissions de la base de données