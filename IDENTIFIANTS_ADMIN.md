# 🔐 Identifiants de Connexion par Défaut - AGRIA HUB

## ✅ Identifiants Administrateur

### 🎯 Connexion Interface Web
- **URL :** `https://votre-domaine.fr/`
- **Email :** `admin@agria-rouen.fr`
- **Mot de passe :** `admin123`
- **Rôle :** Administrateur

### 🔧 Connexion API Directe
- **Endpoint :** `https://votre-domaine.fr/api/auth.php?action=login`
- **Méthode :** POST
- **Content-Type :** application/json
- **Body :**
```json
{
  "email": "admin@agria-rouen.fr",
  "password": "admin123"
}
```

## 🤖 Configuration Intelligence Artificielle

### Gemini AI
- **API Key :** `AIzaSyAKMJDkoitiEgTGGWQC6z5VLr9re7NhiQs`
- **Modèle par défaut :** `gemini-2.5-flash`
- **Endpoint :** `/api/gemini.php?action=chat`
- **Rate Limit :** 120 requêtes/minute par IP
- **Fonctionnalités :**
  - Chatbot intelligent
  - Assistance contextuelle
  - Historique de conversation
  - Instructions système personnalisées

### Configuration IA
```json
{
  "model": "gemini-2.5-flash",
  "systemInstruction": "Tu es l'assistant IA d'AGRIA Rouen, un restaurant administratif moderne.",
  "history": [],
  "message": "Votre question ici"
}
```

## 📱 Fonctionnalités PWA (Progressive Web App)

### Caractéristiques
- ✅ **Responsive Design** : Optimisé mobile, tablette, desktop
- ✅ **Installation** : Peut être installée comme une app native
- ✅ **Mode Hors-ligne** : Fonctionne sans connexion internet
- ✅ **Notifications Push** : Alertes en temps réel
- ✅ **Cache Intelligent** : Mise en cache automatique des ressources

### Configuration PWA
- **Nom :** Agria Rouen - Restaurant Administratif
- **Couleur thème :** #009A58 (vert AGRIA)
- **Mode d'affichage :** Standalone (plein écran)
- **Orientation :** Portrait prioritaire
- **Raccourcis :**
  - Menu du jour (`/menu`)
  - Actualités (`/actu`)
  - Contact (`/contact`)

## 🗄️ Base de Données

### Paramètres de Connexion (Production)
- **Serveur :** `db5018629781.hosting-data.io`
- **Base de données :** `dbs14768810`
- **Utilisateur :** `dbu3279635`
- **Mot de passe :** `Resto.AgriaRouen76100`
- **Port :** `3306`
- **Charset :** `utf8mb4`

### Utilisateurs par Défaut
```sql
-- Administrateur principal
INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES 
('admin@agria-rouen.fr', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'AGRIA', 'admin', 1);
```

## 🔒 Sécurité

### JWT Configuration
- **Secret :** Généré automatiquement basé sur les paramètres DB
- **Durée de vie :** 24 heures
- **Refresh Token :** 7 jours

### Rate Limiting
- **API Gemini :** 120 req/min par IP
- **Authentification :** 5 tentatives max par IP
- **API générale :** 1000 req/heure par IP

## 🚀 Déploiement

### Variables d'Environnement Critiques
```env
# Base de données
DB_HOST=db5018629781.hosting-data.io
DB_NAME=dbs14768810
DB_USER=dbu3279635
DB_PASS=Resto.AgriaRouen76100

# IA
GEMINI_API_KEY=AIzaSyAKMJDkoitiEgTGGWQC6z5VLr9re7NhiQs

# Domaine
DOMAIN=mobile.agriarouen.fr
SSL_EMAIL=admin@agria-rouen.fr
```

## ⚠️ Sécurité Importante

### Actions Recommandées Post-Déploiement
1. **Changer le mot de passe admin** immédiatement après le premier déploiement
2. **Régénérer la clé Gemini API** si nécessaire
3. **Configurer les sauvegardes** automatiques
4. **Activer le monitoring** des performances
5. **Vérifier les certificats SSL** Let's Encrypt

### Accès Sécurisé
- Toujours utiliser HTTPS en production
- Activer l'authentification à deux facteurs si disponible
- Surveiller les logs d'accès régulièrement
- Mettre à jour les dépendances de sécurité

## 📞 Support

En cas de problème avec les identifiants ou la configuration :
1. Vérifier les logs dans `/var/log/` ou via Dokploy
2. Consulter la documentation technique dans `DEPLOYMENT.md`
3. Utiliser les scripts de monitoring : `./scripts/monitor.sh`

---

**Date de création :** $(date)  
**Version :** 1.0  
**Environnement :** Production Dokploy