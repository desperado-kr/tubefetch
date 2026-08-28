import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const isWindows = process.platform === 'win32';

// Ensure temporary working directory
const tempDir = path.join(os.tmpdir(), 'tubefetch_temp');
if (!fs.existsSync(tempDir)) {
  try {
    fs.mkdirSync(tempDir, { recursive: true });
  } catch (e) {
    console.warn('Temp dir create warning:', e);
  }
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
      if (stats.size > 2000000) {
        return linuxBin;
      }
    } catch (e) {}
  }

  if (ytDlpDownloadPromise) {
    return ytDlpDownloadPromise;
  }

  ytDlpDownloadPromise = new Promise((resolve, reject) => {
    console.log('[INIT] Downloading Linux yt-dlp standalone binary...');
    const file = fs.createWriteStream(linuxBin);

    const download = (url) => {
      https.get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return download(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`Failed to download yt-dlp binary: HTTP ${res.statusCode}`));
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          try {
            fs.chmodSync(linuxBin, 0o755);
          } catch (e) {}
          console.log('[INIT] yt-dlp standalone binary ready.');
          resolve(linuxBin);
        });
      }).on('error', (err) => {
        fs.unlink(linuxBin, () => {});
        reject(err);
      });
    };

    download('https://github.com/yt-dlp/yt-dlp-nightly-builds/releases/latest/download/yt-dlp');
  });

  return ytDlpDownloadPromise;
}

function getYtDlpArgs(extraArgs = []) {
  const args = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--extractor-args', 'youtube:player_client=mweb,android_embedded;player_skip=webpage,configs',
    '--retries', '5'
  ];

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

function sanitizeFilename(filename) {
  return filename.replace(/[/\\?%*:|"<>]/g, '_').trim();
}

// SSE Endpoint for download progress
app.get('/api/progress/:id', (req, res) => {
  const { id } = req.params;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  progressClients.set(id, res);
  res.write(`data: ${JSON.stringify({ status: 'connected', percent: 0 })}\n\n`);

  req.on('close', () => {
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

// Video Info Endpoint
app.post('/api/info', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: '유효한 영상 URL을 입력해주세요.' });
    }

    const cleanUrl = url.trim();
    const isSupported = /^https?:\/\/.+/i.test(cleanUrl);
    if (!isSupported) {
      return res.status(400).json({ error: '올바른 영상 주소(http/https)를 입력해주세요.' });
    }

    console.log(`[INFO] Fetching metadata for: ${cleanUrl}`);

    const binPath = await getYtDlpPath();
    const args = getYtDlpArgs(['--dump-single-json', cleanUrl]);

    const ytdlp = spawn(binPath, args);
    let stdoutData = '';
    let stderrData = '';

    ytdlp.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    ytdlp.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    ytdlp.on('error', (err) => {
      console.error('[SPAWN ERROR]', err);
      return res.status(500).json({
        error: '영상 추출 엔진 실행에 실패했습니다.',
        details: err.message
      });
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        console.error(`[ERROR] yt-dlp info failed (code ${code}): ${stderrData}`);
        return res.status(500).json({
          error: '영상 정보를 가져오지 못했습니다. 비공개 영상이거나 연령 제한 영상일 수 있습니다.',
          details: stderrData
        });
      }

      try {
        const data = JSON.parse(stdoutData);

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
            if (f.url) {
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
                url: f.url
              });
            }
          });
        }

        const responsePayload = {
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
          is_short: data.duration && data.duration <= 60,
          resolutions: availableResolutions.length > 0 ? availableResolutions : [1080, 720, 480, 360],
          direct_streams: directStreams
        };

        res.json(responsePayload);
      } catch (err) {
        console.error('[ERROR] JSON parse failed:', err);
        res.status(500).json({ error: '영상 데이터 해석에 실패했습니다.' });
      }
    });
  } catch (err) {
    console.error('[API FATAL ERROR]', err);
    res.status(500).json({ error: '서버 내부 오류가 발생했습니다.', details: err.message });
  }
});

// Direct Download Endpoint (Zero Server Traffic 302 Redirect)
app.get('/api/direct-download', async (req, res) => {
  try {
    const { url, format_id, stream_url } = req.query;

    if (stream_url) {
      return res.redirect(302, stream_url);
    }

    if (!url) {
      return res.status(400).send('URL이 필요합니다.');
    }

    const binPath = await getYtDlpPath();
    const args = getYtDlpArgs(['-g']);

    if (format_id) {
      args.push('-f', format_id);
    }

    args.push(url);

    const ytdlp = spawn(binPath, args);
    let stdoutData = '';

    ytdlp.stdout.on('data', (chunk) => {
      stdoutData += chunk.toString();
    });

    ytdlp.on('close', (code) => {
      if (code !== 0 || !stdoutData.trim()) {
        return res.status(500).send('다이렉트 다운로드 주소를 추출하지 못했습니다.');
      }

      const directStreamUrl = stdoutData.trim().split('\n')[0].trim();
      res.redirect(302, directStreamUrl);
    });
  } catch (err) {
    res.status(500).send('다이렉트 다운로드 처리 중 오류가 발생했습니다.');
  }
});

// Download & Stream Endpoint (Server side merge)
app.get('/api/download', async (req, res) => {
  try {
    const { url, type = 'video', quality = '1080p', downloadId, title } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const binPath = await getYtDlpPath();
    const safeTitle = sanitizeFilename(title || 'download');
    const timestamp = Date.now();
    const outputFilename = type === 'audio' ? `${safeTitle}_${timestamp}.mp3` : `${safeTitle}_${timestamp}.mp4`;
    const outputPath = path.join(tempDir, outputFilename);

    console.log(`[DOWNLOAD] Starting download for: ${url} (type: ${type}, quality: ${quality})`);

    const args = getYtDlpArgs([
      '--newline',
      '--progress',
      '-o', outputPath
    ]);

    if (type === 'audio') {
      args.push('-x', '--audio-format', 'mp3', '--audio-quality', quality === '320k' ? '0' : '2');
    } else {
      const height = parseInt(quality.replace('p', '')) || 1080;
      args.push('-f', `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`, '--merge-output-format', 'mp4');
    }

    args.push(url);

    const ytdlp = spawn(binPath, args);

    ytdlp.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const progressMatch = text.match(/\[download\]\s+(\d+\.?\d*)%/);
      if (progressMatch && downloadId) {
        const percent = parseFloat(progressMatch[1]);
        const speedMatch = text.match(/at\s+([^\s]+)/);
        const etaMatch = text.match(/ETA\s+([^\s]+)/);
        const sizeMatch = text.match(/of\s+([^\s]+)/);

        sendProgress(downloadId, {
          status: 'downloading',
          percent: percent,
          speed: speedMatch ? speedMatch[1] : '',
          eta: etaMatch ? etaMatch[1] : '',
          size: sizeMatch ? sizeMatch[1] : '',
          message: `다운로드 중 (${percent}%)`
        });
      }
    });

    ytdlp.on('close', (code) => {
      if (code !== 0) {
        if (downloadId) {
          sendProgress(downloadId, { status: 'error', message: '다운로드에 실패했습니다.' });
        }
        if (!res.headersSent) {
          return res.status(500).json({ error: '다운로드 실패' });
        }
        return;
      }

      let finalFilePath = outputPath;
      if (!fs.existsSync(finalFilePath)) {
        const baseWithoutExt = outputPath.replace(/\.[^/.]+$/, '');
        const files = fs.readdirSync(tempDir);
        const matched = files.find((f) => path.join(tempDir, f).startsWith(baseWithoutExt));
        if (matched) {
          finalFilePath = path.join(tempDir, matched);
        }
      }

      if (!fs.existsSync(finalFilePath)) {
        if (downloadId) sendProgress(downloadId, { status: 'error', message: '파일을 찾을 수 없습니다.' });
        if (!res.headersSent) return res.status(500).json({ error: '파일 생성 실패' });
        return;
      }

      if (downloadId) {
        sendProgress(downloadId, { status: 'completed', percent: 100, message: '완료!' });
      }

      const stat = fs.statSync(finalFilePath);
      const downloadName = type === 'audio' ? `${safeTitle}.mp3` : `${safeTitle}.mp4`;

      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`);
      res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
      res.setHeader('Content-Length', stat.size);

      const stream = fs.createReadStream(finalFilePath);
      stream.pipe(res);

      stream.on('end', () => {
        setTimeout(() => {
          try {
            if (fs.existsSync(finalFilePath)) fs.unlinkSync(finalFilePath);
          } catch (e) {}
        }, 10000);
      });
    });
  } catch (err) {
    console.error('[DOWNLOAD FATAL]', err);
    if (!res.headersSent) res.status(500).json({ error: '서버 오류' });
  }
});

// Periodic cleanup of temporary files
setInterval(() => {
  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (now - stats.mtimeMs > 20 * 60 * 1000) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {}
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
