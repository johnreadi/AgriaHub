/**
 * Service API pour l'application AGRIA
 * Gère les appels HTTP vers les endpoints PHP/MySQL
 */

// Configuration de base
// const API_BASE_URL = 'https://mobile.agriarouen.fr/api';
// Pour le développement local (PHP dev server) et la production IONOS
const hostname = (typeof window !== 'undefined') ? window.location.hostname : '';
const isLocal = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
const API_BASE_URL = isLocal ? 'http://localhost/agriarouen/api' : '/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('auth_token');
    // Activer le mode debug par défaut en local; persistant via localStorage('debug_login'="1")
    try {
      const persisted = localStorage.getItem('debug_login');
      this.isDebugMode = persisted === '1' || isLocal;
    } catch (_) {
      this.isDebugMode = isLocal;
    }
  }

  // Basculer le mode debug pour les appels (persistant)
  setDebugLogin(enabled) {
    this.isDebugMode = !!enabled;
    try {
      if (typeof window !== 'undefined') {
        if (enabled) localStorage.setItem('debug_login', '1');
        else localStorage.removeItem('debug_login');
      }
    } catch (_) {}
  }

  getDebugLogin() {
    return !!this.isDebugMode;
  }

  /**
   * Méthode générique pour les appels API
   */
  async request(endpoint, options = {}) {
    // Sur IONOS (prod), API_BASE_URL = '/api' et endpoint = '/auth/login' -> '/api/auth/login'
    // En local (PHP dev), API_BASE_URL = 'http://localhost:8001' et endpoint = '/auth/login' -> 'http://localhost:8001/auth/login'
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    };
    // Autoriser la surcharge par appelant (ex: endpoints publics sans cookies)
    const isCrossOriginApi = API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://');
    // IMPORTANT: Toujours inclure les cookies pour l'authentification, même en cross-origin
    config.credentials = options.credentials ?? 'include';
    config.mode = options.mode ?? 'cors';

    // Ajouter le token d'authentification si disponible
    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }
    // Injecter le flag debug côté frontend pour tracing backend
    if (this.isDebugMode) {
      config.headers['X-Debug'] = '1';
    }

    // Debug: tracer les requêtes sortantes
    try {
      console.debug('[ApiService] request', (config.method || 'GET'), url);
    } catch (_) {}

    try {
      const response = await fetch(url, config);
      try { console.debug('[ApiService] response status', response.status, 'for', url); } catch (_) {}
      
      // Gérer les erreurs HTTP
      if (!response.ok) {
        // Essayer de récupérer un message d'erreur utile provenant du backend
        let errorData = {};
        let rawText = '';
        try {
          rawText = await response.text();
          errorData = JSON.parse(rawText);
        } catch (_) {
          // Pas un JSON valide, continuer avec un objet vide
        }
        const message = (
          errorData.error ||
          errorData.message ||
          (Array.isArray(errorData.details) ? errorData.details[0] : undefined) ||
          `HTTP Error: ${response.status}`
        );
        const err = new Error(message);
        // Attacher des métadonnées utiles pour le debug côté UI
        err.status = response.status;
        err.data = errorData;
        err.raw = rawText;
        throw err;
      }

      // Tentative de parse JSON, avec repli gracieux sur texte/aucun contenu
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (contentType.includes('application/json')) {
        return await response.json();
      } else {
        const txt = await response.text();
        // Si pas de contenu, retourner un objet vide
        if (!txt || txt.trim().length === 0) return {};
        return { message: txt };
      }
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  /**
   * Méthodes GET
   */
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Méthodes POST
   */
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Méthodes PUT
   */
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Méthodes DELETE
   */
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  /**
   * Authentification
   */
  async login(identifier, password) {
     // Aligne avec WAMP: POST sur auth.php?action=login (+ debug si activé)
     const base = '/auth.php?action=login';
     const endpoint = this.isDebugMode ? base + '&debug=1' : base;
     try { console.info('[ApiService] login endpoint', endpoint, 'host', (typeof window !== 'undefined' ? window.location.hostname : 'node')); } catch (_) {}
     const response = await this.post(endpoint, { identifier, email: identifier, login: identifier, password });
     // Compatibilité avec différents schémas de réponse: token ou access_token
     const accessToken = response.token || response.access_token;
     if (accessToken) {
       this.token = accessToken;
       localStorage.setItem('auth_token', accessToken);
       try { console.info('[ApiService] token captured, len=', String(accessToken).length); } catch (_) {}
     }
     return response;
    }

  // Nouvelle méthode: Inscription
  async register(userData) {
    // Aligne avec WAMP: POST sur auth.php?action=register
    const endpoint = '/auth.php?action=register';
    return this.post(endpoint, userData);
  }

  async logout() {
    try {
      // Correction pour WAMP: utiliser GET avec action=logout au lieu de POST
      await this.get('/auth.php?action=logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
    }
  }

  async getCurrentUser() {
    return this.get('/auth.php?action=me');
  }

  /**
   * Gestion des utilisateurs
   */
  async getUsers() {
    return this.get('/users.php');
  }

  async getUserById(id) {
    return this.get(`/users.php?id=${id}`);
  }

  async createUser(userData) {
    return this.post('/users.php', userData);
  }

  async updateUser(id, userData) {
    return this.put(`/users.php?id=${id}`, userData);
  }

  async deleteUser(id) {
    return this.delete(`/users.php?id=${id}`);
  }

  /**
   * Gestion du menu (à implémenter côté PHP si nécessaire)
   */
  async getMenu() {
    return this.get('/menu.php');
  }

  async saveMenu(menuData) {
    return this.request('/menu.php', {
      method: 'POST',
      body: JSON.stringify({ menu: menuData }),
      // Pas de cookies nécessaires: on utilise le header Authorization
      credentials: 'omit',
    });
  }

  // --- Conversations ---
  async listConversations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/conversations.php${queryString ? '?' + queryString : ''}`);
  }

  async getConversation(id) {
    return this.get(`/conversations.php?id=${id}`);
  }

  async createConversation(data) {
    return this.post('/conversations.php', data);
  }

  async updateConversation(id, data) {
    return this.put(`/conversations.php?id=${id}`, data);
  }

  async deleteConversation(id) {
    return this.delete(`/conversations.php?id=${id}`);
  }

  async sendMessage(conversationId, data) {
    return this.post(`/conversations.php?action=send&id=${conversationId}`, data);
  }

  async markMessageRead(messageId) {
    return this.put(`/conversations.php?action=read&messageId=${messageId}`);
  }

  async deleteMessage(messageId) {
    return this.delete(`/conversations.php?action=deleteMessage&messageId=${messageId}`);
  }

  async getMessagingStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/conversations.php?action=stats${queryString ? '&' + queryString : ''}`);
  }

  // --- Newsletter ---
  async listSubscribers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/newsletter.php?action=subscribers${queryString ? '&' + queryString : ''}`);
  }

  async addSubscriber(data) {
    return this.post('/newsletter.php?action=subscribe', data);
  }

  async removeSubscriber(id) {
    return this.delete(`/newsletter.php?action=unsubscribe&id=${id}`);
  }

  async listCampaigns(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/newsletter.php?action=campaigns${queryString ? '&' + queryString : ''}`);
  }

  async createCampaign(data) {
    return this.post('/newsletter.php?action=createCampaign', data);
  }

  async sendCampaign(id) {
    return this.post(`/newsletter.php?action=sendCampaign&id=${id}`);
  }

  async scheduleCampaign(id, scheduleData) {
    return this.post(`/newsletter.php?action=scheduleCampaign&id=${id}`, scheduleData);
  }

  async getCampaign(id) {
    return this.get(`/newsletter.php?action=getCampaign&id=${id}`);
  }

  async deleteCampaign(id) {
    return this.delete(`/newsletter.php?action=deleteCampaign&id=${id}`);
  }

  async updateCampaign(id, data) {
    return this.put(`/newsletter.php?action=updateCampaign&id=${id}`, data);
  }

  async getNewsletterStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/newsletter.php?action=stats${queryString ? '&' + queryString : ''}`);
  }

  // --- Settings ---
  async listSettings() {
    return this.get('/settings.php');
  }

  async getSetting(key) {
    return this.get(`/settings.php?key=${key}`);
  }

  async updateSetting(key, value) {
    return this.put('/settings.php', { key, value });
  }

  async getSliderSettings() {
    return this.get('/settings.php?type=slider');
  }

  async updateSliderSettings(value) {
    return this.put('/settings.php', { key: 'slider', value });
  }

  // --- Pages ---
  async listPages(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/pages.php${queryString ? '?' + queryString : ''}`);
  }

  async getPage(slug) {
    return this.get(`/pages.php?slug=${encodeURIComponent(slug)}`);
  }

  async createPage(data) {
    return this.post('/pages.php', data);
  }

  async updatePage(slug, data) {
    return this.put(`/pages.php?slug=${slug}`, data);
  }

  async deletePage(slug) {
    return this.delete(`/pages.php?slug=${slug}`);
  }

  // --- Slides ---
  async listSlides(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.get(`/slides.php${queryString ? '?' + queryString : ''}`);
  }

  async getSlide(id) {
    return this.get(`/slides.php?id=${id}`);
  }

  async createSlide(data) {
    return this.post('/slides.php', data);
  }

  async updateSlide(id, data) {
    return this.put(`/slides.php?id=${id}`, data);
  }

  async deleteSlide(id) {
    return this.delete(`/slides.php?id=${id}`);
  }

  async reorderSlides(updates) {
    return this.put('/slides.php?action=reorder', { updates });
  }

  async getSlidesSettings() {
    return this.get('/slides.php?action=settings');
  }

  async updateSlidesSettings(value) {
    return this.put('/slides.php?action=settings', { value });
  }

  // --- Auth helpers ---
  isAuthenticated() {
    return !!this.token;
  }

  getToken() {
    return this.token;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }
}

const apiService = new ApiService();

export default apiService;
export { apiService };