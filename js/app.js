const App = (() => {

  const SCREENS = {
    map: MapScreen,
    timeline: Timeline,
    food: FoodJournal,
    passport: Passport,
  };

  let currentTab = 'map';

  function init() {
    Modal.init();

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

    // Start on map
    renderCurrent();
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
