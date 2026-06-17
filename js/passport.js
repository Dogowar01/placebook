const Passport = (() => {

  const ACHIEVEMENTS = [
    { id: 'first',      emoji: '📍', name: 'First Pin',      desc: 'Add your first place',                   check: locs => locs.length >= 1 },
    { id: 'explorer5',  emoji: '🗺️', name: 'Explorer',       desc: 'Visit 5 different places',               check: locs => locs.length >= 5 },
    { id: 'wanderer',   emoji: '✈️', name: 'Wanderer',       desc: 'Visit 3 different countries',            check: locs => new Set(locs.map(l=>l.country).filter(Boolean)).size >= 3 },
    { id: 'foodie',     emoji: '🍽️', name: 'Foodie',         desc: 'Log 10 meals across your places',        check: locs => locs.reduce((s,l)=>s+(l.food||[]).length,0) >= 10 },
    { id: 'shutter',    emoji: '📸', name: 'Shutterstock',   desc: 'Add 25 photos total',                    check: locs => locs.reduce((s,l)=>s+(l.photos||[]).length,0) >= 25 },
    { id: 'gemhunter',  emoji: '💎', name: 'Gem Hunter',     desc: 'Find 5 hidden gems',                     check: locs => locs.reduce((s,l)=>s+(l.gems||[]).length,0) >= 5 },
    { id: 'beachbum',   emoji: '🏖️', name: 'Beach Bum',      desc: 'Visit 3 beaches',                        check: locs => locs.filter(l=>l.category==='beach').length >= 3 },
    { id: 'climber',    emoji: '⛰️', name: 'Summit Chaser',  desc: 'Log 3 mountains',                        check: locs => locs.filter(l=>l.category==='mountain').length >= 3 },
    { id: 'camper',     emoji: '⛺', name: 'Camper',         desc: 'Stay at 3 campsites',                    check: locs => locs.filter(l=>l.category==='campsite').length >= 3 },
    { id: 'returner',   emoji: '↩️', name: 'Always Return',  desc: 'Mark 5 places as "would return"',        check: locs => locs.filter(l=>l.wouldReturn).length >= 5 },
    { id: 'century',    emoji: '💯', name: 'Century',        desc: 'Reach 100 places',                       check: locs => locs.length >= 100 },
    { id: 'worldtour',  emoji: '🌍', name: 'World Tour',     desc: 'Visit 10 different countries',           check: locs => new Set(locs.map(l=>l.country).filter(Boolean)).size >= 10 },
    { id: 'gourmet',    emoji: '🥂', name: 'Gourmet',        desc: 'Visit 5 fine dining restaurants',        check: locs => locs.reduce((s,l)=>s+(l.food||[]).filter(f=>f.category==='fine dining').length,0)>=5 },
    { id: 'storyteller',emoji: '✍️', name: 'Storyteller',    desc: 'Write notes on 10 places',               check: locs => locs.filter(l=>l.notes&&l.notes.length>20).length >= 10 },
  ];

  function render() {
    const locations = Storage.getLocations();
    const count = locations.length;

    // Stats
    const countrySet = new Set(locations.map(l=>l.country).filter(Boolean));
    const totalMeals = locations.reduce((s,l)=>s+(l.food||[]).length,0);
    const totalPhotos = locations.reduce((s,l)=>s+(l.photos||[]).length,0);
    const avgRating = count ? (locations.reduce((s,l)=>s+(l.rating||0),0)/count).toFixed(1) : '—';

    // Category breakdown
    const byCat = {};
    Utils.allCategories().forEach(c => { byCat[c.key] = 0; });
    locations.forEach(l => { if (l.category && byCat[l.category] !== undefined) byCat[l.category]++; });
    const maxCat = Math.max(1, ...Object.values(byCat));

    // Top countries
    const countryCounts = {};
    locations.forEach(l => { if (l.country) countryCounts[l.country] = (countryCounts[l.country]||0)+1; });
    const topCountries = Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).slice(0,5);

    // Achievements
    const unlocked = ACHIEVEMENTS.filter(a => a.check(locations));
    const locked = ACHIEVEMENTS.filter(a => !a.check(locations));
    const pct = Math.round((unlocked.length / ACHIEVEMENTS.length) * 100);

    return `
      <div class="screen" id="passport-screen">

        <!-- Hero -->
        <div class="passport-hero">
          <div class="passport-icon-wrap">📘</div>
          <h1>Travel Passport</h1>
          <p>${count} place${count!==1?'s':''} · ${countrySet.size} countr${countrySet.size!==1?'ies':'y'}</p>
          <div class="passport-progress-track" style="width:100%">
            <div class="passport-progress-fill" style="width:${pct}%"></div>
          </div>
          <p style="font-size:12px;color:rgba(255,255,255,0.6)">${unlocked.length}/${ACHIEVEMENTS.length} achievements · ${pct}% complete</p>
        </div>

        <!-- Content -->
        <div class="passport-content pb-bottom">

          <!-- Stats grid -->
          <div class="stats-grid">
            ${statCard('🌍', count, 'Places')}
            ${statCard('🗺️', countrySet.size, 'Countries')}
            ${statCard('⭐', avgRating, 'Avg Rating')}
            ${statCard('🍽️', totalMeals, 'Meals')}
            ${statCard('📸', totalPhotos, 'Photos')}
            ${statCard('↩️', locations.filter(l=>l.wouldReturn).length, 'Returns')}
          </div>

          <!-- Category breakdown -->
          <div class="section-card">
            <div class="section-card-header">Breakdown by Category</div>
            <div class="section-card-body">
              ${Utils.allCategories().map(c => {
                const n = byCat[c.key] || 0;
                const pct = Math.round((n / maxCat) * 100);
                return `
                  <div class="cat-row">
                    <span class="cat-row-emoji">${c.emoji}</span>
                    <div class="cat-row-content">
                      <div class="cat-row-label-row">
                        <span class="cat-row-name">${c.label}</span>
                        <span class="cat-row-count">${n}</span>
                      </div>
                      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Top countries -->
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

          <!-- Achievements -->
          <div class="section-card">
            <div class="section-card-header">Achievements (${unlocked.length}/${ACHIEVEMENTS.length})</div>
            <div class="section-card-body">
              ${unlocked.map(a => achievementHtml(a, true)).join('')}
              ${locked.map(a => achievementHtml(a, false)).join('')}
            </div>
          </div>

        </div>
      </div>
    `;
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

  function achievementHtml(a, unlocked) {
    return `
      <div class="achievement ${unlocked ? 'unlocked' : 'locked'}">
        <span class="achievement-icon">${a.emoji}</span>
        <div>
          <div class="achievement-name">${a.name}</div>
          <div class="achievement-desc">${a.desc}</div>
        </div>
        ${unlocked ? `<span class="achievement-check">✓</span>` : ''}
      </div>
    `;
  }

  function bind() { /* static screen */ }

  return { render, bind };
})();
