import { env } from '$env/static/public';

const port = env.PUBLIC_API_PORT || '9070';
const isTauri = typeof window !== 'undefined'
  && (window.location.protocol === 'tauri:' || window.location.hostname === 'tauri.localhost');

// i assume both the client and server are on the same host (assuming its not defined in env)
export const API_HOST = env.PUBLIC_API_URL || (typeof window !== 'undefined'
  ? `${isTauri ? 'http:' : window.location.protocol}//${isTauri ? 'localhost' : window.location.hostname}:${port}`
  : `http://localhost:${port}`);

export const WS_HOST = env.PUBLIC_WS_URL
  || API_HOST.replace(/^http/, 'ws');
