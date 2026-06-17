const Modal = (() => {
  let step = 0;
  const STEPS = 5;
  let draft = {};
  let pendingLatLng = null;
  let onSaveCb = null;

  // -- step labels
  const STEP_TITLES = ['Basics','Theme','Details','Food Log','Photos'];

  function open(latLng, onSave) {
    pendingLatLng = latLng;
    onSaveCb = onSave;
    draft = { lat: latLng.lat, lng: latLng.lng, photos: [], food: [], highlights: [], gems: [] };
    step = 0;
    document.getElementById('modal-overlay').classList.remove('hidden');
    renderStep();
  }

  function close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    draft = {};
    step = 0;
  }

  function renderDots() {
    const dots = document.getElementById('modal-dots');
    if (!dots) return;
    let html = '';
    for (let i = 0; i < STEPS; i++) {
      html += `<div class="modal-dot${i === step ? ' active' : ''}"></div>`;
    }
    dots.innerHTML = html;
    document.querySelector('.modal-title').textContent = STEP_TITLES[step];
  }

  function renderStep() {
    renderDots();
    const body = document.getElementById('modal-body');
    const footer = document.getElementById('modal-footer');

    switch (step) {
      case 0: renderBasics(body, footer); break;
      case 1: renderTheme(body, footer); break;
      case 2: renderDetails(body, footer); break;
      case 3: renderFood(body, footer); break;
      case 4: renderPhotos(body, footer); break;
    }
  }

  // ── Step 0: Basics ──────────────────────────────────────
  function renderBasics(body, footer) {
    const cats = Utils.allCategories();
    body.innerHTML = `
      <div class="field">
        <label>Place Name *</label>
        <input id="f-name" type="text" placeholder="e.g. Santorini, The Blue Lagoon…" value="${Utils.escHtml(draft.name || '')}">
      </div>
      <div class="row-2">
        <div class="field">
          <label>Country</label>
          <input id="f-country" type="text" placeholder="e.g. Greece" value="${Utils.escHtml(draft.country || '')}">
        </div>
        <div class="field">
          <label>Visit Date</label>
          <input id="f-date" type="date" value="${draft.date || new Date().toISOString().slice(0,10)}">
        </div>
      </div>
      <div class="field">
        <label>Category</label>
        <div class="category-grid">
          ${cats.map(c => `
            <button class="cat-option${draft.category === c.key ? ' selected' : ''}" data-cat="${c.key}">
              <span class="cat-option-emoji">${c.emoji}</span>${c.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;

    footer.innerHTML = `
      <button class="btn-primary" id="btn-next-0">Next <span>→</span></button>
    `;

    body.querySelectorAll('.cat-option').forEach(btn => {
      btn.addEventListener('click', () => {
        draft.category = btn.dataset.cat;
        body.querySelectorAll('.cat-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    document.getElementById('btn-next-0').addEventListener('click', () => {
      const name = document.getElementById('f-name').value.trim();
      if (!name) { document.getElementById('f-name').focus(); return; }
      draft.name = name;
      draft.country = document.getElementById('f-country').value.trim();
      draft.date = document.getElementById('f-date').value;
      if (!draft.category) draft.category = 'town';
      step = 1; renderStep();
    });
  }

  // ── Step 1: Theme ───────────────────────────────────────
  function renderTheme(body, footer) {
    const themes = Themes.all();
    body.innerHTML = `
      <p class="hint">Choose a visual style for this place's scrapbook page.</p>
      <div class="theme-grid">
        ${themes.map(t => `
          <div class="theme-card${draft.theme === t.id ? ' selected' : ''}" data-theme="${t.id}"
               style="background:${t.cardBg};border-color:${draft.theme === t.id ? t.accent : t.cardBorder};color:${t.text}">
            <div class="theme-emoji">${t.emoji}</div>
            <div class="theme-name">${t.name}</div>
            <div class="theme-desc" style="color:${t.textMuted}">${t.desc}</div>
          </div>
        `).join('')}
      </div>
      <div id="theme-preview"></div>
    `;

    renderThemePreview(draft.theme || 'modern');

    body.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        draft.theme = card.dataset.theme;
        body.querySelectorAll('.theme-card').forEach(c => {
          const t = Themes.get(c.dataset.theme);
          c.style.borderColor = t.cardBorder;
          c.classList.remove('selected');
        });
        card.classList.add('selected');
        const t = Themes.get(draft.theme);
        card.style.borderColor = t.accent;
        renderThemePreview(draft.theme);
      });
    });

    footer.innerHTML = `
      <button class="btn-secondary" id="btn-back-1">← Back</button>
      <button class="btn-primary" id="btn-next-1">Next →</button>
    `;
    document.getElementById('btn-back-1').addEventListener('click', () => { step = 0; renderStep(); });
    document.getElementById('btn-next-1').addEventListener('click', () => {
      if (!draft.theme) draft.theme = 'modern';
      step = 2; renderStep();
    });
  }

  function renderThemePreview(themeId) {
    const t = Themes.get(themeId);
    const preview = document.getElementById('theme-preview');
    if (!preview) return;
    preview.innerHTML = `
      <div class="theme-preview" style="background:${t.cardBg};border-color:${t.cardBorder};font-family:${t.fontFamily}">
        <div class="preview-label" style="color:${t.textMuted}">Preview</div>
        <div class="preview-name" style="color:${t.text};font-weight:${t.headingWeight}">${draft.name || 'Place Name'}</div>
        <div class="preview-sub" style="color:${t.textMuted}">${draft.country || 'Country'} · ${Utils.formatDateShort(draft.date || new Date().toISOString())}</div>
        <span class="preview-badge" style="background:${t.badgeBg};color:${t.badgeText}">${t.emoji} ${t.name}</span>
      </div>
    `;
  }

  // ── Step 2: Details ─────────────────────────────────────
  function renderDetails(body, footer) {
    const moods = Utils.MOODS;
    const weather = Utils.WEATHER;

    body.innerHTML = `
      <div class="field">
        <label>Overall Rating</label>
        ${Utils.starsInteractive(draft.rating, v => { draft.rating = v; })}
      </div>
      <div class="field">
        <label>Mood</label>
        <div class="chip-row">
          ${moods.map(m => `<span class="chip${draft.mood === m ? ' selected' : ''}" data-mood="${Utils.escHtml(m)}">${m}</span>`).join('')}
        </div>
      </div>
      <div class="row-2">
        <div class="field">
          <label>Weather</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${weather.map(w => `<span class="chip${draft.weather === w ? ' selected' : ''}" data-weather="${Utils.escHtml(w)}">${w}</span>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Total Cost (optional)</label>
          <input id="f-cost" type="text" placeholder="e.g. £120" value="${Utils.escHtml(draft.cost || '')}">
        </div>
      </div>
      <div class="field">
        <label>Your Story / Notes</label>
        <textarea id="f-notes" placeholder="What made this place special? What do you remember most?" rows="4">${Utils.escHtml(draft.notes || '')}</textarea>
      </div>
      <div class="field">
        <label>Highlights <span style="color:#9CA3AF;font-weight:400">(what was great)</span></label>
        <div id="highlights-list">
          ${(draft.highlights||[]).map((h,i) => highlightRow(h,i)).join('')}
        </div>
        <div class="add-link" id="add-highlight">＋ Add highlight</div>
      </div>
      <div class="field">
        <label>Hidden Gems <span style="color:#9CA3AF;font-weight:400">(secret tips)</span></label>
        <div id="gems-list">
          ${(draft.gems||[]).map((g,i) => gemRow(g,i)).join('')}
        </div>
        <div class="add-link" id="add-gem">＋ Add hidden gem</div>
      </div>
      <div class="field">
        <div class="toggle-row">
          <label>Would Return?</label>
          <div class="toggle${draft.wouldReturn ? ' on' : ''}" id="toggle-return"><div class="toggle-thumb"></div></div>
        </div>
      </div>
    `;

    // Mood chips
    body.querySelectorAll('[data-mood]').forEach(chip => {
      chip.addEventListener('click', () => {
        draft.mood = chip.dataset.mood;
        body.querySelectorAll('[data-mood]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
    });

    // Weather chips
    body.querySelectorAll('[data-weather]').forEach(chip => {
      chip.addEventListener('click', () => {
        draft.weather = chip.dataset.weather;
        body.querySelectorAll('[data-weather]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
    });

    // Highlights
    document.getElementById('add-highlight').addEventListener('click', () => {
      draft.highlights = draft.highlights || [];
      draft.highlights.push('');
      const list = document.getElementById('highlights-list');
      const i = draft.highlights.length - 1;
      list.insertAdjacentHTML('beforeend', highlightRow('', i));
      bindListRow(list, 'highlights', i);
      list.lastElementChild.querySelector('input').focus();
    });

    (draft.highlights || []).forEach((_, i) => bindListRow(document.getElementById('highlights-list'), 'highlights', i));

    // Gems
    document.getElementById('add-gem').addEventListener('click', () => {
      draft.gems = draft.gems || [];
      draft.gems.push('');
      const list = document.getElementById('gems-list');
      const i = draft.gems.length - 1;
      list.insertAdjacentHTML('beforeend', gemRow('', i));
      bindListRow(list, 'gems', i);
      list.lastElementChild.querySelector('input').focus();
    });

    (draft.gems || []).forEach((_, i) => bindListRow(document.getElementById('gems-list'), 'gems', i));

    // Toggle
    const toggle = document.getElementById('toggle-return');
    toggle.addEventListener('click', () => {
      draft.wouldReturn = !draft.wouldReturn;
      toggle.classList.toggle('on', draft.wouldReturn);
    });

    footer.innerHTML = `
      <button class="btn-secondary" id="btn-back-2">← Back</button>
      <button class="btn-primary" id="btn-next-2">Next →</button>
    `;
    document.getElementById('btn-back-2').addEventListener('click', () => { saveDetails(); step = 1; renderStep(); });
    document.getElementById('btn-next-2').addEventListener('click', () => { saveDetails(); step = 3; renderStep(); });
  }

  function highlightRow(val, i) {
    return `<div class="list-input-row" data-listtype="highlights" data-idx="${i}"><input type="text" placeholder="e.g. Incredible sunset views" value="${Utils.escHtml(val)}"><span class="remove-btn">✕</span></div>`;
  }

  function gemRow(val, i) {
    return `<div class="list-input-row" data-listtype="gems" data-idx="${i}"><input type="text" placeholder="e.g. The little bakery behind the church" value="${Utils.escHtml(val)}"><span class="remove-btn">✕</span></div>`;
  }

  function bindListRow(listEl, key, i) {
    const row = listEl.querySelector(`[data-listtype="${key}"][data-idx="${i}"]`);
    if (!row) return;
    row.querySelector('input').addEventListener('input', e => { draft[key][i] = e.target.value; });
    row.querySelector('.remove-btn').addEventListener('click', () => {
      draft[key].splice(i, 1);
      row.remove();
      // Re-index remaining rows
      listEl.querySelectorAll(`[data-listtype="${key}"]`).forEach((r, ni) => {
        r.dataset.idx = ni;
        const inp = r.querySelector('input');
        inp.value = draft[key][ni] || '';
      });
    });
  }

  function saveDetails() {
    const notesEl = document.getElementById('f-notes');
    if (notesEl) draft.notes = notesEl.value;
    const costEl = document.getElementById('f-cost');
    if (costEl) draft.cost = costEl.value.trim();
    // Highlights/gems already updated on input events
    draft.highlights = (draft.highlights || []).filter(h => h.trim());
    draft.gems = (draft.gems || []).filter(g => g.trim());
  }

  // ── Step 3: Food Log ────────────────────────────────────
  function renderFood(body, footer) {
    if (!draft.food) draft.food = [];

    body.innerHTML = `
      <p class="hint">Log memorable meals and drinks from this place.</p>
      <div id="food-entries">
        ${draft.food.map((f,i) => foodEntryHtml(f,i)).join('')}
      </div>
      <div class="add-food-box" id="add-food-box">
        <div class="box-title">Add a meal or drink</div>
        <div class="field" style="margin-bottom:10px">
          <input id="f-food-name" type="text" placeholder="Dish or drink name">
        </div>
        <div class="row-2">
          <div class="field" style="margin-bottom:10px">
            <select id="f-food-cat">
              ${Utils.FOOD_CATEGORIES.map(c => `<option value="${c}">${c[0].toUpperCase()+c.slice(1)}</option>`).join('')}
            </select>
          </div>
          <div class="field" style="margin-bottom:10px">
            <input id="f-food-venue" type="text" placeholder="Venue (optional)">
          </div>
        </div>
        <div class="field" style="margin-bottom:12px">
          <label>Rating</label>
          ${Utils.starsInteractive(0, v => { window.__foodRating = v; })}
        </div>
        <button class="btn-primary" id="btn-add-food" style="width:100%">Add to Log</button>
      </div>
    `;

    window.__foodRating = 0;
    bindFoodEntries();

    document.getElementById('btn-add-food').addEventListener('click', () => {
      const name = document.getElementById('f-food-name').value.trim();
      if (!name) { document.getElementById('f-food-name').focus(); return; }
      const entry = {
        name,
        category: document.getElementById('f-food-cat').value,
        venue: document.getElementById('f-food-venue').value.trim(),
        rating: window.__foodRating || 0,
      };
      draft.food.push(entry);
      document.getElementById('food-entries').insertAdjacentHTML('beforeend', foodEntryHtml(entry, draft.food.length - 1));
      bindFoodEntry(draft.food.length - 1);
      document.getElementById('f-food-name').value = '';
      document.getElementById('f-food-venue').value = '';
      window.__foodRating = 0;
    });

    footer.innerHTML = `
      <button class="btn-secondary" id="btn-back-3">← Back</button>
      <button class="btn-primary" id="btn-next-3">Next →</button>
    `;
    document.getElementById('btn-back-3').addEventListener('click', () => { step = 2; renderStep(); });
    document.getElementById('btn-next-3').addEventListener('click', () => { step = 4; renderStep(); });
  }

  function foodEntryHtml(f, i) {
    const cat = Utils.FOOD_CATEGORIES;
    const catEmojis = {'restaurant':'🍽️','cafe':'☕','street food':'🌮','bar':'🍺','bakery':'🥐','market':'🛒','fine dining':'🥂','takeaway':'📦','picnic':'🧺','other':'🍴'};
    const emoji = catEmojis[f.category] || '🍴';
    return `
      <div class="food-entry-item" data-food-idx="${i}">
        <span style="font-size:20px">${emoji}</span>
        <div style="flex:1">
          <div class="food-entry-name">${Utils.escHtml(f.name)}</div>
          <div class="food-entry-meta">${f.category}${f.venue ? ' · '+Utils.escHtml(f.venue) : ''} · ${f.rating ? '⭐'.repeat(f.rating) : 'No rating'}</div>
        </div>
        <button class="remove-btn food-remove" data-idx="${i}">✕</button>
      </div>
    `;
  }

  function bindFoodEntries() {
    (draft.food || []).forEach((_, i) => bindFoodEntry(i));
  }

  function bindFoodEntry(i) {
    const btn = document.querySelector(`.food-remove[data-idx="${i}"]`);
    if (btn) btn.addEventListener('click', () => {
      draft.food.splice(i, 1);
      document.querySelector(`[data-food-idx="${i}"]`).remove();
    });
  }

  // ── Step 4: Photos ──────────────────────────────────────
  function renderPhotos(body, footer) {
    if (!draft.photos) draft.photos = [];

    body.innerHTML = `
      <p class="hint">Add photos to bring this place to life. Stored locally on your device.</p>
      <div class="photo-grid" id="photo-grid">
        ${draft.photos.map((p,i) => photoThumb(p,i)).join('')}
        <div class="photo-add-btn" id="photo-add-btn">
          <span class="cam-icon">📷</span>
          <span>Add Photos</span>
        </div>
      </div>
      <input type="file" id="photo-input" accept="image/*" multiple style="display:none">
      <div class="prompt-box" style="margin-top:20px">
        <h4>💭 Memory Prompt</h4>
        <p>What's the first thing that comes to mind when you think of this place?</p>
        <p>What would you tell a friend to do here?</p>
      </div>
    `;

    bindPhotoGrid();

    document.getElementById('photo-add-btn').addEventListener('click', () => {
      document.getElementById('photo-input').click();
    });

    document.getElementById('photo-input').addEventListener('change', async e => {
      const files = Array.from(e.target.files);
      for (const f of files) {
        if (draft.photos.length >= 12) break;
        const data = await Storage.compressImage(f);
        draft.photos.push(data);
        const grid = document.getElementById('photo-grid');
        const addBtn = document.getElementById('photo-add-btn');
        grid.insertBefore(Object.assign(document.createElement('div'), {
          className: 'photo-thumb',
          innerHTML: photoThumb(data, draft.photos.length - 1),
        }), addBtn);
        bindPhotoThumb(draft.photos.length - 1);
      }
      e.target.value = '';
    });

    footer.innerHTML = `
      <button class="btn-secondary" id="btn-back-4">← Back</button>
      <button class="btn-primary" id="btn-save">✓ Save Place</button>
    `;
    document.getElementById('btn-back-4').addEventListener('click', () => { step = 3; renderStep(); });
    document.getElementById('btn-save').addEventListener('click', save);
  }

  function photoThumb(src, i) {
    return `<div class="photo-thumb"><img src="${src}" alt="photo"><button class="photo-remove" data-idx="${i}">✕</button></div>`;
  }

  function bindPhotoGrid() {
    draft.photos.forEach((_, i) => bindPhotoThumb(i));
  }

  function bindPhotoThumb(i) {
    const btn = document.querySelector(`.photo-remove[data-idx="${i}"]`);
    if (btn) btn.addEventListener('click', e => {
      e.stopPropagation();
      draft.photos.splice(i, 1);
      btn.closest('.photo-thumb').remove();
    });
  }

  // ── Save ────────────────────────────────────────────────
  function save() {
    const loc = {
      ...draft,
      id: Utils.generateId(),
      createdAt: new Date().toISOString(),
    };
    Storage.addLocation(loc);
    close();
    if (typeof onSaveCb === 'function') onSaveCb(loc);
  }

  // ── Init ────────────────────────────────────────────────
  function init() {
    document.getElementById('modal-close').addEventListener('click', close);
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay')) close();
    });
  }

  return { open, close, init };
})();
