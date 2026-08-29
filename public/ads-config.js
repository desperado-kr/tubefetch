// =========================================================
// TubeFetch Monetization & Ad Network Configuration Manager
// Supports: Hybrid Mode (Adsterra Banners + Monetag Ad Gate),
//           Adsterra, Monetag, Google AdSense, and Affiliate CPA
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
    bannersProvider: 'adsterra', // Provider for Top, Result, and Floating banners: 'adsterra' | 'affiliate' | 'adsense'
    adGateProvider: 'monetag'    // Provider for 1080p/4K/320k Download Gate: 'monetag' | 'adsterra' | 'affiliate'
  },

  // Ad Gate (Rewarded Interstitial Modal) Settings
  adGate: {
    enabled: true,
    durationSeconds: 5, // 5-second countdown for high-quality downloads
    triggerResolutions: ['1080', '1440', '2160', '4K', '320k'], // Qualities requiring ad gate
    canSkipImmediately: true // Allow user to skip or download after timer
  },

  // 1. Adsterra Configuration (Paste your Adsterra Code snippets here)
  adsterra: {
    // Top 728x90 Banner (Adsterra key: a32ecf32dad36eb94fff29440474d54b)
    topBannerHtml: `
      <div class="adsterra-banner-wrapper" style="display:flex; justify-content:center; align-items:center; width:100%; min-height:90px; overflow-x:auto;">
        <script type="text/javascript">
          atOptions = {
            'key' : 'a32ecf32dad36eb94fff29440474d54b',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highrevenueformat.com/a32ecf32dad36eb94fff29440474d54b/invoke.js"></script>
      </div>
    `,
    // Result In-Feed 300x250 or 728x90 Banner
    resultBannerHtml: `
      <div class="adsterra-banner-wrapper" style="display:flex; justify-content:center; align-items:center; width:100%; min-height:90px; overflow-x:auto;">
        <script type="text/javascript">
          atOptions = {
            'key' : 'a32ecf32dad36eb94fff29440474d54b',
            'format' : 'iframe',
            'height' : 90,
            'width' : 728,
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highrevenueformat.com/a32ecf32dad36eb94fff29440474d54b/invoke.js"></script>
      </div>
    `,
    // Floating Bottom Banner / Social Bar Script
    floatingBannerHtml: '',
    // Direct SmartLink or Popunder Script (Optional)
    popunderScriptUrl: ''
  },

  // 2. Monetag Configuration (Paste your Monetag Code snippets here)
  monetag: {
    // 1080p Download Ad Gate Modal HTML / In-Page Push / Interstitial
    modalAdHtml: '',
    // Monetag Direct SmartLink URL (Triggers when user clicks download)
    directLinkUrl: '',
    // Monetag Vignette / Interstitial Script Tag
    interstitialScriptTag: ''
  },

  // 3. Google AdSense Configuration
  googleAdSense: {
    publisherId: 'ca-pub-XXXXXXXXXXXXXXXX',
    slots: {
      topBanner: '1234567890',
      resultBanner: '2345678901',
      floatingBottom: '3456789012',
      adGateModal: '4567890123'
    }
  },

  // 4. High-Converting Affiliate Sponsors (Fallback when custom ad codes are empty)
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
 * Render Top Leaderboard Banner (728x90 / responsive)
 */
export function renderTopBanner(containerEl, lang = 'ko') {
  if (!containerEl) return;

  const provider = getBannerProvider();

  if (provider === 'adsense') {
    renderAdSenseBlock(containerEl, ADS_CONFIG.googleAdSense.slots.topBanner, '728x90');
    return;
  }

  if (provider === 'adsterra' && ADS_CONFIG.adsterra.topBannerHtml) {
    containerEl.className = 'ad-banner-slot top-banner';
    setInnerHTMLWithScripts(containerEl, ADS_CONFIG.adsterra.topBannerHtml);
    return;
  }

  // Fallback to high-converting localized affiliate banner
  const campaign = getNextAffiliateCampaign();
  const title = campaign.title[lang] || campaign.title['en'] || campaign.title['ko'];
  const cta = campaign.ctaText[lang] || campaign.ctaText['en'] || campaign.ctaText['ko'];

  containerEl.innerHTML = `
    <div class="ad-placeholder top-leaderboard">
      <span class="ad-tag">SPONSORED</span>
      <div class="ad-content-box">
        <div class="ad-brand-group">
          <span class="ad-logo-icon">${campaign.logoEmoji}</span>
          <span class="ad-brand">${campaign.brand}</span>
          <span class="ad-pill-highlight">${campaign.discountBadge}</span>
        </div>
        <span class="ad-headline">${title}</span>
        <a href="${campaign.ctaUrl}" target="_blank" rel="noopener noreferrer" class="btn-ad-cta" data-campaign-id="${campaign.id}">
          ${cta} ↗
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

  if (provider === 'adsterra' && ADS_CONFIG.adsterra.resultBannerHtml) {
    setInnerHTMLWithScripts(containerEl, ADS_CONFIG.adsterra.resultBannerHtml);
    return;
  }

  const campaign = getNextAffiliateCampaign();
  const title = campaign.title[lang] || campaign.title['en'] || campaign.title['ko'];
  const desc = campaign.desc[lang] || campaign.desc['en'] || campaign.desc['ko'];
  const cta = campaign.ctaText[lang] || campaign.ctaText['en'] || campaign.ctaText['ko'];

  containerEl.innerHTML = `
    <div class="ad-result-card">
      <div class="ad-result-header">
        <div class="ad-sponsor-badge">
          <span class="ad-tag-subtle">SPONSORED</span>
          <span class="ad-partner-name">${campaign.logoEmoji} ${campaign.brand}</span>
        </div>
        <span class="ad-discount-chip">${campaign.discountBadge}</span>
      </div>
      <div class="ad-result-body">
        <div class="ad-result-text">
          <h4 class="ad-result-title">${title}</h4>
          <p class="ad-result-desc">${desc}</p>
        </div>
        <a href="${campaign.ctaUrl}" target="_blank" rel="noopener noreferrer" class="btn-result-cta" data-campaign-id="${campaign.id}">
          ${cta}
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
    setInnerHTMLWithScripts(containerEl, ADS_CONFIG.monetag.modalAdHtml);
    return;
  }

  const campaign = getRandomAffiliateCampaign();
  const title = campaign.title[lang] || campaign.title['en'] || campaign.title['ko'];
  const desc = campaign.desc[lang] || campaign.desc['en'] || campaign.desc['ko'];
  const cta = campaign.ctaText[lang] || campaign.ctaText['en'] || campaign.ctaText['ko'];

  containerEl.innerHTML = `
    <div class="ad-inner-banner">
      <div class="ad-modal-sponsor-row">
        <div class="ad-sponsor-pill">${campaign.categoryBadge}</div>
        <span class="ad-modal-discount-pill">${campaign.discountBadge}</span>
      </div>
      <div class="ad-sponsor-content">
        <div class="ad-sponsor-logo">${campaign.logoEmoji} ${campaign.brand}</div>
        <h4>${title}</h4>
        <p>${desc}</p>
        <a href="${campaign.ctaUrl}" target="_blank" rel="noopener noreferrer" class="btn-ad-modal-cta" data-campaign-id="${campaign.id}">
          ${cta} ↗
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

  if (provider === 'adsterra' && ADS_CONFIG.adsterra.floatingBannerHtml) {
    setInnerHTMLWithScripts(containerEl, ADS_CONFIG.adsterra.floatingBannerHtml);
    return;
  }

  const campaign = getRandomAffiliateCampaign();
  const title = campaign.title[lang] || campaign.title['en'] || campaign.title['ko'];
  const cta = campaign.ctaText[lang] || campaign.ctaText['en'] || campaign.ctaText['ko'];

  containerEl.innerHTML = `
    <div class="floating-ad-wrapper">
      <div class="floating-ad-content">
        <div class="floating-ad-left">
          <span class="floating-ad-tag">AD</span>
          <span class="floating-ad-icon">${campaign.logoEmoji}</span>
          <div class="floating-ad-text">
            <span class="floating-ad-brand">${campaign.brand}</span>
            <span class="floating-ad-title">${title}</span>
          </div>
        </div>
        <div class="floating-ad-actions">
          <a href="${campaign.ctaUrl}" target="_blank" rel="noopener noreferrer" class="btn-floating-cta">
            ${cta}
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

function ensureAdSenseScriptLoaded() {
  const pubId = ADS_CONFIG.googleAdSense.publisherId;
  if (!pubId || pubId.includes('XXXXX')) return;

  const scriptId = 'google-adsense-script';
  if (!document.getElementById(scriptId)) {
    const script = document.createElement('script');
    script.id = scriptId;
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
  }
}

function renderAdSenseBlock(container, slotId, format = 'auto') {
  ensureAdSenseScriptLoaded();

  container.innerHTML = `
    <div class="adsense-container" style="text-align:center; overflow:hidden; min-height:90px; width:100%; display:flex; justify-content:center;">
      <ins class="adsbygoogle"
           style="display:block; width:100%;"
           data-ad-client="${ADS_CONFIG.googleAdSense.publisherId}"
           data-ad-slot="${slotId}"
           data-ad-format="${format}"
           data-full-width-responsive="true"></ins>
    </div>
  `;
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    console.warn('AdSense script error:', e);
  }
}
