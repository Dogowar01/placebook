const LocationDetail = (() => {

  let currentId = null;

  // Deterministic rotation pattern so styles are consistent on re-open
  const ROTATIONS = [-3, 2.5, -4, 1.5, -2, 3.5, -1, 4, -3.5, 2, -1.5, 3];
  const STYLES    = ['polaroid', 'stamp', 'postcard'];

  async function open(id) {
    const loc = Storage.getLocation(id);
    if (!loc) return;
    currentId = id;

    // Load photos from IndexedDB
    if (loc.photoIds && loc.photoIds.length) {
      const urls = await PhotoDB.getMany(loc.photoIds);
      loc.photos = urls.filter(Boolean);
    } else if (!loc.photos) {
      loc.photos = [];
    }

    const panel = document.getElementById('detail-panel');
    panel.innerHTML = buildHtml(loc);
    panel.classList.remove('hidden');

    panel.classList.add('sliding');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { panel.classList.add('visible'); });
    });

    Themes.applyToEl(panel, loc.theme || 'modern');
    bindEvents(loc);
    bindSwipeNav(loc);
  }

  function bindSwipeNav(loc) {
    const panel = document.getElementById('detail-panel');
    if (!panel) return;
    const allLocs = Storage.getLocations();
    const idx = allLocs.findIndex(l => l.id === loc.id);
    if (allLocs.length < 2 || idx === -1) return;
    let sx = 0, sy = 0;
    panel.addEventListener('touchstart', e => {
      sx = e.touches[0].clientX;
      sy = e.touches[0].clientY;
    }, { passive: true });
    panel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - sx;
      const dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0 && idx < allLocs.length - 1) open(allLocs[idx + 1].id);
      else if (dx > 0 && idx > 0) open(allLocs[idx - 1].id);
    }, { passive: true });
  }

  function close() {
    const panel = document.getElementById('detail-panel');
    panel.classList.remove('visible');
    setTimeout(() => {
      panel.classList.remove('sliding');
      panel.classList.add('hidden');
      panel.innerHTML = '';
      currentId = null;
    }, 320);
  }

  function buildHtml(loc) {
    const t = Themes.get(loc.theme || 'modern');
    const cat = Utils.category(loc.category);
    const photo0 = loc.photos && loc.photos[0];
    const dateStr = Utils.formatDate(loc.date || loc.createdAt);

    return `
      <!-- Hero -->
      <div class="detail-hero" style="background:${t.heroGrad}">
        ${photo0 ? `<img src="${photo0}" alt="${Utils.escHtml(loc.name)}">` : `<div class="detail-hero-placeholder">${cat.emoji}</div>`}
        <div class="detail-hero-overlay"></div>
        <div class="detail-nav">
          <button class="detail-nav-btn" id="detail-back">‹</button>
          <span class="detail-theme-badge" style="background:${t.badgeBg};color:${t.badgeText}">${t.emoji} ${t.name}</span>
          <button class="detail-nav-btn" id="detail-more">…</button>
        </div>
      </div>

      <!-- Content -->
      <div class="detail-content" style="--th-card-bg:${t.cardBg};--th-border:${t.cardBorder};--th-accent:${t.accent};--th-text:${t.text};--th-text-muted:${t.textMuted};--th-badge-bg:${t.badgeBg};--th-badge-text:${t.badgeText}">

        <!-- Main card -->
        <div class="d-card" style="background:var(--th-card-bg);border-color:var(--th-border);font-family:${t.fontFamily}">
          <span class="d-category-badge" style="background:${cat.color}20;color:${cat.color}">${cat.emoji} ${cat.label}</span>
          <div class="d-location-name" style="color:var(--th-text);font-weight:${t.headingWeight}">${Utils.escHtml(loc.name)}</div>
          <div class="d-location-sub" style="color:var(--th-text-muted)">${Utils.escHtml(loc.country || '')}</div>
          <div class="d-rating-row">
            ${loc.rating ? Utils.stars(loc.rating, 'sm') : '<span style="color:var(--th-text-muted);font-size:13px">No rating</span>'}
            <span class="d-date" style="color:var(--th-text-muted)">${dateStr}</span>
          </div>
          ${loc.mood ? `<div class="d-mood" style="color:var(--th-text-muted)">${Utils.escHtml(loc.mood)} ${loc.weather ? '· ' + Utils.escHtml(loc.weather) : ''}</div>` : ''}
          ${loc.wouldReturn ? `<div style="color:${t.accent};font-size:13px;margin-top:6px;font-weight:600">↩ Would return</div>` : ''}
        </div>

        <!-- Notes -->
        ${loc.notes ? `
        <div class="d-card" style="background:var(--th-card-bg);border-color:var(--th-border)">
          <div class="d-section-label" style="color:var(--th-text-muted)">Story</div>
          <div class="d-notes" style="color:var(--th-text);font-family:${t.fontFamily}">${Utils.escHtml(loc.notes)}</div>
        </div>` : ''}

        <!-- Category-specific data -->
        ${buildCatDataCard(loc, t)}

        <!-- Highlights -->
        ${loc.highlights && loc.highlights.length ? `
        <div class="d-card" style="background:var(--th-card-bg);border-color:var(--th-border)">
          <div class="d-section-label" style="color:var(--th-text-muted)">Highlights</div>
          ${Utils.buildListItems(loc.highlights)}
        </div>` : ''}

        <!-- Hidden Gems -->
        ${loc.gems && loc.gems.length ? `
        <div class="d-card" style="background:${t.accent}15;border-color:${t.accent}40">
          <div class="d-section-label" style="color:${t.accent}">Hidden Gems 💎</div>
          ${Utils.buildListItems(loc.gems)}
        </div>` : ''}

        <!-- Scrapbook Photos -->
        ${loc.photos && loc.photos.length > 0 ? buildScrapbook(loc, t) : ''}

        <!-- Food log -->
        ${loc.food && loc.food.length ? `
        <div class="d-card" style="background:var(--th-card-bg);border-color:var(--th-border)">
          <div class="d-section-label" style="color:var(--th-text-muted)">Food Log 🍽️</div>
          ${loc.food.map(f => {
            const emo = {'restaurant':'🍽️','cafe':'☕','street food':'🌮','bar':'🍺','bakery':'🥐','market':'🛒','fine dining':'🥂','takeaway':'📦','picnic':'🧺','other':'🍴'};
            return `
            <div class="d-food-row" style="border-bottom-color:var(--th-border)">
              <span style="font-size:20px">${emo[f.category]||'🍴'}</span>
              <div style="flex:1">
                <div class="d-food-name" style="color:var(--th-text)">${Utils.escHtml(f.name)}</div>
                <div class="d-food-cat" style="color:var(--th-text-muted)">${f.category}${f.venue?' · '+Utils.escHtml(f.venue):''}</div>
              </div>
              ${f.rating ? `<span style="font-size:12px">${'⭐'.repeat(f.rating)}</span>` : ''}
            </div>`;
          }).join('')}
        </div>` : ''}

        <!-- Stats -->
        <div class="d-card" style="background:var(--th-card-bg);border-color:var(--th-border)">
          <div class="d-stats-row">
            <div class="d-stat">
              <div class="d-stat-value" style="color:${t.accent}">${loc.photos ? loc.photos.length : 0}</div>
              <div class="d-stat-label" style="color:var(--th-text-muted)">Photos</div>
            </div>
            <div class="d-stat-divider" style="background:var(--th-border)"></div>
            <div class="d-stat">
              <div class="d-stat-value" style="color:${t.accent}">${loc.food ? loc.food.length : 0}</div>
              <div class="d-stat-label" style="color:var(--th-text-muted)">Meals</div>
            </div>
            <div class="d-stat-divider" style="background:var(--th-border)"></div>
            <div class="d-stat">
              <div class="d-stat-value" style="color:${t.accent}">${(loc.highlights||[]).length + (loc.gems||[]).length}</div>
              <div class="d-stat-label" style="color:var(--th-text-muted)">Tips</div>
            </div>
          </div>
          ${loc.cost ? `<div class="d-cost" style="border-top-color:var(--th-border);color:var(--th-text-muted)">💰 Total cost: <strong style="color:var(--th-text)">${Utils.escHtml(loc.cost)}</strong></div>` : ''}
        </div>

        <!-- Share & Delete -->
        <button id="detail-share" style="width:100%;padding:14px;background:rgba(139,92,246,0.08);border:1.5px solid rgba(139,92,246,0.25);border-radius:16px;color:#A78BFA;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:8px">
          📤 Share this place
        </button>
        <button id="detail-delete" style="width:100%;padding:14px;background:#FEF2F2;border:1.5px solid #FECACA;border-radius:16px;color:#EF4444;font-size:14px;font-weight:600;cursor:pointer">
          🗑 Delete this place
        </button>
      </div>
    `;
  }

  // ── Category-specific data card ───────────────────────
  function buildCatDataCard(loc, t) {
    const cd = loc.catData;
    if (!cd || Object.keys(cd).length === 0) return '';
    const cat = loc.category;

    const LABELS = {
      beach: 'Beach Details 🏖️', mountain: 'Trail Details ⛰️',
      campsite: 'Campsite Info ⛺', park: 'Park Details 🌲',
      viewpoint: 'Viewpoint Info 🌅', hotel: 'Stay Details 🏨',
    };
    if (!LABELS[cat]) return '';

    let chips = [];
    if (cat === 'beach') {
      chips = [cd.water, cd.bestSeason, ...(cd.facilities || [])];
    } else if (cat === 'mountain') {
      chips = [cd.difficulty, cd.elevation ? `⛰️ ${cd.elevation}` : null, cd.trail ? `🥾 ${cd.trail}` : null, cd.bestSeason];
    } else if (cat === 'campsite') {
      chips = [cd.campType, ...(cd.facilities || []), cd.bookingRequired ? '📅 Booking Required' : null];
    } else if (cat === 'park') {
      chips = [cd.bestSeason, cd.entry, cd.wildlife ? `🦌 ${cd.wildlife}` : null];
    } else if (cat === 'viewpoint') {
      chips = [cd.bestTime, cd.access, cd.view ? `👁 ${cd.view}` : null];
    } else if (cat === 'hotel') {
      chips = [cd.stayType, cd.pricePerNight ? `💰 ${cd.pricePerNight}/night` : null,
               cd.nights ? `🌙 ${cd.nights} night${cd.nights != 1 ? 's' : ''}` : null,
               ...(cd.amenities || []), cd.bookAgain || null];
    }

    chips = chips.filter(Boolean);
    if (!chips.length) return '';

    return `
      <div class="d-card" style="background:var(--th-card-bg);border-color:var(--th-border)">
        <div class="d-section-label" style="color:var(--th-text-muted)">${LABELS[cat]}</div>
        <div class="cat-data-chips">
          ${chips.map(c => `<span class="cat-data-chip">${Utils.escHtml(c)}</span>`).join('')}
        </div>
      </div>
    `;
  }

  // ── Scrapbook photo wall ───────────────────────────────
  function buildScrapbook(loc, t) {
    const dateShort = Utils.formatDateShort(loc.date || loc.createdAt);
    const stampCap = (loc.country || 'Memory').toUpperCase();
    const countryCode = (loc.country || '••').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || '✦';
    const isDark = t.cardBg === '#1F2937';

    const items = loc.photos.map((src, i) => {
      const style = STYLES[i % 3];
      const rot   = ROTATIONS[i % ROTATIONS.length];
      if (style === 'polaroid') return polaroidHtml(src, i, rot, i === 0 ? loc.name : dateShort);
      if (style === 'stamp')    return stampHtml(src, i, rot, t.accent, stampCap);
      return postcardHtml(src, i, rot, loc.name, countryCode, t);
    }).join('');

    return `
      <div class="scrapbook-section">
        <div class="scrapbook-label">Memories</div>
        <div class="scrapbook-wall${isDark ? ' sb-dark' : ''}">
          ${items}
        </div>
      </div>
    `;
  }

  function polaroidHtml(src, i, rot, caption) {
    return `
      <div class="sb-polaroid" data-photo-idx="${i}" style="transform:rotate(${rot}deg)">
        <img src="${src}" alt="photo">
        <div class="pol-caption">${Utils.escHtml(caption)}</div>
      </div>
    `;
  }

  function stampHtml(src, i, rot, accentColor, caption) {
    return `
      <div class="sb-stamp" data-photo-idx="${i}" style="transform:rotate(${rot}deg);--stamp-color:${accentColor}">
        <div class="sb-stamp-inner">
          <img src="${src}" alt="photo">
          <div class="sb-stamp-cap">${Utils.escHtml(caption.slice(0, 14))}</div>
        </div>
      </div>
    `;
  }

  function postcardHtml(src, i, rot, name, countryCode, t) {
    return `
      <div class="sb-postcard" data-photo-idx="${i}" style="transform:rotate(${rot}deg)">
        <img src="${src}" alt="photo" class="sb-postcard-photo">
        <div class="sb-postcard-body" style="border-top-color:${t.accent}">
          <div class="sb-postcard-left">
            <div class="sb-postcard-from">Postcard from</div>
            <div class="sb-postcard-place" style="color:${t.accent}">${Utils.escHtml(name.slice(0,16))}</div>
            <div class="sb-postcard-lines">
              <div class="sb-postcard-line"></div>
              <div class="sb-postcard-line"></div>
            </div>
          </div>
          <div class="sb-postcard-right">
            <div class="sb-postcard-stamp-box" style="background:${t.accent}1f;border:1.5px solid ${t.accent}55;color:${t.accent}">
              ${countryCode}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ── Action sheet ───────────────────────────────────────
  function showActionSheet(loc) {
    document.querySelector('.action-sheet')?.remove();

    const sheet = document.createElement('div');
    sheet.className = 'action-sheet';
    sheet.innerHTML = `
      <div class="action-sheet-backdrop"></div>
      <div class="action-sheet-menu">
        <div class="action-sheet-title">${Utils.escHtml(loc.name)}</div>
        <button class="action-sheet-btn" id="as-edit">✏️ Edit Place</button>
        <button class="action-sheet-btn" id="as-move">📍 Move Pin</button>
        <button class="action-sheet-btn" id="as-flyto">🗺 Fly to on Map</button>
        <button class="action-sheet-btn" id="as-add-trip">🗂 Add to Trip</button>
        <button class="action-sheet-btn action-sheet-btn-danger" id="as-delete">🗑 Delete Place</button>
        <button class="action-sheet-btn action-sheet-btn-cancel" id="as-cancel">Cancel</button>
      </div>
    `;
    document.body.appendChild(sheet);

    const dismiss = () => sheet.remove();
    sheet.querySelector('.action-sheet-backdrop').addEventListener('click', dismiss);
    sheet.querySelector('#as-cancel').addEventListener('click', dismiss);

    sheet.querySelector('#as-edit').addEventListener('click', () => {
      dismiss();
      close();
      setTimeout(() => {
        Modal.openEdit(loc, updated => {
          MapScreen.refreshMarker(updated);
          setTimeout(() => LocationDetail.open(updated.id), 100);
        });
      }, 350);
    });

    sheet.querySelector('#as-move').addEventListener('click', () => {
      dismiss();
      close();
      App.switchTab('map');
      setTimeout(() => MapScreen.startMoveMode(loc), 450);
    });

    sheet.querySelector('#as-flyto').addEventListener('click', () => {
      dismiss();
      close();
      App.switchTab('map');
      setTimeout(() => MapScreen.flyTo(loc), 500);
    });

    sheet.querySelector('#as-add-trip').addEventListener('click', () => {
      dismiss();
      if (typeof Trips !== 'undefined') Trips.addLocationToTrip(loc.id);
    });

    sheet.querySelector('#as-delete').addEventListener('click', () => {
      dismiss();
      if (!confirm(`Delete "${loc.name}"? This cannot be undone.`)) return;
      Storage.deleteLocation(loc.id);
      MapScreen.removeMarker(loc.id);
      close();
    });
  }

  // ── Events ─────────────────────────────────────────────
  function bindEvents(loc) {
    document.getElementById('detail-back').addEventListener('click', close);
    document.getElementById('detail-more').addEventListener('click', () => showActionSheet(loc));

    const shareBtn = document.getElementById('detail-share');
    if (shareBtn) shareBtn.addEventListener('click', () => {
      if (typeof ShareCard !== 'undefined') ShareCard.generate(loc);
    });

    // All scrapbook photo items open lightbox
    document.querySelectorAll('[data-photo-idx]').forEach(el => {
      el.addEventListener('click', () => {
        openLightbox(loc.photos, +el.dataset.photoIdx);
      });
    });

    document.getElementById('detail-delete').addEventListener('click', () => {
      if (!confirm(`Delete "${loc.name}"? This cannot be undone.`)) return;
      Storage.deleteLocation(loc.id);
      MapScreen.removeMarker(loc.id);
      close();
    });
  }

  function openLightbox(photos, startIdx) {
    let idx = startIdx;
    let scale = 1, initDist = 0, initScale = 1;

    function show(i) {
      const img = lb.querySelector('.lb-img');
      img.src = photos[i];
      img.style.transform = 'scale(1)';
      scale = 1;
      lb.querySelector('.lb-counter').textContent = `${i + 1} / ${photos.length}`;
    }

    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button class="lb-close">✕</button>
      <button class="lb-prev" ${photos.length < 2 ? 'style="display:none"' : ''}>‹</button>
      <img class="lb-img" src="${photos[idx]}" alt="photo" style="touch-action:none">
      <button class="lb-next" ${photos.length < 2 ? 'style="display:none"' : ''}>›</button>
      <div class="lb-counter">${idx + 1} / ${photos.length}</div>
    `;
    document.body.appendChild(lb);

    const img = lb.querySelector('.lb-img');
    lb.querySelector('.lb-close').addEventListener('click', () => lb.remove());
    lb.querySelector('.lb-prev').addEventListener('click', () => { idx = (idx - 1 + photos.length) % photos.length; show(idx); });
    lb.querySelector('.lb-next').addEventListener('click', () => { idx = (idx + 1) % photos.length; show(idx); });
    lb.addEventListener('click', e => { if (e.target === lb) lb.remove(); });

    // Pinch-to-zoom
    lb.addEventListener('touchstart', e => {
      if (e.touches.length === 2) {
        initDist = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
        initScale = scale;
      }
    }, { passive: true });
    lb.addEventListener('touchmove', e => {
      if (e.touches.length !== 2) return;
      const d = Math.hypot(e.touches[1].clientX - e.touches[0].clientX, e.touches[1].clientY - e.touches[0].clientY);
      scale = Math.min(4, Math.max(1, initScale * (d / initDist)));
      img.style.transform = `scale(${scale})`;
    }, { passive: true });
    lb.addEventListener('touchend', () => {
      if (scale < 1.15) { scale = 1; img.style.transform = 'scale(1)'; }
    }, { passive: true });
  }

  return { open, close };
})();
