const Themes = (() => {
  const THEMES = {
    modern: {
      id: 'modern',
      name: 'Modern',
      emoji: '🏙️',
      desc: 'Clean, minimal, bold',
      cardBg: '#FFFFFF',
      cardBorder: '#E5E7EB',
      accent: '#4F46E5',
      accentLight: '#EEF2FF',
      text: '#111827',
      textMuted: '#6B7280',
      badgeBg: '#EEF2FF',
      badgeText: '#3730A3',
      fontFamily: "'Inter', sans-serif",
      headingWeight: 800,
      heroGrad: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
    },
    country: {
      id: 'country',
      name: 'Country',
      emoji: '🌾',
      desc: 'Warm, earthy, natural',
      cardBg: '#FFFBF0',
      cardBorder: '#D4A853',
      accent: '#A16207',
      accentLight: '#FEF9EE',
      text: '#1C1208',
      textMuted: '#78543A',
      badgeBg: '#FEF9C3',
      badgeText: '#854D0E',
      fontFamily: "'Lora', serif",
      headingWeight: 700,
      heroGrad: 'linear-gradient(135deg,#D97706,#A16207)',
    },
    city: {
      id: 'city',
      name: 'City',
      emoji: '🌆',
      desc: 'Sleek, dark, metropolitan',
      cardBg: '#1F2937',
      cardBorder: '#374151',
      accent: '#F59E0B',
      accentLight: '#1F2937',
      text: '#F9FAFB',
      textMuted: '#9CA3AF',
      badgeBg: '#374151',
      badgeText: '#FCD34D',
      fontFamily: "'Inter', sans-serif",
      headingWeight: 800,
      heroGrad: 'linear-gradient(135deg,#111827,#374151)',
    },
    rural: {
      id: 'rural',
      name: 'Rural',
      emoji: '🌿',
      desc: 'Soft greens, organic',
      cardBg: '#F0FDF4',
      cardBorder: '#86EFAC',
      accent: '#16A34A',
      accentLight: '#F0FDF4',
      text: '#14532D',
      textMuted: '#4B7C5E',
      badgeBg: '#DCFCE7',
      badgeText: '#15803D',
      fontFamily: "'Lora', serif",
      headingWeight: 600,
      heroGrad: 'linear-gradient(135deg,#22C55E,#16A34A)',
    },
    coastal: {
      id: 'coastal',
      name: 'Coastal',
      emoji: '🌊',
      desc: 'Ocean blues, fresh',
      cardBg: '#F0F9FF',
      cardBorder: '#7DD3FC',
      accent: '#0284C7',
      accentLight: '#E0F2FE',
      text: '#0C2340',
      textMuted: '#4B6E8C',
      badgeBg: '#E0F2FE',
      badgeText: '#0369A1',
      fontFamily: "'Inter', sans-serif",
      headingWeight: 700,
      heroGrad: 'linear-gradient(135deg,#0EA5E9,#0284C7)',
    },
    mountain: {
      id: 'mountain',
      name: 'Mountain',
      emoji: '⛰️',
      desc: 'Purple peaks, rugged',
      cardBg: '#FAF5FF',
      cardBorder: '#C4B5FD',
      accent: '#7C3AED',
      accentLight: '#F5F3FF',
      text: '#2E1065',
      textMuted: '#6D519D',
      badgeBg: '#EDE9FE',
      badgeText: '#5B21B6',
      fontFamily: "'Inter', sans-serif",
      headingWeight: 800,
      heroGrad: 'linear-gradient(135deg,#7C3AED,#4C1D95)',
    },
  };

  function get(id) { return THEMES[id] || THEMES.modern; }

  function all() { return Object.values(THEMES); }

  function applyToEl(el, themeId) {
    const t = get(themeId);
    el.style.setProperty('--th-card-bg', t.cardBg);
    el.style.setProperty('--th-border', t.cardBorder);
    el.style.setProperty('--th-accent', t.accent);
    el.style.setProperty('--th-accent-light', t.accentLight);
    el.style.setProperty('--th-text', t.text);
    el.style.setProperty('--th-text-muted', t.textMuted);
    el.style.setProperty('--th-badge-bg', t.badgeBg);
    el.style.setProperty('--th-badge-text', t.badgeText);
    el.style.setProperty('--th-font', t.fontFamily);
    el.style.setProperty('--th-heading-weight', t.headingWeight);
    el.style.setProperty('--th-hero-grad', t.heroGrad);
    el.style.fontFamily = t.fontFamily;
  }

  return { get, all, applyToEl };
})();
