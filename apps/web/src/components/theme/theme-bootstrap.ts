/**
 * Inline script that runs in the document <head> before React hydration.
 * Reads the persisted theme and stamps the `data-theme` attribute on
 * <html> so the very first paint matches user preference — no FOUC.
 *
 * Kept in a plain non-client module so it can be imported from a Server
 * Component (layout.tsx) without pulling in the rest of ThemeProvider.
 */
export const THEME_STORAGE_KEY = 'amutot.theme';

export const themeBootstrapScript = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='nachalat'){document.documentElement.setAttribute('data-theme','nachalat');var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content','#0A0806');}}catch(e){}})();`;
