const https = require('https');
const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const apiKey = '6310eb90cbd59dc97d5923266dc71018';
const csr = fs.readFileSync(path.join(__dirname, '../auraplay.csr'), 'utf8');

const postData = querystring.stringify({
  certificate_domains: 'auraplay.duckdns.org',
  certificate_validity_days: '90',
  certificate_csr: csr,
  strict_domains: 1
});

const req = https.request({
  hostname: 'api.zerossl.com',
  path: `/certificates?access_key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('ZeroSSL Response:');
    try {
      const parsed = JSON.parse(body);
      console.log(JSON.stringify(parsed, null, 2));
      fs.writeFileSync(path.join(__dirname, '../zerossl_cert_info.json'), JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.write(postData);
req.end();
