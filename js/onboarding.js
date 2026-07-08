const Onboarding = (() => {
  const KEY = 'pb_home_set';

  function isNeeded() {
    return !localStorage.getItem(KEY);
  }

  function markDone() {
    localStorage.setItem(KEY, '1');
  }

  function start() {
    const el = document.createElement('div');
    el.id = 'ob-overlay';
    el.className = 'ob-overlay';
    el.innerHTML = welcomeHtml();
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => el.classList.add('ob-visible'));
    });

    el.querySelector('#ob-use-location').addEventListener('click', () => useLocation(el));
    el.querySelector('#ob-skip').addEventListener('click', () => { markDone(); dismiss(el); });
  }

  function welcomeHtml() {
    return `
      <div class="ob-welcome">
        <div class="ob-welcome-top">
          <div class="ob-logo">📍</div>
          <h1 class="ob-title">Welcome to<br>Stamped</h1>
          <p class="ob-sub">Your personal scrapbook of everywhere you've been</p>
        </div>
        <div class="ob-features">
          <div class="ob-feat"><span>🗺️</span><span>Pin every place you've visited</span></div>
          <div class="ob-feat"><span>📸</span><span>Polaroids, stamps &amp; postcards</span></div>
          <div class="ob-feat"><span>🍽️</span><span>Food journal &amp; hidden gems</span></div>
          <div class="ob-feat"><span>🏆</span><span>Travel passport &amp; achievements</span></div>
        </div>
        <div class="ob-actions">
          <button class="ob-btn-primary" id="ob-use-location">Continue</button>
          <button class="ob-btn-ghost" id="ob-skip">Skip for now</button>
        </div>
      </div>
    `;
  }

  function useLocation(el) {
    const btn = el.querySelector('#ob-use-location');
    btn.textContent = 'Finding you…';
    btn.disabled = true;

    if (!navigator.geolocation) {
      // No geolocation: drop home at the current map centre so there's
      // always a valid pin; the user can adjust later.
      showNameSheet(el, MapScreen.getCenter());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => showNameSheet(el, { lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {
        // Denied or failed — fall back to the map centre rather than
        // leaving the user stuck.
        showNameSheet(el, MapScreen.getCenter());
      },
      { timeout: 9000, enableHighAccuracy: true }
    );
  }

  function showNameSheet(el, latlng) {
    el.classList.add('ob-sheet-mode');
    el.innerHTML = `
      <div class="ob-sheet">
        <div class="ob-sheet-handle"></div>
        <div class="ob-sheet-emoji">🏠</div>
        <div class="ob-sheet-title">Name your home base</div>
        <input class="ob-input" id="ob-home-name" type="text" value="Home" placeholder="e.g. My Home, The Flat…" autocomplete="off">
        <button class="ob-btn-primary ob-btn-save" id="ob-btn-save">📍 Place Home Pin</button>
      </div>
    `;

    const input = el.querySelector('#ob-home-name');
    setTimeout(() => { input.focus(); input.select(); }, 100);

    el.querySelector('#ob-btn-save').addEventListener('click', () => {
      const name = input.value.trim() || 'Home';
      const loc = Storage.addLocation({
        name,
        category: 'home',
        lat: latlng.lat,
        lng: latlng.lng,
        isHome: true,
        date: new Date().toISOString().slice(0, 10),
        country: '',
        theme: 'modern',
        photos: [], food: [], highlights: [], gems: [],
      });

      MapScreen.addMarker(loc);
      MapScreen.updateCount();
      MapScreen.flyTo(loc);
      markDone();
      showToast(el);
    });
  }

  function showToast(el) {
    el.className = 'ob-overlay ob-visible ob-toast-mode';
    el.innerHTML = `
      <div class="ob-toast">
        <span class="ob-toast-icon">🏠</span>
        <span>Home set! Now tap <strong>＋</strong> to add places you've visited.</span>
      </div>
    `;
    setTimeout(() => dismiss(el), 2600);
  }

  function dismiss(el) {
    el.style.transition = 'opacity 0.4s';
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 420);
  }

  return { isNeeded, start, markDone };
})();
