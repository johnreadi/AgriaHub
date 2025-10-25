# Configuration AGRIA ROUEN - Informations Techniques

## 📋 Informations de Configuration

Ce fichier contient les informations de configuration extraites du fichier `.env` et intégrées dans le package de déploiement IONOS.

## 🗄️ Base de Données

### Paramètres de Connexion
- **Serveur** : `db5018629781.hosting-data.io`
- **Base de données** : `dbs14768810`
- **Utilisateur** : `dbu3279635`
- **Mot de passe** : `Resto.AgriaRouen76100`
- **Port** : `3306`
- **Charset** : `utf8mb4`
- **Collation** : `utf8mb4_unicode_ci`

### Configuration SSL
- **Chiffrement** : Activé
- **Vérification SSL** : Désactivée (ssl_verify: false)

## 🌐 API et URLs

### URL de Base
- **API Base URL** : `https://mobile.agriarouen.fr/api/`
- **Force HTTPS** : Activé

### Environnement
- **CI Environment** : `development`

## 🤖 Services Externes

### Gemini AI
- **API Key** : `AIzaSyDZWoAvgpc78Fnu3T64s1kG0O6CdMfp6nE`
- **Usage** : Fonctionnalités d'intelligence artificielle (chatbot, etc.)

## 🔧 Configuration Technique

### Driver de Base de Données
- **Driver** : `MySQLi`
- **Optimisé pour** : MySQL/MariaDB

### Sécurité
- **JWT Secret** : Généré automatiquement basé sur les paramètres de BDD
- **CORS** : Configuré pour accepter les requêtes cross-origin
- **Headers de sécurité** : Configurés dans .htaccess

## 📝 Notes Importantes

### Sécurité
⚠️ **ATTENTION** : Ce fichier contient des informations sensibles. Ne le partagez jamais publiquement.

### Environnement de Production
- Les paramètres sont configurés pour l'environnement de production IONOS
- Le domaine `mobile.agriarouen.fr` est configuré comme URL de base
- SSL/HTTPS est forcé pour toutes les communications

### Maintenance
- Changez le mot de passe administrateur par défaut après le premier déploiement
- Surveillez les logs d'accès et d'erreur
- Effectuez des sauvegardes régulières de la base de données

## 🔄 Mise à Jour de Configuration

Si vous devez modifier ces paramètres :

1. **Base de données** : Modifiez `api/config.php`
2. **URLs** : Mettez à jour `API_BASE_URL` dans `config.php`
3. **Clés API** : Changez `GEMINI_API_KEY` si nécessaire
4. **SSL** : Configurez dans le panneau IONOS

## 📞 Support Technique

### Hébergement
- **Fournisseur** : IONOS
- **Type** : Hébergement mutualisé
- **Support** : Via panneau de contrôle IONOS

### Base de Données
- **Type** : MySQL/MariaDB
- **Accès** : Via phpMyAdmin dans le panneau IONOS
- **Sauvegarde** : Configurée automatiquement par IONOS

---

**Date de configuration** : Générée automatiquement depuis le fichier `.env`  
**Version** : Package de déploiement IONOS v1.0