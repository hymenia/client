import { sveltekit } from '@sveltejs/kit/vite';
import fs from 'node:fs';
import os from 'node:os';
import { loadEnv } from 'vite';

function lanIp() {
  let interfaces;
  try {
    interfaces = os.networkInterfaces();
  } catch {
    return null;
  }

  for (const list of Object.values(interfaces)) {
    for (const iface of list || []) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return null;
}

export default ({ mode }) => {
  let env = loadEnv(mode, process.cwd(), '');
  let tauriDevHost = process.env.TAURI_DEV_HOST;
  let ip = env.TLS_CERT_IP || lanIp();
  let certPath = env.TLS_CERT_PATH || (ip && `/etc/hymenia/certs/${ip}.pem`);
  let keyPath = env.TLS_KEY_PATH || (ip && `/etc/hymenia/certs/${ip}-key.pem`);
  let tls = mode !== 'tauri' && certPath && keyPath && fs.existsSync(certPath) && fs.existsSync(keyPath)
    ? {
        cert: fs.readFileSync(certPath),
        key: fs.readFileSync(keyPath)
      }
    : undefined;

  return {
    plugins: [sveltekit()],
    server: {
      host: tauriDevHost || (mode === 'tauri' ? '127.0.0.1' : '0.0.0.0'),
      port: 5173,
      strictPort: mode === 'tauri',
      hmr: tauriDevHost
        ? {
            protocol: 'ws',
            host: tauriDevHost,
            port: 5174
          }
        : undefined,
      https: tls,
      watch: {
        ignored: ['**/src-tauri/**'],
        usePolling: true,
        interval: 500
      }
    }
  };
};
