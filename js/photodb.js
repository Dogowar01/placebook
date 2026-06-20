const PhotoDB = (() => {
  const DB_NAME = 'placebook-photos';
  const STORE   = 'photos';
  let _db = null;

  function openDB() {
    if (_db) return Promise.resolve(_db);
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
      req.onsuccess = e => { _db = e.target.result; resolve(_db); };
      req.onerror = () => reject(req.error);
    });
  }

  async function put(id, dataUrl) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(dataUrl, id);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
  }

  async function putNew(dataUrl) {
    const id = Utils.generateId();
    await put(id, dataUrl);
    return id;
  }

  async function get(id) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    });
  }

  async function getMany(ids) {
    if (!ids || !ids.length) return [];
    const db = await openDB();
    return Promise.all(ids.map(id => new Promise((res, rej) => {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      req.onsuccess = () => res(req.result || null);
      req.onerror = () => rej(req.error);
    })));
  }

  async function remove(id) {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = res;
      tx.onerror = () => rej(tx.error);
    });
  }

  async function getAll() {
    const db = await openDB();
    return new Promise((res, rej) => {
      const result = {};
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
      req.onsuccess = e => {
        const c = e.target.result;
        if (c) { result[c.key] = c.value; c.continue(); }
        else res(result);
      };
      req.onerror = () => rej(req.error);
    });
  }

  // Migrate a legacy base64 array to IDB; returns array of new IDs
  async function migrate(base64Array) {
    const ids = [];
    for (const dataUrl of base64Array) {
      const id = Utils.generateId();
      await put(id, dataUrl);
      ids.push(id);
    }
    return ids;
  }

  return { put, putNew, get, getMany, remove, getAll, migrate };
})();
