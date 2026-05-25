'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from './theme-bootstrap';

export type ThemeName = 'tulip' | 'nachalat';

const STORAGE_KEY = THEME_STORAGE_KEY;
const ATTR = 'data-theme';

type ThemeContextValue = {
  theme: ThemeName;
  setTheme: (next: ThemeName) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyToDocument(theme: ThemeName) {
  const root = document.documentElement;
  if (theme === 'tulip') {
    root.removeAttribute(ATTR);
  } else {
    root.setAttribute(ATTR, theme);
  }
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'nachalat' ? '#0A0806' : '#A74C66');
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>('tulip');

  useEffect(() => {
    const stored = (typeof window !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as ThemeName | null)) || null;
    if (stored === 'nachalat' || stored === 'tulip') {
      setThemeState(stored);
      applyToDocument(stored);
    }
  }, []);

  const setTheme = useCallback((next: ThemeName) => {
    setThemeState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — ignore */
    }
    applyToDocument(next);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'tulip' ? 'nachalat' : 'tulip');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>');
  }
  return ctx;
}

export { themeBootstrapScript } from './theme-bootstrap';
