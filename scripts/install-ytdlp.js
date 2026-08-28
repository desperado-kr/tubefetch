import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const binDir = path.join(rootDir, 'bin');

if (!fs.existsSync(binDir)) {
  fs.mkdirSync(binDir, { recursive: true });
}

const isWindows = process.platform === 'win32';
const targetPath = isWindows ? path.join(binDir, 'yt-dlp.exe') : path.join(binDir, 'yt-dlp');

const url = isWindows
  ? 'https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp.exe'
  : 'https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp';

console.log(`[POSTINSTALL] Checking yt-dlp binary for platform ${process.platform}...`);

if (fs.existsSync(targetPath)) {
  console.log(`[POSTINSTALL] yt-dlp binary already exists at ${targetPath}`);
  process.exit(0);
}

console.log(`[POSTINSTALL] Downloading latest yt-dlp nightly from ${url}...`);

const file = fs.createWriteStream(targetPath);

function download(downloadUrl) {
  https.get(downloadUrl, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return download(res.headers.location);
    }
    if (res.statusCode !== 200) {
      console.warn(`[POSTINSTALL] Download failed with HTTP ${res.statusCode}`);
      return;
    }
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      try {
        if (!isWindows) {
          fs.chmodSync(targetPath, 0o755);
        }
      } catch (e) {}
      console.log(`[POSTINSTALL] Successfully installed yt-dlp to ${targetPath}`);
    });
  }).on('error', (err) => {
    console.warn(`[POSTINSTALL] Download error:`, err.message);
    try { fs.unlinkSync(targetPath); } catch (e) {}
  });
}

download(url);
