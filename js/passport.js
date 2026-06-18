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
        { id: 'shutter',      emoji: '📸', name: 'Shutterstock',     desc: 'Add 25 photos',                       check: l => l.reduce((s,x)=>s+(x.photos||[]).length,0) >= 25 },
        { id: 'photostar',    emoji: '🌟', name: 'Photo Star',        desc: 'Add 50 photos',                       check: l => l.reduce((s,x)=>s+(x.photos||[]).length,0) >= 50 },
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
    const totalPhotos = locations.reduce((s,l) => s+(l.photos||[]).length, 0);
    const avgRating = count ? (locations.reduce((s,l) => s+(l.rating||0), 0)/count).toFixed(1) : '—';

    const byCat = {};
    Utils.allCategories().forEach(c => { byCat[c.key] = 0; });
    locations.forEach(l => { if (l.category && byCat[l.category] !== undefined) byCat[l.category]++; });
    const maxCat = Math.max(1, ...Object.values(byCat));

    const countryCounts = {};
    locations.forEach(l => { if (l.country) countryCounts[l.country] = (countryCounts[l.country]||0)+1; });
    const topCountries = Object.entries(countryCounts).sort((a,b) => b[1]-a[1]).slice(0,5);

    return `
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
    `;
  }

  function renderAchievements(locations) {
    return ACHIEVEMENT_GROUPS.map(group => {
      const unlockedItems = group.items.filter(a => a.check(locations));
      const lockedItems   = group.items.filter(a => !a.check(locations));
      return `
        <div class="section-card">
          <div class="achieve-group-header">
            <span>${group.label}</span>
            <span class="achieve-count">${unlockedItems.length}/${group.items.length}</span>
          </div>
          <div class="section-card-body">
            ${unlockedItems.map(a => achievementHtml(a, true)).join('')}
            ${lockedItems.map(a => achievementHtml(a, false)).join('')}
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

  function bind() {
    document.querySelectorAll('[data-ptab]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.ptab;
        document.querySelectorAll('[data-ptab]').forEach(b => b.classList.toggle('active', b.dataset.ptab === tab));
        const locations = Storage.getLocations();
        document.getElementById('passport-tab-content').innerHTML =
          tab === 'stats' ? renderStats(locations) : renderAchievements(locations);
      });
    });
  }

  return { render, bind };
})();
