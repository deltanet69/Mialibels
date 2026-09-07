const https = require('node:https');
https.get('https://smart.miattaqwa15.sch.id/login', (res) => {
  let b = ''; res.on('data', d => b+=d); res.on('end', () => {
    const scripts = [...b.matchAll(/src=\"(\/_next\/static\/chunks\/[^\"]+)\"/g)].map(m => m[1]);
    console.log('Scripts:', scripts);
    if(scripts.length > 0) {
      https.get('https://smart.miattaqwa15.sch.id' + scripts[0], res2 => console.log('S1:', res2.statusCode));
      https.get('https://smart.miattaqwa15.sch.id' + scripts[1], res2 => console.log('S2:', res2.statusCode));
    }
  });
});
