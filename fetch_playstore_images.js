const https = require('https');

const apps = [
  { id: "1v1", package: "com.justbuild.lol" },
  { id: "qwop", package: "com.noodlecake.qwop" },
  { id: "dogeminer", package: "se.rkn.dogeminer2" }, // Guessing package name
];

async function fetchPlayImage(pkg) {
  return new Promise((resolve) => {
    https.get(`https://play.google.com/store/apps/details?id=${pkg}&hl=en_US&gl=US`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/<meta property="og:image" content="([^"]+)"/);
        resolve(match ? match[1] : null);
      });
    }).on('error', () => resolve(null));
  });
}

async function run() {
  for (const app of apps) {
    const url = await fetchPlayImage(app.package);
    console.log(`{ id: "${app.id}", image: "${url}" },`);
  }
}

run();
