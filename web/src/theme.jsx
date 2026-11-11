// Өнгөний сэдэв: 4 бэлэн зохицол + өөрийн сонгосон өнгө. Хэрэглэгч бүрийн браузерт хадгална.
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const PRESETS = [
  { id: 'green', name: 'Ногоон', accent: '#2F8F57', soft: '#E6F4EA', link: '#2563EB', g1: '#B9DE8F', g2: '#E3EA7E' },
  { id: 'indigo', name: 'Индиго', accent: '#4F46E5', soft: '#EEF0FF', link: '#4F46E5', g1: '#C7D2FE', g2: '#E9D5FF' },
  { id: 'teal', name: 'Teal', accent: '#0F766E', soft: '#E3F4F2', link: '#0F766E', g1: '#99E1D9', g2: '#CFE8FF' },
  { id: 'amber', name: 'Терракота', accent: '#C2410C', soft: '#FDEDE4', link: '#B45309', g1: '#FDBA74', g2: '#FDE68A' },
  { id: 'mono', name: 'Монохром', accent: '#111111', soft: '#EDEDEF', link: '#111111', g1: '#D4D4D8', g2: '#F4F4F5' },
];

const KEY = 'cb.theme';

const hexToRgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (hex, withHex, t) => {
  const a = hexToRgb(hex);
  const b = hexToRgb(withHex);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
};

/** Өөрийн өнгөнөөс бусад утгыг гаргана */
export function customTheme(accent) {
  return { id: 'custom', name: 'Өөрийн', accent, soft: mix(accent, '#ffffff', 0.88), link: accent, g1: mix(accent, '#ffffff', 0.5), g2: mix(accent, '#FEF3C7', 0.75) };
}

function apply(theme) {
  const root = document.documentElement.style;
  root.setProperty('--accent', hexToRgb(theme.accent).join(' '));
  root.setProperty('--accent-soft', hexToRgb(theme.soft).join(' '));
  root.setProperty('--link', hexToRgb(theme.link).join(' '));
  root.setProperty('--g1', theme.g1);
  root.setProperty('--g2', theme.g2);
}

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (saved?.id === 'custom' && /^#[0-9a-f]{6}$/i.test(saved.accent)) return customTheme(saved.accent);
    return PRESETS.find((p) => p.id === saved?.id) || PRESETS[0];
  } catch {
    return PRESETS[0];
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(load);
  useEffect(() => {
    apply(theme);
    try { localStorage.setItem(KEY, JSON.stringify({ id: theme.id, accent: theme.accent })); } catch { /* хадгалахгүй */ }
  }, [theme]);
  const value = useMemo(() => ({ theme, setTheme }), [theme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
