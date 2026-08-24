const https = require('https');

const data = JSON.stringify({
  emailOrUsername: "auraplay2026@gmail.com",
  password: "AuraBetAdmin2026!"
});

const req = https.request({
  hostname: "auraplay-route-bluesignal5-dev.apps.rm2.thpm.p1.openshiftapps.com",
  port: 443,
  path: "/api/auth/login",
  method: "POST",
  rejectUnauthorized: false,
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`HTTP Status: ${res.statusCode}`);
    console.log(`Response Body: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`Request Error: ${e.message}`);
});

req.write(data);
req.end();
