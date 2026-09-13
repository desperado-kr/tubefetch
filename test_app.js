import http from 'http';
import app from './server.js';

function checkHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', reject);
  });
}

async function run() {
  console.log('Testing Web App & API Endpoints...');
  let server = null;
  let baseUrl = 'http://localhost:3000';
  try {
    await checkHttp(baseUrl);
  } catch (e) {
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  }

  try {
    const status = await checkHttp(baseUrl);
    console.log(`HTTP status for ${baseUrl}:`, status);
    if (status !== 200) {
      throw new Error(`Expected 200, got ${status}`);
    }
    console.log('✅ Server and web app are running successfully!');
  } finally {
    if (server) {
      await new Promise((res) => server.close(res));
    }
  }
}

await run();
