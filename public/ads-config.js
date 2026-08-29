// =========================================================
// TubeFetch Monetization & Ad Network Configuration Manager
// Supports: Hybrid Mode (Adsterra Banners + Monetag Ad Gate),
//           Adsterra, Monetag, Google AdSense, and Affiliate CPA
//
// 광고 코드를 넣는 곳은 아래 "PASTE ZONE" 세 군데뿐입니다.
// 값을 비워두면 자동으로 제휴(Affiliate) 배너가 대신 노출되므로,
// 코드를 넣기 전에도 화면이 비어 보이지 않습니다.
// =========================================================

export const ADS_CONFIG = {
  // Current active ad provider:
  // 'hybrid'    -> Adsterra for Banners + Monetag for 1080p Ad Gate (Recommended ⭐⭐⭐⭐⭐)
  // 'adsterra'  -> All Adsterra
  // 'monetag'   -> All Monetag
  // 'affiliate' -> Built-in High-Converting VPN & AI Tools CPA ($20-$50/sale)
  // 'adsense'   -> Google AdSense
  activeProvider: 'hybrid',

  // Hybrid Mode Settings (Mix & Match best performers)
  hybrid: {
    bannersProvider: 'adsterra', // Top, Result, Floating banners: 'adsterra' | 'affiliate' | 'adsense'
    adGateProvider: 'monetag'    // 1080p/4K/320k Download Gate: 'monetag' | 'adsterra' | 'affiliate'
  },

  // Ad Gate (Rewarded Interstitial Modal) Settings
  adGate: {
    enabled: true,
    durationSeconds: 5, // 5-second countdown for high-quality downloads
    triggerResolutions: ['1080', '1440', '2160', '4K', '320k'], // Qualities requiring ad gate
    canSkipImmediately: true // Allow user to skip or download after timer
  },

  // -------------------------------------------------------------------------
  // 1. Adsterra
  // -------------------------------------------------------------------------
  adsterra: {
    // ▼▼▼ PASTE ZONE 1 - 배너 ▼▼▼
    // Adsterra 대시보드 > Websites > "+ Add unit" 으로 슬롯을 만든 뒤,
    // 발급된 32자리 key 문자열만 아래에 넣으면 됩니다. (script 태그 통째로 X)
    //
    // ⚠️ 슬롯마다 반드시 별도의 key 를 발급받으세요. 하나의 key 를 두 슬롯에
    //    재사용하면 Adsterra 의 atOptions 전역이 덮어써져 두 번째 배너가 뜨지 않고,
    //    중복 impression 으로 집계되어 계정 정지 사유가 됩니다.
    banners: {
      top: { key: 'a32ecf32dad36eb94fff29440474d54b', width: 728, height: 90 },
      result: { key: '', width: 300, height: 250 }
    },

    // ▼▼▼ PASTE ZONE 2 - 하단 플로팅 / Social Bar ▼▼▼
    // Adsterra 에서 "Social Bar" 단위를 만들면 invoke.js 스크립트 URL 이 나옵니다.
    // 그 URL 만 넣으세요. Social Bar 는 스스로 화면 하단에 바를 그리므로,
    // 값이 채워지면 내장 플로팅 배너는 자동으로 숨겨집니다.
    socialBarScriptUrl: '',

    // Popunder / Direct SmartLink 스크립트 URL (선택)
    popunderScriptUrl: ''
  },

  // -------------------------------------------------------------------------
  // 2. Monetag (1080p / 4K / 320kbps 다운로드 게이트)
  // -------------------------------------------------------------------------
  monetag: {
    // ▼▼▼ PASTE ZONE 3 - 광고 게이트 ▼▼▼
    // Interstitial / In-Page Push 코드를 통째로 붙여넣으면 5초 모달 안에 렌더됩니다.
    modalAdHtml: '',

    // Monetag Direct Link (SmartLink) URL.
    // openDirectLinkOnGate 를 true 로 두면 사용자가 '바로 다운로드 시작' 을 누른
    // 순간(= 사용자 제스처) 새 탭으로 열립니다. 카운트다운 자동 완료 시에는 열지
    // 않습니다 - 제스처가 없으면 브라우저가 팝업을 차단하기 때문입니다.
    directLinkUrl: '',
    openDirectLinkOnGate: false,

    // Vignette / Interstitial 스크립트 URL (선택)
    interstitialScriptUrl: ''
  },

  // -------------------------------------------------------------------------
  // 3. Google AdSense
  // -------------------------------------------------------------------------
  googleAdSense: {
    publisherId: 'ca-pub-XXXXXXXXXXXXXXXX',
    slots: {
      topBanner: '1234567890',
      resultBanner: '2345678901',
      floatingBottom: '3456789012',
      adGateModal: '4567890123'
    }
  },

  // -------------------------------------------------------------------------
  // 4. High-Converting Affiliate Sponsors (Fallback when ad codes are empty)
  // -------------------------------------------------------------------------
  affiliateCampaigns: [
    {
      id: 'nordvpn',
      brand: 'NordVPN ⚡',
      logoEmoji: '🛡️',
      categoryBadge: 'Sponsored Partner',
      discountBadge: '최대 74% 할인 + 3개월 무료',
      title: {
        ko: '⚡ 해외 차단 영상도 버퍼링 없이 초고속 다운로드',
        en: '⚡ Download Geo-Restricted Videos at Lightning Speed',
        ja: '⚡ 地域制限動画も最速・安全に高速ダウンロード',
        zh: '⚡ 无视地区限制，超高速安全下载全球视频',
        es: '⚡ Descarga vídeos restringidos a máxima velocidad'
      },
      desc: {
        ko: 'NordVPN으로 IP를 안전하게 보호하고, 전 세계 고화질 스트림을 최고 속도로 다운로드하세요.',
        en: 'Protect your online privacy and bypass bandwidth throttling for seamless 4K downloads.',
        ja: 'プライバシーを保護し、帯域制限なしで4K・1080p動画をスムーズにダウンロード。',
        zh: '保护网络隐私，解除网络限速，轻松下载 4K 超高清音视频。',
        es: 'Protege tu privacidad y descarga contenidos en 4K sin restricciones de velocidad.'
      },
      ctaText: {
        ko: 'NordVPN 특별 할인받기',
        en: 'Get Special Deal (74% OFF)',
        ja: '今すぐ特別割引を適用',
        zh: '立即获取特惠折扣',
        es: 'Obtener Descuento Exclusivo'
      },
      ctaUrl: 'https://nordvpn.com',
      badgeColor: '#0284c7'
    },
    {
      id: 'surfshark',
      brand: 'Surfshark VPN 🦈',
      logoEmoji: '🌊',
      categoryBadge: 'Recommended Utility',
      discountBadge: '86% OFF 특가',
      title: {
        ko: '🚀 무제한 기기 동시 연결 & 강력한 광고 차단',
        en: '🚀 Unlimited Devices & Built-in CleanWeb Ad Blocker',
        ja: '🚀 無制限デバイス接続＆強力な広告ブロック機能',
        zh: '🚀 无限设备同时连接 & 内置强力去广告功能',
        es: '🚀 Conexión ilimitada de dispositivos y bloqueo de anuncios'
      },
      desc: {
        ko: '가족 모두 무제한 기기에서 사용 가능한 가장 가성비 좋은 프리미엄 VPN입니다.',
        en: 'One account for all your family devices with maximum encryption and speed.',
        ja: '1つの契約で家族全員の全デバイスを保護。高速かつ安全な通信を実現。',
        zh: '单个账号支持所有设备，高速稳定，畅享全球高清音视频。',
        es: 'Una sola cuenta para todos tus dispositivos con máxima velocidad.'
      },
      ctaText: {
        ko: 'Surfshark 최저가 확인',
        en: 'Get Surfshark Deal',
        ja: 'Surfsharkの特別オファーを見る',
        zh: '查看 Surfshark 优惠',
        es: 'Obtener Oferta de Surfshark'
      },
      ctaUrl: 'https://surfshark.com',
      badgeColor: '#059669'
    },
    {
      id: 'aivideo',
      brand: 'HitPaw AI Enhancer ✨',
      logoEmoji: '🪄',
      categoryBadge: 'AI Video Tool',
      discountBadge: 'AI 4K 업스케일링',
      title: {
        ko: '🪄 흐릿한 저화질 영상을 클릭 한 번으로 4K 초고화질 복원',
        en: '🪄 AI 4K Video Upscaler & Quality Enhancer',
        ja: '🪄 AIで低解像度動画をワンクリックで4K高画質化',
        zh: '🪄 AI 智能画质修复，一键将模糊视频提升至 4K',
        es: '🪄 Mejora la calidad de tus vídeos a 4K con IA en un clic'
      },
      desc: {
        ko: '다운로드한 영상의 해상도를 인공지능 신경망으로 4배 더 선명하게 향상시킵니다.',
        en: 'Automatically sharpen details, reduce noise, and upscale old videos to crisp 4K.',
        ja: 'AIがノイズを除去し、細部を自動補正してクリアな映像に蘇らせます。',
        zh: 'AI 智能去除噪点与模糊，自动增强细节，让老旧视频重获新生。',
        es: 'Restaura y aumenta la resolución de tus vídeos con inteligencia artificial avanzada.'
      },
      ctaText: {
        ko: '무료로 AI 화질 향상 체험',
        en: 'Try AI Enhancer Free',
        ja: '無料でAI高画質化を体験',
        zh: '免费体验 AI 画质增强',
        es: 'Probar Gratis con IA'
      },
      ctaUrl: 'https://www.hitpaw.com',
      badgeColor: '#8b5cf6'
    }
  ]
};

// Current index for rotating affiliate ads
let currentAffiliateIndex = 0;

export function getNextAffiliateCampaign() {
  const campaigns = ADS_CONFIG.affiliateCampaigns;
  const campaign = campaigns[currentAffiliateIndex % campaigns.length];
  currentAffiliateIndex++;
  return campaign;
}

export function getRandomAffiliateCampaign() {
  const campaigns = ADS_CONFIG.affiliateCampaigns;
  const randomIndex = Math.floor(Math.random() * campaigns.length);
  return campaigns[randomIndex];
}

// ---------------------------------------------------------------------------
// Rendering helpers
// ---------------------------------------------------------------------------

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHttpUrl(value) {
  try {
    const parsed = new URL(String(value), window.location.href);
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.toString() : '#';
  } catch (e) {
    return '#';
  }
}

function pickLocale(dict, lang) {
  if (!dict) return '';
  return dict[lang] || dict['en'] || dict['ko'] || '';
}

/**
 * Execute embedded script tags in dynamically inserted HTML
 */
function setInnerHTMLWithScripts(element, html) {
  element.innerHTML = html;
  const scripts = element.querySelectorAll('script');
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach((attr) => {
      newScript.setAttribute(attr.name, attr.value);
    });
    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

// Third-party ad tags must be injected exactly once per slot. The renderers are
// re-run on every language change (so the affiliate fallbacks can re-localize),
// and re-injecting an ad network's invoke.js would double-count impressions -
// which is precisely what gets publisher accounts suspended.
const liveThirdPartySlots = new WeakSet();

function renderThirdPartyOnce(containerEl, html) {
  if (liveThirdPartySlots.has(containerEl)) return;
  liveThirdPartySlots.add(containerEl);
  setInnerHTMLWithScripts(containerEl, html);
}

const injectedScriptIds = new Set();

function injectScriptOnce(src, id) {
  if (injectedScriptIds.has(id) || document.getElementById(id)) return;
  injectedScriptIds.add(id);

  const script = document.createElement('script');
  script.id = id;
  script.async = true;
  script.src = src;
  document.body.appendChild(script);
}

const ADSTERRA_KEY_PATTERN = /^[a-f0-9]{32}$/i;

function buildAdsterraBannerHtml(slot) {
  if (!slot || !ADSTERRA_KEY_PATTERN.test(String(slot.key || ''))) return null;

  const key = slot.key;
  const width = Number(slot.width) || 728;
  const height = Number(slot.height) || 90;

  return `
    <div class="adsterra-banner-wrapper" style="display:flex; justify-content:center; align-items:center; width:100%; min-height:${height}px; overflow-x:auto;">
      <script type="text/javascript">
        atOptions = {
          'key' : '${key}',
          'format' : 'iframe',
          'height' : ${height},
          'width' : ${width},
          'params' : {}
        };
      </script>
      <script type="text/javascript" src="https://www.highrevenueformat.com/${key}/invoke.js"></script>
    </div>
  `;
}

function getBannerProvider() {
  if (ADS_CONFIG.activeProvider === 'hybrid') {
    return ADS_CONFIG.hybrid?.bannersProvider || 'adsterra';
  }
  return ADS_CONFIG.activeProvider;
}

function getAdGateProvider() {
  if (ADS_CONFIG.activeProvider === 'hybrid') {
    return ADS_CONFIG.hybrid?.adGateProvider || 'monetag';
  }
  return ADS_CONFIG.activeProvider;
}

/**
 * Monetag Direct Link, if configured. app.js opens this from the ad gate's
 * skip button so the popup rides a real user gesture.
 */
export function getAdGateDirectLink() {
  const { directLinkUrl, openDirectLinkOnGate } = ADS_CONFIG.monetag;
  if (!openDirectLinkOnGate || !directLinkUrl) return null;
  const safe = safeHttpUrl(directLinkUrl);
  return safe === '#' ? null : safe;
}

/**
 * Render Top Leaderboard Banner (728x90 / responsive)
 */
export function renderTopBanner(containerEl, lang = 'ko') {
  if (!containerEl) return;

  const provider = getBannerProvider();

  if (provider === 'adsense') {
    renderAdSenseBlock(containerEl, ADS_CONFIG.googleAdSense.slots.topBanner, '728x90');
    return;
  }

  if (provider === 'adsterra') {
    const html = buildAdsterraBannerHtml(ADS_CONFIG.adsterra.banners.top);
    if (html) {
      containerEl.className = 'ad-banner-slot top-banner';
      renderThirdPartyOnce(containerEl, html);
      return;
    }
  }

  // Fallback to high-converting localized affiliate banner
  const campaign = getNextAffiliateCampaign();
  const title = pickLocale(campaign.title, lang);
  const cta = pickLocale(campaign.ctaText, lang);

  containerEl.innerHTML = `
    <div class="ad-placeholder top-leaderboard">
      <span class="ad-tag">SPONSORED</span>
      <div class="ad-content-box">
        <div class="ad-brand-group">
          <span class="ad-logo-icon">${escapeHtml(campaign.logoEmoji)}</span>
          <span class="ad-brand">${escapeHtml(campaign.brand)}</span>
          <span class="ad-pill-highlight">${escapeHtml(campaign.discountBadge)}</span>
        </div>
        <span class="ad-headline">${escapeHtml(title)}</span>
        <a href="${escapeHtml(safeHttpUrl(campaign.ctaUrl))}" target="_blank" rel="noopener noreferrer sponsored" class="btn-ad-cta" data-campaign-id="${escapeHtml(campaign.id)}">
          ${escapeHtml(cta)} ↗
        </a>
      </div>
    </div>
  `;
}

/**
 * Render In-Feed Result Banner (Appears right under download options)
 */
export function renderResultBanner(containerEl, lang = 'ko') {
  if (!containerEl) return;

  const provider = getBannerProvider();

  if (provider === 'adsense') {
    renderAdSenseBlock(containerEl, ADS_CONFIG.googleAdSense.slots.resultBanner, 'responsive');
    return;
  }

  if (provider === 'adsterra') {
    const html = buildAdsterraBannerHtml(ADS_CONFIG.adsterra.banners.result);
    if (html) {
      renderThirdPartyOnce(containerEl, html);
      return;
    }
  }

  const campaign = getNextAffiliateCampaign();
  const title = pickLocale(campaign.title, lang);
  const desc = pickLocale(campaign.desc, lang);
  const cta = pickLocale(campaign.ctaText, lang);

  containerEl.innerHTML = `
    <div class="ad-result-card">
      <div class="ad-result-header">
        <div class="ad-sponsor-badge">
          <span class="ad-tag-subtle">SPONSORED</span>
          <span class="ad-partner-name">${escapeHtml(campaign.logoEmoji)} ${escapeHtml(campaign.brand)}</span>
        </div>
        <span class="ad-discount-chip">${escapeHtml(campaign.discountBadge)}</span>
      </div>
      <div class="ad-result-body">
        <div class="ad-result-text">
          <h4 class="ad-result-title">${escapeHtml(title)}</h4>
          <p class="ad-result-desc">${escapeHtml(desc)}</p>
        </div>
        <a href="${escapeHtml(safeHttpUrl(campaign.ctaUrl))}" target="_blank" rel="noopener noreferrer sponsored" class="btn-result-cta" data-campaign-id="${escapeHtml(campaign.id)}">
          ${escapeHtml(cta)}
        </a>
      </div>
    </div>
  `;
}

/**
 * Render 5-Second Rewarded Ad Gate Content
 */
export function renderAdGateContent(containerEl, lang = 'ko') {
  if (!containerEl) return;

  const provider = getAdGateProvider();

  if (provider === 'adsense') {
    renderAdSenseBlock(containerEl, ADS_CONFIG.googleAdSense.slots.adGateModal, '300x250');
    return;
  }

  if (provider === 'monetag' && ADS_CONFIG.monetag.modalAdHtml) {
    renderThirdPartyOnce(containerEl, ADS_CONFIG.monetag.modalAdHtml);
    return;
  }

  if (provider === 'adsterra') {
    const html = buildAdsterraBannerHtml(ADS_CONFIG.adsterra.banners.result);
    if (html) {
      renderThirdPartyOnce(containerEl, html);
      return;
    }
  }

  const campaign = getRandomAffiliateCampaign();
  const title = pickLocale(campaign.title, lang);
  const desc = pickLocale(campaign.desc, lang);
  const cta = pickLocale(campaign.ctaText, lang);

  containerEl.innerHTML = `
    <div class="ad-inner-banner">
      <div class="ad-modal-sponsor-row">
        <div class="ad-sponsor-pill">${escapeHtml(campaign.categoryBadge)}</div>
        <span class="ad-modal-discount-pill">${escapeHtml(campaign.discountBadge)}</span>
      </div>
      <div class="ad-sponsor-content">
        <div class="ad-sponsor-logo">${escapeHtml(campaign.logoEmoji)} ${escapeHtml(campaign.brand)}</div>
        <h4>${escapeHtml(title)}</h4>
        <p>${escapeHtml(desc)}</p>
        <a href="${escapeHtml(safeHttpUrl(campaign.ctaUrl))}" target="_blank" rel="noopener noreferrer sponsored" class="btn-ad-modal-cta" data-campaign-id="${escapeHtml(campaign.id)}">
          ${escapeHtml(cta)} ↗
        </a>
      </div>
    </div>
  `;
}

/**
 * Render Floating Sticky Bottom Banner
 */
export function renderFloatingBanner(containerEl, lang = 'ko') {
  if (!containerEl) return;

  const isClosed = sessionStorage.getItem('tubefetch_floating_ad_closed') === 'true';
  if (isClosed) {
    containerEl.classList.add('hidden');
    return;
  }

  const provider = getBannerProvider();

  // Social Bar draws its own bar directly into <body>, so the built-in slot
  // stays empty and hidden when it is configured.
  if (provider === 'adsterra' && ADS_CONFIG.adsterra.socialBarScriptUrl) {
    injectScriptOnce(safeHttpUrl(ADS_CONFIG.adsterra.socialBarScriptUrl), 'adsterra-social-bar');
    containerEl.classList.add('hidden');
    return;
  }

  const campaign = getRandomAffiliateCampaign();
  const title = pickLocale(campaign.title, lang);
  const cta = pickLocale(campaign.ctaText, lang);

  containerEl.innerHTML = `
    <div class="floating-ad-wrapper">
      <div class="floating-ad-content">
        <div class="floating-ad-left">
          <span class="floating-ad-tag">AD</span>
          <span class="floating-ad-icon">${escapeHtml(campaign.logoEmoji)}</span>
          <div class="floating-ad-text">
            <span class="floating-ad-brand">${escapeHtml(campaign.brand)}</span>
            <span class="floating-ad-title">${escapeHtml(title)}</span>
          </div>
        </div>
        <div class="floating-ad-actions">
          <a href="${escapeHtml(safeHttpUrl(campaign.ctaUrl))}" target="_blank" rel="noopener noreferrer sponsored" class="btn-floating-cta">
            ${escapeHtml(cta)}
          </a>
          <button class="btn-floating-close" id="floatingAdCloseBtn" title="광고 닫기">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;

  const closeBtn = containerEl.querySelector('#floatingAdCloseBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      containerEl.classList.add('hidden');
      sessionStorage.setItem('tubefetch_floating_ad_closed', 'true');
    });
  }
}

/**
 * Optional Popunder / SmartLink loader. Called once at startup by app.js.
 */
export function initOptionalAdScripts() {
  const { popunderScriptUrl } = ADS_CONFIG.adsterra;
  if (getBannerProvider() === 'adsterra' && popunderScriptUrl) {
    injectScriptOnce(safeHttpUrl(popunderScriptUrl), 'adsterra-popunder');
  }

  const { interstitialScriptUrl } = ADS_CONFIG.monetag;
  if (getAdGateProvider() === 'monetag' && interstitialScriptUrl) {
    injectScriptOnce(safeHttpUrl(interstitialScriptUrl), 'monetag-interstitial');
  }
}

function ensureAdSenseScriptLoaded() {
  const pubId = ADS_CONFIG.googleAdSense.publisherId;
  if (!pubId || pubId.includes('XXXXX')) return false;

  injectScriptOnce(`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(pubId)}`, 'google-adsense-script');
  return true;
}

function renderAdSenseBlock(container, slotId, format = 'auto') {
  // Without a real publisher ID the script never loads, and pushing onto
  // window.adsbygoogle just grows an array that nothing ever drains.
  if (!ensureAdSenseScriptLoaded()) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = `
    <div class="adsense-container" style="text-align:center; overflow:hidden; min-height:90px; width:100%; display:flex; justify-content:center;">
      <ins class="adsbygoogle"
           style="display:block; width:100%;"
           data-ad-client="${escapeHtml(ADS_CONFIG.googleAdSense.publisherId)}"
           data-ad-slot="${escapeHtml(slotId)}"
           data-ad-format="${escapeHtml(format)}"
           data-full-width-responsive="true"></ins>
    </div>
  `;

  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    console.warn('AdSense script error:', e);
  }
}
