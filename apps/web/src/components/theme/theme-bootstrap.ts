/**
 * Inline script that runs in the document <head> before React hydration.
 * Reads the persisted theme and stamps the `data-theme` attribute on
 * <html> so the very first paint matches user preference — no FOUC.
 *
 * Kept in a plain non-client module so it can be imported from a Server
 * Component (layout.tsx) without pulling in the rest of ThemeProvider.
 */
export const THEME_STORAGE_KEY = 'amutot.theme';

// Default theme is nachalat (dark). Only switch to tulip when the user has
// explicitly persisted that choice — keeps the very first paint dark and
// avoids a light flash before React hydrates.
export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');var isLight=t==='tulip';if(!isLight){document.documentElement.setAttribute('data-theme','nachalat');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#0A0806');}}catch(e){document.documentElement.setAttribute('data-theme','nachalat');}})();`;
