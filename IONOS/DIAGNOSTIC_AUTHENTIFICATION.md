# 🔍 Diagnostic Authentification IONOS

## 🚨 Problème Identifié
**Les identifiants sont refusés en ligne mais fonctionnent en local**

## 🎯 Causes Probables

### 1️⃣ **Configuration Base de Données**
- ❌ **SQLite en local vs MySQL en ligne**
- ❌ **Identifiants MySQL IONOS incorrects**
- ❌ **Base de données non importée sur IONOS**

### 2️⃣ **Utilisateur Admin Manquant**
- ❌ **Script `create_admin.sql` non exécuté**
- ❌ **Mot de passe hashé différemment**

### 3️⃣ **Configuration API**
- ❌ **URL API incorrecte**
- ❌ **CORS mal configuré**

---

## 🔧 Plan de Diagnostic

### **Étape 1: Vérifier la Configuration**

1. **Connectez-vous à votre panneau IONOS**
2. **Allez dans "Bases de données MySQL"**
3. **Notez vos identifiants:**
   - Serveur: `db5018629781.hosting-data.io`
- Base: `dbs14768810`
- Utilisateur: `dbu3279635`
   - Mot de passe: `VotreMotDePasse`

### **Étape 2: Tester la Connexion**

1. **Uploadez le fichier `test_db_ionos.php`** sur votre serveur IONOS
2. **Accédez à:** `https://votre-domaine.fr/api/test_db_ionos.php`
3. **Vérifiez les résultats:**
   - ✅ Extensions PHP disponibles
   - ✅ Connexion MySQL réussie
   - ✅ Tables présentes
   - ✅ Utilisateur admin trouvé

### **Étape 3: Corriger la Configuration**

1. **Modifiez `config.php`** avec vos vraies données IONOS:
```php
define('DB_HOST', 'votre-serveur-mysql.ionos.com');
define('DB_NAME', 'votre_nom_de_base');
define('DB_USER', 'votre_utilisateur');
define('DB_PASS', 'votre_mot_de_passe');
```

2. **Ou utilisez `config_ionos.php`** comme modèle

### **Étape 4: Importer la Base de Données**

1. **Accédez à phpMyAdmin IONOS**
2. **Importez `database.sql`**
3. **Exécutez `create_admin.sql`**

---

## 🧪 Scripts de Test Créés

### 📄 `test_db_ionos.php`
- Test complet de connexion MySQL
- Vérification des tables et utilisateurs
- Diagnostic des erreurs

### 📄 `config_ionos.php`
- Configuration MySQL optimisée pour IONOS
- Remplace SQLite par MySQL
- Headers CORS configurés

---

## ✅ Checklist de Résolution

### **Base de Données**
- [ ] Identifiants MySQL IONOS récupérés
- [ ] `config.php` modifié avec MySQL
- [ ] `database.sql` importé via phpMyAdmin
- [ ] `create_admin.sql` exécuté
- [ ] Test de connexion réussi

### **API**
- [ ] Fichiers API uploadés dans `/api/`
- [ ] `.htaccess` configuré
- [ ] Test endpoint: `https://votre-domaine.fr/api/auth`

### **Frontend**
- [ ] Fichiers `dist/` uploadés à la racine
- [ ] URL API mise à jour dans le code
- [ ] Test de connexion depuis l'interface

---

## 🔍 Commandes de Test

### **Test MySQL Direct**
```bash
mysql -h votre-serveur-mysql.ionos.com -u votre_utilisateur -p
USE votre_nom_de_base;
SELECT * FROM users WHERE role = 'admin';
```

### **Test API**
```bash
curl -X POST https://votre-domaine.fr/api/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@agriarouen.fr","password":"Admin123!"}'
```

---

## 🚨 Erreurs Courantes

### **"Access denied for user"**
- ❌ Identifiants MySQL incorrects
- ✅ Vérifiez dans le panneau IONOS

### **"Unknown database"**
- ❌ Base de données non créée
- ✅ Créez la base via le panneau IONOS

### **"Table 'users' doesn't exist"**
- ❌ `database.sql` non importé
- ✅ Importez via phpMyAdmin

### **"No admin user found"**
- ❌ `create_admin.sql` non exécuté
- ✅ Exécutez le script SQL

---

## 📞 Support

Si le problème persiste:

1. **Vérifiez les logs d'erreur IONOS**
2. **Contactez le support IONOS**
3. **Vérifiez la version PHP (7.4+ requis)**

---

**Créé le:** ${new Date().toISOString()}  
**Version:** 1.0  
**Statut:** Diagnostic en cours