// =========================================================
// Shared YouTube oEmbed fallback
// Imported by both server.js (Node) and app.js (browser) so the two fallback
// paths cannot drift apart.
//
// oEmbed only exposes title / author / thumbnail. It exposes no duration, no
// view count and no media URLs, so those fields are left empty instead of being
// invented - the UI renders "-" for them and falls back to a server-side
// download rather than pretending the watch page is a direct stream.
// =========================================================

const YOUTUBE_HOST_PATTERN = /(^|\.)(youtube\.com|youtu\.be|youtube-nocookie\.com)$/i;
const VIDEO_ID_PATTERN = /(?:v=|youtu\.be\/|embed\/|shorts\/|live\/)([\w-]{11})/;

/**
 * Host-based check. A substring test like /youtube\.com/ also matches
 * hostile hosts such as "youtube.com.attacker.net".
 */
export function isYouTubeUrl(url) {
  try {
    return YOUTUBE_HOST_PATTERN.test(new URL(url).hostname);
  } catch (e) {
    return false;
  }
}

export function extractYouTubeVideoId(url) {
  const match = String(url).match(VIDEO_ID_PATTERN);
  return match ? match[1] : '';
}

export function buildOembedPayload(url, oData) {
  const videoId = extractYouTubeVideoId(url);

  return {
    id: videoId,
    title: oData.title || 'YouTube Video',
    uploader: oData.author_name || 'YouTube Creator',
    uploader_url: oData.author_url || '',
    duration: null,
    duration_formatted: '',
    view_count: '',
    upload_date: '',
    thumbnail: oData.thumbnail_url || (videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : ''),
    description: '',
    is_short: /\/shorts\//.test(url),
    resolutions: [],
    direct_streams: [],
    // Tells the UI to show "-" for the fields oEmbed cannot provide.
    limited_metadata: true
  };
}

/**
 * Returns a payload shaped like /api/info's success response, or null when the
 * URL is not a YouTube link or oEmbed itself fails.
 */
export async function fetchOembedFallback(url, fetchImpl = fetch) {
  if (!isYouTubeUrl(url)) return null;

  try {
    const res = await fetchImpl(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
    if (!res.ok) return null;
    return buildOembedPayload(url, await res.json());
  } catch (err) {
    console.error('[OEMBED FALLBACK ERROR]', err);
    return null;
  }
}
