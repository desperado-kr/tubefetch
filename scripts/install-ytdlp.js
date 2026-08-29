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

// A usable yt-dlp build is well over this; anything smaller is a truncated
// download or an error page that must not be left behind as "installed".
const MIN_BINARY_BYTES = 2000000;

console.log(`[POSTINSTALL] Checking yt-dlp binary for platform ${process.platform}...`);

if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > MIN_BINARY_BYTES) {
  console.log(`[POSTINSTALL] yt-dlp binary already exists at ${targetPath}`);
  process.exit(0);
}

console.log(`[POSTINSTALL] Downloading latest yt-dlp nightly from ${url}...`);

// Download to a temp path and rename only on success, so an interrupted install
// never leaves a half-written binary that later runs look like a valid install.
const tempPath = `${targetPath}.download`;
const file = fs.createWriteStream(tempPath);
let settled = false;

function fail(message) {
  if (settled) return;
  settled = true;
  console.warn(`[POSTINSTALL] ${message}`);
  file.destroy();
  try {
    fs.unlinkSync(tempPath);
  } catch (e) {}
  // Never fail the install: server.js downloads the binary at runtime as a
  // fallback, so a flaky network here should not break `npm install`.
  process.exit(0);
}

function download(downloadUrl, redirectsLeft) {
  https.get(downloadUrl, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      res.resume();
      if (redirectsLeft <= 0) return fail('Too many redirects');
      return download(new URL(res.headers.location, downloadUrl).toString(), redirectsLeft - 1);
    }

    if (res.statusCode !== 200) {
      res.resume();
      return fail(`Download failed with HTTP ${res.statusCode}`);
    }

    res.on('error', (err) => fail(`Download error: ${err.message}`));
    file.on('error', (err) => fail(`Write error: ${err.message}`));

    file.on('finish', () => {
      if (settled) return;
      settled = true;
      file.close(() => {
        try {
          if (fs.statSync(tempPath).size < MIN_BINARY_BYTES) {
            settled = false;
            return fail('Downloaded file is too small to be a valid yt-dlp build');
          }
          fs.renameSync(tempPath, targetPath);
          if (!isWindows) {
            fs.chmodSync(targetPath, 0o755);
          }
          console.log(`[POSTINSTALL] Successfully installed yt-dlp to ${targetPath}`);
        } catch (e) {
          settled = false;
          fail(`Install error: ${e.message}`);
        }
      });
    });

    res.pipe(file);
  }).on('error', (err) => fail(`Download error: ${err.message}`));
}

download(url, 5);
