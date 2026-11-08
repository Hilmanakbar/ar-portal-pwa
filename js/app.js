/**
 * AppUtils — Navigation and UI utility module for AR Portal PWA
 * Available globally as window.AppUtils
 */
const AppUtils = {

  /** Supported 3D model formats (FBX removed — not supported by model-viewer) */
  SUPPORTED_FORMATS: ['gltf', 'glb', 'obj', 'stl', 'dae'],

  /**
   * Navigate to a page
   * @param {string} page - URL to navigate to
   */
  navigate(page) {
    window.location.href = page;
  },

  /**
   * Load portals data from /data/portals.json with cache-busting
   * @returns {Promise<{portals: Array, models: Array}>}
   */
  async loadPortalsData() {
    const urls = [
      '/data/portals.json?t=' + Date.now(),
      '../data/portals.json?t=' + Date.now(),
    ];
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) return res.json();
      } catch {}
    }
    return { portals: [], models: [] };
  },

  /**
   * Show a toast notification
   * @param {string} message - Text to display
   * @param {'success'|'error'|'info'|'warning'} type - Toast type
   * @param {number} duration - Duration in ms (default 3000)
   */
  showToast(message, type = 'info', duration = 3000) {
    // Ensure toast container exists
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: '✅',
      error: '❌',
      info: 'ℹ️',
      warning: '⚠️',
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    container.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-visible');
    });

    // Auto-remove after duration
    const timer = setTimeout(() => {
      toast.classList.remove('toast-visible');
      toast.classList.add('toast-hiding');
      setTimeout(() => {
        if (toast.parentElement) toast.remove();
      }, 300);
    }, duration);

    // Clear timer if manually closed
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(timer);
    });

    return toast;
  },

  /**
   * Show or hide the full-screen loading overlay
   * @param {boolean} show
   * @param {string} message - Optional loading message
   */
  showLoading(show, message = 'Memuat...') {
    let overlay = document.getElementById('loading-overlay');

    if (show) {
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <p class="loading-message">${message}</p>
          </div>
        `;
        document.body.appendChild(overlay);
      } else {
        const msg = overlay.querySelector('.loading-message');
        if (msg) msg.textContent = message;
      }
      overlay.style.display = 'flex';
      requestAnimationFrame(() => overlay.classList.add('loading-visible'));
    } else {
      if (overlay) {
        overlay.classList.remove('loading-visible');
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 300);
      }
    }
  },

  /**
   * Format a file size in bytes to a human-readable string
   * @param {number} bytes
   * @returns {string}
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    if (bytes < 0) return 'Unknown';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0);
    return `${size} ${units[i]}`;
  },

  /**
   * Get the lowercase file extension from a filename
   * @param {string} filename
   * @returns {string}
   */
  getFileExtension(filename) {
    if (!filename) return '';
    const parts = filename.split('.');
    if (parts.length < 2) return '';
    return parts[parts.length - 1].toLowerCase();
  },

  /**
   * Check if admin is authenticated
   * @returns {boolean}
   */
  isAdminAuthenticated() {
    return localStorage.getItem('admin_auth') === 'true';
  },

  /**
   * Require admin auth — redirect if not authenticated
   * @param {string} redirectTo - Where to redirect if not auth (default: 'index.html')
   */
  requireAdminAuth(redirectTo = 'index.html') {
    if (!this.isAdminAuthenticated()) {
      window.location.href = redirectTo;
      return false;
    }
    return true;
  },

  /**
   * Log out admin
   */
  adminLogout() {
    localStorage.removeItem('admin_auth');
    window.location.href = '../index.html';
  },

  /**
   * Format an ISO date string to a readable local date
   * @param {string} isoString
   * @returns {string}
   */
  formatDate(isoString) {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return isoString;
    }
  },

  /**
   * Truncate a string to a max length
   * @param {string} str
   * @param {number} maxLen
   * @returns {string}
   */
  truncate(str, maxLen = 80) {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen) + '...' : str;
  },

  /**
   * Get format badge HTML for a file format
   * @param {string} format
   * @returns {string} HTML string
   */
  getFormatBadge(format) {
    const colorMap = {
      gltf: 'badge-success',
      glb:  'badge-success',
      obj:  'badge-info',
      stl:  'badge-warning',
      dae:  'badge-primary',
    };
    const cls = colorMap[format?.toLowerCase()] || 'badge-info';
    return `<span class="badge ${cls}">${(format || '?').toUpperCase()}</span>`;
  },

  /**
   * Debounce a function
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  /**
   * Show a confirm dialog (returns Promise<boolean>)
   * @param {string} message
   * @param {string} title
   */
  confirm(message, title = 'Konfirmasi') {
    return new Promise((resolve) => {
      let modal = document.getElementById('confirm-modal');
      if (!modal) {
        modal = document.createElement('div');
        modal.id = 'confirm-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal" style="max-width:400px;">
            <div class="modal-header">
              <h3 class="modal-title"></h3>
            </div>
            <div class="modal-body">
              <p class="confirm-message"></p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="confirm-cancel">Batal</button>
              <button class="btn btn-danger" id="confirm-ok">Hapus</button>
            </div>
          </div>
        `;
        document.body.appendChild(modal);
      }

      modal.querySelector('.modal-title').textContent = title;
      modal.querySelector('.confirm-message').textContent = message;
      modal.style.display = 'flex';

      const cleanup = (result) => {
        modal.style.display = 'none';
        resolve(result);
      };

      modal.querySelector('#confirm-ok').onclick = () => cleanup(true);
      modal.querySelector('#confirm-cancel').onclick = () => cleanup(false);
      modal.onclick = (e) => { if (e.target === modal) cleanup(false); };
    });
  },
};

// Export as global
window.AppUtils = AppUtils;
