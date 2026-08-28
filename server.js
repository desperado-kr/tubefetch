import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure directories
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const ytdlpPath = path.join(__dirname, 'bin', 'yt-dlp.exe');
const denoPath = path.join(__dirname, 'bin', 'deno.exe');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Progress tracking clients (SSE)
const progressClients = new Map();

// Helper: Format duration seconds to HH:MM:SS
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

// Helper: Format number with commas
function formatNumber(num) {
  if (!num) return '0';
  return Number(num).toLocaleString();
}

// Helper: Sanitize filename for safe Content-Disposition
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

  // Send initial connected state
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
  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: '유효한 영상 URL을 입력해주세요.' });
  }

  const cleanUrl = url.trim();
  // Support YouTube, TikTok, Instagram, X/Twitter, Facebook, etc.
  const isSupported = /^https?:\/\/.+/i.test(cleanUrl);
  if (!isSupported) {
    return res.status(400).json({ error: '올바른 영상 주소(http/https)를 입력해주세요.' });
  }

  console.log(`[INFO] Fetching metadata for: ${cleanUrl}`);

  const args = [
    '--dump-single-json',
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--js-runtimes', `deno:${denoPath}`,
    '--remote-components', 'ejs:github',
    '--retries', '10',
    url.trim()
  ];

  const ytdlp = spawn(ytdlpPath, args);
  let stdoutData = '';
  let stderrData = '';

  ytdlp.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });

  ytdlp.stderr.on('data', (chunk) => {
    stderrData += chunk.toString();
  });

  ytdlp.on('close', (code) => {
    if (code !== 0) {
      console.error(`[ERROR] yt-dlp info failed: ${stderrData}`);
      return res.status(500).json({
        error: '영상 정보를 가져오지 못했습니다. 비공개 영상이거나 연령 제한 영상일 수 있습니다.',
        details: stderrData
      });
    }

    try {
      const data = JSON.parse(stdoutData);

      // Extract best thumbnail
      let thumbnail = data.thumbnail;
      if (Array.isArray(data.thumbnails) && data.thumbnails.length > 0) {
        const sorted = [...data.thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0));
        thumbnail = sorted[0]?.url || thumbnail;
      }

      // Collect available resolutions
      const heights = new Set();
      if (Array.isArray(data.formats)) {
        data.formats.forEach((f) => {
          if (f.height && f.vcodec && f.vcodec !== 'none') {
            heights.add(f.height);
          }
        });
      }

      const availableResolutions = Array.from(heights).sort((a, b) => b - a);

      // Parse direct streams
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
        uploader: data.uploader || data.channel || 'YouTube Creator',
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
});

// Direct Download Endpoint (Zero Server Traffic 302 Redirect)
app.get('/api/direct-download', async (req, res) => {
  const { url, format_id, stream_url } = req.query;

  if (stream_url) {
    return res.redirect(302, stream_url);
  }

  if (!url) {
    return res.status(400).send('URL이 필요합니다.');
  }

  const args = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--js-runtimes', `deno:${denoPath}`,
    '--remote-components', 'ejs:github',
    '-g'
  ];

  if (format_id) {
    args.push('-f', format_id);
  }

  args.push(url);

  const ytdlp = spawn(ytdlpPath, args);
  let stdoutData = '';

  ytdlp.stdout.on('data', (chunk) => {
    stdoutData += chunk.toString();
  });

  ytdlp.on('close', (code) => {
    if (code !== 0 || !stdoutData.trim()) {
      return res.status(500).send('다이렉트 다운로드 주소를 추출하지 못했습니다.');
    }

    const streamUrl = stdoutData.trim().split('\n')[0].trim();
    res.redirect(302, streamUrl);
  });
});

// Download & Stream Endpoint
app.get('/api/download', async (req, res) => {
  const { url, type = 'video', quality = 'best', downloadId } = req.query;

  if (!url) {
    return res.status(400).send('URL이 누락되었습니다.');
  }

  const timestamp = Date.now();
  const filePrefix = `yt_${timestamp}_${Math.random().toString(36).substring(2, 8)}`;
  let outputTemplate = path.join(tempDir, `${filePrefix}.%(ext)s`);

  let args = [
    '--no-playlist',
    '--no-warnings',
    '--no-check-certificates',
    '--js-runtimes', `deno:${denoPath}`,
    '--remote-components', 'ejs:github',
    '--retries', '10',
    '--fragment-retries', '10',
    '--newline'
  ];

  let targetExt = 'mp4';

  if (type === 'audio') {
    targetExt = quality === 'm4a' ? 'm4a' : 'mp3';
    args.push('-x');
    if (quality === 'm4a') {
      args.push('--audio-format', 'm4a');
    } else {
      args.push('--audio-format', 'mp3');
      const bitrate = quality === '320k' ? '320k' : quality === '192k' ? '192k' : '128k';
      args.push('--audio-quality', bitrate);
    }
    args.push('-o', outputTemplate);
    args.push(url);
  } else {
    // Video mode
    targetExt = 'mp4';
    let formatSpec = 'bestvideo[vcodec^=vp9]+bestaudio/bestvideo[vcodec^=avc]+bestaudio/bestvideo+bestaudio/best';

    if (quality === '1080p') {
      formatSpec = 'bestvideo[height<=1080][vcodec^=vp9]+bestaudio/bestvideo[height<=1080][vcodec^=avc]+bestaudio/bestvideo[height<=1080]+bestaudio/best[height<=1080]/best';
    } else if (quality === '720p') {
      formatSpec = 'bestvideo[height<=720][vcodec^=vp9]+bestaudio/bestvideo[height<=720][vcodec^=avc]+bestaudio/bestvideo[height<=720]+bestaudio/best[height<=720]/best';
    } else if (quality === '480p') {
      formatSpec = 'bestvideo[height<=480][vcodec^=vp9]+bestaudio/bestvideo[height<=480][vcodec^=avc]+bestaudio/bestvideo[height<=480]+bestaudio/best[height<=480]/best';
    } else if (quality === '360p') {
      formatSpec = 'bestvideo[height<=360][vcodec^=vp9]+bestaudio/bestvideo[height<=360][vcodec^=avc]+bestaudio/bestvideo[height<=360]+bestaudio/best[height<=360]/18/best';
    } else if (quality === '4k' || quality === '2160p') {
      formatSpec = 'bestvideo[height<=2160][vcodec^=vp9]+bestaudio/bestvideo[height<=2160][vcodec^=avc]+bestaudio/bestvideo[height<=2160]+bestaudio/best[height<=2160]/best';
    }

    args.push('-f', formatSpec);
    args.push('--merge-output-format', 'mp4');
    args.push('-o', outputTemplate);
    args.push(url);
  }

  console.log(`[DOWNLOAD] Started: type=${type}, quality=${quality}, url=${url}`);

  if (downloadId) {
    sendProgress(downloadId, { status: 'starting', percent: 5, message: '다운로드 준비 중...' });
  }

  const ytdlp = spawn(ytdlpPath, args);
  let errorOutput = '';

  ytdlp.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    console.log(`[yt-dlp stdout]: ${text.trim()}`);

    if (downloadId) {
      // Parse progress: [download]  45.2% of ~12.50MiB at 4.21MiB/s ETA 00:01
      const progressMatch = text.match(/\[download\]\s+([\d\.]+)%\s+of\s+~?([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/);
      if (progressMatch) {
        const percent = Math.min(95, parseFloat(progressMatch[1]));
        const size = progressMatch[2];
        const speed = progressMatch[3];
        const eta = progressMatch[4];
        sendProgress(downloadId, {
          status: 'downloading',
          percent: percent,
          speed: speed,
          size: size,
          eta: eta,
          message: `스트림 다운로드 중... (${percent.toFixed(1)}% / ${speed})`
        });
      } else if (text.includes('[Merger]') || text.includes('Merging formats')) {
        sendProgress(downloadId, {
          status: 'converting',
          percent: 96,
          message: '고화질 영상과 오디오 합성 중 (FFmpeg)...'
        });
      } else if (text.includes('[ExtractAudio]') || text.includes('Destination:')) {
        sendProgress(downloadId, {
          status: 'converting',
          percent: 96,
          message: '고음질 오디오 변환 중 (FFmpeg)...'
        });
      }
    }
  });

  ytdlp.stderr.on('data', (chunk) => {
    errorOutput += chunk.toString();
  });

  ytdlp.on('close', async (code) => {
    if (code !== 0) {
      console.error(`[ERROR] yt-dlp download failed: ${errorOutput}`);
      if (downloadId) {
        sendProgress(downloadId, { status: 'error', message: '다운로드 중 오류가 발생했습니다.' });
      }
      return res.status(500).send(`다운로드 실패: ${errorOutput}`);
    }

    if (downloadId) {
      sendProgress(downloadId, { status: 'finalizing', percent: 99, message: '파일 전송 준비 완료!' });
    }

    // Find generated file in temp directory matching filePrefix
    try {
      const files = fs.readdirSync(tempDir);
      const targetFile = files.find((f) => f.startsWith(filePrefix));

      if (!targetFile) {
        if (downloadId) {
          sendProgress(downloadId, { status: 'error', message: '생성된 파일을 찾을 수 없습니다.' });
        }
        return res.status(500).send('파일 처리 실패: 생성된 파일을 찾을 수 없습니다.');
      }

      const filePath = path.join(tempDir, targetFile);
      const stats = fs.statSync(filePath);

      // Get video title if possible via query or fallback
      const rawTitle = req.query.title ? decodeURIComponent(req.query.title) : 'youtube_download';
      const safeFilename = `${sanitizeFilename(rawTitle)}.${targetExt}`;

      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Type', type === 'audio' ? 'audio/mpeg' : 'video/mp4');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(safeFilename)}"; filename*=UTF-8''${encodeURIComponent(safeFilename)}`
      );

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);

      if (downloadId) {
        sendProgress(downloadId, { status: 'completed', percent: 100, message: '다운로드 완료!' });
      }

      // Cleanup temp file after response ends
      res.on('finish', () => {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
              console.log(`[CLEANUP] Deleted temp file: ${filePath}`);
            }
          } catch (e) {
            console.error('[CLEANUP ERROR]', e);
          }
        }, 5000);
      });
    } catch (err) {
      console.error('[ERROR] File streaming failed:', err);
      res.status(500).send('파일 전송 중 오류 발생');
    }
  });
});

// Auto-clean old temp files every 15 minutes
setInterval(() => {
  try {
    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    files.forEach((file) => {
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      // Older than 20 minutes
      if (now - stats.mtimeMs > 20 * 60 * 1000) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    console.error('Periodic cleanup error:', err);
  }
}, 15 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 YouTube Downloader Server running!`);
  console.log(`👉 Web Interface: http://localhost:${PORT}`);
  console.log(`====================================================`);
});

export default app;
