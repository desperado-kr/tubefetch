import app from './server.js';
import http from 'http';

async function runSecurityTests() {
  console.log('=== Verifying Enterprise Security & Overload Protections ===');

  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Security test ephemeral server listening on port ${port}`);

  try {
    // -------------------------------------------------------------------------
    // 1. SSRF & Internal Network / Cloud Metadata Protection
    // -------------------------------------------------------------------------
    console.log('--- 1. Testing SSRF & Restricted Host Prevention ---');
    const ssrfTargets = [
      'http://localhost:3000',
      'http://127.0.0.1:8080',
      'http://169.254.169.254/latest/meta-data',
      'http://instance-data/latest/meta-data',
      'http://metadata.google.internal/computeMetadata/v1/',
      'http://10.0.0.1/admin',
      'http://192.168.1.1/secret',
      'http://172.16.0.1/',
      'http://0.0.0.0/',
      'http://0x7f000001/',
      'http://2130706433/',
      'http://database:5432/',
      'http://redis/'
    ];

    for (const target of ssrfTargets) {
      const res = await fetch(`${baseUrl}/api/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target })
      });
      if (res.status !== 400) {
        throw new Error(`SSRF vulnerability detected: ${target} returned HTTP ${res.status} instead of 400!`);
      }
    }
    console.log(`✅ All ${ssrfTargets.length} SSRF attack payloads rejected with HTTP 400!`);

    // -------------------------------------------------------------------------
    // 2. HTTP Security Headers Hardening
    // -------------------------------------------------------------------------
    console.log('--- 2. Testing HTTP Security Headers ---');
    const healthRes = await fetch(`${baseUrl}/api/health`);

    if (healthRes.headers.get('x-powered-by')) {
      throw new Error('x-powered-by header was leaked!');
    }
    if (healthRes.headers.get('x-content-type-options') !== 'nosniff') {
      throw new Error('Missing X-Content-Type-Options: nosniff');
    }
    if (healthRes.headers.get('x-frame-options') !== 'SAMEORIGIN') {
      throw new Error('Missing X-Frame-Options: SAMEORIGIN');
    }
    if (!healthRes.headers.get('referrer-policy')) {
      throw new Error('Missing Referrer-Policy header');
    }
    console.log('✅ Security headers verified (x-powered-by hidden, nosniff, SAMEORIGIN, strict referrer)!');

    // -------------------------------------------------------------------------
    // 3. IP Rate Limiting (Anti-DDoS / Abuse Prevention)
    // -------------------------------------------------------------------------
    console.log('--- 3. Testing IP Rate Limiting ---');
    let hit429 = false;
    for (let i = 0; i < 35; i++) {
      const rateTestRes = await fetch(`${baseUrl}/api/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-test-ratelimit': 'true'
        },
        body: JSON.stringify({ url: '' })
      });

      if (rateTestRes.status === 429) {
        hit429 = true;
        const retryAfter = rateTestRes.headers.get('retry-after');
        const limit = rateTestRes.headers.get('ratelimit-limit');
        if (!retryAfter || !limit) {
          throw new Error('429 response missing RateLimit headers');
        }
        console.log(`✅ Rate limit successfully triggered on request #${i + 1} with HTTP 429 and Retry-After: ${retryAfter}s.`);
        break;
      }
    }

    if (!hit429) {
      throw new Error('Rate limit was not triggered after 35 rapid requests');
    }

    // -------------------------------------------------------------------------
    // 4. Large JSON Body DoS Protection
    // -------------------------------------------------------------------------
    console.log('--- 4. Testing Large Payload Protection ---');
    const hugePayload = 'A'.repeat(128 * 1024); // 128KB exceeds 64KB limit
    const largeRes = await fetch(`${baseUrl}/api/info`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: hugePayload })
    });

    if (largeRes.status !== 413) {
      throw new Error(`Large payload was not rejected with 413 Payload Too Large (got ${largeRes.status})`);
    }
    console.log('✅ 128KB payload successfully rejected with HTTP 413 Payload Too Large!');

    // -------------------------------------------------------------------------
    // 5. Huge Duration Overload Protection
    // -------------------------------------------------------------------------
    console.log('--- 5. Testing Huge Duration Overload Protection ---');
    const hugeDurationRes = await fetch(`${baseUrl}/api/download?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&duration=12000`);
    if (hugeDurationRes.status !== 400) {
      throw new Error(`Duration > 3 hours was not rejected (got ${hugeDurationRes.status})`);
    }
    console.log('✅ Video exceeding 3 hours rejected with HTTP 400 (Server overload protected)!');

    console.log('🎉 ALL SECURITY & OVERLOAD PROTECTION TESTS PASSED 100%!');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

runSecurityTests().catch((err) => {
  console.error('❌ Security verification failed:', err);
  process.exit(1);
});
