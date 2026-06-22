const Oura = (() => {
  const TOKEN_KEY = 'oura_token';
  const BASE = 'https://api.ouraring.com/v2/usercollection';

  function getToken() { return localStorage.getItem(TOKEN_KEY) || ''; }
  function setToken(t) {
    if (t) localStorage.setItem(TOKEN_KEY, t.trim());
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function fetchDay(date) {
    const token = getToken();
    if (!token || !date) return null;
    const headers = { Authorization: `Bearer ${token}` };
    const q = `?start_date=${date}&end_date=${date}`;
    try {
      const [rd, sl, ac] = await Promise.all([
        fetch(`${BASE}/daily_readiness${q}`, { headers }).then(r => r.json()),
        fetch(`${BASE}/daily_sleep${q}`, { headers }).then(r => r.json()),
        fetch(`${BASE}/daily_activity${q}`, { headers }).then(r => r.json()),
      ]);
      const r = rd.data?.[0];
      const s = sl.data?.[0];
      const a = ac.data?.[0];
      if (!r && !s && !a) return null;
      return {
        date,
        readiness:  r?.score  ?? null,
        sleep:      s?.score  ?? null,
        sleepHours: s?.total_sleep_duration ? Math.round(s.total_sleep_duration / 360) / 10 : null,
        activity:   a?.score  ?? null,
        steps:      a?.steps  ?? null,
      };
    } catch { return null; }
  }

  async function testToken(token) {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const r = await fetch(`${BASE}/daily_readiness?start_date=${today}&end_date=${today}`, {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      return r.ok;
    } catch { return false; }
  }

  return { getToken, setToken, fetchDay, testToken };
})();
