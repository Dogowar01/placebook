const Timeline = (() => {

  function render() {
    const locations = Storage.getLocations();

    if (locations.length === 0) {
      return `
        <div class="screen">
          <div class="screen-header">
            <h1>Timeline</h1>
            <p>Your travel history</p>
          </div>
          <div class="empty-state">
            <div class="big-emoji">🕰️</div>
            <h2>No memories yet</h2>
            <p>Add places on the map to see them appear here in chronological order.</p>
          </div>
        </div>
      `;
    }

    // Group by year, sorted newest first
    const byYear = {};
    locations.forEach(loc => {
      const y = Utils.getYear(loc.date || loc.createdAt);
      if (!byYear[y]) byYear[y] = [];
      byYear[y].push(loc);
    });

    const years = Object.keys(byYear).sort((a,b) => b - a);

    const groupsHtml = years.map(year => {
      const locs = byYear[year].sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt));
      const countries = [...new Set(locs.map(l => l.country).filter(Boolean))];
      return `
        <div class="year-group">
          <div class="year-header">
            <div class="year-bubble">${year.slice(2)}</div>
            <div class="year-info">
              <h3>${year}</h3>
              <p>${locs.length} place${locs.length!==1?'s':''} · ${countries.slice(0,3).join(', ')}</p>
            </div>
          </div>
          <div class="year-timeline">
            ${locs.map(loc => tlItem(loc)).join('')}
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="screen timeline-screen">
        <div class="screen-header">
          <h1>Timeline</h1>
          <p>${locations.length} place${locations.length!==1?'s':''} across ${years.length} year${years.length!==1?'s':''}</p>
        </div>
        <div class="scroll-content pb-bottom">
          ${groupsHtml}
        </div>
      </div>
    `;
  }

  function tlItem(loc) {
    const cat = Utils.category(loc.category);
    const photo = loc.photos && loc.photos[0];
    const dateStr = Utils.formatDateShort(loc.date || loc.createdAt);
    const highlight = loc.highlights && loc.highlights[0] ? loc.highlights[0] : (loc.notes ? loc.notes.slice(0,80) : '');

    return `
      <div class="tl-item" data-loc-id="${loc.id}">
        <div class="tl-dot" style="background:${cat.color}"></div>
        <div class="tl-card">
          ${photo ? `<img src="${photo}" alt="${Utils.escHtml(loc.name)}" loading="lazy">` : ''}
          <div class="tl-body">
            <div class="tl-name-row">
              <span class="tl-name">${Utils.escHtml(loc.name)}</span>
              <span style="font-size:18px;flex-shrink:0">${cat.emoji}</span>
            </div>
            <div class="tl-sub">${Utils.escHtml(loc.country || '')} · ${cat.label}</div>
            <div class="tl-date">${dateStr} ${loc.rating ? '· ' + '⭐'.repeat(loc.rating) : ''}</div>
            ${highlight ? `<div class="tl-highlight">${Utils.escHtml(highlight)}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  function bind() {
    document.querySelectorAll('.tl-item').forEach(el => {
      el.addEventListener('click', () => {
        LocationDetail.open(el.dataset.locId);
      });
    });
  }

  return { render, bind };
})();
