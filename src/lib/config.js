const { PUBLIC_API_URL, PUBLIC_WS_URL } = import.meta.env;

const port = import.meta.env.PUBLIC_API_PORT || '9070';
const isTauri = typeof window !== 'undefined'
  && (window.location.protocol === 'tauri:' || window.location.hostname === 'tauri.localhost');

// i assume both the client and server are on the same host (assuming its not defined in env)
export const DEFAULT_API_HOST = PUBLIC_API_URL || (typeof window !== 'undefined'
  ? `${isTauri ? 'http:' : window.location.protocol}//${isTauri ? 'localhost' : window.location.hostname}:${port}`
  : `http://localhost:${port}`);

let savedApiHost = null;
if (typeof window !== 'undefined') {
  try {
    savedApiHost = window.localStorage.getItem('hymenia_server_url');
  } catch {
    // storage access is sometimes blocked in some webviews
  }
}

export const API_HOST = savedApiHost || DEFAULT_API_HOST;
export const WS_HOST = savedApiHost
  ? API_HOST.replace(/^http/, 'ws')
  : PUBLIC_WS_URL || API_HOST.replace(/^http/, 'ws');
