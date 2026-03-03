import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';

type ThemeMode = 'light' | 'dark' | 'system';

export type AccentColor = '#7c3aed' | '#f97316' | '#4cc9f0' | '#80ed99';

export const ACCENT_COLORS: { value: AccentColor; label: string; dark: string; darkOnly?: boolean }[] = [
  { value: '#f97316', label: 'Orange',  dark: '#fb923c' },
  { value: '#7c3aed', label: 'Violet',  dark: '#a78bfa' },
  { value: '#4cc9f0', label: 'Cyan',    dark: '#38b6e0', darkOnly: true },
  { value: '#80ed99', label: 'Vert',    dark: '#5cd478', darkOnly: true },
];

export const DEFAULT_ACCENT: AccentColor = '#f97316';

/**
 * Returns '#000000' for light accent colors (poor contrast with white text)
 * and '#ffffff' for dark accent colors. Uses W3C perceived luminance.
 */
export function getAccentTextColor(hex: string): '#000000' | '#ffffff' {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#000000' : '#ffffff';
}

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colorScheme: 'light' | 'dark';
  accentColor: AccentColor;
  setAccentColor: (color: AccentColor) => void;
  accentTextColor: '#000000' | '#ffffff';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'user-theme-preference';
const ACCENT_STORAGE_KEY = 'user-accent-color';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceColorScheme = useDeviceColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [accentColor, setAccentColorState] = useState<AccentColor>(DEFAULT_ACCENT);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const [savedTheme, savedAccent] = await Promise.all([
          AsyncStorage.getItem(THEME_STORAGE_KEY),
          AsyncStorage.getItem(ACCENT_STORAGE_KEY),
        ]);
        if (savedTheme) setThemeState(savedTheme as ThemeMode);
        if (savedAccent) setAccentColorState(savedAccent as AccentColor);
      } catch (error) {
        console.error('Failed to load preferences', error);
      }
    };
    loadPrefs();
  }, []);

  const colorScheme = theme === 'system' ? (deviceColorScheme ?? 'light') : theme;

  // Auto-reset dark-only accents when switching to light mode
  useEffect(() => {
    if (colorScheme === 'light') {
      const current = ACCENT_COLORS.find(c => c.value === accentColor);
      if (current?.darkOnly) {
        setAccentColorState(DEFAULT_ACCENT);
        AsyncStorage.setItem(ACCENT_STORAGE_KEY, DEFAULT_ACCENT).catch(() => {});
      }
    }
  }, [colorScheme, accentColor]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference', error);
    }
  };

  const setAccentColor = async (color: AccentColor) => {
    setAccentColorState(color);
    try {
      await AsyncStorage.setItem(ACCENT_STORAGE_KEY, color);
    } catch (error) {
      console.error('Failed to save accent color', error);
    }
  };

  const accentTextColor = getAccentTextColor(accentColor);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorScheme, accentColor, setAccentColor, accentTextColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}

