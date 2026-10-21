export const DEFAULT_ACCENT = '#2fb380';

function mixHex(hex, targetHex, amount) {
  const parse = (h) => {
    const n = parseInt(h.replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  };
  const a = parse(hex);
  const b = parse(targetHex);
  const toHex = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(a.r + (b.r - a.r) * amount)}${toHex(a.g + (b.g - a.g) * amount)}${toHex(a.b + (b.b - a.b) * amount)}`;
}

export function applyAccent(theme) {
  if (typeof document === 'undefined') return;
  const displayHex = theme === 'dark' ? mixHex(DEFAULT_ACCENT, '#ffffff', 0.3) : DEFAULT_ACCENT;
  const softAlpha = theme === 'dark' ? 0.24 : 0.14;
  const root = document.documentElement.style;
  root.setProperty('--accent', displayHex);
  root.setProperty('--accent-hover', mixHex(displayHex, '#ffffff', 0.15));
  root.setProperty('--accent-soft', `rgba(47, 179, 128, ${softAlpha})`);
  root.setProperty('--accent-text', '#ffffff');
}

export function setTheme(newTheme) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', newTheme);
  }
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('dark', newTheme === 'dark');
  }
  applyAccent(newTheme);
  return newTheme;
}

export function loadAppearancePrefs() {
  if (typeof localStorage === 'undefined') return {};
  const prefs = {};
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) prefs.theme = savedTheme;
  localStorage.removeItem('accent-color');
  prefs.restoreLastLocation = localStorage.getItem('restore-last-location') !== 'false';
  prefs.enterToSend = localStorage.getItem('enter-to-send') !== 'false';
  try {
    const widths = JSON.parse(localStorage.getItem('col-widths'));
    if (widths) prefs.colWidths = widths;
  } catch {
  }
  return prefs;
}
