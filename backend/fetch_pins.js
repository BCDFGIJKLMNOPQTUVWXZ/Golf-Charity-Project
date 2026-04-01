import https from 'https';

const urls = [
  'https://pin.it/5blRhyo1T',
  'https://pin.it/731zUKMG1',
  'https://pin.it/dkt9uAbFF',
  'https://pin.it/6hu938bsY',
  'https://pin.it/3h0Gvsp51',
  'https://pin.it/2Vb5ounnc',
  'https://pin.it/1UCyqQVEd'
];

async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchHtml(res.headers.location)); // Handle redirect
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  for (const url of urls) {
    try {
      const html = await fetchHtml(url);
      const match = html.match(/<meta property="og:image" name="og:image" content="([^"]+)"/);
      const match2 = html.match(/<meta property="og:image" content="([^"]+)"/);
      console.log(`${url} -> ${match ? match[1] : (match2 ? match2[1] : 'Not found')}`);
    } catch (e) {
      console.log(`${url} -> Error: ${e.message}`);
    }
  }
}

run();
