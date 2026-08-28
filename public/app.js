// =========================================================
// TubeFetch Client Logic (Zero-Traffic CDN + Ad Gate Modal + i18n)
// =========================================================

import { translations } from './i18n.js';

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const htmlEl = document.documentElement;
  const langSelect = document.getElementById('langSelect');
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const sunIcon = document.getElementById('sunIcon');
  const moonIcon = document.getElementById('moonIcon');

  const urlInput = document.getElementById('urlInput');
  const pasteBtn = document.getElementById('pasteBtn');
  const clearBtn = document.getElementById('clearBtn');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const btnText = analyzeBtn.querySelector('.btn-text');
  const spinner = analyzeBtn.querySelector('.spinner');

  const loadingCard = document.getElementById('loadingCard');
  const errorCard = document.getElementById('errorCard');
  const errorTitle = document.getElementById('errorTitle');
  const errorMsg = document.getElementById('errorMsg');
  const retryBtn = document.getElementById('retryBtn');

  const resultSection = document.getElementById('resultSection');
  const videoThumb = document.getElementById('videoThumb');
  const videoDuration = document.getElementById('videoDuration');
  const shortsBadge = document.getElementById('shortsBadge');
  const videoTitle = document.getElementById('videoTitle');
  const videoAuthor = document.getElementById('videoAuthor');
  const videoViews = document.getElementById('videoViews');
  const videoDate = document.getElementById('videoDate');
  const actionCardList = document.getElementById('actionCardList');

  // Ad Gate Modal Elements
  const adGateModal = document.getElementById('adGateModal');
  const countdownNumber = document.getElementById('countdownNumber');
  const skipAdBtn = document.getElementById('skipAdBtn');

  const progressModal = document.getElementById('progressModal');
  const progressStatusTitle = document.getElementById('progressStatusTitle');
  const progressPercentBadge = document.getElementById('progressPercentBadge');
  const progressBar = document.getElementById('progressBar');
  const progressSpeed = document.getElementById('progressSpeed');
  const progressSize = document.getElementById('progressSize');
  const progressEta = document.getElementById('progressEta');
  const progressMessage = document.getElementById('progressMessage');

  const historySection = document.getElementById('historySection');
  const historyList = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // State
  let currentVideoData = null;
  let currentEventSource = null;
  let currentLang = localStorage.getItem('tubefetch_lang') || 'ko';
  let currentTheme = localStorage.getItem('tubefetch_theme') || 'dark';
  let countdownTimer = null;
  let activeAdFinishCallback = null;

  // 1. Initialize Theme
  applyTheme(currentTheme);

  // 2. Initialize Language
  langSelect.value = currentLang;
  applyLanguage(currentLang);

  // 3. Initialize History
  renderHistory();

  // Theme Toggle Event Listener
  themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    applyTheme(currentTheme);
    localStorage.setItem('tubefetch_theme', currentTheme);
  });

  function applyTheme(theme) {
    htmlEl.setAttribute('data-theme', theme);
    if (theme === 'light') {
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }

  // Language Change Event Listener
  langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    applyLanguage(currentLang);
    localStorage.setItem('tubefetch_lang', currentLang);
  });

  function t(key) {
    return translations[currentLang]?.[key] || translations['en']?.[key] || key;
  }

  function applyLanguage(lang) {
    htmlEl.lang = lang;
    const dict = translations[lang] || translations['en'];

    // Update text for all elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) {
        el.placeholder = dict[key];
      }
    });

    // Re-render action cards if video card is open
    if (currentVideoData) {
      renderActionCards(currentVideoData);
      videoViews.textContent = `${currentVideoData.view_count}${t('views_suffix')}`;
    }
  }

  // URL Input Event Listeners
  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim().length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  });

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  });

  clearBtn.addEventListener('click', () => {
    urlInput.value = '';
    clearBtn.classList.add('hidden');
    urlInput.focus();
  });

  // Paste Button
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        urlInput.value = text.trim();
        clearBtn.classList.remove('hidden');
        handleAnalyze();
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
      urlInput.focus();
    }
  });

  // Analyze Button
  analyzeBtn.addEventListener('click', handleAnalyze);
  retryBtn.addEventListener('click', handleAnalyze);

  // Clear History
  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('tubefetch_history');
    renderHistory();
  });

  // Skip Ad Button in Modal
  skipAdBtn.addEventListener('click', () => {
    if (countdownTimer) clearInterval(countdownTimer);
    adGateModal.classList.add('hidden');
    if (typeof activeAdFinishCallback === 'function') {
      activeAdFinishCallback();
      activeAdFinishCallback = null;
    }
  });

  // 5-Second Ad Gate Modal Helper
  function openAdGateModal(onComplete) {
    activeAdFinishCallback = onComplete;
    adGateModal.classList.remove('hidden');
    let timeLeft = 5;
    countdownNumber.textContent = timeLeft;

    if (countdownTimer) clearInterval(countdownTimer);

    countdownTimer = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        countdownNumber.textContent = timeLeft;
      } else {
        clearInterval(countdownTimer);
        adGateModal.classList.add('hidden');
        if (typeof activeAdFinishCallback === 'function') {
          activeAdFinishCallback();
          activeAdFinishCallback = null;
        }
      }
    }, 1000);
  }

  // Main Analyze Function
  async function handleAnalyze() {
    const url = urlInput.value.trim();
    if (!url) {
      showError(t('error_title'), t('error_desc'));
      return;
    }

    hideError();
    resultSection.classList.add('hidden');
    loadingCard.classList.remove('hidden');
    setButtonLoading(true);

    try {
      const res = await fetch('/api/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t('error_desc'));
      }

      currentVideoData = data;
      renderVideoInfo(data);
    } catch (err) {
      console.error('Analyze error:', err);
      showError(t('error_title'), err.message || t('error_desc'));
    } finally {
      loadingCard.classList.add('hidden');
      setButtonLoading(false);
    }
  }

  function renderVideoInfo(data) {
    videoThumb.src = data.thumbnail;
    videoDuration.textContent = data.duration_formatted || '00:00';
    videoTitle.textContent = data.title;
    videoAuthor.textContent = data.uploader;
    videoViews.textContent = `${data.view_count}${t('views_suffix')}`;
    videoDate.textContent = data.upload_date || 'Media';

    if (data.is_short) {
      shortsBadge.classList.remove('hidden');
    } else {
      shortsBadge.classList.add('hidden');
    }

    renderActionCards(data);

    resultSection.classList.remove('hidden');
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function renderActionCards(data) {
    actionCardList.innerHTML = '';

    const maxRes = (data.resolutions && data.resolutions.length > 0) ? data.resolutions[0] : 1080;
    const bestResLabel = maxRes >= 2160 ? '4K Ultra HD' : maxRes >= 1440 ? '2K QHD' : maxRes >= 1080 ? '1080p Full HD' : `${maxRes}p HD`;

    // Find direct video+audio stream (720p or 360p)
    const directStream = (data.direct_streams || []).find((s) => s.type === 'video_with_audio' || (s.vcodec !== 'none' && s.acodec !== 'none'));
    const directAudioStream = (data.direct_streams || []).find((s) => s.type === 'audio_only' && s.ext === 'm4a') || (data.direct_streams || []).find((s) => s.type === 'audio_only');

    const actions = [
      // 1. Best Quality Video (1080p/4K MP4) -> With 5-Sec Ad Gate
      {
        id: 'best_video',
        icon: '🎬',
        typeClass: 'best',
        title: `${t('card_best_video_title')} (${bestResLabel})`,
        badge: t('card_best_video_badge'),
        badgeClass: 'best',
        desc: t('card_best_video_desc'),
        onClick: () => {
          openAdGateModal(() => {
            triggerServerDownload('video', `${maxRes}p`, `${bestResLabel} MP4`);
          });
        }
      },
      // 2. Fast Direct Video (720p HD MP4) -> 1-Second Direct (0 Server Traffic, No Ad Gate)
      {
        id: 'direct_video',
        icon: '⚡',
        typeClass: 'direct',
        title: `${t('card_direct_video_title')} (${directStream ? directStream.resolution : '720p HD'})`,
        badge: t('card_direct_video_badge'),
        badgeClass: 'direct',
        desc: t('card_direct_video_desc'),
        onClick: () => {
          if (directStream && directStream.url) {
            triggerDirectDownload(directStream.url, directStream.resolution, directStream.ext);
          } else {
            triggerServerDownload('video', '720p', '720p MP4');
          }
        }
      },
      // 3. Best Quality MP3 (320kbps) -> With 5-Sec Ad Gate
      {
        id: 'mp3_audio',
        icon: '🎵',
        typeClass: 'audio',
        title: t('card_mp3_title'),
        badge: t('card_mp3_badge'),
        badgeClass: 'audio',
        desc: t('card_mp3_desc'),
        onClick: () => {
          openAdGateModal(() => {
            triggerServerDownload('audio', '320k', '320kbps MP3');
          });
        }
      },
      // 4. Raw Original Audio (M4A) -> Direct Stream (0 Server Traffic)
      {
        id: 'm4a_audio',
        icon: '🎙️',
        typeClass: 'audio',
        title: t('card_m4a_title'),
        badge: t('card_m4a_badge'),
        badgeClass: 'audio',
        desc: t('card_m4a_desc'),
        onClick: () => {
          if (directAudioStream && directAudioStream.url) {
            triggerDirectDownload(directAudioStream.url, 'M4A', directAudioStream.ext || 'm4a');
          } else {
            triggerServerDownload('audio', 'm4a', 'M4A Original');
          }
        }
      }
    ];

    actions.forEach((action) => {
      const card = document.createElement('div');
      card.className = `action-card ${action.typeClass}`;
      card.innerHTML = `
        <div class="action-card-left">
          <div class="action-card-icon">${action.icon}</div>
          <div class="action-card-text">
            <div class="action-card-title-row">
              <span class="action-card-title">${action.title}</span>
              <span class="action-card-badge ${action.badgeClass}">${action.badge}</span>
            </div>
            <span class="action-card-desc">${action.desc}</span>
          </div>
        </div>
        <div class="action-card-right">
          <button class="btn-action-download">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span>${t('btn_download_now')}</span>
          </button>
        </div>
      `;

      card.addEventListener('click', action.onClick);
      actionCardList.appendChild(card);
    });
  }

  // 1. Direct CDN Download (0 Server Traffic)
  function triggerDirectDownload(streamUrl, name, ext) {
    if (!currentVideoData) return;

    const directUrl = `/api/direct-download?stream_url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(currentVideoData.title)}`;
    
    const link = document.createElement('a');
    link.href = directUrl;
    link.target = '_blank';
    link.download = `${currentVideoData.title}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    saveToHistory({
      id: currentVideoData.id,
      title: currentVideoData.title,
      thumbnail: currentVideoData.thumbnail,
      type: 'direct',
      quality: `${name} (${ext.toUpperCase()})`,
      timestamp: Date.now()
    });
  }

  // 2. Server Download with SSE Progress
  function triggerServerDownload(type, quality, label) {
    if (!currentVideoData) return;

    const url = urlInput.value.trim();
    const downloadId = 'dl_' + Math.random().toString(36).substring(2, 9);

    progressModal.classList.remove('hidden');
    progressBar.style.width = '0%';
    progressPercentBadge.textContent = '0%';
    progressStatusTitle.textContent = `${label} 다운로드 준비 중...`;
    progressMessage.textContent = '고화질 미디어 스트림을 수집하고 있습니다.';
    progressSpeed.textContent = '-';
    progressSize.textContent = '-';
    progressEta.textContent = '-';

    if (currentEventSource) {
      currentEventSource.close();
    }

    currentEventSource = new EventSource(`/api/progress/${downloadId}`);

    currentEventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.status === 'downloading') {
          const pct = Math.round(data.percent || 0);
          progressBar.style.width = `${pct}%`;
          progressPercentBadge.textContent = `${pct}%`;
          progressStatusTitle.textContent = `다운로드 중 (${pct}%)`;
          progressMessage.textContent = data.message || '';
          if (data.speed) progressSpeed.textContent = `속도: ${data.speed}`;
          if (data.size) progressSize.textContent = `크기: ${data.size}`;
          if (data.eta) progressEta.textContent = `남은 시간: ${data.eta}`;
        } else if (data.status === 'converting') {
          progressBar.style.width = '96%';
          progressPercentBadge.textContent = '96%';
          progressStatusTitle.textContent = 'FFmpeg 고품질 인코딩 중...';
          progressMessage.textContent = data.message || '';
        } else if (data.status === 'finalizing') {
          progressBar.style.width = '99%';
          progressPercentBadge.textContent = '99%';
          progressStatusTitle.textContent = '파일 전송 준비 중...';
        } else if (data.status === 'completed') {
          progressBar.style.width = '100%';
          progressPercentBadge.textContent = '100%';
          progressStatusTitle.textContent = '다운로드 완료!';
          currentEventSource.close();
          setTimeout(() => {
            progressModal.classList.add('hidden');
          }, 3000);
        } else if (data.status === 'error') {
          progressStatusTitle.textContent = '오류 발생';
          progressMessage.textContent = data.message || '다운로드에 실패했습니다.';
          currentEventSource.close();
        }
      } catch (e) {
        console.error('SSE JSON error:', e);
      }
    };

    currentEventSource.onerror = (err) => {
      console.warn('SSE connection closed:', err);
    };

    const downloadUrl = `/api/download?url=${encodeURIComponent(url)}&type=${type}&quality=${quality}&downloadId=${downloadId}&title=${encodeURIComponent(currentVideoData.title)}`;
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    saveToHistory({
      id: currentVideoData.id,
      title: currentVideoData.title,
      thumbnail: currentVideoData.thumbnail,
      type: type,
      quality: label,
      timestamp: Date.now()
    });
  }

  function saveToHistory(item) {
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem('tubefetch_history')) || [];
    } catch (e) {
      history = [];
    }

    history = history.filter((h) => h.id !== item.id || h.type !== item.type || h.quality !== item.quality);
    history.unshift(item);
    if (history.length > 8) history.pop();

    localStorage.setItem('tubefetch_history', JSON.stringify(history));
    renderHistory();
  }

  function renderHistory() {
    let history = [];
    try {
      history = JSON.parse(localStorage.getItem('tubefetch_history')) || [];
    } catch (e) {
      history = [];
    }

    if (history.length === 0) {
      historySection.classList.add('hidden');
      return;
    }

    historySection.classList.remove('hidden');
    historyList.innerHTML = '';

    history.forEach((item) => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.innerHTML = `
        <img src="${item.thumbnail}" alt="Thumb" class="history-thumb">
        <div class="history-info">
          <div class="history-title" title="${item.title}">${item.title}</div>
          <div class="history-badge">${item.quality || item.type}</div>
        </div>
      `;
      historyList.appendChild(el);
    });
  }

  function setButtonLoading(loading) {
    if (loading) {
      analyzeBtn.disabled = true;
      btnText.classList.add('hidden');
      spinner.classList.remove('hidden');
    } else {
      analyzeBtn.disabled = false;
      btnText.classList.remove('hidden');
      spinner.classList.add('hidden');
    }
  }

  function showError(title, msg) {
    errorTitle.textContent = title;
    errorMsg.textContent = msg;
    errorCard.classList.remove('hidden');
  }

  function hideError() {
    errorCard.classList.add('hidden');
  }
});
