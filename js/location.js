const LocationDetail = (() => {

  let currentId = null;
  let lightboxListener = null;

  function open(id) {
    const loc = Storage.getLocation(id);
    if (!loc) return;
    currentId = id;

    const panel = document.getElementById('detail-panel');
    panel.innerHTML = buildHtml(loc);
    panel.classList.remove('hidden');

    // Force reflow then animate in
    panel.classList.add('sliding');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => { panel.classList.add('visible'); });
    });

    // Apply theme CSS vars to the panel
    Themes.applyToEl(panel, loc.theme || 'modern');

    bindEvents(loc);
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

        <!-- Photos -->
        ${loc.photos && loc.photos.length > 0 ? `
        <div class="d-card" style="background:var(--th-card-bg);border-color:var(--th-border)">
          <div class="d-section-label" style="color:var(--th-text-muted)">Photos</div>
          <div class="d-photo-grid">
            ${loc.photos.map((p,i) => `
              <div class="d-photo" style="border-color:var(--th-border)" data-photo-idx="${i}">
                <img src="${p}" alt="photo ${i+1}">
              </div>
            `).join('')}
          </div>
        </div>` : ''}

        <!-- Food log -->
        ${loc.food && loc.food.length ? `
        <div class="d-card" style="background:var(--th-card-bg);border-color:var(--th-border)">
          <div class="d-section-label" style="color:var(--th-text-muted)">Food Log 🍽️</div>
          ${loc.food.map(f => {
            const catEmojis = {'restaurant':'🍽️','cafe':'☕','street food':'🌮','bar':'🍺','bakery':'🥐','market':'🛒','fine dining':'🥂','takeaway':'📦','picnic':'🧺','other':'🍴'};
            return `
            <div class="d-food-row" style="border-bottom-color:var(--th-border)">
              <span style="font-size:20px">${catEmojis[f.category]||'🍴'}</span>
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

        <!-- Delete -->
        <button id="detail-delete" style="width:100%;padding:14px;background:#FEF2F2;border:1.5px solid #FECACA;border-radius:16px;color:#EF4444;font-size:14px;font-weight:600;cursor:pointer">
          🗑 Delete this place
        </button>
      </div>
    `;
  }

  function bindEvents(loc) {
    // Back
    document.getElementById('detail-back').addEventListener('click', close);

    // More (options)
    document.getElementById('detail-more').addEventListener('click', () => {
      if (confirm(`Options for ${loc.name}:\n\nPress OK to open on map, Cancel to stay.`)) {
        close();
        setTimeout(() => MapScreen.flyTo(loc), 350);
      }
    });

    // Photo lightbox
    document.querySelectorAll('.d-photo').forEach((el, i) => {
      el.addEventListener('click', () => openLightbox(loc.photos, i));
    });

    // Delete
    document.getElementById('detail-delete').addEventListener('click', () => {
      if (!confirm(`Delete "${loc.name}"? This cannot be undone.`)) return;
      Storage.deleteLocation(loc.id);
      MapScreen.removeMarker(loc.id);
      close();
    });
  }

  function openLightbox(photos, startIdx) {
    let idx = startIdx;
    const lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.innerHTML = `
      <button style="position:absolute;top:20px;right:20px;color:white;font-size:28px;background:none;border:none;cursor:pointer;z-index:2">✕</button>
      <img src="${photos[idx]}" alt="photo">
    `;
    document.body.appendChild(lb);
    lb.querySelector('button').addEventListener('click', () => lb.remove());
    lb.addEventListener('click', e => { if (e.target === lb) lb.remove(); });
  }

  return { open, close };
})();
