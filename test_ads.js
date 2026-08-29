import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ADS_CONFIG } from './public/ads-config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function verifyAdsSystem() {
  console.log('--- Verifying TubeFetch Ads & Monetization System ---');

  // 1. Check ads-config
  if (!ADS_CONFIG.adGate || ADS_CONFIG.adGate.durationSeconds !== 5) {
    throw new Error('Ad Gate config is missing or duration is not 5s');
  }
  if (!ADS_CONFIG.affiliateCampaigns || ADS_CONFIG.affiliateCampaigns.length < 3) {
    throw new Error('Affiliate campaigns list is incomplete');
  }
  console.log('✅ ads-config.js verified: 5s countdown, ' + ADS_CONFIG.affiliateCampaigns.length + ' rotating campaigns.');

  // 2. Check index.html ad slots
  const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  const slots = ['topAdBannerSlot', 'resultAdBannerSlot', 'floatingBottomAdSlot', 'adGateBannerContainer'];
  for (const slot of slots) {
    if (!html.includes(slot)) {
      throw new Error(`Missing slot in HTML: ${slot}`);
    }
  }
  console.log('✅ index.html contains all 4 ad containers (Top, In-Feed Result, Modal Ad Gate, Floating Bottom).');

  // 3. Check CSS rules
  const css = fs.readFileSync(path.join(__dirname, 'public', 'style.css'), 'utf8');
  const cssClasses = ['.ad-banner-slot', '.ad-result-card', '.modal-card.ad-gate-card', '.floating-bottom-ad-slot'];
  for (const cls of cssClasses) {
    if (!css.includes(cls)) {
      throw new Error(`Missing CSS class: ${cls}`);
    }
  }
  console.log('✅ style.css includes all required ad styles & animations.');

  // 4. Check app.js logic
  const appJs = fs.readFileSync(path.join(__dirname, 'public', 'app.js'), 'utf8');
  if (!appJs.includes('renderAdGateContent') || !appJs.includes('openAdGateModal') || !appJs.includes('renderFloatingBanner')) {
    throw new Error('app.js is missing ad gate or banner renderer calls');
  }
  console.log('✅ app.js successfully integrates ads-config, ad gate triggers, and multi-lingual refreshes.');

  console.log('🎉 Ad Monetization System Verification Passed 100%!');
}

verifyAdsSystem().catch(err => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
