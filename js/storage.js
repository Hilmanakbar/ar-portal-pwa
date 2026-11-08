/**
 * StorageManager — IndexedDB + LocalStorage manager for AR Portal PWA
 * Available globally as window.StorageManager
 */
class StorageManager {
  constructor() {
    this.dbName = 'ar-portal-db';
    this.dbVersion = 1;
    this.db = null;
  }

  /**
   * Initialize IndexedDB
   */
  init() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db);
        return;
      }

      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create models store
        if (!db.objectStoreNames.contains('models')) {
          const modelsStore = db.createObjectStore('models', { keyPath: 'id' });
          modelsStore.createIndex('name', 'name', { unique: false });
          modelsStore.createIndex('format', 'format', { unique: false });
          modelsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create portals store
        if (!db.objectStoreNames.contains('portals')) {
          const portalsStore = db.createObjectStore('portals', { keyPath: 'id' });
          portalsStore.createIndex('name', 'name', { unique: false });
          portalsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        reject(new Error(`IndexedDB error: ${event.target.error}`));
      };
    });
  }

  /**
   * Ensure database is initialized before operation
   */
  async ensureInit() {
    if (!this.db) {
      await this.init();
    }
    return this.db;
  }

  /**
   * Generic get transaction helper
   */
  _getTransaction(storeName, mode = 'readonly') {
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  // ─── MODEL OPERATIONS ───────────────────────────────────────────────────────

  /**
   * Save a 3D model to IndexedDB
   * @param {Object} model - { id?, name, format, description, fileData (ArrayBuffer), thumbnail?, createdAt? }
   */
  async saveModel(model) {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const modelToSave = {
        id: model.id || this.generateId(),
        name: model.name || 'Untitled Model',
        format: model.format || 'unknown',
        description: model.description || '',
        fileData: model.fileData,
        thumbnail: model.thumbnail || null,
        createdAt: model.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const store = this._getTransaction('models', 'readwrite');
      const request = store.put(modelToSave);

      request.onsuccess = () => resolve(modelToSave);
      request.onerror = (event) => reject(new Error(`Save model error: ${event.target.error}`));
    });
  }

  /**
   * Get a model by ID
   * @param {string} id
   */
  async getModel(id) {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const store = this._getTransaction('models');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(new Error(`Get model error: ${event.target.error}`));
    });
  }

  /**
   * Get all models
   */
  async getAllModels() {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const store = this._getTransaction('models');
      const request = store.getAll();

      request.onsuccess = () => {
        const models = request.result || [];
        // Sort by createdAt descending
        models.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(models);
      };
      request.onerror = (event) => reject(new Error(`Get all models error: ${event.target.error}`));
    });
  }

  /**
   * Get models without fileData (for listing — faster)
   */
  async getAllModelsMetadata() {
    const models = await this.getAllModels();
    return models.map(({ fileData, ...meta }) => meta);
  }

  /**
   * Delete a model by ID
   * @param {string} id
   */
  async deleteModel(id) {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const store = this._getTransaction('models', 'readwrite');
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(new Error(`Delete model error: ${event.target.error}`));
    });
  }

  // ─── PORTAL OPERATIONS ──────────────────────────────────────────────────────

  /**
   * Save a portal to IndexedDB
   * @param {Object} portal - { id?, name, description, modelIds[], createdAt? }
   */
  async savePortal(portal) {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const portalToSave = {
        id: portal.id || this.generateId(),
        name: portal.name || 'Untitled Portal',
        description: portal.description || '',
        modelIds: portal.modelIds || [],
        createdAt: portal.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const store = this._getTransaction('portals', 'readwrite');
      const request = store.put(portalToSave);

      request.onsuccess = () => resolve(portalToSave);
      request.onerror = (event) => reject(new Error(`Save portal error: ${event.target.error}`));
    });
  }

  /**
   * Get a portal by ID
   * @param {string} id
   */
  async getPortal(id) {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const store = this._getTransaction('portals');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = (event) => reject(new Error(`Get portal error: ${event.target.error}`));
    });
  }

  /**
   * Get all portals
   */
  async getAllPortals() {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const store = this._getTransaction('portals');
      const request = store.getAll();

      request.onsuccess = () => {
        const portals = request.result || [];
        portals.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        resolve(portals);
      };
      request.onerror = (event) => reject(new Error(`Get all portals error: ${event.target.error}`));
    });
  }

  /**
   * Delete a portal by ID
   * @param {string} id
   */
  async deletePortal(id) {
    await this.ensureInit();
    return new Promise((resolve, reject) => {
      const store = this._getTransaction('portals', 'readwrite');
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = (event) => reject(new Error(`Delete portal error: ${event.target.error}`));
    });
  }

  /**
   * Update an existing portal
   * @param {Object} portal - must include id
   */
  async updatePortal(portal) {
    await this.ensureInit();
    if (!portal.id) throw new Error('Portal id is required for update');

    const existing = await this.getPortal(portal.id);
    if (!existing) throw new Error(`Portal not found: ${portal.id}`);

    const updated = {
      ...existing,
      ...portal,
      updatedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const store = this._getTransaction('portals', 'readwrite');
      const request = store.put(updated);

      request.onsuccess = () => resolve(updated);
      request.onerror = (event) => reject(new Error(`Update portal error: ${event.target.error}`));
    });
  }

  // ─── HELPERS ────────────────────────────────────────────────────────────────

  /**
   * Generate a unique ID
   * @returns {string} timestamp + random string
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  /**
   * Clear all data (use with caution)
   */
  async clearAll() {
    await this.ensureInit();
    const stores = ['models', 'portals'];
    const promises = stores.map((storeName) =>
      new Promise((resolve, reject) => {
        const store = this._getTransaction(storeName, 'readwrite');
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e);
      })
    );
    return Promise.all(promises);
  }
}

// Export as singleton on window
window.StorageManager = new StorageManager();
