const https = require('https');
const querystring = require('querystring');

const apiKey = '6310eb90cbd59dc97d5923266dc71018';
const certId = '604e8b1068f2139b8e7c1c4ab9ca7e40';

const postData = querystring.stringify({
  validation_method: 'HTTP_CSR_HASH'
});

const req = https.request({
  hostname: 'api.zerossl.com',
  path: `/certificates/${certId}/challenges?access_key=${apiKey}`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('ZeroSSL Verify Response:', body));
});

req.write(postData);
req.end();
