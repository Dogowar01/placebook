const Utils = (() => {

  const CATEGORIES = {
    home:      { emoji: '🏠', label: 'Home',          color: '#EF4444' },
    town:      { emoji: '🏘️', label: 'Town',          color: '#6366F1' },
    city:      { emoji: '🏙️', label: 'City',          color: '#0EA5E9' },
    restaurant:{ emoji: '🍽️', label: 'Restaurant',    color: '#F59E0B' },
    cafe:      { emoji: '☕', label: 'Café',          color: '#92400E' },
    bar:       { emoji: '🍺', label: 'Bar / Pub',     color: '#CA8A04' },
    takeaway:  { emoji: '🥡', label: 'Takeaway',      color: '#F43F5E' },
    hotel:     { emoji: '🏨', label: 'Stay',          color: '#0D9488' },
    campsite:  { emoji: '⛺', label: 'Campsite',      color: '#22C55E' },
    park:      { emoji: '🌲', label: 'National Park', color: '#10B981' },
    beach:     { emoji: '🏖️', label: 'Beach',         color: '#F97316' },
    mountain:  { emoji: '⛰️', label: 'Mountain',      color: '#6B7280' },
    viewpoint: { emoji: '🌅', label: 'Viewpoint',     color: '#D97706' },
    photospot: { emoji: '📸', label: 'Photo Spot',    color: '#2563EB' },
    attraction:{ emoji: '🎡', label: 'Attraction',    color: '#EC4899' },
    museum:    { emoji: '🏛️', label: 'Museum',        color: '#9333EA' },
    shop:      { emoji: '🛍️', label: 'Shopping',      color: '#DB2777' },
    medical:   { emoji: '🏥', label: 'Medical',       color: '#0891B2' },
    hidden:    { emoji: '💎', label: 'Hidden Gem',    color: '#8B5CF6' },
    roadtrip:  { emoji: '🚗', label: 'Road Trip',     color: '#DC2626' },
  };

  const FOOD_CATEGORIES = ['restaurant','cafe','street food','bar','bakery','market','fine dining','takeaway','picnic','other'];

  const MOODS = ['😊 Happy','🤩 Amazed','😌 Peaceful','🥰 Loved it','😮 Surprised','🤔 Curious','😴 Relaxed','🎉 Festive'];

  const WEATHER = ['☀️ Sunny','⛅ Partly Cloudy','🌧️ Rainy','🌫️ Foggy','❄️ Snowy','🌬️ Windy','🌩️ Stormy'];

  function generateId() {
    return Math.random().toString(36).slice(2,9) + Date.now().toString(36);
  }

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' });
  }

  function formatDateShort(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  }

  function getYear(iso) {
    if (!iso) return new Date().getFullYear();
    return new Date(iso).getFullYear();
  }

  function stars(rating, size = '') {
    const r = Math.round(rating || 0);
    let s = '';
    for (let i = 1; i <= 5; i++) s += `<span class="star ${size}" data-v="${i}">${i <= r ? '⭐' : '☆'}</span>`;
    return `<div class="stars readonly ${size}">${s}</div>`;
  }

  function starsInteractive(rating, onChange) {
    const id = 'sr_' + generateId();
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      let current = rating || 0;
      function render(h) {
        el.querySelectorAll('.star').forEach((s, i) => {
          s.textContent = i < h ? '⭐' : '☆';
        });
      }
      el.querySelectorAll('.star').forEach(s => {
        const v = +s.dataset.v;
        s.addEventListener('mouseover', () => render(v));
        s.addEventListener('mouseleave', () => render(current));
        s.addEventListener('click', () => { current = v; render(v); onChange(v); });
        s.addEventListener('touchend', e => { e.preventDefault(); current = v; render(v); onChange(v); });
      });
      render(current);
    }, 0);
    let s = '';
    for (let i = 1; i <= 5; i++) s += `<span class="star lg" data-v="${i}">${i <= (rating||0) ? '⭐' : '☆'}</span>`;
    return `<div class="stars" id="${id}">${s}</div>`;
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function category(key) {
    return CATEGORIES[key] || { emoji: '📍', label: key, color: '#6B7280' };
  }

  function allCategories() {
    return Object.entries(CATEGORIES).filter(([k]) => k !== 'home').map(([k,v]) => ({key:k,...v}));
  }

  function buildListItems(arr, placeholder) {
    if (!arr || arr.length === 0) return `<p class="empty-list">${placeholder}</p>`;
    return arr.map(t => `<div class="d-bullet"><span class="d-bullet-dot">•</span><span class="d-bullet-text">${escHtml(t)}</span></div>`).join('');
  }

  // Parse "country/city" from location name or manual override
  function guessCountry(loc) {
    return loc.country || 'Unknown';
  }

  return { generateId, formatDate, formatDateShort, getYear, stars, starsInteractive, escHtml, category, allCategories, CATEGORIES, FOOD_CATEGORIES, MOODS, WEATHER, buildListItems, guessCountry };
})();
