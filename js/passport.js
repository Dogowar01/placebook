const Passport = (() => {

  const ACHIEVEMENT_GROUPS = [
    {
      id: 'explorer', label: '🗺️ Explorer',
      items: [
        { id: 'first',        emoji: '📍', name: 'First Pin',      desc: 'Add your first place',                check: l => l.length >= 1 },
        { id: 'explorer5',    emoji: '🗺️', name: 'Explorer',       desc: 'Visit 5 places',                      check: l => l.length >= 5 },
        { id: 'globetrotter', emoji: '✈️', name: 'Globetrotter',   desc: 'Visit 25 places',                     check: l => l.length >= 25 },
        { id: 'trailblazer',  emoji: '🚀', name: 'Trailblazer',    desc: 'Visit 50 places',                     check: l => l.length >= 50 },
        { id: 'century',      emoji: '💯', name: 'Century',         desc: 'Reach 100 places',                    check: l => l.length >= 100 },
        { id: 'wanderer',     emoji: '🌍', name: 'Wanderer',        desc: 'Visit 3 different countries',         check: l => new Set(l.map(x=>x.country).filter(Boolean)).size >= 3 },
        { id: 'worldtour',    emoji: '🌐', name: 'World Tour',      desc: 'Visit 10 different countries',        check: l => new Set(l.map(x=>x.country).filter(Boolean)).size >= 10 },
      ],
    },
    {
      id: 'foodie', label: '🍽️ Foodie',
      items: [
        { id: 'foodie',       emoji: '🍽️', name: 'Foodie',          desc: 'Log 10 meals',                        check: l => l.reduce((s,x)=>s+(x.food||[]).length,0) >= 10 },
        { id: 'gourmet',      emoji: '🥂', name: 'Gourmet',          desc: 'Visit 5 fine dining restaurants',     check: l => l.reduce((s,x)=>s+(x.food||[]).filter(f=>f.category==='fine dining').length,0) >= 5 },
        { id: 'cafecrawler',  emoji: '☕', name: 'Café Crawler',     desc: 'Visit 5 cafés',                       check: l => l.filter(x=>x.category==='cafe').length >= 5 },
        { id: 'pubcrawler',   emoji: '🍺', name: 'Pub Crawler',      desc: 'Visit 5 bars or pubs',                check: l => l.filter(x=>x.category==='bar').length >= 5 },
        { id: 'takeawayking', emoji: '🥡', name: 'Takeaway King',    desc: 'Log 5 takeaways',                     check: l => l.filter(x=>x.category==='takeaway').length >= 5 },
        { id: 'regulareat',   emoji: '🍴', name: 'Regular',          desc: 'Visit 5 restaurants',                 check: l => l.filter(x=>x.category==='restaurant').length >= 5 },
      ],
    },
    {
      id: 'nature', label: '🌿 Nature',
      items: [
        { id: 'beachbum',     emoji: '🏖️', name: 'Beach Bum',       desc: 'Visit 3 beaches',                     check: l => l.filter(x=>x.category==='beach').length >= 3 },
        { id: 'climber',      emoji: '⛰️', name: 'Summit Chaser',   desc: 'Log 3 mountains',                     check: l => l.filter(x=>x.category==='mountain').length >= 3 },
        { id: 'camper',       emoji: '⛺', name: 'Camper',           desc: 'Stay at 3 campsites',                 check: l => l.filter(x=>x.category==='campsite').length >= 3 },
        { id: 'parkranger',   emoji: '🌲', name: 'Park Ranger',      desc: 'Visit 3 national parks',              check: l => l.filter(x=>x.category==='park').length >= 3 },
        { id: 'viewfinder',   emoji: '🌅', name: 'Viewfinder',       desc: 'Find 3 great viewpoints',             check: l => l.filter(x=>x.category==='viewpoint').length >= 3 },
        { id: 'roadwarrior',  emoji: '🚗', name: 'Road Warrior',     desc: 'Complete 3 road trips',               check: l => l.filter(x=>x.category==='roadtrip').length >= 3 },
      ],
    },
    {
      id: 'culture', label: '🏛️ Culture',
      items: [
        { id: 'culturevult',  emoji: '🏛️', name: 'Culture Vulture', desc: 'Visit 3 museums',                     check: l => l.filter(x=>x.category==='museum').length >= 3 },
        { id: 'thrillseekr',  emoji: '🎡', name: 'Thrill Seeker',   desc: 'Visit 5 attractions',                  check: l => l.filter(x=>x.category==='attraction').length >= 5 },
        { id: 'shopaholic',   emoji: '🛍️', name: 'Shopaholic',       desc: 'Visit 3 shopping spots',              check: l => l.filter(x=>x.category==='shop').length >= 3 },
        { id: 'gemhunter',    emoji: '💎', name: 'Gem Hunter',        desc: 'Find 5 hidden gem spots',             check: l => l.filter(x=>x.category==='hidden').length >= 5 },
      ],
    },
    {
      id: 'memories', label: '📸 Memories',
      items: [
        { id: 'shutter',      emoji: '📸', name: 'Shutterstock',     desc: 'Add 25 photos',                       check: l => l.reduce((s,x)=>s+(x.photoIds||x.photos||[]).length,0) >= 25 },
        { id: 'photostar',    emoji: '🌟', name: 'Photo Star',        desc: 'Add 50 photos',                       check: l => l.reduce((s,x)=>s+(x.photoIds||x.photos||[]).length,0) >= 50 },
        { id: 'storyteller',  emoji: '✍️', name: 'Storyteller',       desc: 'Write notes on 10 places',            check: l => l.filter(x=>x.notes&&x.notes.length>20).length >= 10 },
        { id: 'diarykeepr',   emoji: '📖', name: 'Diary Keeper',      desc: 'Write notes on 25 places',            check: l => l.filter(x=>x.notes&&x.notes.length>20).length >= 25 },
        { id: 'returner',     emoji: '↩️', name: 'Always Return',     desc: 'Mark 5 places as "would return"',    check: l => l.filter(x=>x.wouldReturn).length >= 5 },
        { id: 'tipsharer',    emoji: '💡', name: 'Tip Sharer',        desc: 'Share 5 hidden gem tips',             check: l => l.reduce((s,x)=>s+(x.gems||[]).length,0) >= 5 },
      ],
    },
  ];

  const ALL_ACHIEVEMENTS = ACHIEVEMENT_GROUPS.flatMap(g => g.items);

  function render() {
    const locations = Storage.getLocations();
    const count = locations.length;
    const countrySet = new Set(locations.map(l => l.country).filter(Boolean));
    const unlocked = ALL_ACHIEVEMENTS.filter(a => a.check(locations));
    const pct = Math.round((unlocked.length / ALL_ACHIEVEMENTS.length) * 100);

    return `
      <div class="screen" id="passport-screen">
        <div class="passport-hero">
          <div class="passport-icon-wrap">📘</div>
          <h1>Travel Passport</h1>
          <p>${count} place${count!==1?'s':''} · ${countrySet.size} countr${countrySet.size!==1?'ies':'y'}</p>
          <div class="passport-progress-track">
            <div class="passport-progress-fill" style="width:${pct}%"></div>
          </div>
          <p style="font-size:12px;color:rgba(255,255,255,0.6)">${unlocked.length}/${ALL_ACHIEVEMENTS.length} achievements · ${pct}%</p>
        </div>
        <div class="passport-tab-bar">
          <button class="passport-tab active" data-ptab="stats">📊 Stats</button>
          <button class="passport-tab" data-ptab="achievements">🏆 Achievements</button>
          <button class="passport-tab" data-ptab="backup">💾 Backup</button>
        </div>
        <div class="passport-content pb-bottom" id="passport-tab-content">
          ${renderStats(locations)}
        </div>
      </div>
    `;
  }

  function renderStats(locations) {
    const count = locations.length;
    const countrySet = new Set(locations.map(l => l.country).filter(Boolean));
    const totalMeals = locations.reduce((s,l) => s+(l.food||[]).length, 0);
    const totalPhotos = locations.reduce((s,l) => s+(l.photoIds||l.photos||[]).length, 0);
    const avgRating = count ? (locations.reduce((s,l) => s+(l.rating||0), 0)/count).toFixed(1) : '—';

    const byCat = {};
    Utils.allCategories().forEach(c => { byCat[c.key] = 0; });
    locations.forEach(l => { if (l.category && byCat[l.category] !== undefined) byCat[l.category]++; });
    const maxCat = Math.max(1, ...Object.values(byCat));

    const countryCounts = {};
    locations.forEach(l => { if (l.country) countryCounts[l.country] = (countryCounts[l.country]||0)+1; });
    const topCountries = Object.entries(countryCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

    return `
      <button class="wrapped-btn" id="wrapped-btn">🎁 Year Wrapped ${new Date().getFullYear()}</button>
      <div class="stats-grid">
        ${statCard('🌍', count, 'Places')}
        ${statCard('🗺️', countrySet.size, 'Countries')}
        ${statCard('⭐', avgRating, 'Avg Rating')}
        ${statCard('🍽️', totalMeals, 'Meals')}
        ${statCard('📸', totalPhotos, 'Photos')}
        ${statCard('↩️', locations.filter(l=>l.wouldReturn).length, 'Returns')}
      </div>
      <div class="section-card">
        <div class="section-card-header">Breakdown by Category</div>
        <div class="section-card-body">
          ${Utils.allCategories().map(c => {
            const n = byCat[c.key] || 0;
            const p = Math.round((n / maxCat) * 100);
            return `
              <div class="cat-row">
                <span class="cat-row-emoji">${c.emoji}</span>
                <div class="cat-row-content">
                  <div class="cat-row-label-row">
                    <span class="cat-row-name">${c.label}</span>
                    <span class="cat-row-count">${n}</span>
                  </div>
                  <div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ${topCountries.length ? `
      <div class="section-card">
        <div class="section-card-header">Top Countries</div>
        <div class="section-card-body">
          ${topCountries.map(([country, n], i) => `
            <div class="country-row">
              <span class="country-rank">#${i+1}</span>
              <span class="country-name">${Utils.escHtml(country)}</span>
              <span class="country-count">${n} place${n!==1?'s':''}</span>
            </div>
          `).join('')}
        </div>
      </div>` : ''}
      ${renderYearByYear(locations)}
      ${renderTopMoods(locations)}
    `;
  }

  function renderYearByYear(locations) {
    if (!locations.length) return '';
    const byYear = {};
    locations.forEach(l => {
      const y = Utils.getYear(l.date || l.createdAt);
      byYear[y] = (byYear[y] || 0) + 1;
    });
    const years = Object.keys(byYear).sort((a,b) => b - a);
    const maxCount = Math.max(1, ...Object.values(byYear));
    return `
      <div class="section-card">
        <div class="section-card-header">Year by Year</div>
        <div class="section-card-body">
          ${years.map(y => {
            const n = byYear[y];
            const pct = Math.round((n / maxCount) * 100);
            return `
              <div class="cat-row">
                <span class="cat-row-emoji" style="font-size:14px;width:38px;font-weight:700;color:var(--accent-2)">${y}</span>
                <div class="cat-row-content">
                  <div class="cat-row-label-row">
                    <span class="cat-row-name">${n} place${n!==1?'s':''}</span>
                    <span class="cat-row-count">${n}</span>
                  </div>
                  <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderTopMoods(locations) {
    const moodCounts = {};
    locations.forEach(l => {
      if (l.mood) moodCounts[l.mood] = (moodCounts[l.mood] || 0) + 1;
    });
    const moods = Object.entries(moodCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);
    if (!moods.length) return '';
    const maxM = Math.max(1, ...moods.map(m => m[1]));
    return `
      <div class="section-card">
        <div class="section-card-header">Top Moods</div>
        <div class="section-card-body">
          ${moods.map(([mood, n]) => {
            const pct = Math.round((n / maxM) * 100);
            return `
              <div class="cat-row">
                <span class="cat-row-emoji">${mood.split(' ')[0]}</span>
                <div class="cat-row-content">
                  <div class="cat-row-label-row">
                    <span class="cat-row-name">${Utils.escHtml(mood)}</span>
                    <span class="cat-row-count">${n}</span>
                  </div>
                  <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderBackup() {
    return `
      <div class="backup-card">
        <div class="big-emoji" style="font-size:40px;margin-bottom:12px">💾</div>
        <p style="font-size:14px;color:var(--text-muted);margin-bottom:20px;line-height:1.5">Your data is stored locally on this device. Export regularly to keep a backup.</p>
        <button class="backup-btn btn-primary" id="backup-export" style="width:100%;margin-bottom:12px">⬇ Export Backup</button>
      </div>
      <div class="backup-card" style="margin-top:0">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:12px">📂 Import Backup</div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:12px;line-height:1.45">Select a previously exported <code>.json</code> file to restore your data. This will overwrite current data.</p>
        <label class="backup-btn btn-secondary" id="backup-import-label" style="display:flex;align-items:center;justify-content:center;cursor:pointer;padding:13px 20px;border-radius:14px;font-size:14px;font-weight:600">
          📁 Choose File
          <input type="file" accept=".json" id="backup-import-input" style="display:none">
        </label>
        <div id="backup-import-status" style="margin-top:10px;font-size:13px;color:var(--text-muted)"></div>
      </div>
    `;
  }

  function renderAchievements(locations) {
    return ACHIEVEMENT_GROUPS.map(group => {
      const unlockedItems = group.items.filter(a => a.check(locations));
      return `
        <div class="section-card">
          <div class="achieve-group-header">
            <span>${group.label}</span>
            <span class="achieve-count">${unlockedItems.length}/${group.items.length}</span>
          </div>
          <div class="stamps-grid">
            ${group.items.map(a => stampHtml(a, a.check(locations))).join('')}
          </div>
        </div>
      `;
    }).join('');
  }

  function statCard(emoji, value, label) {
    return `
      <div class="stat-card">
        <div class="emoji">${emoji}</div>
        <div class="value">${value}</div>
        <div class="label">${label}</div>
      </div>
    `;
  }

  function achievementHtml(a, isUnlocked) {
    return `
      <div class="achievement ${isUnlocked ? 'unlocked' : 'locked'}">
        <span class="achievement-icon">${a.emoji}</span>
        <div>
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-desc">${a.desc}</div>
        </div>
        ${isUnlocked ? `<span class="achievement-check">✓</span>` : ''}
      </div>
    `;
  }

  function stampHtml(a, isUnlocked) {
    return `
      <div class="stamp ${isUnlocked ? 'stamp-unlocked' : 'stamp-locked'}" title="${Utils.escHtml(a.desc)}">
        <div class="stamp-inner">
          <div class="stamp-emoji">${a.emoji}</div>
          <div class="stamp-name">${a.name}</div>
          ${isUnlocked ? '<div class="stamp-check">✓</div>' : '<div class="stamp-lock">🔒</div>'}
        </div>
      </div>
    `;
  }

  function bind() {
    const wrappedBtn = document.getElementById('wrapped-btn');
    if (wrappedBtn) wrappedBtn.addEventListener('click', () => ShareCard.generateWrapped(new Date().getFullYear()));

    document.querySelectorAll('[data-ptab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.ptab;
        document.querySelectorAll('[data-ptab]').forEach(b => b.classList.toggle('active', b.dataset.ptab === tab));
        const locations = Storage.getLocations();
        const content = document.getElementById('passport-tab-content');
        if (tab === 'stats') { content.innerHTML = renderStats(locations); const wb = document.getElementById('wrapped-btn'); if (wb) wb.addEventListener('click', () => ShareCard.generateWrapped(new Date().getFullYear())); }
        else if (tab === 'achievements') content.innerHTML = renderAchievements(locations);
        else if (tab === 'backup') { content.innerHTML = renderBackup(); bindBackup(); }
      });
    });
  }

  function bindBackup() {
    const exportBtn = document.getElementById('backup-export');
    if (exportBtn) exportBtn.addEventListener('click', async () => {
      exportBtn.disabled = true;
      exportBtn.textContent = '⏳ Exporting…';
      try {
        await Storage.exportBackup();
        exportBtn.textContent = '✓ Done!';
        setTimeout(() => { exportBtn.disabled = false; exportBtn.textContent = '⬇ Export Backup'; }, 2500);
      } catch (e) {
        alert('Export failed: ' + e.message);
        exportBtn.disabled = false;
        exportBtn.textContent = '⬇ Export Backup';
      }
    });

    const importInput = document.getElementById('backup-import-input');
    if (importInput) importInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async ev => {
        const status = document.getElementById('backup-import-status');
        try {
          const result = await Storage.importBackup(ev.target.result);
          if (status) status.innerHTML = `<span style="color:#10B981">✓ Imported ${result.locations} places, ${result.trips} trips, ${result.photos} photos. Reloading…</span>`;
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          if (status) status.innerHTML = `<span style="color:#F87171">✗ Import failed: ${Utils.escHtml(err.message)}</span>`;
        }
      };
      reader.readAsText(file);
    });
  }

  return { render, bind };
})();
