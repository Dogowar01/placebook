const Trips = (() => {
  const TRIP_COLORS = ['#8B5CF6','#EC4899','#10B981','#F59E0B','#3B82F6','#EF4444'];
  let detailTripId = null;

  // ── Render ───────────────────────────────────────────────
  function render() {
    return `
      <div class="screen" id="trips-screen">
        <div class="screen-header">
          <h1>Trips</h1>
          <p>Your journeys &amp; adventures</p>
        </div>
        <div id="trips-content" class="scroll-content pb-bottom">
          ${renderTripList()}
        </div>
      </div>
    `;
  }

  function renderTripList() {
    const trips = Storage.getTrips();
    if (trips.length === 0) {
      return `
        <div class="empty-state" style="padding:40px 20px">
          <div class="big-emoji">🗂</div>
          <h2>No trips yet</h2>
          <p>Group your places into trips and adventures.</p>
          <button class="btn-primary" id="new-trip-btn" style="width:100%;max-width:240px">＋ New Trip</button>
        </div>
      `;
    }
    return `
      <button class="btn-primary" id="new-trip-btn" style="width:100%;margin-bottom:16px">＋ New Trip</button>
      ${trips.map(trip => tripCard(trip)).join('')}
    `;
  }

  function tripCard(trip) {
    const count = (trip.locationIds || []).length;
    const locs = (trip.locationIds || []).map(id => Storage.getLocation(id)).filter(Boolean);
    const photo = locs.find(l => l.photos && l.photos[0]);
    return `
      <div class="trip-card" data-trip-id="${trip.id}" style="border-left-color:${trip.color || '#8B5CF6'}">
        <div class="trip-card-body">
          <div class="trip-card-emoji">${trip.emoji || '🗺'}</div>
          <div class="trip-card-name">${Utils.escHtml(trip.name)}</div>
          ${trip.description ? `<div class="trip-card-desc">${Utils.escHtml(trip.description)}</div>` : ''}
          <div class="trip-card-meta">${count} place${count !== 1 ? 's' : ''}</div>
        </div>
        ${photo
          ? `<div class="trip-card-photo"><img src="${photo.photos[0]}" alt=""></div>`
          : `<div class="trip-card-no-photo" style="background:${(trip.color||'#8B5CF6')}20;color:${trip.color||'#8B5CF6'}">${trip.emoji || '🗺'}</div>`
        }
      </div>
    `;
  }

  // ── Trip Detail ──────────────────────────────────────────
  function renderDetail(tripId) {
    const trip = Storage.getTrip(tripId);
    if (!trip) return renderTripList();
    const locs = (trip.locationIds || []).map(id => Storage.getLocation(id)).filter(Boolean);
    return `
      <div class="trip-detail">
        <div class="trip-detail-header">
          <button class="trip-back-btn" id="trip-back">‹</button>
          <div style="flex:1;min-width:0">
            <div class="trip-detail-name">${Utils.escHtml(trip.name)}</div>
            ${trip.description ? `<div class="trip-detail-desc">${Utils.escHtml(trip.description)}</div>` : ''}
          </div>
          <button class="trip-more-btn" id="trip-more">…</button>
        </div>
        <div style="display:flex;gap:10px;margin-bottom:16px">
          <button class="btn-primary" id="trip-add-place" style="flex:1">＋ Add Place</button>
          <button class="btn-secondary" id="trip-replay-btn" style="flex:0;white-space:nowrap">▶ Replay</button>
          <button class="btn-secondary" id="trip-view-map" style="flex:0;white-space:nowrap">🗺 Map</button>
        </div>
        <div id="trip-places-list">
          ${locs.length === 0
            ? `<p style="color:var(--text-muted);font-size:14px;text-align:center;padding:20px 0">No places added yet.</p>`
            : locs.map(loc => tripPlaceRow(loc, tripId)).join('')
          }
        </div>
      </div>
    `;
  }

  function tripPlaceRow(loc, tripId) {
    const cat = Utils.category(loc.category);
    const dateStr = Utils.formatDateShort(loc.date || loc.createdAt);
    return `
      <div class="trip-place-row" data-loc-id="${loc.id}">
        <div class="trip-place-avatar" style="background:${cat.color}20;color:${cat.color}">${cat.emoji}</div>
        <div class="trip-place-info">
          <div class="trip-place-name">${Utils.escHtml(loc.name)}</div>
          <div class="trip-place-sub">${Utils.escHtml(loc.country || '')} · ${dateStr}</div>
        </div>
        <button class="trip-place-remove" data-loc-id="${loc.id}" data-trip-id="${tripId}">✕</button>
      </div>
    `;
  }

  // ── Bind ─────────────────────────────────────────────────
  function bind() {
    const content = document.getElementById('trips-content');
    if (!content) return;

    content.addEventListener('click', e => {
      // New trip button
      if (e.target.id === 'new-trip-btn' || e.target.closest('#new-trip-btn')) {
        showNewTripSheet();
        return;
      }
      // Trip card → open detail
      const card = e.target.closest('.trip-card');
      if (card) {
        detailTripId = card.dataset.tripId;
        content.innerHTML = renderDetail(detailTripId);
        bindDetail();
        return;
      }
    });
  }

  function bindDetail() {
    const content = document.getElementById('trips-content');
    if (!content) return;

    const backBtn = document.getElementById('trip-back');
    if (backBtn) backBtn.addEventListener('click', () => {
      detailTripId = null;
      content.innerHTML = renderTripList();
      bind();
    });

    const moreBtn = document.getElementById('trip-more');
    if (moreBtn) moreBtn.addEventListener('click', () => {
      const trip = Storage.getTrip(detailTripId);
      if (trip) showTripActionSheet(trip);
    });

    const addPlaceBtn = document.getElementById('trip-add-place');
    if (addPlaceBtn) addPlaceBtn.addEventListener('click', () => showAddPlaceSheet(detailTripId));

    const replayBtn = document.getElementById('trip-replay-btn');
    if (replayBtn) replayBtn.addEventListener('click', () => showTripReplay(detailTripId));

    const viewMapBtn = document.getElementById('trip-view-map');
    if (viewMapBtn) viewMapBtn.addEventListener('click', () => {
      App.switchTab('map');
      setTimeout(() => MapScreen.showTripRoute(detailTripId), 400);
    });

    content.addEventListener('click', e => {
      const removeBtn = e.target.closest('.trip-place-remove');
      if (removeBtn) {
        const locId = removeBtn.dataset.locId;
        const tripId = removeBtn.dataset.tripId;
        const trip = Storage.getTrip(tripId);
        if (!trip) return;
        const ids = (trip.locationIds || []).filter(id => id !== locId);
        Storage.updateTrip(tripId, { locationIds: ids });
        content.innerHTML = renderDetail(tripId);
        bindDetail();
      }

      const placeRow = e.target.closest('.trip-place-row:not(.trip-place-row [data-loc-id])');
      if (placeRow && !e.target.closest('.trip-place-remove')) {
        LocationDetail.open(placeRow.dataset.locId);
      }
    });
  }

  // ── New Trip Sheet ───────────────────────────────────────
  function showNewTripSheet() {
    document.querySelector('.action-sheet')?.remove();

    let selectedColor = TRIP_COLORS[0];
    let selectedEmoji = '🗺';

    const sheet = document.createElement('div');
    sheet.className = 'action-sheet';
    sheet.innerHTML = `
      <div class="action-sheet-backdrop"></div>
      <div class="action-sheet-menu">
        <div class="action-sheet-title">New Trip</div>
        <div class="field" style="margin-bottom:12px">
          <label>Trip Name *</label>
          <input id="trip-name-input" type="text" placeholder="e.g. Italy Road Trip" style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:12px;font-size:16px;color:var(--text);background:var(--surface-2)">
        </div>
        <div class="field" style="margin-bottom:12px">
          <label>Description (optional)</label>
          <input id="trip-desc-input" type="text" placeholder="A short note about this trip" style="width:100%;padding:12px 14px;border:1.5px solid var(--border);border-radius:12px;font-size:16px;color:var(--text);background:var(--surface-2)">
        </div>
        <div class="field" style="margin-bottom:12px">
          <label>Emoji</label>
          <input id="trip-emoji-input" type="text" placeholder="🗺" maxlength="2" value="🗺" style="width:60px;padding:10px;border:1.5px solid var(--border);border-radius:12px;font-size:22px;text-align:center;color:var(--text);background:var(--surface-2)">
        </div>
        <div class="field" style="margin-bottom:16px">
          <label>Color</label>
          <div class="trip-color-row" id="trip-color-row">
            ${TRIP_COLORS.map((c, i) => `<button class="trip-color-swatch${i===0?' selected':''}" data-color="${c}" style="background:${c}"></button>`).join('')}
          </div>
        </div>
        <button class="btn-primary" id="trip-create-btn" style="width:100%">Create Trip</button>
        <button class="action-sheet-btn action-sheet-btn-cancel" id="trip-cancel-btn" style="margin-top:8px">Cancel</button>
      </div>
    `;
    document.body.appendChild(sheet);

    const dismiss = () => sheet.remove();
    sheet.querySelector('.action-sheet-backdrop').addEventListener('click', dismiss);
    sheet.querySelector('#trip-cancel-btn').addEventListener('click', dismiss);

    sheet.querySelectorAll('.trip-color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        sheet.querySelectorAll('.trip-color-swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
        selectedColor = sw.dataset.color;
      });
    });

    const emojiInput = sheet.querySelector('#trip-emoji-input');
    emojiInput.addEventListener('input', () => { selectedEmoji = emojiInput.value || '🗺'; });

    sheet.querySelector('#trip-create-btn').addEventListener('click', () => {
      const name = sheet.querySelector('#trip-name-input').value.trim();
      if (!name) { sheet.querySelector('#trip-name-input').focus(); return; }
      const trip = Storage.addTrip({
        name,
        description: sheet.querySelector('#trip-desc-input').value.trim(),
        color: selectedColor,
        emoji: selectedEmoji || '🗺',
        locationIds: [],
      });
      dismiss();
      // Refresh trips list
      const content = document.getElementById('trips-content');
      if (content) { content.innerHTML = renderTripList(); bind(); }
    });
  }

  // ── Trip Action Sheet ────────────────────────────────────
  function showTripActionSheet(trip) {
    document.querySelector('.action-sheet')?.remove();

    const sheet = document.createElement('div');
    sheet.className = 'action-sheet';
    sheet.innerHTML = `
      <div class="action-sheet-backdrop"></div>
      <div class="action-sheet-menu">
        <div class="action-sheet-title">${Utils.escHtml(trip.name)}</div>
        <button class="action-sheet-btn" id="trip-as-map">🗺 View on Map</button>
        <button class="action-sheet-btn action-sheet-btn-danger" id="trip-as-delete">🗑 Delete Trip</button>
        <button class="action-sheet-btn action-sheet-btn-cancel" id="trip-as-cancel">Cancel</button>
      </div>
    `;
    document.body.appendChild(sheet);

    const dismiss = () => sheet.remove();
    sheet.querySelector('.action-sheet-backdrop').addEventListener('click', dismiss);
    sheet.querySelector('#trip-as-cancel').addEventListener('click', dismiss);

    sheet.querySelector('#trip-as-map').addEventListener('click', () => {
      dismiss();
      App.switchTab('map');
      setTimeout(() => MapScreen.showTripRoute(trip.id), 400);
    });

    sheet.querySelector('#trip-as-delete').addEventListener('click', () => {
      dismiss();
      if (!confirm(`Delete trip "${trip.name}"? This cannot be undone.`)) return;
      Storage.deleteTrip(trip.id);
      detailTripId = null;
      const content = document.getElementById('trips-content');
      if (content) { content.innerHTML = renderTripList(); bind(); }
    });
  }

  // ── Add Place to Trip Sheet ──────────────────────────────
  function showAddPlaceSheet(tripId) {
    const trip = Storage.getTrip(tripId);
    if (!trip) return;
    const existingIds = new Set(trip.locationIds || []);
    const available = Storage.getLocations().filter(l => !existingIds.has(l.id));

    document.querySelector('.action-sheet')?.remove();

    const sheet = document.createElement('div');
    sheet.className = 'action-sheet';
    sheet.innerHTML = `
      <div class="action-sheet-backdrop"></div>
      <div class="action-sheet-menu" style="max-height:70dvh;overflow-y:auto">
        <div class="action-sheet-title">Add Place to ${Utils.escHtml(trip.name)}</div>
        <input id="tap-loc-search" type="text" placeholder="Search places…" style="width:100%;padding:10px 14px;margin-bottom:12px;border:1.5px solid var(--border);border-radius:12px;font-size:15px;color:var(--text);background:var(--surface-2)">
        <div id="tap-loc-list">
          ${available.length === 0
            ? '<p style="color:var(--text-muted);text-align:center;padding:12px 0;font-size:14px">All places already added.</p>'
            : available.map(l => {
                const cat = Utils.category(l.category);
                return `<div class="tap-loc-row" data-loc-id="${l.id}">
                  <span style="font-size:20px;margin-right:10px">${cat.emoji}</span>
                  <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px;color:var(--text)">${Utils.escHtml(l.name)}</div><div style="font-size:12px;color:var(--text-muted)">${Utils.escHtml(l.country||'')} · ${cat.label}</div></div>
                </div>`;
              }).join('')
          }
        </div>
        <button class="action-sheet-btn action-sheet-btn-cancel" id="tap-cancel">Cancel</button>
      </div>
    `;
    document.body.appendChild(sheet);

    const dismiss = () => sheet.remove();
    sheet.querySelector('.action-sheet-backdrop').addEventListener('click', dismiss);
    sheet.querySelector('#tap-cancel').addEventListener('click', dismiss);

    // Search filter
    sheet.querySelector('#tap-loc-search').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      sheet.querySelectorAll('.tap-loc-row').forEach(row => {
        const name = row.querySelector('[style*="font-weight"]')?.textContent?.toLowerCase() || '';
        row.style.display = name.includes(q) ? '' : 'none';
      });
    });

    sheet.querySelector('#tap-loc-list').addEventListener('click', e => {
      const row = e.target.closest('.tap-loc-row');
      if (!row) return;
      const locId = row.dataset.locId;
      const t = Storage.getTrip(tripId);
      if (!t) return;
      const ids = [...(t.locationIds || [])];
      if (!ids.includes(locId)) ids.push(locId);
      Storage.updateTrip(tripId, { locationIds: ids });
      dismiss();
      const content = document.getElementById('trips-content');
      if (content) { content.innerHTML = renderDetail(tripId); bindDetail(); }
    });
  }

  // ── addLocationToTrip (from location detail action sheet) ─
  function addLocationToTrip(locId) {
    const trips = Storage.getTrips();
    if (trips.length === 0) {
      alert('No trips yet. Create a trip first in the Trips tab.');
      return;
    }

    document.querySelector('.action-sheet')?.remove();

    const sheet = document.createElement('div');
    sheet.className = 'action-sheet';
    sheet.innerHTML = `
      <div class="action-sheet-backdrop"></div>
      <div class="action-sheet-menu">
        <div class="action-sheet-title">Add to Trip</div>
        ${trips.map(t => `
          <button class="action-sheet-btn trip-pick-btn" data-trip-id="${t.id}">
            <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${t.color||'#8B5CF6'};margin-right:8px;vertical-align:middle"></span>
            ${Utils.escHtml(t.name)} (${(t.locationIds||[]).length} places)
          </button>
        `).join('')}
        <button class="action-sheet-btn action-sheet-btn-cancel" id="trip-pick-cancel">Cancel</button>
      </div>
    `;
    document.body.appendChild(sheet);

    const dismiss = () => sheet.remove();
    sheet.querySelector('.action-sheet-backdrop').addEventListener('click', dismiss);
    sheet.querySelector('#trip-pick-cancel').addEventListener('click', dismiss);

    sheet.querySelectorAll('.trip-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tripId = btn.dataset.tripId;
        const trip = Storage.getTrip(tripId);
        if (!trip) return;
        const ids = [...(trip.locationIds || [])];
        if (!ids.includes(locId)) ids.push(locId);
        Storage.updateTrip(tripId, { locationIds: ids });
        dismiss();
      });
    });
  }

  // ── Trip Replay Slideshow ────────────────────────────────
  function showTripReplay(tripId) {
    const trip = Storage.getTrip(tripId);
    if (!trip) return;
    const locs = (trip.locationIds || [])
      .map(id => Storage.getLocation(id))
      .filter(Boolean)
      .sort((a, b) => new Date(a.date || a.createdAt) - new Date(b.date || b.createdAt));
    if (locs.length === 0) { alert('Add some places to this trip first.'); return; }

    let idx = 0;
    let autoTimer = null;

    const overlay = document.createElement('div');
    overlay.className = 'replay-overlay';
    document.body.appendChild(overlay);

    function render() {
      const loc = locs[idx];
      const cat = Utils.category(loc.category);
      const photo = loc.photos && loc.photos[0];
      const dateStr = Utils.formatDate(loc.date || loc.createdAt);
      overlay.innerHTML = `
        <div class="replay-bg" ${photo ? `style="background-image:url('${photo}')"` : `style="background:${cat.color}22"`}></div>
        <div class="replay-scrim"></div>
        <div class="replay-top">
          <div class="replay-dots">
            ${locs.map((_, i) => `<div class="replay-dot${i === idx ? ' active' : i < idx ? ' done' : ''}"></div>`).join('')}
          </div>
          <button class="replay-close-btn" id="replay-close">✕</button>
        </div>
        ${!photo ? `<div class="replay-emoji-bg">${cat.emoji}</div>` : ''}
        <div class="replay-bottom">
          <div class="replay-cat">${cat.emoji} ${cat.label}</div>
          <div class="replay-name">${Utils.escHtml(loc.name)}</div>
          <div class="replay-sub">${Utils.escHtml(loc.country || '')}${loc.country && dateStr ? '  ·  ' : ''}${dateStr}</div>
          ${loc.rating ? `<div class="replay-stars">${'⭐'.repeat(loc.rating)}</div>` : ''}
        </div>
        <div class="replay-nav">
          <button class="replay-nav-btn" id="replay-prev" ${idx === 0 ? 'disabled' : ''}>‹</button>
          <span class="replay-counter">${idx + 1} / ${locs.length}</span>
          <button class="replay-nav-btn" id="replay-next" ${idx === locs.length - 1 ? 'disabled' : ''}>›</button>
        </div>
        <div class="replay-progress-bar"><div class="replay-progress-fill" id="replay-fill" style="animation-duration:3.5s"></div></div>
      `;
      overlay.querySelector('#replay-close').addEventListener('click', stop);
      overlay.querySelector('#replay-prev').addEventListener('click', () => { clearAuto(); if (idx > 0) { idx--; render(); } });
      overlay.querySelector('#replay-next').addEventListener('click', () => { clearAuto(); advance(); });
    }

    function advance() {
      if (idx < locs.length - 1) { idx++; render(); startAuto(); }
    }

    function clearAuto() { clearTimeout(autoTimer); const f = document.getElementById('replay-fill'); if (f) f.style.animationName = 'none'; }

    function startAuto() {
      clearAuto();
      if (idx < locs.length - 1) {
        const f = document.getElementById('replay-fill');
        if (f) { f.style.animationName = ''; void f.offsetWidth; f.classList.add('running'); }
        autoTimer = setTimeout(advance, 3500);
      }
    }

    function stop() { clearTimeout(autoTimer); overlay.remove(); }

    render();
    startAuto();
  }

  return { render, bind, addLocationToTrip };
})();
