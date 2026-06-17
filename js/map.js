const MapScreen = (() => {
  let map = null;
  let markers = {};
  let addMode = false;
  let clickListener = null;

  function render() {
    return `
      <div id="map-screen">
        <div id="leaflet-map"></div>
        <div class="map-topbar">
          <div class="map-logo">
            <span class="map-logo-emoji">📍</span>
            <div>
              <div class="map-logo-text">Placebook</div>
              <div class="map-logo-count" id="map-count">0 places</div>
            </div>
          </div>
        </div>
        <div class="add-mode-banner hidden" id="add-mode-banner">
          <span>Tap anywhere on the map to add a place</span>
          <button id="cancel-add">✕</button>
        </div>
        <button class="map-fab" id="map-fab" title="Add Place">＋</button>
      </div>
    `;
  }

  function bind() {
    if (map) { map.remove(); map = null; }
    markers = {};

    map = L.map('leaflet-map', {
      center: [30, 15],
      zoom: 2.5,
      zoomControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    // Zoom control top-right
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    // Load existing locations
    const locations = Storage.getLocations();
    locations.forEach(loc => addMarker(loc));
    updateCount();

    // FAB → add mode
    document.getElementById('map-fab').addEventListener('click', () => {
      enterAddMode();
    });

    document.getElementById('cancel-add').addEventListener('click', () => {
      exitAddMode();
    });

    // Show empty state if no locations
    if (locations.length === 0) showEmptyState();
  }

  function updateCount() {
    const locs = Storage.getLocations();
    const el = document.getElementById('map-count');
    if (el) el.textContent = `${locs.length} place${locs.length !== 1 ? 's' : ''}`;
  }

  function showEmptyState() {
    const screen = document.getElementById('map-screen');
    if (!screen || screen.querySelector('.map-empty')) return;
    screen.insertAdjacentHTML('beforeend', `
      <div class="map-empty" id="map-empty">
        <div class="map-empty-card">
          <div class="big-emoji">🌍</div>
          <h2>Your world awaits</h2>
          <p>Tap the + button to add your first place and start building your personal scrapbook.</p>
          <button class="btn-primary" id="empty-start" style="width:100%;padding:14px 20px;border-radius:14px;font-size:15px;font-weight:700;background:var(--accent);color:white;border:none;cursor:pointer">
            ＋ Add First Place
          </button>
        </div>
      </div>
    `);
    document.getElementById('empty-start').addEventListener('click', () => {
      document.getElementById('map-empty').remove();
      enterAddMode();
    });
  }

  function enterAddMode() {
    addMode = true;
    document.getElementById('leaflet-map').classList.add('add-mode');
    document.getElementById('add-mode-banner').classList.remove('hidden');
    document.getElementById('map-fab').style.display = 'none';

    clickListener = function(e) {
      exitAddMode();
      Modal.open(e.latlng, loc => {
        addMarker(loc);
        updateCount();
      });
    };
    map.once('click', clickListener);
  }

  function exitAddMode() {
    addMode = false;
    document.getElementById('leaflet-map').classList.remove('add-mode');
    const banner = document.getElementById('add-mode-banner');
    if (banner) banner.classList.add('hidden');
    const fab = document.getElementById('map-fab');
    if (fab) fab.style.display = '';
    if (clickListener) { map.off('click', clickListener); clickListener = null; }
  }

  function addMarker(loc) {
    if (!loc.lat || !loc.lng) return;
    const cat = Utils.category(loc.category);
    const icon = L.divIcon({
      html: `<div class="pb-pin" style="background:${cat.color}"><span class="pb-pin-emoji">${cat.emoji}</span></div>`,
      className: '',
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -38],
    });

    const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map);
    marker.bindPopup(buildPopup(loc), { maxWidth: 240, className: 'pb-popup' });
    marker.on('click', () => marker.openPopup());
    markers[loc.id] = marker;
  }

  function buildPopup(loc) {
    const photo = loc.photos && loc.photos[0];
    const cat = Utils.category(loc.category);
    const dateStr = Utils.formatDateShort(loc.date || loc.createdAt);
    const ratingStr = loc.rating ? '⭐'.repeat(loc.rating) : '';
    return `
      <div class="map-popup">
        ${photo
          ? `<img class="map-popup-img" src="${photo}" alt="${Utils.escHtml(loc.name)}">`
          : `<div class="map-popup-no-img" style="background:${cat.color}20">${cat.emoji}</div>`}
        <div class="map-popup-body">
          <div class="map-popup-name">${Utils.escHtml(loc.name)}</div>
          <div class="map-popup-sub">${Utils.escHtml(loc.country || '')} · ${cat.label} · ${dateStr}</div>
          ${ratingStr ? `<div class="map-popup-stars">${ratingStr}</div>` : ''}
          <a class="map-popup-link" href="#" data-open-loc="${loc.id}">Open Scrapbook →</a>
        </div>
      </div>
    `;
  }

  // Called after a location is saved to refresh a specific marker popup
  function refreshMarker(loc) {
    if (markers[loc.id]) {
      markers[loc.id].setPopupContent(buildPopup(loc));
    } else {
      addMarker(loc);
    }
    updateCount();
  }

  function removeMarker(id) {
    if (markers[id]) {
      map.removeLayer(markers[id]);
      delete markers[id];
    }
    updateCount();
  }

  function flyTo(loc) {
    if (map && loc.lat && loc.lng) {
      map.flyTo([loc.lat, loc.lng], 13, { duration: 1.2 });
    }
  }

  return { render, bind, addMarker, refreshMarker, removeMarker, flyTo, updateCount };
})();
