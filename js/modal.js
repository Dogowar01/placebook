const Modal = (() => {
  let step = 0;
  let draft = {};
  let pendingLatLng = null;
  let onSaveCb = null;
  let editMode = false;
  let editId = null;

  const FOOD_CATS  = new Set(['restaurant', 'cafe', 'bar', 'takeaway']);
  const NATURE_CATS = new Set(['beach', 'mountain', 'park', 'viewpoint', 'campsite']);
  const STAY_CATS  = new Set(['hotel']);

  function getStepSequence() {
    const cat = draft.category || 'town';
    if (FOOD_CATS.has(cat))   return ['Basics', 'Theme', 'Details', 'Food Log', 'Photos'];
    if (NATURE_CATS.has(cat)) return ['Basics', 'Theme', 'Details', 'Conditions', 'Photos'];
    if (STAY_CATS.has(cat))   return ['Basics', 'Theme', 'Details', 'Stay Info', 'Photos'];
    return ['Basics', 'Theme', 'Details', 'Photos'];
  }

  function nextStep() {
    const seq = getStepSequence();
    if (step < seq.length - 1) { step++; renderStep(); }
  }

  function prevStep() {
    if (step > 0) { step--; renderStep(); }
  }

  function open(latLng, onSave) {
    pendingLatLng = latLng;
    onSaveCb = onSave;
    editMode = false;
    editId = null;
    draft = { lat: latLng.lat, lng: latLng.lng, photos: [], food: [], highlights: [], gems: [], catData: {} };
    step = 0;
    document.getElementById('modal-overlay').classList.remove('hidden');
    renderStep();
  }

  function openEdit(loc, onSave) {
    onSaveCb = onSave;
    editMode = true;
    editId = loc.id;
    draft = JSON.parse(JSON.stringify(loc));
    step = 0;
    document.getElementById('modal-overlay').classList.remove('hidden');
    renderStep();
  }

  function close() {
    document.getElementById('modal-overlay').classList.add('hidden');
    draft = {};
    step = 0;
    editMode = false;
    editId = null;
  }

  function renderStep() {
    const seq = getStepSequence();
    const stepName = seq[step];

    const dots = document.getElementById('modal-dots');
    if (dots) {
      dots.innerHTML = seq.map((_, i) => `<div class="modal-dot${i === step ? ' active' : ''}"></div>`).join('');
    }
    const titleEl = document.querySelector('.modal-title');
    if (titleEl) titleEl.textContent = stepName;

    const body   = document.getElementById('modal-body');
    const footer = document.getElementById('modal-footer');

    const renderers = {
      'Basics':     renderBasics,
      'Theme':      renderTheme,
      'Details':    renderDetails,
      'Food Log':   renderFood,
      'Conditions': renderConditions,
      'Stay Info':  renderStayInfo,
      'Photos':     renderPhotos,
    };
    renderers[stepName](body, footer);
  }

  // ── Basics ───────────────────────────────────────────────
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

    footer.innerHTML = `<button class="btn-primary" id="btn-next-basics">Next <span>→</span></button>`;

    body.querySelectorAll('.cat-option').forEach(btn => {
      btn.addEventListener('click', () => {
        draft.category = btn.dataset.cat;
        body.querySelectorAll('.cat-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });

    document.getElementById('btn-next-basics').addEventListener('click', () => {
      const name = document.getElementById('f-name').value.trim();
      if (!name) { document.getElementById('f-name').focus(); return; }
      draft.name    = name;
      draft.country = document.getElementById('f-country').value.trim();
      draft.date    = document.getElementById('f-date').value;
      if (!draft.category) draft.category = 'town';
      nextStep();
    });
  }

  // ── Theme ────────────────────────────────────────────────
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
        card.style.borderColor = Themes.get(draft.theme).accent;
        renderThemePreview(draft.theme);
      });
    });

    footer.innerHTML = `
      <button class="btn-secondary" id="btn-back-theme">← Back</button>
      <button class="btn-primary" id="btn-next-theme">Next →</button>
    `;
    document.getElementById('btn-back-theme').addEventListener('click', prevStep);
    document.getElementById('btn-next-theme').addEventListener('click', () => {
      if (!draft.theme) draft.theme = 'modern';
      nextStep();
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

  // ── Details ──────────────────────────────────────────────
  function renderDetails(body, footer) {
    const moods   = Utils.MOODS;
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
        <textarea id="f-notes" placeholder="What made this place special?" rows="4">${Utils.escHtml(draft.notes || '')}</textarea>
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

    body.querySelectorAll('[data-mood]').forEach(chip => {
      chip.addEventListener('click', () => {
        draft.mood = chip.dataset.mood;
        body.querySelectorAll('[data-mood]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
    });

    body.querySelectorAll('[data-weather]').forEach(chip => {
      chip.addEventListener('click', () => {
        draft.weather = chip.dataset.weather;
        body.querySelectorAll('[data-weather]').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
    });

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

    const toggle = document.getElementById('toggle-return');
    toggle.addEventListener('click', () => {
      draft.wouldReturn = !draft.wouldReturn;
      toggle.classList.toggle('on', draft.wouldReturn);
    });

    footer.innerHTML = `
      <button class="btn-secondary" id="btn-back-details">← Back</button>
      <button class="btn-primary" id="btn-next-details">Next →</button>
    `;
    document.getElementById('btn-back-details').addEventListener('click', () => { saveDetails(); prevStep(); });
    document.getElementById('btn-next-details').addEventListener('click', () => { saveDetails(); nextStep(); });
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
      listEl.querySelectorAll(`[data-listtype="${key}"]`).forEach((r, ni) => {
        r.dataset.idx = ni;
        r.querySelector('input').value = draft[key][ni] || '';
      });
    });
  }

  function saveDetails() {
    const notesEl = document.getElementById('f-notes');
    if (notesEl) draft.notes = notesEl.value;
    const costEl = document.getElementById('f-cost');
    if (costEl) draft.cost = costEl.value.trim();
    draft.highlights = (draft.highlights || []).filter(h => h.trim());
    draft.gems       = (draft.gems || []).filter(g => g.trim());
  }

  // ── Conditions (beach / mountain / campsite / park / viewpoint) ──
  function renderConditions(body, footer) {
    if (!draft.catData) draft.catData = {};
    const cat = draft.category;

    let html = '';

    if (cat === 'beach') {
      html = `
        <div class="field">
          <label>Water Conditions</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${['🏊 Calm','🌊 Waves','⚠️ Strong Currents','🚫 No Swimming'].map(w =>
              `<span class="chip${draft.catData.water===w?' selected':''}" data-cond="water" data-val="${Utils.escHtml(w)}">${w}</span>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Facilities</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${['🚿 Showers','🚗 Parking','🏖️ Sunbeds','🍦 Cafés','🏋 Lifeguard','♿ Accessible'].map(f =>
              `<span class="chip${(draft.catData.facilities||[]).includes(f)?' selected':''}" data-multi="facilities" data-val="${Utils.escHtml(f)}">${f}</span>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Best Season</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${['🌸 Spring','☀️ Summer','🍂 Autumn','❄️ Winter','🗓️ Year-round'].map(s =>
              `<span class="chip${draft.catData.bestSeason===s?' selected':''}" data-cond="bestSeason" data-val="${Utils.escHtml(s)}">${s}</span>`).join('')}
          </div>
        </div>
      `;
    } else if (cat === 'mountain') {
      html = `
        <div class="field">
          <label>Difficulty</label>
          <div class="chip-row">
            ${['🟢 Easy','🟡 Moderate','🟠 Hard','🔴 Expert'].map(d =>
              `<span class="chip${draft.catData.difficulty===d?' selected':''}" data-cond="difficulty" data-val="${Utils.escHtml(d)}">${d}</span>`).join('')}
          </div>
        </div>
        <div class="row-2">
          <div class="field">
            <label>Elevation</label>
            <input id="cond-elevation" type="text" placeholder="e.g. 2,500m" value="${Utils.escHtml(draft.catData.elevation||'')}">
          </div>
          <div class="field">
            <label>Trail Name</label>
            <input id="cond-trail" type="text" placeholder="e.g. Ben Nevis Trail" value="${Utils.escHtml(draft.catData.trail||'')}">
          </div>
        </div>
        <div class="field">
          <label>Best Season</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${['🌸 Spring','☀️ Summer','🍂 Autumn','❄️ Winter'].map(s =>
              `<span class="chip${draft.catData.bestSeason===s?' selected':''}" data-cond="bestSeason" data-val="${Utils.escHtml(s)}">${s}</span>`).join('')}
          </div>
        </div>
      `;
    } else if (cat === 'campsite') {
      html = `
        <div class="field">
          <label>Type</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${['⛺ Tent','✨ Glamping','🚐 Motorhome','🏕️ Wild Camping'].map(d =>
              `<span class="chip${draft.catData.campType===d?' selected':''}" data-cond="campType" data-val="${Utils.escHtml(d)}">${d}</span>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Facilities</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${['🚿 Showers','🔌 Electric','💧 Water','🔥 BBQ','🛒 Shop','🐕 Dog-friendly'].map(f =>
              `<span class="chip${(draft.catData.facilities||[]).includes(f)?' selected':''}" data-multi="facilities" data-val="${Utils.escHtml(f)}">${f}</span>`).join('')}
          </div>
        </div>
        <div class="field">
          <div class="toggle-row">
            <label>Booking Required?</label>
            <div class="toggle${draft.catData.bookingRequired?' on':''}" id="toggle-booking"><div class="toggle-thumb"></div></div>
          </div>
        </div>
      `;
    } else if (cat === 'park') {
      html = `
        <div class="field">
          <label>Best Season</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${['🌸 Spring','☀️ Summer','🍂 Autumn','❄️ Winter','🗓️ Year-round'].map(s =>
              `<span class="chip${draft.catData.bestSeason===s?' selected':''}" data-cond="bestSeason" data-val="${Utils.escHtml(s)}">${s}</span>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Wildlife Spotted</label>
          <input id="cond-wildlife" type="text" placeholder="e.g. Red deer, eagles, foxes" value="${Utils.escHtml(draft.catData.wildlife||'')}">
        </div>
        <div class="field">
          <label>Entry</label>
          <div class="chip-row">
            ${['🆓 Free','💰 Paid','🎟️ Pass Required'].map(e =>
              `<span class="chip${draft.catData.entry===e?' selected':''}" data-cond="entry" data-val="${Utils.escHtml(e)}">${e}</span>`).join('')}
          </div>
        </div>
      `;
    } else if (cat === 'viewpoint') {
      html = `
        <div class="field">
          <label>Best Time</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${['🌄 Sunrise','🌇 Golden Hour','🌅 Sunset','🌃 Night'].map(t =>
              `<span class="chip${draft.catData.bestTime===t?' selected':''}" data-cond="bestTime" data-val="${Utils.escHtml(t)}">${t}</span>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>Access</label>
          <div class="chip-row" style="flex-wrap:wrap;gap:6px">
            ${['🟢 Easy Walk','🟡 Short Hike','🟠 Tough Hike','🚗 Drive Up'].map(a =>
              `<span class="chip${draft.catData.access===a?' selected':''}" data-cond="access" data-val="${Utils.escHtml(a)}">${a}</span>`).join('')}
          </div>
        </div>
        <div class="field">
          <label>What can you see?</label>
          <input id="cond-view" type="text" placeholder="e.g. City skyline, mountains, sea" value="${Utils.escHtml(draft.catData.view||'')}">
        </div>
      `;
    }

    body.innerHTML = html || `<p class="hint">No extra details needed for this category.</p>`;
    bindConditionChips(body);

    footer.innerHTML = `
      <button class="btn-secondary" id="btn-back-cond">← Back</button>
      <button class="btn-primary" id="btn-next-cond">Next →</button>
    `;
    document.getElementById('btn-back-cond').addEventListener('click', prevStep);
    document.getElementById('btn-next-cond').addEventListener('click', nextStep);
  }

  // ── Stay Info (hotel) ────────────────────────────────────
  function renderStayInfo(body, footer) {
    if (!draft.catData) draft.catData = {};

    body.innerHTML = `
      <div class="field">
        <label>Type of Stay</label>
        <div class="chip-row" style="flex-wrap:wrap;gap:6px">
          ${['🏨 Hotel','🏠 Airbnb','🏰 B&B','🏕️ Hostel','🛥️ Other'].map(t =>
            `<span class="chip${draft.catData.stayType===t?' selected':''}" data-cond="stayType" data-val="${Utils.escHtml(t)}">${t}</span>`).join('')}
        </div>
      </div>
      <div class="row-2">
        <div class="field">
          <label>Price per Night</label>
          <input id="stay-price" type="text" placeholder="e.g. £85" value="${Utils.escHtml(draft.catData.pricePerNight||'')}">
        </div>
        <div class="field">
          <label>Nights Stayed</label>
          <input id="stay-nights" type="number" min="1" placeholder="e.g. 3" value="${Utils.escHtml(String(draft.catData.nights||''))}">
        </div>
      </div>
      <div class="field">
        <label>Amenities</label>
        <div class="chip-row" style="flex-wrap:wrap;gap:6px">
          ${['🍳 Breakfast','🅿️ Parking','🏊 Pool','💆 Spa','🐕 Pet-friendly','📶 Fast WiFi','🏋️ Gym'].map(a =>
            `<span class="chip${(draft.catData.amenities||[]).includes(a)?' selected':''}" data-multi="amenities" data-val="${Utils.escHtml(a)}">${a}</span>`).join('')}
        </div>
      </div>
      <div class="field">
        <label>Would you book again?</label>
        <div class="chip-row">
          ${['✅ Yes','❌ No','🤷 Maybe'].map(b =>
            `<span class="chip${draft.catData.bookAgain===b?' selected':''}" data-cond="bookAgain" data-val="${Utils.escHtml(b)}">${b}</span>`).join('')}
        </div>
      </div>
    `;

    bindConditionChips(body);

    const priceEl  = document.getElementById('stay-price');
    if (priceEl)  priceEl.addEventListener('input', e  => { draft.catData.pricePerNight = e.target.value; });
    const nightsEl = document.getElementById('stay-nights');
    if (nightsEl) nightsEl.addEventListener('input', e => { draft.catData.nights = e.target.value; });

    footer.innerHTML = `
      <button class="btn-secondary" id="btn-back-stay">← Back</button>
      <button class="btn-primary" id="btn-next-stay">Next →</button>
    `;
    document.getElementById('btn-back-stay').addEventListener('click', prevStep);
    document.getElementById('btn-next-stay').addEventListener('click', nextStep);
  }

  // Shared chip binding for conditions / stay info
  function bindConditionChips(body) {
    body.querySelectorAll('[data-cond]').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.cond;
        draft.catData[key] = chip.dataset.val;
        body.querySelectorAll(`[data-cond="${key}"]`).forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
      });
    });

    body.querySelectorAll('[data-multi]').forEach(chip => {
      chip.addEventListener('click', () => {
        const key = chip.dataset.multi;
        if (!draft.catData[key]) draft.catData[key] = [];
        const val = chip.dataset.val;
        const idx = draft.catData[key].indexOf(val);
        if (idx >= 0) {
          draft.catData[key].splice(idx, 1);
          chip.classList.remove('selected');
        } else {
          draft.catData[key].push(val);
          chip.classList.add('selected');
        }
      });
    });

    const bookingToggle = document.getElementById('toggle-booking');
    if (bookingToggle) {
      bookingToggle.addEventListener('click', () => {
        draft.catData.bookingRequired = !draft.catData.bookingRequired;
        bookingToggle.classList.toggle('on', draft.catData.bookingRequired);
      });
    }

    [['cond-elevation','elevation'],['cond-trail','trail'],['cond-wildlife','wildlife'],['cond-view','view']].forEach(([id, key]) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', e => { draft.catData[key] = e.target.value; });
    });
  }

  // ── Food Log ─────────────────────────────────────────────
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
      <button class="btn-secondary" id="btn-back-food">← Back</button>
      <button class="btn-primary" id="btn-next-food">Next →</button>
    `;
    document.getElementById('btn-back-food').addEventListener('click', prevStep);
    document.getElementById('btn-next-food').addEventListener('click', nextStep);
  }

  function foodEntryHtml(f, i) {
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

  // ── Photos ───────────────────────────────────────────────
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
        const grid   = document.getElementById('photo-grid');
        const addBtn = document.getElementById('photo-add-btn');
        const wrapper = document.createElement('div');
        wrapper.innerHTML = photoThumb(data, draft.photos.length - 1);
        grid.insertBefore(wrapper.firstElementChild, addBtn);
        bindPhotoThumb(draft.photos.length - 1);
      }
      e.target.value = '';
    });

    footer.innerHTML = `
      <button class="btn-secondary" id="btn-back-photos">← Back</button>
      <button class="btn-primary" id="btn-save">${editMode ? '✓ Update Place' : '✓ Save Place'}</button>
    `;
    document.getElementById('btn-back-photos').addEventListener('click', prevStep);
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

  // ── Save ─────────────────────────────────────────────────
  function save() {
    if (editMode && editId) {
      const updates = { ...draft };
      delete updates.id;
      delete updates.createdAt;
      const updated = Storage.updateLocation(editId, updates);
      close();
      if (typeof onSaveCb === 'function') onSaveCb(updated);
    } else {
      const loc = {
        ...draft,
        id: Utils.generateId(),
        createdAt: new Date().toISOString(),
      };
      Storage.addLocation(loc);
      close();
      if (typeof onSaveCb === 'function') onSaveCb(loc);
    }
  }

  // ── Init ─────────────────────────────────────────────────
  function init() {
    document.getElementById('modal-close').addEventListener('click', close);
    document.getElementById('modal-overlay').addEventListener('click', e => {
      if (e.target === document.getElementById('modal-overlay')) close();
    });
  }

  return { open, openEdit, close, init };
})();
