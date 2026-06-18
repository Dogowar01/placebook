const App = (() => {

  const SCREENS = {
    map: MapScreen,
    timeline: Timeline,
    trips: Trips,
    food: FoodJournal,
    passport: Passport,
  };

  let currentTab = 'map';

  // Keep the Leaflet map sized correctly when the viewport changes (toolbar
  // show/hide, rotation). Layout height itself is handled in CSS via
  // 100dvh so the shell includes the bottom safe area.
  function onViewportChange() {
    if (typeof MapScreen !== 'undefined') MapScreen.invalidateSize();
  }

  function init() {
    Modal.init();

    window.addEventListener('resize', onViewportChange);
    window.addEventListener('orientationchange', () => setTimeout(onViewportChange, 120));

    // Tab navigation
    document.getElementById('bottom-nav').addEventListener('click', e => {
      const tab = e.target.closest('[data-tab]');
      if (!tab) return;
      switchTab(tab.dataset.tab);
    });

    // Delegate popup "Open Scrapbook" clicks (bubble up from Leaflet)
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-open-loc]');
      if (a) { e.preventDefault(); LocationDetail.open(a.dataset.openLoc); }
    });

    // Register service worker. updateViaCache:'none' forces the browser to
    // always re-fetch sw.js from the network so new deploys are detected.
    // When a new worker takes control, reload once so the fresh build shows.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });
    }

    // Render map first so Leaflet can initialise
    renderCurrent();

    // Show onboarding on first launch
    if (Onboarding.isNeeded()) {
      Onboarding.start();
    }
  }

  function switchTab(tab) {
    if (tab === currentTab) return;
    currentTab = tab;

    document.querySelectorAll('.nav-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));

    renderCurrent();
  }

  function renderCurrent() {
    const screen = SCREENS[currentTab];
    if (!screen) return;

    const container = document.getElementById('screen-container');
    container.innerHTML = screen.render();
    if (typeof screen.bind === 'function') screen.bind();
  }

  return { init, renderCurrent, switchTab };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => App.init());
