import http from 'http';

function postJson(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const req = http.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(body) }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  console.log('Testing Edge and Error Handling...');
  // 1. Invalid URL test
  const invalidRes = await postJson('http://localhost:3000/api/info', { url: 'https://invalid-url.com' });
  console.log('Invalid URL response status:', invalidRes.status, invalidRes.body);
  if (invalidRes.status < 400 || !invalidRes.body.error) {
    throw new Error('Expected error status >= 400 with error message on invalid URL');
  }

  // 2. Empty URL test
  const emptyRes = await postJson('http://localhost:3000/api/info', { url: '' });
  console.log('Empty URL response status:', emptyRes.status, emptyRes.body);
  if (emptyRes.status < 400) {
    throw new Error('Expected error status >= 400 on empty URL');
  }

  console.log('✅ All edge cases and error handling validated successfully!');
}

run().catch((err) => {
  console.error('❌ Edge test failed:', err);
  process.exit(1);
});
