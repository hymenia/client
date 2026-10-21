import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const result = spawnSync('pnpm', ['dlx', '@tauri-apps/cli@^2', 'android', 'init'], {
  stdio: 'inherit'
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const manifestPath = 'src-tauri/gen/android/app/src/main/AndroidManifest.xml';
let manifest = await readFile(manifestPath, 'utf8');
const permission = '<uses-permission android:name="android.permission.RECORD_AUDIO" />';

if (!manifest.includes('android.permission.RECORD_AUDIO')) {
  manifest = manifest.replace('</manifest>', `    ${permission}\n</manifest>`);
  await writeFile(manifestPath, manifest);
}
