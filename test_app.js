import http from 'http';

function checkHttp(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      resolve(res.statusCode);
    }).on('error', reject);
  });
}

async function run() {
  console.log('Testing Web App & API Endpoints...');
  const status = await checkHttp('http://localhost:3000');
  console.log('HTTP status for http://localhost:3000:', status);
  if (status !== 200) {
    throw new Error(`Expected 200, got ${status}`);
  }
  console.log('✅ Server and web app are running successfully!');
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
