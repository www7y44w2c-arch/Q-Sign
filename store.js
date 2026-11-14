// Stockage local sur l'appareil (IndexedDB pour les fichiers, localStorage pour les petits réglages).
// Rien n'est envoyé sur Internet.
window.BVStore = (() => {
  const DB_NAME = 'bank-verify-ai';
  const STORES = ['cases', 'files', 'specimens'];
  let dbPromise;
  function db() {
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => STORES.forEach(s => { if (!req.result.objectStoreNames.contains(s)) req.result.createObjectStore(s, { keyPath: 'id' }); });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    return dbPromise;
  }
  async function run(store, mode, fn) {
    const d = await db();
    return new Promise((resolve, reject) => {
      const tx = d.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      tx.oncomplete = () => resolve(req && req.result);
      tx.onerror = () => reject(tx.error);
    });
  }
  const api = {
    get: (store, id) => run(store, 'readonly', s => s.get(id)),
    all: (store) => run(store, 'readonly', s => s.getAll()),
    put: (store, value) => run(store, 'readwrite', s => s.put(value)),
    del: (store, id) => run(store, 'readwrite', s => s.delete(id)),
    uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    readLocal(key, fallback) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch { return fallback; } },
    writeLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } },
    // Réduit les photos (max 1600 px, JPEG) pour économiser la place sur le téléphone.
    async compressImage(file, max = 1600) {
      if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
      try {
        const bmp = await createImageBitmap(file);
        const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
        const c = document.createElement('canvas');
        c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
        c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
        const blob = await new Promise(r => c.toBlob(r, 'image/jpeg', 0.85));
        return blob && blob.size < file.size ? blob : file;
      } catch { return file; }
    },
    esc: s => String(s ?? '').replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]))
  };
  // Demande au navigateur de ne pas effacer les données locales.
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  return api;
})();
