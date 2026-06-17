const Storage = (() => {
  const KEYS = {
    locations: 'pb_locations',
    settings: 'pb_settings',
  };

  function getLocations() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.locations) || '[]');
    } catch { return []; }
  }

  function saveLocations(locations) {
    localStorage.setItem(KEYS.locations, JSON.stringify(locations));
  }

  function addLocation(loc) {
    const locations = getLocations();
    loc.id = loc.id || Utils.generateId();
    loc.createdAt = loc.createdAt || new Date().toISOString();
    locations.unshift(loc);
    saveLocations(locations);
    return loc;
  }

  function updateLocation(id, updates) {
    const locations = getLocations();
    const i = locations.findIndex(l => l.id === id);
    if (i === -1) return null;
    locations[i] = { ...locations[i], ...updates, updatedAt: new Date().toISOString() };
    saveLocations(locations);
    return locations[i];
  }

  function deleteLocation(id) {
    const locations = getLocations().filter(l => l.id !== id);
    saveLocations(locations);
  }

  function getLocation(id) {
    return getLocations().find(l => l.id === id) || null;
  }

  function getSettings() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.settings) || '{}');
    } catch { return {}; }
  }

  function saveSetting(key, value) {
    const s = getSettings();
    s[key] = value;
    localStorage.setItem(KEYS.settings, JSON.stringify(s));
  }

  // Compress image to base64 data URL (max 800px, 0.7 quality)
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          const MAX = 800;
          let { width: w, height: h } = img;
          if (w > MAX || h > MAX) {
            if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
            else { w = Math.round(w * MAX / h); h = MAX; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.72));
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return { getLocations, addLocation, updateLocation, deleteLocation, getLocation, getSettings, saveSetting, compressImage };
})();
