const Storage = (() => {
  const KEYS = {
    locations: 'pb_locations',
    settings: 'pb_settings',
    trips: 'pb_trips',
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

  // ── Trips ────────────────────────────────────────────────
  function getTrips() {
    try {
      return JSON.parse(localStorage.getItem(KEYS.trips) || '[]');
    } catch { return []; }
  }

  function saveTrips(trips) {
    localStorage.setItem(KEYS.trips, JSON.stringify(trips));
  }

  function addTrip(trip) {
    const trips = getTrips();
    trip.id = trip.id || Utils.generateId();
    trip.createdAt = trip.createdAt || new Date().toISOString();
    trip.locationIds = trip.locationIds || [];
    trips.unshift(trip);
    saveTrips(trips);
    return trip;
  }

  function updateTrip(id, updates) {
    const trips = getTrips();
    const i = trips.findIndex(t => t.id === id);
    if (i === -1) return null;
    trips[i] = { ...trips[i], ...updates, updatedAt: new Date().toISOString() };
    saveTrips(trips);
    return trips[i];
  }

  function deleteTrip(id) {
    saveTrips(getTrips().filter(t => t.id !== id));
  }

  function getTrip(id) {
    return getTrips().find(t => t.id === id) || null;
  }

  // ── Backup ───────────────────────────────────────────────
  function exportBackup() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const data = {
      version: 1,
      exportedAt: now.toISOString(),
      locations: getLocations(),
      trips: getTrips(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placebook-backup-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importBackup(jsonStr) {
    const data = JSON.parse(jsonStr);
    if (!data || data.version !== 1) throw new Error('Invalid backup format');
    if (Array.isArray(data.locations)) saveLocations(data.locations);
    if (Array.isArray(data.trips)) saveTrips(data.trips);
    return { locations: (data.locations || []).length, trips: (data.trips || []).length };
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

  return {
    getLocations, addLocation, updateLocation, deleteLocation, getLocation,
    getSettings, saveSetting, compressImage,
    getTrips, saveTrips, addTrip, updateTrip, deleteTrip, getTrip,
    exportBackup, importBackup,
  };
})();
