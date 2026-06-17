const FoodJournal = (() => {

  let activeCategory = 'all';
  let activeSort = 'recent';

  function render() {
    const locations = Storage.getLocations();
    const allFood = [];

    locations.forEach(loc => {
      (loc.food || []).forEach(f => {
        allFood.push({ ...f, locationId: loc.id, locationName: loc.name, locationCountry: loc.country, date: loc.date || loc.createdAt });
      });
    });

    if (allFood.length === 0) {
      return `
        <div class="screen">
          <div class="screen-header">
            <h1>Food Journal</h1>
            <p>Meals across all your places</p>
          </div>
          <div class="empty-state">
            <div class="big-emoji">🍽️</div>
            <h2>No meals logged</h2>
            <p>When you add places, use the Food Log step to record meals and drinks you enjoyed there.</p>
          </div>
        </div>
      `;
    }

    // Filter
    const filtered = activeCategory === 'all'
      ? allFood
      : allFood.filter(f => f.category === activeCategory);

    // Sort
    let sorted = [...filtered];
    if (activeSort === 'rating') {
      sorted.sort((a,b) => (b.rating||0) - (a.rating||0));
    } else if (activeSort === 'name') {
      sorted.sort((a,b) => a.name.localeCompare(b.name));
    } else {
      sorted.sort((a,b) => new Date(b.date) - new Date(a.date));
    }

    // Category counts for pills
    const countsByCategory = {};
    allFood.forEach(f => { countsByCategory[f.category] = (countsByCategory[f.category]||0)+1; });

    const cats = ['all', ...Utils.FOOD_CATEGORIES];
    const catEmojis = {'restaurant':'🍽️','cafe':'☕','street food':'🌮','bar':'🍺','bakery':'🥐','market':'🛒','fine dining':'🥂','takeaway':'📦','picnic':'🧺','other':'🍴','all':'🌍'};

    return `
      <div class="screen" id="food-screen">
        <div class="screen-header">
          <h1>Food Journal</h1>
          <p>${allFood.length} meal${allFood.length!==1?'s':''} logged</p>
        </div>

        <div class="food-filter-bar">
          ${cats.map(c => {
            const count = c === 'all' ? allFood.length : (countsByCategory[c]||0);
            if (c !== 'all' && count === 0) return '';
            const label = c === 'all' ? 'All' : c[0].toUpperCase()+c.slice(1);
            return `<button class="cat-pill${activeCategory===c?' active':''}" data-cat="${c}">
              ${catEmojis[c]||'🍴'} ${label} ${count}
            </button>`;
          }).join('')}
        </div>

        <div class="sort-bar">
          <button class="sort-btn${activeSort==='recent'?' active':''}" data-sort="recent">Recent</button>
          <button class="sort-btn${activeSort==='rating'?' active':''}" data-sort="rating">Top Rated</button>
          <button class="sort-btn${activeSort==='name'?' active':''}" data-sort="name">A–Z</button>
        </div>

        <div class="food-list pb-bottom">
          ${sorted.length === 0 ? `<div class="empty-state" style="height:auto;padding:40px 20px"><div class="big-emoji">🔍</div><p>No meals in this category</p></div>` : ''}
          ${sorted.map(f => foodItem(f)).join('')}
        </div>
      </div>
    `;
  }

  function foodItem(f) {
    const catEmojis = {'restaurant':'🍽️','cafe':'☕','street food':'🌮','bar':'🍺','bakery':'🥐','market':'🛒','fine dining':'🥂','takeaway':'📦','picnic':'🧺','other':'🍴'};
    const emoji = catEmojis[f.category] || '🍴';
    const ratingStr = f.rating ? '⭐'.repeat(f.rating) : '';
    const dateStr = Utils.formatDateShort(f.date);
    return `
      <div class="food-item" data-food-loc="${f.locationId}">
        <div class="food-item-icon">${emoji}</div>
        <div style="flex:1;overflow:hidden">
          <div class="food-item-name">${Utils.escHtml(f.name)}</div>
          <div class="food-item-sub">${Utils.escHtml(f.locationName)}${f.locationCountry ? ', '+Utils.escHtml(f.locationCountry):''} · ${dateStr}</div>
          ${f.venue ? `<div class="food-item-sub ellipsis">${Utils.escHtml(f.venue)}</div>` : ''}
        </div>
        <div style="text-align:right;flex-shrink:0">
          ${ratingStr ? `<div style="font-size:12px">${ratingStr}</div>` : ''}
          <div style="font-size:11px;color:var(--text-muted);margin-top:3px;text-transform:capitalize">${f.category}</div>
        </div>
      </div>
    `;
  }

  function bind() {
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        activeCategory = pill.dataset.cat;
        App.renderCurrent();
      });
    });

    document.querySelectorAll('.sort-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSort = btn.dataset.sort;
        App.renderCurrent();
      });
    });

    document.querySelectorAll('.food-item').forEach(el => {
      el.addEventListener('click', () => {
        LocationDetail.open(el.dataset.foodLoc);
      });
    });
  }

  return { render, bind };
})();
