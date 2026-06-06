const https = require('https');

const urls = {
  'DancingScript[wght].ttf': 'https://github.com/google/fonts/raw/main/ofl/dancingscript/DancingScript%5Bwght%5D.ttf',
  'GreatVibes-Regular.ttf': 'https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf',
  'Satisfy-Regular.ttf': 'https://github.com/google/fonts/raw/main/apache/satisfy/Satisfy-Regular.ttf',
  'Parisienne-Regular.ttf': 'https://github.com/google/fonts/raw/main/ofl/parisienne/Parisienne-Regular.ttf',
  'Yellowtail-Regular.ttf': 'https://github.com/google/fonts/raw/main/apache/yellowtail/Yellowtail-Regular.ttf',
  'Cookie-Regular.ttf': 'https://github.com/google/fonts/raw/main/ofl/cookie/Cookie-Regular.ttf',
  'Playball-Regular.ttf': 'https://github.com/google/fonts/raw/main/ofl/playball/Playball-Regular.ttf'
};

Object.entries(urls).forEach(([name, url]) => {
  https.get(url, (res) => {
    console.log(`${name}: Status ${res.statusCode}`);
  }).on('error', (e) => {
    console.error(`${name}: Error ${e.message}`);
  });
});
