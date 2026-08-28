import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { translations } from './public/i18n.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('Testing Zero-Traffic, Ad Gate, i18n & Vercel Config...');

  // 1. Check supported languages and ad keys
  const langs = ['ko', 'en', 'ja', 'zh', 'es'];
  const requiredKeys = ['ad_gate_title', 'ad_gate_desc', 'ad_vpn_title', 'btn_download_now'];
  for (const lang of langs) {
    if (!translations[lang]) {
      throw new Error(`Missing translations for ${lang}`);
    }
    for (const key of requiredKeys) {
      if (!translations[lang][key]) {
        throw new Error(`Missing required translation key: ${key} in ${lang}`);
      }
    }
    console.log(`✅ Language ${lang} dictionary verified with ${Object.keys(translations[lang]).length} keys.`);
  }

  // 2. Check HTML structure for Ad Gate & Banners
  const html = fs.readFileSync(path.join(__dirname, 'public', 'index.html'), 'utf8');
  if (!html.includes('id="adGateModal"') || !html.includes('id="countdownNumber"') || !html.includes('class="ad-banner-slot')) {
    throw new Error('Ad Gate modal or banner slots missing in index.html');
  }
  console.log('✅ HTML markup for Ad Gate Modal & Sponsor Banners validated.');

  // 3. Check vercel.json
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, 'vercel.json'), 'utf8'));
  if (!vercelConfig.version) {
    throw new Error('Invalid vercel.json configuration');
  }
  console.log('✅ Vercel deployment configuration validated.');

  console.log('🎉 All tests passed successfully!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
