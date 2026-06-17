import type { LocationTheme } from "./types";

export interface ThemeConfig {
  id: LocationTheme;
  name: string;
  emoji: string;
  description: string;
  bg: string;
  card: string;
  header: string;
  text: string;
  accent: string;
  accentText: string;
  border: string;
  badge: string;
  photoFrame: string;
  font: string;
}

export const THEMES: Record<LocationTheme, ThemeConfig> = {
  modern: {
    id: "modern",
    name: "Modern",
    emoji: "🏙️",
    description: "Clean, minimal, contemporary",
    bg: "bg-gray-50",
    card: "bg-white border border-gray-200 shadow-sm",
    header: "bg-white border-b border-gray-200",
    text: "text-gray-900",
    accent: "bg-indigo-600",
    accentText: "text-indigo-600",
    border: "border-gray-200",
    badge: "bg-indigo-100 text-indigo-700",
    photoFrame: "border-4 border-white shadow-md",
    font: "font-sans",
  },
  country: {
    id: "country",
    name: "Country",
    emoji: "🌾",
    description: "Rustic, warm, kraft paper feel",
    bg: "bg-amber-50",
    card: "bg-amber-50 border-2 border-amber-200 shadow-md",
    header: "bg-amber-100 border-b-2 border-amber-300",
    text: "text-amber-900",
    accent: "bg-amber-700",
    accentText: "text-amber-700",
    border: "border-amber-300",
    badge: "bg-amber-200 text-amber-900",
    photoFrame: "border-4 border-amber-300 shadow-amber-200 shadow-md",
    font: "font-serif",
  },
  city: {
    id: "city",
    name: "City",
    emoji: "🌆",
    description: "Urban, dark, electric",
    bg: "bg-slate-900",
    card: "bg-slate-800 border border-slate-700 shadow-lg shadow-slate-900",
    header: "bg-slate-800 border-b border-slate-700",
    text: "text-slate-100",
    accent: "bg-violet-500",
    accentText: "text-violet-400",
    border: "border-slate-700",
    badge: "bg-violet-900 text-violet-300",
    photoFrame: "border-2 border-violet-500 shadow-violet-500/20 shadow-lg",
    font: "font-sans",
  },
  rural: {
    id: "rural",
    name: "Rural",
    emoji: "🌿",
    description: "Natural, earthy, green",
    bg: "bg-green-50",
    card: "bg-white border-2 border-green-200 shadow-sm",
    header: "bg-green-100 border-b-2 border-green-200",
    text: "text-green-950",
    accent: "bg-green-700",
    accentText: "text-green-700",
    border: "border-green-200",
    badge: "bg-green-100 text-green-800",
    photoFrame: "border-4 border-green-200 shadow-green-100 shadow-md",
    font: "font-serif",
  },
  coastal: {
    id: "coastal",
    name: "Coastal",
    emoji: "🌊",
    description: "Breezy, blue, nautical",
    bg: "bg-sky-50",
    card: "bg-white border-2 border-sky-200 shadow-sm",
    header: "bg-sky-100 border-b-2 border-sky-200",
    text: "text-sky-950",
    accent: "bg-sky-600",
    accentText: "text-sky-600",
    border: "border-sky-200",
    badge: "bg-sky-100 text-sky-800",
    photoFrame: "border-4 border-sky-200 shadow-sky-100 shadow-md rounded-lg",
    font: "font-sans",
  },
  mountain: {
    id: "mountain",
    name: "Mountain",
    emoji: "⛰️",
    description: "Bold, rugged, alpine",
    bg: "bg-stone-100",
    card: "bg-stone-50 border-2 border-stone-300 shadow-md",
    header: "bg-stone-200 border-b-2 border-stone-300",
    text: "text-stone-900",
    accent: "bg-stone-700",
    accentText: "text-stone-700",
    border: "border-stone-300",
    badge: "bg-stone-200 text-stone-800",
    photoFrame: "border-4 border-stone-400 shadow-stone-300 shadow-md",
    font: "font-mono",
  },
};
