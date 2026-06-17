import type { LocationTheme } from './types';

export interface ThemeConfig {
  id: LocationTheme;
  name: string;
  emoji: string;
  description: string;
  bg: string;
  card: string;
  cardBorder: string;
  headerBg: string;
  text: string;
  textMuted: string;
  accent: string;
  accentLight: string;
  badgeBg: string;
  badgeText: string;
  divider: string;
  fontStyle: 'normal' | 'italic';
}

export const THEMES: Record<LocationTheme, ThemeConfig> = {
  modern: {
    id: 'modern',
    name: 'Modern',
    emoji: '🏙️',
    description: 'Clean, minimal, contemporary',
    bg: '#F9FAFB',
    card: '#FFFFFF',
    cardBorder: '#E5E7EB',
    headerBg: '#FFFFFF',
    text: '#111827',
    textMuted: '#6B7280',
    accent: '#4F46E5',
    accentLight: '#EEF2FF',
    badgeBg: '#EEF2FF',
    badgeText: '#4338CA',
    divider: '#F3F4F6',
    fontStyle: 'normal',
  },
  country: {
    id: 'country',
    name: 'Country',
    emoji: '🌾',
    description: 'Rustic, warm, kraft paper feel',
    bg: '#FFFBEB',
    card: '#FEF3C7',
    cardBorder: '#D97706',
    headerBg: '#FDE68A',
    text: '#78350F',
    textMuted: '#92400E',
    accent: '#B45309',
    accentLight: '#FEF3C7',
    badgeBg: '#FDE68A',
    badgeText: '#78350F',
    divider: '#FDE68A',
    fontStyle: 'italic',
  },
  city: {
    id: 'city',
    name: 'City',
    emoji: '🌆',
    description: 'Urban, dark, electric',
    bg: '#0F172A',
    card: '#1E293B',
    cardBorder: '#334155',
    headerBg: '#1E293B',
    text: '#F1F5F9',
    textMuted: '#94A3B8',
    accent: '#A78BFA',
    accentLight: '#2D1F6E',
    badgeBg: '#312E81',
    badgeText: '#C4B5FD',
    divider: '#334155',
    fontStyle: 'normal',
  },
  rural: {
    id: 'rural',
    name: 'Rural',
    emoji: '🌿',
    description: 'Natural, earthy, green',
    bg: '#F0FDF4',
    card: '#FFFFFF',
    cardBorder: '#86EFAC',
    headerBg: '#DCFCE7',
    text: '#14532D',
    textMuted: '#166534',
    accent: '#15803D',
    accentLight: '#DCFCE7',
    badgeBg: '#DCFCE7',
    badgeText: '#14532D',
    divider: '#DCFCE7',
    fontStyle: 'normal',
  },
  coastal: {
    id: 'coastal',
    name: 'Coastal',
    emoji: '🌊',
    description: 'Breezy, blue, nautical',
    bg: '#F0F9FF',
    card: '#FFFFFF',
    cardBorder: '#BAE6FD',
    headerBg: '#E0F2FE',
    text: '#0C4A6E',
    textMuted: '#075985',
    accent: '#0284C7',
    accentLight: '#E0F2FE',
    badgeBg: '#E0F2FE',
    badgeText: '#0C4A6E',
    divider: '#E0F2FE',
    fontStyle: 'normal',
  },
  mountain: {
    id: 'mountain',
    name: 'Mountain',
    emoji: '⛰️',
    description: 'Bold, rugged, alpine',
    bg: '#F5F5F4',
    card: '#FAFAF9',
    cardBorder: '#A8A29E',
    headerBg: '#E7E5E4',
    text: '#1C1917',
    textMuted: '#57534E',
    accent: '#44403C',
    accentLight: '#E7E5E4',
    badgeBg: '#E7E5E4',
    badgeText: '#1C1917',
    divider: '#E7E5E4',
    fontStyle: 'normal',
  },
};
