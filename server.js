import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import https from 'https';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { fetchOembedFallback } from './public/oembed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isWindows = process.platform === 'win32';

// The bare "yt-dlp" asset is a ~2MB Python zipapp: it needs a system Python and
// ships without curl_cffi, so every request goes out with a stock Python TLS
// fingerprint and `--impersonate` has no targets available. The *_linux builds
// are ~38MB PyInstaller bundles that include curl_cffi.
const YT_DLP_LINUX_ASSET = process.arch === 'arm64' ? 'yt-dlp_linux_aarch64' : 'yt-dlp_linux';
const YT_DLP_LINUX_URL = `https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/${YT_DLP_LINUX_ASSET}`;

// Below every standalone build (Windows .exe ~17MB, Linux ~38MB) but far above
// the ~2MB zipapp, so a stale zipapp or a truncated download is rejected rather
// than adopted as a working binary.
const MIN_BINARY_BYTES = 10 * 1024 * 1024;

// Ensure temporary working directory
const tempDir = path.join(os.tmpdir(), 'tubefetch_temp');
if (!fs.existsSync(tempDir)) {
  try {
    fs.mkdirSync(tempDir, { recursive: true });
  } catch (e) {
    console.warn('Temp dir create warning:', e);
  }
}

// ---------------------------------------------------------------------------
// Input validation
// ---------------------------------------------------------------------------

// Every user-supplied value that reaches the yt-dlp argv goes through this.
// Parsing as a URL rather than a loose regex also guarantees the value cannot
// begin with "-", which yt-dlp would otherwise read as an option (--update-to
// can replace the binary itself, --exec runs a shell command) instead of a
// download target.
function normalizeMediaUrl(value) {
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch (e) {
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  return parsed.toString();
}

const FORMAT_ID_PATTERN = /^[A-Za-z0-9_.+-]{1,64}$/;

function sanitizeFilename(filename) {
  return String(filename ?? '')
    // Path separators, Windows-illegal characters, and "%" which yt-dlp would
    // otherwise interpret as an output-template placeholder.
    .replace(/[/\\?%*:|"<>]/g, '_')
    // Control characters: keep them out of filenames and Content-Disposition.
    .split('').filter((ch) => ch.charCodeAt(0) > 31 && ch.charCodeAt(0) !== 127).join('')
    .replace(/^\.+/, '')
    .trim()
    .slice(0, 120);
}

// Stream URLs are handed to the browser together with an HMAC, and
// /api/direct-download only redirects to a URL whose signature it can verify.
// Without this the endpoint is an open redirect that lends the app's own domain
// to arbitrary phishing pages. Set STREAM_SIGNING_SECRET in the environment to
// keep links valid across restarts and across multiple instances.
const STREAM_SIGNING_SECRET = process.env.STREAM_SIGNING_SECRET || crypto.randomBytes(32).toString('hex');

function signStreamUrl(url) {
  return crypto.createHmac('sha256', STREAM_SIGNING_SECRET).update(url).digest('base64url');
}

function verifyStreamSignature(url, signature) {
  if (typeof signature !== 'string' || !signature) return false;
  const expected = Buffer.from(signStreamUrl(url), 'utf8');
  const provided = Buffer.from(signature, 'utf8');
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

// ---------------------------------------------------------------------------
// yt-dlp resolution & execution
// ---------------------------------------------------------------------------

function downloadYtDlpBinary(targetPath) {
  return new Promise((resolve, reject) => {
    console.log('[INIT] Downloading Linux yt-dlp standalone binary...');
    const file = fs.createWriteStream(targetPath);
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      file.destroy();
      // Leave no truncated binary behind: getYtDlpPath() would otherwise adopt
      // it on the next call as long as it happened to exceed the size check.
      fs.unlink(targetPath, () => {});
      reject(err);
    };

    const request = (url, redirectsLeft) => {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          if (redirectsLeft <= 0) return fail(new Error('Too many redirects while downloading yt-dlp'));
          return request(new URL(res.headers.location, url).toString(), redirectsLeft - 1);
        }

        if (res.statusCode !== 200) {
          res.resume();
          return fail(new Error(`Failed to download yt-dlp binary: HTTP ${res.statusCode}`));
        }

        res.on('error', fail);
        file.on('error', fail);
        file.on('finish', () => {
          if (settled) return;
          settled = true;
          file.close(() => {
            try {
              fs.chmodSync(targetPath, 0o755);
            } catch (e) {}
            console.log('[INIT] yt-dlp standalone binary ready.');
            resolve(targetPath);
          });
        });

        res.pipe(file);
      }).on('error', fail);
    };

    request(YT_DLP_LINUX_URL, 5);
  });
}

// Cross-platform yt-dlp resolver (Windows local vs Linux Vercel/Render)
let ytDlpDownloadPromise = null;
async function getYtDlpPath() {
  if (isWindows) {
    const localExe = path.join(__dirname, 'bin', 'yt-dlp.exe');
    if (fs.existsSync(localExe)) return localExe;
    return 'yt-dlp';
  }

  // Linux / Render environment
  const bundledBin = path.join(__dirname, 'bin', 'yt-dlp');
  if (fs.existsSync(bundledBin)) {
    try {
      fs.chmodSync(bundledBin, 0o755);
    } catch (e) {}
    return bundledBin;
  }

  const linuxBin = path.join(os.tmpdir(), 'yt-dlp');
  if (fs.existsSync(linuxBin)) {
    try {
      const stats = fs.statSync(linuxBin);
      if (stats.size > MIN_BINARY_BYTES) {
        return linuxBin;
      }
    } catch (e) {}
  }

  if (!ytDlpDownloadPromise) {
    ytDlpDownloadPromise = downloadYtDlpBinary(linuxBin);
    // Caching a rejected promise would make every later request fail forever;
    // clear it so the next request retries. The original promise is still
    // returned, so the current caller still sees the rejection.
    ytDlpDownloadPromise.catch(() => {
      ytDlpDownloadPromise = null;
    });
  }

  return ytDlpDownloadPromise;
}

// Cookies live outside tempDir: the cleanup sweep deletes everything in there,
// and yt-dlp writes refreshed cookies back to this file, so it must persist and
// stay writable for the life of the process.
const secureDir = path.join(os.tmpdir(), 'tubefetch_secure');
let cookieFilePath = null;
let cookieFileResolved = false;

/**
 * Materializes a Netscape cookies.txt from the environment, once per process.
 *
 * An authenticated session is the main lever against YouTube's datacenter-IP
 * bot checks, and it also removes the PO Token requirement for the tv client.
 * Prefer YTDLP_COOKIES_B64: cookies.txt is tab-delimited, and dashboard env
 * editors routinely convert tabs to spaces, which yt-dlp then rejects.
 */
function getCookieFile() {
  if (cookieFileResolved) return cookieFilePath;
  cookieFileResolved = true;

  // A file mounted as a secret takes precedence over anything inline.
  const mounted = process.env.YTDLP_COOKIES_PATH;
  if (mounted && fs.existsSync(mounted)) {
    cookieFilePath = mounted;
    console.log('[COOKIES] Using mounted cookie file.');
    return cookieFilePath;
  }

  let raw = '';
  try {
    raw = process.env.YTDLP_COOKIES_B64
      ? Buffer.from(process.env.YTDLP_COOKIES_B64, 'base64').toString('utf8')
      : (process.env.YTDLP_COOKIES || '');
  } catch (e) {
    console.warn('[COOKIES] YTDLP_COOKIES_B64 is not valid base64; ignoring.');
    return null;
  }

  if (!raw.trim()) return null;

  try {
    fs.mkdirSync(secureDir, { recursive: true });
    const target = path.join(secureDir, 'cookies.txt');
    // 0600: this file holds a live Google session.
    fs.writeFileSync(target, raw.endsWith('\n') ? raw : `${raw}\n`, { mode: 0o600 });
    cookieFilePath = target;
    console.log(`[COOKIES] Loaded ${raw.split('\n').filter((l) => l.trim() && !l.startsWith('#')).length} cookie lines.`);
  } catch (err) {
    console.warn('[COOKIES] Failed to write cookie file:', err.message);
  }

  return cookieFilePath;
}

function getYtDlpArgs(extraArgs = []) {
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--retries', '5'
  ];

  const cookieFile = getCookieFile();
  if (cookieFile) {
    args.push('--cookies', cookieFile);
  }

  // bgutil PO Token provider, when one is reachable. Only the clients that
  // require a GVS token use it; with cookies the tv client needs none at all.
  if (process.env.YTDLP_POT_BASE_URL) {
    args.push('--extractor-args', `youtubepot-bgutilhttp:base_url=${process.env.YTDLP_POT_BASE_URL}`);
  }

  // yt-dlp keeps its own client list current as YouTube changes. Pinning one
  // here rots: the previous 'youtube:player_client=mweb,android_embedded'
  // value made every extraction fail with "Requested format is not available"
  // once android_embedded was removed upstream. Override via the environment
  // only when a specific site genuinely needs it.
  if (process.env.YTDLP_EXTRACTOR_ARGS) {
    args.push('--extractor-args', process.env.YTDLP_EXTRACTOR_ARGS);
  }

  if (isWindows) {
    const denoPath = path.join(__dirname, 'bin', 'deno.exe');
    if (fs.existsSync(denoPath)) {
      args.push('--js-runtimes', `deno:${denoPath}`, '--remote-components', 'ejs:github');
    }
  } else {
    args.push('--js-runtimes', 'node', '--remote-components', 'ejs:github');
  }

  return [...args, ...extraArgs];
}

const MAX_STDERR_CAPTURE = 64 * 1024;

/**
 * Single place where yt-dlp is spawned. Every call site gets:
 *  - an 'error' listener, so a missing binary rejects instead of throwing an
 *    uncaught exception that kills the process;
 *  - exactly one settlement, so a handler can never respond twice;
 *  - utf8 stream decoding, so a multi-byte character split across two chunks is
 *    not mangled into replacement characters.
 */
async function runYtDlp(extraArgs, { onStdoutChunk = null, collectStdout = true } = {}) {
  const binPath = await getYtDlpPath();

  return new Promise((resolve) => {
    const child = spawn(binPath, getYtDlpArgs(extraArgs));
    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => {
      if (collectStdout) stdout += chunk;
      if (onStdoutChunk) onStdoutChunk(chunk);
    });

    child.stderr.on('data', (chunk) => {
      if (stderr.length < MAX_STDERR_CAPTURE) stderr += chunk;
    });

    // Promises ignore a second settlement, so an 'error' followed by 'close'
    // resolves once with the error.
    child.on('error', (err) => {
      console.error('[SPAWN ERROR]', err);
      resolve({ code: null, stdout, stderr, error: err });
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr, error: null });
    });
  });
}

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Progress tracking clients (SSE)
const progressClients = new Map();

function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
  if (!num) return '0';
  return Number(num).toLocaleString();
}

// SSE Endpoint for download progress
app.get('/api/progress/:id', (req, res) => {
  const { id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  progressClients.set(id, res);
  res.write(`data: ${JSON.stringify({ status: 'connected', percent: 0 })}\n\n`);

  // Render and most reverse proxies drop connections that stay silent, which
  // would strand the progress modal on a slow extraction.
  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (err) {
      clearInterval(heartbeat);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    progressClients.delete(id);
  });
});

function sendProgress(id, data) {
  const client = progressClients.get(id);
  if (client) {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      console.error('SSE send error:', err);
    }
  }
}

function probeBinary(command) {
  return new Promise((resolve) => {
    const child = spawn(command, ['-version']);
    child.on('error', () => resolve(false));
    child.on('close', (code) => resolve(code === 0));
    child.stdout?.resume();
    child.stderr?.resume();
  });
}

// Diagnostics. Reports whether each piece of configuration is present - never
// the values themselves, since cookies and the signing secret live here.
app.get('/api/health', async (req, res) => {
  const [ffmpeg, ffprobe] = await Promise.all([probeBinary('ffmpeg'), probeBinary('ffprobe')]);

  let ytdlpVersion = null;
  try {
    const { stdout, code } = await runYtDlp(['--version']);
    if (code === 0) ytdlpVersion = stdout.trim();
  } catch (e) {}

  res.json({
    ok: true,
    node: process.version,
    arch: process.arch,
    ytdlp_version: ytdlpVersion,
    ffmpeg,
    ffprobe,
    cookies_configured: Boolean(getCookieFile()),
    pot_provider_configured: Boolean(process.env.YTDLP_POT_BASE_URL),
    stream_secret_from_env: Boolean(process.env.STREAM_SIGNING_SECRET),
    extractor_args: process.env.YTDLP_EXTRACTOR_ARGS || null
  });
});

// Video Info Endpoint
app.post('/api/info', async (req, res) => {
  try {
    const cleanUrl = normalizeMediaUrl(req.body?.url);
    if (!cleanUrl) {
      return res.status(400).json({ error: '올바른 영상 주소(http/https)를 입력해주세요.' });
    }

    console.log(`[INFO] Fetching metadata for: ${cleanUrl}`);

    const { code, stdout, stderr, error } = await runYtDlp(['--dump-single-json', '--', cleanUrl]);

    if (error || code !== 0) {
      const reason = error ? error.message : stderr;
      console.error(`[ERROR] yt-dlp info failed (code ${code}): ${reason}`);

      console.log('[FALLBACK] Attempting YouTube oEmbed metadata extraction...');
      const fallback = await fetchOembedFallback(cleanUrl);
      if (fallback) return res.json(fallback);

      return res.status(502).json({
        error: '영상 정보를 가져오지 못했습니다. 비공개 영상이거나 연령 제한 영상일 수 있습니다.',
        details: reason
      });
    }

    let data;
    try {
      data = JSON.parse(stdout);
    } catch (parseErr) {
      console.error('[ERROR] JSON parse failed:', parseErr);
      return res.status(502).json({ error: '영상 데이터 해석에 실패했습니다.' });
    }

    let thumbnail = data.thumbnail;
    if (Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
      const sorted = [...data.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
      thumbnail = sorted[0]?.url || thumbnail;
    }

    const heights = new Set();
    if (Array.isArray(data.formats)) {
      data.formats.forEach((f) => {
        if (f.height && f.vcodec && f.vcodec !== 'none') {
          heights.add(f.height);
        }
      });
    }

    const availableResolutions = Array.from(heights).sort((a, b) => b - a);

    const directStreams = [];
    if (Array.isArray(data.formats)) {
      data.formats.forEach((f) => {
        const streamUrl = normalizeMediaUrl(f.url);
        if (!streamUrl) return;

        const hasVideo = f.vcodec && f.vcodec !== 'none';
        const hasAudio = f.acodec && f.acodec !== 'none';
        let type = 'unknown';
        if (hasVideo && hasAudio) type = 'video_with_audio';
        else if (hasVideo && !hasAudio) type = 'video_only';
        else if (!hasVideo && hasAudio) type = 'audio_only';

        directStreams.push({
          format_id: f.format_id,
          ext: f.ext,
          resolution: f.resolution || (f.height ? `${f.height}p` : 'audio'),
          height: f.height || 0,
          filesize: f.filesize || f.filesize_approx || 0,
          format_note: f.format_note || '',
          vcodec: f.vcodec,
          acodec: f.acodec,
          type: type,
          url: streamUrl,
          // Proves to /api/direct-download that this URL came from us.
          url_sig: signStreamUrl(streamUrl)
        });
      });
    }

    res.json({
      id: data.id,
      title: data.title,
      uploader: data.uploader || data.channel || 'Video Creator',
      uploader_url: data.uploader_url || data.channel_url || '',
      duration: data.duration,
      duration_formatted: formatDuration(data.duration),
      view_count: formatNumber(data.view_count),
      upload_date: data.upload_date ? `${data.upload_date.slice(0, 4)}-${data.upload_date.slice(4, 6)}-${data.upload_date.slice(6, 8)}` : '',
      thumbnail: thumbnail,
      description: data.description ? data.description.slice(0, 200) + (data.description.length > 200 ? '...' : '') : '',
      is_short: Boolean(data.duration && data.duration <= 60),
      resolutions: availableResolutions.length > 0 ? availableResolutions : [1080, 720, 480, 360],
      direct_streams: directStreams,
      limited_metadata: false
    });
  } catch (err) {
    console.error('[API FATAL ERROR]', err);
    if (!res.headersSent) {
      res.status(500).json({ error: '서버 내부 오류가 발생했습니다.', details: err.message });
    }
  }
});

// Direct Download Endpoint (Zero Server Traffic 302 Redirect)
app.get('/api/direct-download', async (req, res) => {
  try {
    const { stream_url: rawStreamUrl, sig, format_id: formatId } = req.query;

    if (rawStreamUrl !== undefined) {
      const streamUrl = normalizeMediaUrl(rawStreamUrl);
      if (!streamUrl || !verifyStreamSignature(streamUrl, sig)) {
        return res.status(403).send('유효하지 않은 스트림 주소입니다. 링크를 다시 분석해주세요.');
      }
      return res.redirect(302, streamUrl);
    }

    const sourceUrl = normalizeMediaUrl(req.query.url);
    if (!sourceUrl) {
      return res.status(400).send('올바른 영상 주소(http/https)가 필요합니다.');
    }

    const extraArgs = ['-g'];
    if (formatId !== undefined) {
      if (typeof formatId !== 'string' || !FORMAT_ID_PATTERN.test(formatId)) {
        return res.status(400).send('올바르지 않은 포맷 지정입니다.');
      }
      extraArgs.push('-f', formatId);
    }
    extraArgs.push('--', sourceUrl);

    const { code, stdout, error } = await runYtDlp(extraArgs);
    const resolved = (code === 0 && !error) ? normalizeMediaUrl(stdout.trim().split('\n')[0]) : null;

    if (!resolved) {
      return res.status(502).send('다이렉트 다운로드 주소를 추출하지 못했습니다.');
    }

    res.redirect(302, resolved);
  } catch (err) {
    console.error('[DIRECT DOWNLOAD ERROR]', err);
    if (!res.headersSent) res.status(500).send('다이렉트 다운로드 처리 중 오류가 발생했습니다.');
  }
});

const CONTENT_TYPES = {
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4'
};

function parseProgressLine(line) {
  const progressMatch = line.match(/\[download\]\s+(\d+\.?\d*)%/);
  if (!progressMatch) return null;

  const percent = parseFloat(progressMatch[1]);
  const speedMatch = line.match(/at\s+([^\s]+)/);
  const etaMatch = line.match(/ETA\s+([^\s]+)/);
  const sizeMatch = line.match(/of\s+([^\s]+)/);

  return {
    status: 'downloading',
    percent,
    speed: speedMatch ? speedMatch[1] : '',
    eta: etaMatch ? etaMatch[1] : '',
    size: sizeMatch ? sizeMatch[1] : '',
    message: `다운로드 중 (${percent}%)`
  };
}

// Download & Stream Endpoint (Server side merge)
app.get('/api/download', async (req, res) => {
  const { type = 'video', quality = '1080p', downloadId, title } = req.query;

  try {
    const sourceUrl = normalizeMediaUrl(req.query.url);
    if (!sourceUrl) {
      return res.status(400).json({ error: '올바른 영상 주소(http/https)가 필요합니다.' });
    }

    const isAudio = type === 'audio';
    // The "무손실 원본 오디오 (M4A)" card promises no re-encoding, so this path
    // must not go through -x --audio-format mp3 like the 320kbps MP3 card does.
    const wantsOriginalAudio = isAudio && quality === 'm4a';
    const ext = !isAudio ? 'mp4' : (wantsOriginalAudio ? 'm4a' : 'mp3');

    const safeTitle = sanitizeFilename(title) || 'download';
    const timestamp = Date.now();
    const outputPath = path.join(tempDir, `${safeTitle}_${timestamp}.${ext}`);

    console.log(`[DOWNLOAD] Starting download for: ${sourceUrl} (type: ${type}, quality: ${quality})`);

    const extraArgs = ['--newline', '--progress', '-o', outputPath];

    if (wantsOriginalAudio) {
      extraArgs.push('-f', 'bestaudio[ext=m4a]/bestaudio[acodec^=mp4a]/bestaudio');
    } else if (isAudio) {
      // A bitrate value gives a real 320kbps file; "0" would only be LAME's VBR
      // preset, which averages well below the 320 kbps the UI advertises.
      extraArgs.push('-x', '--audio-format', 'mp3', '--audio-quality', quality === '320k' ? '320K' : '192K');
    } else {
      const requested = parseInt(String(quality).replace('p', ''), 10) || 1080;
      const height = Math.min(Math.max(requested, 144), 4320);
      extraArgs.push(
        '-f',
        `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`,
        '--merge-output-format', 'mp4'
      );
    }

    extraArgs.push('--', sourceUrl);

    // yt-dlp writes progress a line at a time, but chunk boundaries do not
    // respect line boundaries - buffer until a newline arrives.
    let progressBuffer = '';
    const onStdoutChunk = downloadId
      ? (chunk) => {
        progressBuffer += chunk;
        const lines = progressBuffer.split('\n');
        progressBuffer = lines.pop() ?? '';
        for (const line of lines) {
          const progress = parseProgressLine(line);
          if (progress) sendProgress(downloadId, progress);
        }
      }
      : null;

    // Everything this request wrote shares this prefix, so it can be listed and
    // removed without touching a concurrent download's files.
    const stem = `${safeTitle}_${timestamp}.`;
    const listRequestFiles = () => {
      try {
        return fs.readdirSync(tempDir).filter((f) => f.startsWith(stem));
      } catch (e) {
        return [];
      }
    };
    const removeRequestFiles = () => {
      for (const f of listRequestFiles()) {
        try {
          fs.unlinkSync(path.join(tempDir, f));
        } catch (e) {}
      }
    };

    const { code, stderr, error } = await runYtDlp(extraArgs, { onStdoutChunk, collectStdout: false });

    if (error || code !== 0) {
      console.error(`[DOWNLOAD ERROR] yt-dlp exited (code ${code}): ${error ? error.message : stderr}`);
      // A failed post-processing step (e.g. missing ffmpeg) still leaves the
      // raw stream yt-dlp already fetched on disk - drop it now rather than
      // leaving it for the hourly sweep.
      removeRequestFiles();
      if (downloadId) {
        sendProgress(downloadId, { status: 'error', message: '다운로드에 실패했습니다.' });
      }
      return res.status(502).json({ error: '다운로드 실패' });
    }

    let finalFilePath = outputPath;
    if (!fs.existsSync(finalFilePath)) {
      // yt-dlp may settle on a different container than requested. Skip its
      // in-progress .part files and .fNNN fragment files.
      const matched = listRequestFiles()
        .filter((f) => !f.endsWith('.part') && !/\.f\d+\./.test(f))
        .sort();
      if (matched.length > 0) finalFilePath = path.join(tempDir, matched[0]);
    }

    if (!fs.existsSync(finalFilePath)) {
      removeRequestFiles();
      if (downloadId) sendProgress(downloadId, { status: 'error', message: '파일을 찾을 수 없습니다.' });
      return res.status(500).json({ error: '파일 생성 실패' });
    }

    if (downloadId) {
      sendProgress(downloadId, { status: 'completed', percent: 100, message: '완료!' });
    }

    const stat = fs.statSync(finalFilePath);
    const downloadName = `${safeTitle}.${ext}`;

    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
    res.setHeader('Content-Type', CONTENT_TYPES[ext]);
    res.setHeader('Content-Length', stat.size);

    const stream = fs.createReadStream(finalFilePath);

    // pipe() does not forward source errors. Without this listener a read
    // failure - or the cleanup sweep unlinking the file mid-transfer - emits an
    // unhandled 'error' that terminates the process.
    stream.on('error', (streamErr) => {
      console.error('[DOWNLOAD STREAM ERROR]', streamErr);
      res.destroy(streamErr);
    });

    // 'close' fires on completion and on client abort alike, so the temp file
    // is removed in both cases rather than waiting for the sweep.
    stream.on('close', () => {
      try {
        if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
      } catch (e) {}
    });

    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (err) {
    console.error('[DOWNLOAD FATAL]', err);
    if (downloadId) {
      sendProgress(downloadId, { status: 'error', message: '다운로드에 실패했습니다.' });
    }
    if (!res.headersSent) res.status(500).json({ error: '서버 오류' });
  }
});

// Periodic cleanup of temporary files
setInterval(() => {
  let files = [];
  try {
    files = fs.readdirSync(tempDir);
  } catch (err) {
    return;
  }

  const now = Date.now();
  files.forEach((file) => {
    // Per-file try/catch: a file removed by a finishing request between the
    // readdir and the stat must not abort the rest of the sweep.
    try {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {}
  });
}, 15 * 60 * 1000);

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 TubeFetch Server running on port ${PORT}`);
    console.log(`👉 Web Interface: http://localhost:${PORT}`);
    console.log(`====================================================`);
  });
}

export default app;
