const MapScreen = (() => {
  let map = null;
  let markers = {};  // { id: maplibregl.Marker }
  let addMode = false;
  let clickHandler = null;

  // ── Dark neon map style ──────────────────────────────────
  const NEON_STYLE = {
    version: 8,
    glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
    sources: {
      ofm: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet',
      },
    },
    layers: [
      // Background
      { id: 'background', type: 'background',
        paint: { 'background-color': '#0B0E17' } },

      // Water
      { id: 'water-fill', type: 'fill', source: 'ofm', 'source-layer': 'water',
        paint: { 'fill-color': '#05090F' } },
      { id: 'waterway', type: 'line', source: 'ofm', 'source-layer': 'waterway',
        layout: { 'line-cap': 'round' },
        paint: { 'line-color': '#05090F', 'line-width': 1 } },

      // Land
      { id: 'landcover', type: 'fill', source: 'ofm', 'source-layer': 'landcover',
        paint: { 'fill-color': '#0C1018', 'fill-opacity': 0.8 } },
      { id: 'landuse', type: 'fill', source: 'ofm', 'source-layer': 'landuse',
        paint: { 'fill-color': '#0D1020', 'fill-opacity': 0.6 } },
      { id: 'park', type: 'fill', source: 'ofm', 'source-layer': 'park',
        paint: { 'fill-color': '#0A1510', 'fill-opacity': 0.7 } },

      // Roads — layered bottom to top
      { id: 'road-path', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: ['in', 'class', 'path', 'track'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#131820', 'line-width': 1, 'line-dasharray': [2, 3] } },

      { id: 'road-service', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: ['==', 'class', 'service'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#161B2A', 'line-width': 1.5 } },

      { id: 'road-minor', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: ['in', 'class', 'minor', 'residential'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#1D2232',
                 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 16, 4] } },

      { id: 'road-tertiary', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: ['==', 'class', 'tertiary'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#232840',
                 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 16, 5] } },

      { id: 'road-secondary', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: ['==', 'class', 'secondary'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2A3050',
                 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 1, 16, 6] } },

      { id: 'road-primary', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: ['==', 'class', 'primary'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#333A65',
                 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 1, 16, 8] } },

      { id: 'road-trunk', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: ['==', 'class', 'trunk'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#3C4478',
                 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 1.5, 16, 9] } },

      { id: 'road-motorway', type: 'line', source: 'ofm', 'source-layer': 'transportation',
        filter: ['==', 'class', 'motorway'],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#474F8A',
                 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 16, 10] } },

      // Buildings — neon green with glow (only visible when zoomed in enough)
      { id: 'building-fill', type: 'fill', source: 'ofm', 'source-layer': 'building',
        minzoom: 14,
        paint: { 'fill-color': '#080F0C', 'fill-opacity': 1 } },

      { id: 'building-glow', type: 'line', source: 'ofm', 'source-layer': 'building',
        minzoom: 14,
        paint: { 'line-color': '#00FF88', 'line-width': 4, 'line-blur': 10, 'line-opacity': 0.3 } },

      { id: 'building-outline', type: 'line', source: 'ofm', 'source-layer': 'building',
        minzoom: 14,
        paint: { 'line-color': '#00FF88', 'line-width': 0.8, 'line-opacity': 0.9 } },

      // Labels — country
      { id: 'label-country', type: 'symbol', source: 'ofm', 'source-layer': 'place',
        filter: ['==', 'class', 'country'],
        maxzoom: 7,
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Open Sans Semibold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 14],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.15,
          'text-max-width': 10,
        },
        paint: {
          'text-color': 'rgba(240,242,250,0.4)',
          'text-halo-color': 'rgba(11,14,23,0.95)',
          'text-halo-width': 2,
        } },

      // Labels — capital & city
      { id: 'label-city', type: 'symbol', source: 'ofm', 'source-layer': 'place',
        filter: ['in', 'class', 'capital', 'city'],
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Open Sans Semibold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 12, 18],
          'text-max-width': 8,
        },
        paint: {
          'text-color': 'rgba(240,242,250,0.82)',
          'text-halo-color': 'rgba(11,14,23,0.92)',
          'text-halo-width': 2,
        } },

      // Labels — town & village
      { id: 'label-town', type: 'symbol', source: 'ofm', 'source-layer': 'place',
        filter: ['in', 'class', 'town', 'village'],
        minzoom: 8,
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Open Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 15],
          'text-max-width': 8,
        },
        paint: {
          'text-color': 'rgba(240,242,250,0.6)',
          'text-halo-color': 'rgba(11,14,23,0.9)',
          'text-halo-width': 1.5,
        } },

      // Labels — neighbourhood
      { id: 'label-neighbourhood', type: 'symbol', source: 'ofm', 'source-layer': 'place',
        filter: ['in', 'class', 'suburb', 'neighbourhood'],
        minzoom: 13,
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Open Sans Regular'],
          'text-size': 11,
          'text-max-width': 6,
        },
        paint: {
          'text-color': 'rgba(240,242,250,0.38)',
          'text-halo-color': 'rgba(11,14,23,0.9)',
          'text-halo-width': 1.5,
        } },

      // Labels — road names
      { id: 'label-road', type: 'symbol', source: 'ofm', 'source-layer': 'transportation_name',
        minzoom: 13,
        layout: {
          'text-field': ['coalesce', ['get', 'name:en'], ['get', 'name']],
          'text-font': ['Open Sans Regular'],
          'text-size': 10,
          'symbol-placement': 'line',
          'text-max-angle': 30,
          'text-pitch-alignment': 'viewport',
        },
        paint: {
          'text-color': 'rgba(240,242,250,0.3)',
          'text-halo-color': 'rgba(11,14,23,0.85)',
          'text-halo-width': 1.5,
        } },
    ],
  };

  // ── Render (HTML skeleton) ───────────────────────────────
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

  // ── Bind (initialise MapLibre) ───────────────────────────
  function bind() {
    if (map) { map.remove(); map = null; }
    markers = {};

    map = new maplibregl.Map({
      container: 'leaflet-map',
      style: NEON_STYLE,
      center: [15, 30],
      zoom: 1.8,
      attributionControl: false,
      pitchWithRotate: false,
      dragRotate: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

    map.on('load', () => {
      const locations = Storage.getLocations();
      locations.forEach(loc => addMarker(loc));
      updateCount();

      const onboarding = (typeof Onboarding !== 'undefined') && Onboarding.isNeeded();
      if (locations.length === 0 && !onboarding) showEmptyState();
    });

    // Geolocation — centre and show "you are here" pulse
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        map.flyTo({ center: [lng, lat], zoom: 12 });

        const el = document.createElement('div');
        el.className = 'you-here-dot';
        new maplibregl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(map);
      }, () => {}, { timeout: 8000, enableHighAccuracy: false });
    }

    document.getElementById('map-fab').addEventListener('click', () => enterAddMode());
    document.getElementById('cancel-add').addEventListener('click', () => exitAddMode());
  }

  // ── Add / exit add mode ──────────────────────────────────
  function enterAddMode() {
    addMode = true;
    document.getElementById('leaflet-map').classList.add('add-mode');
    document.getElementById('add-mode-banner').classList.remove('hidden');
    document.getElementById('map-fab').style.display = 'none';

    clickHandler = e => {
      exitAddMode();
      Modal.open({ lat: e.lngLat.lat, lng: e.lngLat.lng }, loc => {
        addMarker(loc);
        updateCount();
      });
    };
    map.once('click', clickHandler);
  }

  function exitAddMode() {
    addMode = false;
    document.getElementById('leaflet-map').classList.remove('add-mode');
    const banner = document.getElementById('add-mode-banner');
    if (banner) banner.classList.add('hidden');
    const fab = document.getElementById('map-fab');
    if (fab) fab.style.display = '';
    if (clickHandler) { map.off('click', clickHandler); clickHandler = null; }
  }

  // ── Empty state ──────────────────────────────────────────
  function showEmptyState() {
    const screen = document.getElementById('map-screen');
    if (!screen || screen.querySelector('.map-empty')) return;
    screen.insertAdjacentHTML('beforeend', `
      <div class="map-empty" id="map-empty">
        <div class="map-empty-card">
          <div class="big-emoji">🌍</div>
          <h2>Your world awaits</h2>
          <p>Tap the + button to add your first place and start building your personal scrapbook.</p>
          <button class="btn-primary" id="empty-start" style="width:100%;padding:14px 20px;border-radius:14px;font-size:15px;font-weight:700;border:none;cursor:pointer">
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

  // ── Count ────────────────────────────────────────────────
  function updateCount() {
    const locs = Storage.getLocations();
    const el = document.getElementById('map-count');
    if (el) el.textContent = `${locs.length} place${locs.length !== 1 ? 's' : ''}`;
  }

  // ── Markers ──────────────────────────────────────────────
  function addMarker(loc) {
    if (!loc.lat || !loc.lng) return;
    const cat = Utils.category(loc.category);
    const isHome = loc.isHome || loc.category === 'home';
    const size = isHome ? 44 : 36;

    const el = document.createElement('div');
    el.className = `pb-pin${isHome ? ' pb-pin-home' : ''}`;
    el.style.cssText = `background:${cat.color};width:${size}px;height:${size}px`;
    el.innerHTML = `<span class="pb-pin-emoji">${cat.emoji}</span>`;

    const popup = new maplibregl.Popup({
      offset: [0, -(size + 4)],
      maxWidth: '240px',
      className: 'pb-popup',
      closeButton: false,
    }).setHTML(buildPopup(loc));

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([loc.lng, loc.lat])
      .setPopup(popup)
      .addTo(map);

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

  function refreshMarker(loc) {
    if (markers[loc.id]) {
      markers[loc.id].getPopup().setHTML(buildPopup(loc));
    } else {
      addMarker(loc);
    }
    updateCount();
  }

  function removeMarker(id) {
    if (markers[id]) {
      markers[id].remove();
      delete markers[id];
    }
    updateCount();
  }

  function flyTo(loc) {
    if (map && loc.lat && loc.lng) {
      map.flyTo({ center: [loc.lng, loc.lat], zoom: 14, duration: 1200 });
    }
  }

  function getCenter() {
    if (!map) return { lat: 51.5, lng: -0.12 };
    const c = map.getCenter();
    return { lat: c.lat, lng: c.lng };
  }

  function invalidateSize() {
    if (map) map.resize();
  }

  return { render, bind, addMarker, refreshMarker, removeMarker, flyTo, updateCount, getCenter, invalidateSize };
})();
