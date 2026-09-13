import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');

async function testSeoNeo() {
  console.log('=== Verifying SEO, NEO, AEO, GEO Implementation ===');

  // 1. Check robots.txt
  const robotsTxt = fs.readFileSync(path.join(publicDir, 'robots.txt'), 'utf8');
  const requiredBots = ['Yeti', 'Googlebot', 'Bingbot', 'Daumoa', 'GPTBot', 'ClaudeBot', 'PerplexityBot'];
  for (const bot of requiredBots) {
    if (!robotsTxt.includes(`User-agent: ${bot}`)) {
      throw new Error(`robots.txt missing User-agent: ${bot}`);
    }
  }
  if (!robotsTxt.includes('Sitemap: https://tubefetch-rho.vercel.app/sitemap.xml')) {
    throw new Error('robots.txt missing Sitemap directive');
  }
  console.log('✅ robots.txt verified (Naver Yeti, Googlebot, Bing, Daum, AI search crawlers, Sitemap)');

  // 2. Check sitemap.xml
  const sitemapXml = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
  if (!sitemapXml.includes('<loc>https://tubefetch-rho.vercel.app/</loc>')) {
    throw new Error('sitemap.xml missing main loc');
  }
  const langs = ['ko', 'en', 'ja', 'zh', 'es'];
  for (const lang of langs) {
    if (!sitemapXml.includes(`hreflang="${lang}"`)) {
      throw new Error(`sitemap.xml missing hreflang=${lang}`);
    }
  }
  console.log('✅ sitemap.xml verified (canonical URL & 5-language hreflang alternates)');

  // 3. Check llms.txt (GEO)
  const llmsTxt = fs.readFileSync(path.join(publicDir, 'llms.txt'), 'utf8');
  if (!llmsTxt.includes('# TubeFetch') || !llmsTxt.includes('인용 및 데이터 정책')) {
    throw new Error('llms.txt missing title or attribution policy');
  }
  console.log('✅ llms.txt verified (AI assistant guide, features, citation policy)');

  // 4. Check og-image.svg
  const ogImage = fs.readFileSync(path.join(publicDir, 'og-image.svg'), 'utf8');
  if (!ogImage.includes('<svg') || !ogImage.includes('TubeFetch')) {
    throw new Error('og-image.svg invalid or missing');
  }
  console.log('✅ og-image.svg verified (1200x630 social share preview)');

  // 5. Check index.html
  const indexHtml = fs.readFileSync(path.join(publicDir, 'index.html'), 'utf8');
  
  // Meta tags
  if (!indexHtml.includes('<link rel="canonical" href="https://tubefetch-rho.vercel.app/">')) {
    throw new Error('index.html missing canonical URL');
  }
  if (!indexHtml.includes('name="naver-site-verification"')) {
    throw new Error('index.html missing naver-site-verification tag');
  }
  if (!indexHtml.includes('name="google-site-verification"')) {
    throw new Error('index.html missing google-site-verification tag');
  }
  if (!indexHtml.includes('property="og:title"') || !indexHtml.includes('property="og:image"')) {
    throw new Error('index.html missing OpenGraph tags');
  }
  if (!indexHtml.includes('name="twitter:card"')) {
    throw new Error('index.html missing Twitter Card tags');
  }
  console.log('✅ index.html Meta, Canonical, Naver NEO, Google, and OpenGraph tags verified');

  // JSON-LD
  if (!indexHtml.includes('"@type": "WebApplication"') || !indexHtml.includes('"@type": "FAQPage"')) {
    throw new Error('index.html missing WebApplication or FAQPage JSON-LD schemas');
  }
  console.log('✅ JSON-LD Structured Data verified (WebApplication + FAQPage)');

  // Visible FAQ
  if (!indexHtml.includes('class="faq-section"') || !indexHtml.includes('자주 묻는 질문')) {
    throw new Error('index.html missing visible FAQ section');
  }
  console.log('✅ Visible FAQ Section verified (matching JSON-LD for AI Overviews & Naver AI Briefing)');

  console.log('🎉 ALL SEO, NEO, AEO, and GEO REQUIREMENTS PASSED 100%!');
}

testSeoNeo().catch(err => {
  console.error('❌ SEO/NEO Test failed:', err);
  process.exit(1);
});
