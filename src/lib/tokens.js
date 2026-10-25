const STORAGE_KEY = 'theme-token-overrides';
const STYLE_ID = 'token-overrides';

// One small palette of values shared by the whole app.
const LIGHT = {
  '--background': 'linear-gradient(135deg, #eeeeee, #d1dfc2)',
  '--panel': 'rgba(255, 255, 255, 0.55)',
  '--panel-soft': 'rgba(240, 240, 240, 0.6)',
  '--panel-solid': 'rgba(255, 255, 255, 0.85)',
  '--panel-solid-soft': 'rgba(240, 240, 240, 0.85)',
  '--hover': 'rgba(0, 0, 0, 0.06)',
  '--button': '#eeeeee',
  '--button-hover': '#dddddd',
  '--text': '#000000',
  '--text-muted': '#555555',
  '--text-on-accent': '#ffffff',
  '--placeholder': '#999999',
  '--line': 'rgba(0, 0, 0, 0.14)',
  '--line-soft': 'rgba(0, 0, 0, 0.1)',
  '--accent': '#2fb380',
  '--accent-hover': '#28986d',
  '--accent-soft': 'rgba(47, 179, 128, 0.14)',
  '--danger': '#c33',
  '--success': '#2fb380',
  '--warning': '#ff9800',
  '--overlay': 'rgba(0, 0, 0, 0.45)',
  '--shadow': '0 6px 20px rgba(0, 0, 0, 0.18)',
  '--media-background': '#000000',
  '--avatar-radius': '50%',
  '--field-height': '40px',
  '--font-size': '14px',
  '--font-size-small': '13px',
  '--font-size-tiny': '12px',
  '--gap': '8px',
  '--radius': '10px',
  '--radius-small': '6px',
  '--radius-large': '16px',
  '--radius-round': '999px',
  '--speed': '140ms',
  '--ease': 'cubic-bezier(0.2, 0.75, 0.25, 1)',
  '--code-text': '#d63384',
  '--code-block': '#f8f9fa',
  '--code-block-border': 'rgba(0, 0, 0, 0.1)'
};

const DARK = {
  ...LIGHT,
  '--background': 'linear-gradient(135deg, #23330d, #0d3325)',
  '--panel': 'rgba(69, 69, 69, 0.6)',
  '--panel-soft': 'rgba(80, 80, 80, 0.6)',
  '--panel-solid': 'rgba(69, 69, 69, 0.85)',
  '--panel-solid-soft': 'rgba(80, 80, 80, 0.85)',
  '--hover': 'rgba(255, 255, 255, 0.08)',
  '--button': '#404040',
  '--button-hover': '#5f5f5f',
  '--text': '#f0f0f0',
  '--text-muted': '#aaaaaa',
  '--line': 'rgba(255, 255, 255, 0.18)',
  '--line-soft': 'rgba(255, 255, 255, 0.12)',
  '--danger': '#ff8080',
  '--success': '#3fd39a',
  '--warning': '#ffb84d',
  '--overlay': 'rgba(0, 0, 0, 0.55)',
  '--shadow': '0 6px 20px rgba(0, 0, 0, 0.4)',
  '--code-text': '#ff79c6',
  '--code-block': '#2d2d2d',
  '--code-block-border': 'rgba(255, 255, 255, 0.1)'
};

const NAMES = new Set(Object.keys(LIGHT));

const VALUE_PROPERTIES = {
  '--avatar-radius': 'border-radius',
  '--field-height': 'height',
  '--font-size': 'font-size',
  '--font-size-small': 'font-size',
  '--font-size-tiny': 'font-size',
  '--gap': 'gap',
  '--radius': 'border-radius',
  '--radius-small': 'border-radius',
  '--radius-large': 'border-radius',
  '--radius-round': 'border-radius',
  '--shadow': 'box-shadow',
  '--speed': 'transition-duration',
  '--ease': 'transition-timing-function'
};

function isValid(name, value) {
  if (typeof CSS === 'undefined' || !CSS.supports) return true;
  if (!value) return false;
  const property = VALUE_PROPERTIES[name];
  if (property) return CSS.supports(property, value);
  return CSS.supports('color', value) || CSS.supports('background-image', value);
}

function readOverrides() {
  const empty = { light: {}, dark: {} };
  if (typeof localStorage === 'undefined') return empty;
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    const kept = { light: {}, dark: {} };
    for (const mode of ['light', 'dark']) {
      for (const [name, value] of Object.entries(saved[mode] || {})) {
        if (NAMES.has(name) && isValid(name, value)) kept[mode][name] = value;
      }
    }
    return kept;
  } catch {
    return empty;
  }
}

function writeOverrides(overrides) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
  } catch {}
}

export function getTokens(mode) {
  const base = mode === 'dark' ? DARK : LIGHT;
  return { ...base, ...readOverrides()[mode] };
}

// no evil stuff like xss
const stripUnsafe = (value) => String(value).replace(/[;{}<>]/g, '').trim();

export function setToken(mode, name, value) {
  if (!NAMES.has(name)) return false;
  const next = stripUnsafe(value);
  if (!isValid(name, next)) return false;
  const overrides = readOverrides();
  overrides[mode] = { ...overrides[mode], [name]: next };
  writeOverrides(overrides);
  applyTokens();
  return true;
}

export function resetTokens(mode) {
  const overrides = readOverrides();
  overrides[mode] = {};
  writeOverrides(overrides);
  applyTokens();
}

function block(selector, tokens) {
  const lines = Object.entries(tokens).map(([name, value]) => `  ${name}: ${value};`);
  return `${selector} {\n${lines.join('\n')}\n}`;
}

export function applyTokens() {
  if (typeof document === 'undefined') return;
  const css = [
    block(':root', getTokens('light')),
    block('body.dark', getTokens('dark')),
    'body { background: var(--background) fixed; }'
  ].join('\n');

  let el = document.getElementById(STYLE_ID);
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.appendChild(el);
  }
  el.textContent = css;
}
