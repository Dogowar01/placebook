const App = (() => {

  const SCREENS = {
    map: MapScreen,
    timeline: Timeline,
    trips: Trips,
    food: FoodJournal,
    passport: Passport,
  };

  let currentTab = 'map';

  // Keep the Leaflet map sized correctly when the viewport changes (toolbar
  // show/hide, rotation). Layout height itself is handled in CSS via
  // 100dvh so the shell includes the bottom safe area.
  function onViewportChange() {
    if (typeof MapScreen !== 'undefined') MapScreen.invalidateSize();
  }

  // ── Web Share Target ─────────────────────────────────────
  function extractEventDate(text) {
    const now = new Date();
    const M = {
      january:0,february:1,march:2,april:3,may:4,june:5,
      july:6,august:7,september:8,october:9,november:10,december:11,
      jan:0,feb:1,mar:2,apr:3,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
    };
    // "28 June 2025" or "28 June"
    let m = text.match(/\b(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)(?:\s+(\d{4}))?\b/i);
    if (m) {
      const dt = new Date(m[3] ? +m[3] : now.getFullYear(), M[m[2].toLowerCase()], +m[1]);
      if (dt < now && !m[3]) dt.setFullYear(dt.getFullYear() + 1);
      return dt.toISOString().slice(0, 10);
    }
    // "June 28, 2025" or "June 28"
    m = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/i);
    if (m) {
      const dt = new Date(m[3] ? +m[3] : now.getFullYear(), M[m[1].toLowerCase()], +m[2]);
      if (dt < now && !m[3]) dt.setFullYear(dt.getFullYear() + 1);
      return dt.toISOString().slice(0, 10);
    }
    // dd/mm/yyyy
    m = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    if (m) {
      let y = +m[3]; if (y < 100) y += 2000;
      return new Date(y, +m[2] - 1, +m[1]).toISOString().slice(0, 10);
    }
    return now.toISOString().slice(0, 10);
  }

  function extractEventAddress(text, excludeName) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l && l !== excludeName);
    const streetLine = lines.find(l => /^\d+\s+[A-Za-z]/.test(l));
    if (streetLine) return streetLine;
    return lines.find(l =>
      /\b(street|st\b|road|rd\b|avenue|ave\b|drive|dr\b|lane|ln\b|highway|hwy|way|place|pl\b|court|ct\b|square|park|boulevard|blvd|crescent|close|grove)\b/i.test(l)
    ) || '';
  }

  function parseSharedEvent(title, text, url) {
    const combined = [title, text].filter(Boolean).join('\n');
    const lines    = combined.split('\n').map(l => l.trim()).filter(Boolean);
    const name     = (title || lines[0] || '').slice(0, 80);
    const date     = extractEventDate(combined);
    const address  = extractEventAddress(combined, name);
    const notes    = (url ? `${combined}\n\n${url}` : combined).trim().slice(0, 600);
    return { name, date, address, notes };
  }

  async function handleShareTarget() {
    const params = new URLSearchParams(window.location.search);
    const title  = params.get('title') || '';
    const text   = params.get('text')  || '';
    const url    = params.get('url')   || '';
    if (!title && !text && !url) return;

    // Strip params so a reload doesn't re-trigger
    window.history.replaceState({}, '', window.location.pathname);

    const parsed = parseSharedEvent(title, text, url);

    let lat = 0, lng = 0;
    if (parsed.address) {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(parsed.address)}&format=json&limit=1`);
        const results = await r.json();
        if (results.length) { lat = +results[0].lat; lng = +results[0].lon; }
      } catch {}
    }

    // Wait for MapLibre to initialise before flying / opening modal
    setTimeout(() => {
      if (!lat) { const c = MapScreen.getCenter(); lat = c.lat; lng = c.lng; }
      MapScreen.flyTo({ lat, lng });
      setTimeout(() => {
        Modal.open({ lat, lng }, loc => {
          MapScreen.addMarker(loc);
          MapScreen.refreshMarker(loc);
          MapScreen.updateCount();
        }, {
          name:     parsed.name,
          date:     parsed.date,
          notes:    parsed.notes,
          category: 'market',
        });
      }, 800);
    }, 1500);
  }

  async function migratePhotosToIDB() {
    const locs = Storage.getLocations();
    let n = 0;
    for (const loc of locs) {
      if (loc.photos && loc.photos.length && !loc.photoIds) {
        const ids = await PhotoDB.migrate(loc.photos);
        Storage.updateLocation(loc.id, { photoIds: ids, photos: undefined });
        n++;
      }
    }
    if (n) console.log(`[Placebook] migrated ${n} location(s) photos → IndexedDB`);
  }

  function init() {
    Modal.init();
    migratePhotosToIDB();
    handleShareTarget();

    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', () => setTimeout(onViewportChange, 120));

    // Tab navigation
    document.getElementById('bottom-nav').addEventListener('click', e => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      switchTab(tab.dataset.tab);
    });

    // Delegate popup "Open Scrapbook" clicks (bubble up from Leaflet)
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-open-loc]');
      if (a) { e.preventDefault(); LocationDetail.open(a.dataset.openLoc); }
    });

    // Register service worker. updateViaCache:'none' forces the browser to
    // always re-fetch sw.js from the network so new deploys are detected.
    // When a new worker takes control, reload once so the fresh build shows.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    }

    // Render map first so Leaflet can initialise
    renderCurrent();

    // Show onboarding on first launch
    if (Onboarding.isNeeded()) {
      Onboarding.start();
    }
  }

  function switchTab(tab) {
    if (tab === currentTab) return;
    currentTab = tab;

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

    renderCurrent();
  }

  function renderCurrent() {
    const screen = SCREENS[currentTab];
    if (!screen) return;

    const container = document.getElementById('screen-container');
    container.innerHTML = screen.render();
    if (typeof screen.bind === 'function') screen.bind();
  }

  return { init, renderCurrent, switchTab };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
