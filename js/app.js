const App = (() => {

  const SCREENS = {
    map: MapScreen,
    timeline: Timeline,
    food: FoodJournal,
    passport: Passport,
  };

  let currentTab = 'map';

  // Lock the app to the real visible viewport height. iOS CSS viewport units
  // (vh/dvh/-webkit-fill-available) are inconsistent across versions and
  // between Safari-browser and home-screen modes, which leaves a strip of
  // background below the nav. window.innerHeight is always the true visible
  // height, so we drive the layout from it and update as the toolbar
  // shows/hides or the device rotates.
  function setAppHeight() {
    document.documentElement.style.setProperty('--app-height', window.innerHeight + 'px');
    if (typeof MapScreen !== 'undefined') MapScreen.invalidateSize();
  }

  function init() {
    Modal.init();

    setAppHeight();
    window.addEventListener('resize', setAppHeight);
    window.addEventListener('orientationchange', () => setTimeout(setAppHeight, 120));
    // iOS sometimes reports a stale height on first paint — re-measure shortly after.
    setTimeout(setAppHeight, 250);

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

    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
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
