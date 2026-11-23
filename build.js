const esbuild = require('esbuild'); const fs = require('fs'); const crypto = require('crypto');
const r = esbuild.buildSync({ entryPoints: ['src/app.js'], bundle: true, minify: true, format: 'iife', write: false, target: 'es2020', legalComments: 'none' });
let js = r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = fs.readFileSync('src/index.html', 'utf8').replace('/*BUNDLE*/', () => js);
fs.mkdirSync('dist/icons', { recursive: true });
fs.writeFileSync('dist/index.html', html);
// installable web app: manifest, icons and a service worker whose cache name changes with every build
const manifest = fs.readFileSync('src/manifest.webmanifest', 'utf8');
const h = crypto.createHash('sha256').update(html).update(manifest);
fs.writeFileSync('dist/manifest.webmanifest', manifest);
for (const f of fs.readdirSync('src/icons').sort()) { h.update(fs.readFileSync('src/icons/' + f)); fs.copyFileSync('src/icons/' + f, 'dist/icons/' + f); }
const hash = h.digest('hex').slice(0, 10);
fs.writeFileSync('dist/sw.js', fs.readFileSync('src/sw.js', 'utf8').replace(/__BUILD__/g, hash));
console.log('built', (html.length / 1024).toFixed(0), 'KB · sw cache', hash);
