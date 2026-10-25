export function setTheme(newTheme) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('theme', newTheme);
  }
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('dark', newTheme === 'dark');
  }
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