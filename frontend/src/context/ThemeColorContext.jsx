import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEME_PALETTES = [
  {
    id: 'green',
    name: 'Green (Emerald)',
    color: '#10B981',
    primary: '#10B981',
    hover: '#059669',
    light: '#34D399',
    glow: 'rgba(16, 185, 129, 0.14)',
    border: 'rgba(16, 185, 129, 0.40)',
    text: '#FFFFFF',
    strokeColor: '#10B981',
    badgeBg: 'bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30',
    cardOverlay: 'from-black/75 via-[#1C1917]/60 to-[#10B981]/[0.08]',
    cornerGlow: 'bg-[#10B981]/[0.10]',
  },
  {
    id: 'red',
    name: 'Light Red (Coral Crimson)',
    color: '#F87171',
    primary: '#F87171',
    hover: '#EF4444',
    light: '#FCA5A5',
    glow: 'rgba(248, 113, 113, 0.14)',
    border: 'rgba(248, 113, 113, 0.40)',
    text: '#FFFFFF',
    strokeColor: '#F87171',
    badgeBg: 'bg-[#F87171]/15 text-[#FCA5A5] border border-[#F87171]/30',
    cardOverlay: 'from-black/75 via-[#1C1917]/60 to-[#F87171]/[0.08]',
    cornerGlow: 'bg-[#F87171]/[0.10]',
  },
  {
    id: 'black',
    name: 'Black Gold (Onyx & Gold)',
    color: '#D4AF37',
    primary: '#334155',
    hover: '#1E293B',
    light: '#F1D279',
    glow: 'rgba(212, 175, 55, 0.16)',
    border: 'rgba(212, 175, 55, 0.45)',
    text: '#F8FAFC',
    strokeColor: '#D4AF37',
    badgeBg: 'bg-[#18181B] text-[#F1D279] border border-[#D4AF37]/40',
    cardOverlay: 'from-black/85 via-[#1C1917]/70 to-[#D4AF37]/[0.10]',
    cornerGlow: 'bg-[#D4AF37]/[0.12]',
    swatchBackground: 'linear-gradient(135deg, #09090B 48%, #D4AF37 50%, #F59E0B 65%, #09090B 100%)',
    swatchBorder: '1.5px solid #D4AF37',
  },
  {
    id: 'mocha',
    name: 'Mocha Coffee (Warm Espresso)',
    color: '#9A6B4C',
    primary: '#9A6B4C',
    hover: '#7E5438',
    light: '#C49A7C',
    glow: 'rgba(154, 107, 76, 0.15)',
    border: 'rgba(154, 107, 76, 0.40)',
    text: '#FFFFFF',
    strokeColor: '#9A6B4C',
    badgeBg: 'bg-[#9A6B4C]/20 text-[#C49A7C] border border-[#9A6B4C]/35',
    cardOverlay: 'from-black/75 via-[#1C1917]/60 to-[#9A6B4C]/[0.10]',
    cornerGlow: 'bg-[#9A6B4C]/[0.12]',
  }
];

const DEFAULT_THEME_ID = 'mocha';
const STORAGE_KEY = 'tech_avenue_accent_theme';
const LEGACY_STORAGE_KEY = 'techavenue_theme_color';

const ThemeColorContext = createContext({
  themeId: DEFAULT_THEME_ID,
  setThemeId: () => {},
  currentTheme: THEME_PALETTES.find((t) => t.id === DEFAULT_THEME_ID),
  THEME_PALETTES
});

export function ThemeColorProvider({ children }) {
  const [themeId, setThemeIdState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved && THEME_PALETTES.some((t) => t.id === saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return DEFAULT_THEME_ID;
  });

  const currentTheme = THEME_PALETTES.find((t) => t.id === themeId) || THEME_PALETTES[3];

  const setThemeId = (newId) => {
    setThemeIdState(newId);
    try {
      localStorage.setItem(STORAGE_KEY, newId);
      localStorage.setItem(LEGACY_STORAGE_KEY, newId);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', themeId);

    // Apply global CSS variables for all components, modals, and charts
    root.style.setProperty('--accent-primary', currentTheme.primary);
    root.style.setProperty('--accent-hover', currentTheme.hover);
    root.style.setProperty('--accent-light', currentTheme.light);
    root.style.setProperty('--accent-glow', currentTheme.glow);
    root.style.setProperty('--accent-border', currentTheme.border);
    root.style.setProperty('--accent-text', currentTheme.text);

    // Backward compatibility aliases
    root.style.setProperty('--theme-primary', currentTheme.primary);
    root.style.setProperty('--theme-primary-hover', currentTheme.hover);
    root.style.setProperty('--theme-accent', currentTheme.light);
    root.style.setProperty('--theme-light', currentTheme.light);
    root.style.setProperty('--theme-glow', currentTheme.glow);
  }, [themeId, currentTheme]);

  return (
    <ThemeColorContext.Provider value={{ themeId, setThemeId, currentTheme, THEME_PALETTES }}>
      {children}
    </ThemeColorContext.Provider>
  );
}

export const ThemeProvider = ThemeColorProvider;

export function useThemeColor() {
  return useContext(ThemeColorContext);
}

export const useTheme = useThemeColor;
