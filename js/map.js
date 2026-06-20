const MapScreen = (() => {
  let map = null;
  let markers = {};  // { id: maplibregl.Marker }
  let addMode = false;
  let clickHandler = null;
  let activeFilters = { query: '', categories: [], wishlist: null };
  let geocodeTimer = null;
  let heatmapActive = false;

  const WMO = {
    0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',
    51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',
    71:'🌨',73:'🌨',75:'❄️',77:'🌨',80:'🌦',81:'🌧',82:'⛈',
    85:'🌨',86:'❄️',95:'⛈',96:'⛈',99:'⛈',
  };

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

      // Water — near-black fill, soft neon blue gradient glow at edges
      // No sharp line; all layers are heavily blurred so they blend into
      // a smooth luminous halo that fades toward the dark centre.
      { id: 'water-fill', type: 'fill', source: 'ofm', 'source-layer': 'water',
        paint: { 'fill-color': '#010509' } },
      // Ambient bloom (very wide, faint — sets the overall colour cast)
      { id: 'water-glow-1', type: 'line', source: 'ofm', 'source-layer': 'water',
        paint: { 'line-color': '#0044AA', 'line-width': 28, 'line-blur': 40, 'line-opacity': 0.18 } },
      // Wide soft gradient step
      { id: 'water-glow-2', type: 'line', source: 'ofm', 'source-layer': 'water',
        paint: { 'line-color': '#0077CC', 'line-width': 14, 'line-blur': 22, 'line-opacity': 0.22 } },
      // Mid gradient step
      { id: 'water-glow-3', type: 'line', source: 'ofm', 'source-layer': 'water',
        paint: { 'line-color': '#00AAEE', 'line-width': 6,  'line-blur': 10, 'line-opacity': 0.3 } },
      // Bright inner step — still blurred, no hard edge
      { id: 'water-glow-4', type: 'line', source: 'ofm', 'source-layer': 'water',
        paint: { 'line-color': '#00CCFF', 'line-width': 2,  'line-blur': 4,  'line-opacity': 0.45 } },
      // Waterways (rivers/streams) — same soft glow, no hard edge
      { id: 'waterway', type: 'line', source: 'ofm', 'source-layer': 'waterway',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#00AAEE',
                 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 14, 6],
                 'line-blur': 6, 'line-opacity': 0.4 } },

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

  // ── GeoJSON helpers ──────────────────────────────────────
  function locationsToGeoJson(locs) {
    return {
      type: 'FeatureCollection',
      features: (locs || [])
        .filter(l => l.lat && l.lng)
        .map(l => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [l.lng, l.lat] },
          properties: { id: l.id },
        })),
    };
  }

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
          <div class="map-topbar-actions">
            <button class="map-icon-btn" id="map-paste-btn" title="Paste & Add">📋</button>
            <button class="map-icon-btn" id="map-heat-btn" title="Heatmap">🔥</button>
            <button class="map-icon-btn" id="map-search-btn" title="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </div>
        </div>

        <!-- Search overlay -->
        <div class="search-overlay hidden" id="search-overlay">
          <div class="search-box">
            <input type="text" id="search-input" placeholder="Search places or find address…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
            <button id="search-clear" class="map-icon-btn" style="flex-shrink:0;width:32px;height:32px">✕</button>
          </div>
          <div class="filter-chip-row" style="margin-top:10px;display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;padding-bottom:2px">
            <button class="filter-chip active" data-wl="all">All</button>
            <button class="filter-chip" data-wl="visited">✓ Visited</button>
            <button class="filter-chip" data-wl="wishlist">📌 Wishlist</button>
          </div>
          <div class="search-cat-chips" id="search-cat-chips">
            ${Utils.allCategories().map(c => `<button class="filter-chip" data-cat="${c.key}">${c.emoji} ${c.label}</button>`).join('')}
          </div>
          <div class="search-results-list hidden" id="search-results-list"></div>
        </div>

        <!-- On This Day banner -->
        <div class="on-this-day-banner hidden" id="on-this-day-banner">
          <span class="otd-emoji">📅</span>
          <span class="otd-text" id="otd-text"></span>
          <button class="otd-dismiss" id="otd-dismiss">✕</button>
        </div>

        <div class="add-mode-banner hidden" id="add-mode-banner">
          <span>Tap anywhere on the map to add a place</span>
          <div style="display:flex;align-items:center;gap:8px">
            <button id="add-gps-btn" class="add-mode-gps-btn">📍 Use GPS</button>
            <button id="cancel-add">✕</button>
          </div>
        </div>
        <button class="map-fab" id="map-fab" title="Add Place">＋</button>
        <div class="weather-widget hidden" id="weather-widget">
          <span id="weather-icon"></span>
          <span id="weather-temp"></span>
        </div>
      </div>
    `;
  }

  // ── Bind (initialise MapLibre) ───────────────────────────
  function bind() {
    if (map) { map.remove(); map = null; }
    markers = {};
    activeFilters = { query: '', categories: [], wishlist: null };

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

      // ── Cluster source & layers ──────────────────────────
      map.addSource('pb-cluster', {
        type: 'geojson',
        data: locationsToGeoJson(locations),
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 65,
      });

      map.addLayer({
        id: 'pb-cluster-glow',
        type: 'circle',
        source: 'pb-cluster',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': 'rgba(139,92,246,0.25)',
          'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 2, 28, 10, 44],
          'circle-blur': 1,
        },
      });

      map.addLayer({
        id: 'pb-clusters',
        type: 'circle',
        source: 'pb-cluster',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#8B5CF6',
          'circle-radius': ['interpolate', ['linear'], ['get', 'point_count'], 2, 18, 10, 30],
          'circle-stroke-width': 2,
          'circle-stroke-color': 'rgba(255,255,255,0.3)',
        },
      });

      map.addLayer({
        id: 'pb-cluster-count',
        type: 'symbol',
        source: 'pb-cluster',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['Open Sans Semibold'],
          'text-size': 14,
        },
        paint: { 'text-color': '#fff' },
      });

      // Cluster click → expand
      map.on('click', 'pb-clusters', e => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['pb-clusters'] });
        if (!features.length) return;
        const clusterId = features[0].properties.cluster_id;
        map.getSource('pb-cluster').getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          map.easeTo({ center: features[0].geometry.coordinates, zoom: zoom + 0.5 });
        });
      });

      map.on('mouseenter', 'pb-clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'pb-clusters', () => { map.getCanvas().style.cursor = ''; });

      map.on('zoomend', syncMarkerVisibility);
      map.on('moveend', syncMarkerVisibility);

      // Add individual markers
      locations.forEach(loc => addMarker(loc));
      syncMarkerVisibility();
      updateCount();

      const onboarding = (typeof Onboarding !== 'undefined') && Onboarding.isNeeded();
      if (locations.length === 0 && !onboarding) showEmptyState();

      // On This Day check
      checkOnThisDay();
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

    // GPS add button
    document.getElementById('add-gps-btn').addEventListener('click', () => {
      if (!navigator.geolocation) { alert('Geolocation not supported'); return; }
      navigator.geolocation.getCurrentPosition(pos => {
        exitAddMode();
        Modal.open({ lat: pos.coords.latitude, lng: pos.coords.longitude }, loc => {
          addMarker(loc);
          refreshClusterSource();
          syncMarkerVisibility();
          updateCount();
        });
      }, () => alert('Could not get GPS location'), { timeout: 10000, enableHighAccuracy: true });
    });

    // Heatmap toggle
    document.getElementById('map-heat-btn').addEventListener('click', () => {
      heatmapActive = !heatmapActive;
      document.getElementById('map-heat-btn').classList.toggle('map-icon-btn-active', heatmapActive);
      if (heatmapActive) {
        if (!map.getSource('pb-heat')) {
          map.addSource('pb-heat', { type: 'geojson', data: locationsToGeoJson(Storage.getLocations()) });
        }
        if (!map.getLayer('pb-heatmap')) {
          map.addLayer({
            id: 'pb-heatmap',
            type: 'heatmap',
            source: 'pb-heat',
            paint: {
              'heatmap-weight': 1,
              'heatmap-intensity': ['interpolate',['linear'],['zoom'], 0,1, 15,3],
              'heatmap-color': ['interpolate',['linear'],['heatmap-density'],
                0,'rgba(0,0,0,0)',
                0.2,'rgba(139,92,246,0.4)',
                0.5,'rgba(167,139,250,0.75)',
                0.8,'rgba(216,180,254,0.9)',
                1,'rgba(255,255,255,1)',
              ],
              'heatmap-radius': ['interpolate',['linear'],['zoom'], 0,22, 15,70],
              'heatmap-opacity': 0.88,
            },
          }, 'pb-cluster-glow');
        }
      } else {
        if (map.getLayer('pb-heatmap')) map.removeLayer('pb-heatmap');
        if (map.getSource('pb-heat'))   map.removeSource('pb-heat');
      }
    });

    // Paste & Add
    document.getElementById('map-paste-btn').addEventListener('click', () => App.pasteAndAdd());

    // Weather fetch
    fetchWeather();

    // Pull-down on map to refresh weather
    let pullStartY = 0;
    const mapEl = document.getElementById('leaflet-map');
    mapEl.addEventListener('touchstart', e => {
      if (e.touches.length === 1) pullStartY = e.touches[0].clientY;
    }, { passive: true });
    mapEl.addEventListener('touchend', e => {
      if (e.changedTouches[0].clientY - pullStartY > 90) fetchWeather();
    }, { passive: true });

    // Search toggle
    document.getElementById('map-search-btn').addEventListener('click', () => {
      const overlay = document.getElementById('search-overlay');
      overlay.classList.toggle('hidden');
      if (!overlay.classList.contains('hidden')) {
        setTimeout(() => document.getElementById('search-input').focus(), 50);
      }
    });

    // Search input — filter saved places + trigger geocoding
    document.getElementById('search-input').addEventListener('input', e => {
      const q = e.target.value.trim();
      activeFilters.query = q.toLowerCase();
      applyFilters();
      updateSearchResults(q);
    });

    // Clear/close search
    document.getElementById('search-clear').addEventListener('click', closeSearch);

    // Results list — click to fly to saved place or geocode result
    document.getElementById('search-results-list').addEventListener('click', e => {
      const item = e.target.closest('.search-result-item');
      if (!item) return;
      if (item.dataset.locId) {
        const loc = Storage.getLocations().find(l => l.id === item.dataset.locId);
        if (loc) {
          closeSearch();
          map.flyTo({ center: [loc.lng, loc.lat], zoom: Math.max(map.getZoom(), 14) });
          setTimeout(() => { const m = markers[loc.id]; if (m) m.togglePopup(); }, 700);
        }
      } else if (item.dataset.lat) {
        closeSearch();
        map.flyTo({ center: [+item.dataset.lon, +item.dataset.lat], zoom: 14 });
      }
    });

    // Wishlist filter chips
    document.querySelectorAll('.filter-chip[data-wl]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip[data-wl]').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const wl = btn.dataset.wl;
        activeFilters.wishlist = wl === 'all' ? null : wl === 'wishlist';
        applyFilters();
      });
    });

    // Category filter chips
    document.querySelectorAll('.filter-chip[data-cat]').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('active');
        const key = btn.dataset.cat;
        const idx = activeFilters.categories.indexOf(key);
        if (idx >= 0) activeFilters.categories.splice(idx, 1);
        else activeFilters.categories.push(key);
        applyFilters();
      });
    });
  }

  // ── Weather ──────────────────────────────────────────────
  function fetchWeather() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lon } = pos.coords;
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius&timezone=auto`)
        .then(r => r.json())
        .then(d => {
          const temp = Math.round(d.current.temperature_2m);
          const code = d.current.weather_code;
          const icon = WMO[code] || '🌡️';
          const w = document.getElementById('weather-widget');
          if (!w) return;
          document.getElementById('weather-icon').textContent = icon;
          document.getElementById('weather-temp').textContent = `${temp}°`;
          w.classList.remove('hidden');
        })
        .catch(() => {});
    }, () => {}, { timeout: 8000 });
  }

  // ── Search helpers ───────────────────────────────────────
  function closeSearch() {
    clearTimeout(geocodeTimer);
    document.getElementById('search-input').value = '';
    activeFilters.query = '';
    activeFilters.categories = [];
    activeFilters.wishlist = null;
    document.getElementById('search-overlay').classList.add('hidden');
    const list = document.getElementById('search-results-list');
    list.classList.add('hidden');
    list.innerHTML = '';
    document.querySelectorAll('.filter-chip[data-wl]').forEach(c => c.classList.toggle('active', c.dataset.wl === 'all'));
    document.querySelectorAll('.filter-chip[data-cat]').forEach(c => c.classList.remove('active'));
    applyFilters();
  }

  function updateSearchResults(q) {
    const list = document.getElementById('search-results-list');
    clearTimeout(geocodeTimer);
    if (!q) {
      list.classList.add('hidden');
      list.innerHTML = '';
      return;
    }
    const ql = q.toLowerCase();
    const locs = Storage.getLocations().filter(l =>
      (l.name || '').toLowerCase().includes(ql) ||
      (l.country || '').toLowerCase().includes(ql)
    ).slice(0, 5);

    let html = locs.map(l => {
      const cat = Utils.category(l.category);
      return `<div class="search-result-item" data-loc-id="${l.id}">
        <span class="search-result-icon" style="background:${cat.color}22">${cat.emoji}</span>
        <div class="search-result-info">
          <div class="search-result-name">${Utils.escHtml(l.name)}</div>
          <div class="search-result-sub">${Utils.escHtml(l.country || '')}${l.country ? ' · ' : ''}${cat.label}</div>
        </div>
      </div>`;
    }).join('');

    html += `<div class="search-result-item search-result-addr" id="search-geocode-row" data-lat="" data-lon="">
      <span class="search-result-icon">🗺️</span>
      <div class="search-result-info">
        <div class="search-result-name">Find "${Utils.escHtml(q)}" on map</div>
        <div class="search-result-sub">Searching addresses…</div>
      </div>
    </div>`;

    list.innerHTML = html;
    list.classList.remove('hidden');

    if (q.length >= 2) {
      geocodeTimer = setTimeout(() => geocodeAndShowResults(q), 600);
    }
  }

  function geocodeAndShowResults(q) {
    const list = document.getElementById('search-results-list');
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=4&addressdetails=0`)
      .then(r => r.json())
      .then(results => {
        const row = list.querySelector('#search-geocode-row');
        if (!row) return;
        if (results.length === 0) {
          row.querySelector('.search-result-sub').textContent = 'No address results found';
          row.dataset.lat = '';
          return;
        }
        row.parentNode.removeChild(row);
        results.forEach(r => {
          const parts = r.display_name.split(',');
          const name = parts[0].trim();
          const sub = parts.slice(1, 4).join(',').trim();
          const el = document.createElement('div');
          el.className = 'search-result-item search-result-addr';
          el.dataset.lat = r.lat;
          el.dataset.lon = r.lon;
          el.innerHTML = `<span class="search-result-icon">🗺️</span>
            <div class="search-result-info">
              <div class="search-result-name">${Utils.escHtml(name)}</div>
              <div class="search-result-sub">${Utils.escHtml(sub)}</div>
            </div>`;
          list.appendChild(el);
        });
      })
      .catch(() => {
        const row = document.getElementById('search-geocode-row');
        if (row) row.querySelector('.search-result-sub').textContent = 'Could not reach address search';
      });
  }

  // ── Cluster source refresh ───────────────────────────────
  function refreshClusterSource() {
    if (!map || !map.getSource('pb-cluster')) return;
    const locs = getFilteredLocations();
    map.getSource('pb-cluster').setData(locationsToGeoJson(locs));
  }

  // ── Filter helpers ───────────────────────────────────────
  function getFilteredLocations() {
    let locs = Storage.getLocations();
    const { query, categories, wishlist } = activeFilters;
    if (query) {
      locs = locs.filter(l =>
        (l.name || '').toLowerCase().includes(query) ||
        (l.country || '').toLowerCase().includes(query)
      );
    }
    if (categories.length > 0) {
      locs = locs.filter(l => categories.includes(l.category));
    }
    if (wishlist !== null) {
      locs = locs.filter(l => !!l.wishlist === wishlist);
    }
    return locs;
  }

  function applyFilters() {
    const filtered = getFilteredLocations();
    const filteredIds = new Set(filtered.map(l => l.id));

    if (map && map.getSource('pb-cluster')) {
      map.getSource('pb-cluster').setData(locationsToGeoJson(filtered));
    }

    Object.entries(markers).forEach(([id, marker]) => {
      marker.getElement().style.visibility = filteredIds.has(id) ? '' : 'hidden';
    });

    syncMarkerVisibility();
  }

  // Above clusterMaxZoom (11) no clusters exist — show all filtered markers.
  // Below it, clusters cover groups of pins — hide individual markers so they
  // don't render on top of the cluster circles.
  function syncMarkerVisibility() {
    if (!map) return;
    const filtered = getFilteredLocations();
    const filteredIds = new Set(filtered.map(l => l.id));
    const aboveClusterZoom = map.getZoom() >= 11;

    Object.entries(markers).forEach(([id, marker]) => {
      marker.getElement().style.visibility =
        (filteredIds.has(id) && aboveClusterZoom) ? '' : 'hidden';
    });
  }

  // ── On This Day ──────────────────────────────────────────
  function checkOnThisDay() {
    const today = new Date();
    const todayMD = `${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
    const currentYear = today.getFullYear();

    const locations = Storage.getLocations().filter(l => !l.wishlist && l.date);
    const match = locations.find(l => {
      const d = new Date(l.date);
      const lMD = `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return lMD === todayMD && d.getFullYear() < currentYear;
    });

    if (!match) return;

    const yearsAgo = currentYear - new Date(match.date).getFullYear();
    const banner = document.getElementById('on-this-day-banner');
    const text = document.getElementById('otd-text');
    if (!banner || !text) return;

    text.textContent = `${yearsAgo} year${yearsAgo !== 1 ? 's' : ''} ago today — You visited ${match.name}${match.country ? ', ' + match.country : ''}`;
    banner.classList.remove('hidden');

    banner.addEventListener('click', e => {
      if (e.target.id === 'otd-dismiss' || e.target.className === 'otd-dismiss') return;
      LocationDetail.open(match.id);
    });

    document.getElementById('otd-dismiss').addEventListener('click', e => {
      e.stopPropagation();
      banner.classList.add('hidden');
    });
  }

  // ── Add / exit add mode ──────────────────────────────────
  function enterAddMode() {
    addMode = true;
    document.getElementById('leaflet-map').classList.add('add-mode');
    document.getElementById('add-mode-banner').classList.remove('hidden');
    document.getElementById('map-fab').style.display = 'none';

    clickHandler = e => {
      if (navigator.vibrate) navigator.vibrate(10);
      exitAddMode();
      Modal.open({ lat: e.lngLat.lat, lng: e.lngLat.lng }, loc => {
        addMarker(loc);
        refreshClusterSource();
        syncMarkerVisibility();
        updateCount();
      });
    };
    map.once('click', clickHandler);
  }

  function exitAddMode() {
    addMode = false;
    document.getElementById('leaflet-map').classList.remove('add-mode');
    const banner = document.getElementById('add-mode-banner');
    if (banner) {
      banner.classList.add('hidden');
      const span = banner.querySelector('span');
      if (span) span.textContent = 'Tap anywhere on the map to add a place';
      const gps = document.getElementById('add-gps-btn');
      if (gps) gps.style.display = '';
    }
    const fab = document.getElementById('map-fab');
    if (fab) fab.style.display = '';
    if (clickHandler) { map.off('click', clickHandler); clickHandler = null; }
  }

  function startMoveMode(loc) {
    addMode = true;
    const banner = document.getElementById('add-mode-banner');
    if (banner) {
      banner.querySelector('span').textContent = `Tap new location for "${loc.name.slice(0, 22)}"`;
      const gps = document.getElementById('add-gps-btn');
      if (gps) gps.style.display = 'none';
      banner.classList.remove('hidden');
    }
    document.getElementById('leaflet-map').classList.add('add-mode');
    const fab = document.getElementById('map-fab');
    if (fab) fab.style.display = 'none';

    clickHandler = e => {
      if (navigator.vibrate) navigator.vibrate(10);
      const updated = Storage.updateLocation(loc.id, { lat: e.lngLat.lat, lng: e.lngLat.lng });
      if (markers[loc.id]) { markers[loc.id].remove(); delete markers[loc.id]; }
      if (updated) addMarker(updated);
      refreshClusterSource();
      syncMarkerVisibility();
      exitAddMode();
    };
    map.once('click', clickHandler);
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

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#',''), 16);
    return `${(n>>16)&255},${(n>>8)&255},${n&255}`;
  }

  // ── Markers ──────────────────────────────────────────────
  function addMarker(loc) {
    if (!loc.lat || !loc.lng) return;
    const cat = Utils.category(loc.category);
    const isHome = loc.isHome || loc.category === 'home';
    const size = isHome ? 44 : 36;
    const pinH = Math.round(size * 1.4);

    const el = document.createElement('div');
    el.className = `pb-pin${isHome ? ' pb-pin-home' : ''}${loc.wishlist ? ' pb-pin-wishlist' : ''}`;
    const animDelay = -(Math.random() * 3).toFixed(2);
    const rgb = hexToRgb(cat.color);
    el.style.cssText = `width:${size}px;height:${pinH}px;cursor:pointer;--pin-delay:${animDelay}s;--pc:${rgb}`;

    const fillOpacity = loc.wishlist ? '0.35' : '1';
    const strokeDash = loc.wishlist ? 'stroke-dasharray="5 3"' : '';

    el.innerHTML = `
      <svg viewBox="0 0 36 50" xmlns="http://www.w3.org/2000/svg" class="${loc.wishlist ? '' : 'pin-svg'}" style="width:100%;height:100%;display:block">
        <path d="M18 1C8.6 1 1 8.6 1 18c0 13.1 15.4 29.8 16.3 30.8a.9.9 0 0 0 1.4 0C18.6 47.8 35 31.1 35 18 35 8.6 27.4 1 18 1z"
              fill="${cat.color}" fill-opacity="${fillOpacity}" stroke="rgba(255,255,255,0.9)" stroke-width="1.5" ${strokeDash}/>
      </svg>
      <span class="pb-pin-emoji">${cat.emoji}</span>
    `;

    // Photo count badge
    const photoCount = (loc.photoIds || loc.photos || []).length;
    if (photoCount > 0) {
      const badge = document.createElement('span');
      badge.className = 'pb-pin-badge';
      badge.textContent = photoCount;
      el.appendChild(badge);
    }

    const popup = new maplibregl.Popup({
      offset: [0, -(pinH + 4)],
      maxWidth: '240px',
      className: 'pb-popup',
      closeButton: false,
    }).setHTML(buildPopup(loc));

    const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
      .setLngLat([loc.lng, loc.lat])
      .setPopup(popup)
      .addTo(map);

    markers[loc.id] = marker;

    // Async load first photo for popup if stored in IDB
    if (loc.photoIds && loc.photoIds.length && !(loc.photos && loc.photos.length)) {
      PhotoDB.get(loc.photoIds[0]).then(dataUrl => {
        if (dataUrl && markers[loc.id]) {
          markers[loc.id].getPopup().setHTML(buildPopup({ ...loc, photos: [dataUrl] }));
        }
      }).catch(() => {});
    }
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
          <div class="map-popup-name">${Utils.escHtml(loc.name)}${loc.wishlist ? ' <span style="font-size:11px;color:#A78BFA">📌 Wishlist</span>' : ''}</div>
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
    refreshClusterSource();
    updateCount();
  }

  function removeMarker(id) {
    if (markers[id]) {
      markers[id].remove();
      delete markers[id];
    }
    refreshClusterSource();
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

  // ── Trip Route ───────────────────────────────────────────
  function showTripRoute(tripId) {
    if (!map) return;
    const trip = Storage.getTrip(tripId);
    if (!trip || !trip.locationIds || !trip.locationIds.length) return;

    const locs = trip.locationIds
      .map(id => Storage.getLocation(id))
      .filter(Boolean)
      .filter(l => l.lat && l.lng)
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));

    if (locs.length < 2) return;

    const color = trip.color || '#8B5CF6';
    const coords = locs.map(l => [l.lng, l.lat]);

    // Remove old route layers/source
    ['trip-route-glow', 'trip-route-line'].forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });
    if (map.getSource('trip-route')) map.removeSource('trip-route');

    map.addSource('trip-route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords },
      },
    });

    map.addLayer({
      id: 'trip-route-glow',
      type: 'line',
      source: 'trip-route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': color,
        'line-width': 12,
        'line-blur': 8,
        'line-opacity': 0.45,
      },
    });

    map.addLayer({
      id: 'trip-route-line',
      type: 'line',
      source: 'trip-route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': color,
        'line-width': 2.5,
        'line-dasharray': [4, 3],
        'line-opacity': 0.9,
      },
    });

    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    map.fitBounds(
      [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
      { padding: 80, duration: 1000 }
    );
  }

  return { render, bind, addMarker, refreshMarker, removeMarker, flyTo, updateCount, getCenter, invalidateSize, showTripRoute, applyFilters, startMoveMode };
})();
