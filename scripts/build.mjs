// Builds the deployable site into dist/ (Cloudflare Pages: build command
// `npm run build`, build output directory `dist`).
//
// Source pages keep using the Tailwind Play CDN with their own inline
// `tailwind.config = {...}`, so editing and previewing a page works exactly as
// before. For production, this script:
//   1. copies only the public site files into dist/ (not the .sql/.py/notes
//      that also live in the repo),
//   2. compiles each page's Tailwind CSS ahead of time from that page's own
//      inline config (same Tailwind + plugin versions the CDN serves), and
//   3. in dist/ only, swaps the CDN <script> + config for a <link> to the
//      compiled, content-hashed CSS file.
// Internal pages (admin, cta-playground) are copied untouched and keep the CDN.

import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const TAILWIND_BIN = path.join(ROOT, 'node_modules', '.bin', 'tailwindcss');

// Public files and folders, relative to the repo root. Everything else in the
// repo (SQL migrations, one-off scripts, notes) stays out of the website.
const PUBLIC_DIRS = ['image', 'js'];
const PUBLIC_FILES = ['favicon.ico', 'robots.txt', '_headers'];
const KEEP_CDN = new Set(['admin.html', 'cta-playground.html']);

// Google Analytics 4 (property "myifai.com", stream "IFAI Website"). Added in
// dist/ to every page except internal ones (admin, playground) and the 404
// page, so admin visits don't count as traffic. It goes at the end of <head>
// and loads async, so LCP preloads and the CSS start first.
const GA_MEASUREMENT_ID = 'G-FZQJD0VS2F';
const NO_ANALYTICS = new Set(['admin.html', 'cta-playground.html', '404.html']);
const GA_SNIPPET = `<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${GA_MEASUREMENT_ID}');
</script>
`;

// Every page and script is scanned for class names, so a class used anywhere
// (including ones only assembled in client JS or Functions) gets generated.
const CONTENT = [
  path.join(ROOT, '*.html'),
  path.join(ROOT, 'js', '**', '*.js'),
  path.join(ROOT, 'functions', '**', '*.js')
];

const PLUGIN_MODULES = {
  forms: '@tailwindcss/forms',
  'container-queries': '@tailwindcss/container-queries'
};

const CDN_SCRIPT = /[ \t]*<script src="https:\/\/cdn\.tailwindcss\.com\/?(?:\?plugins=([^"]*))?"><\/script>[ \t]*\n?/;
const CONFIG_SCRIPT = /[ \t]*<script(?: id="tailwind-config")?>\s*tailwind\.config\s*=\s*(\{[\s\S]*?\})\s*;?\s*<\/script>[ \t]*\n?/;

function copyRecursive(src, dest) {
  fs.cpSync(src, dest, { recursive: true, filter: (p) => !p.endsWith('.DS_Store') });
}

function compileCss(configSource, plugins, cacheDir) {
  const configFile = path.join(cacheDir, `tailwind-${createHash('sha1').update(configSource + plugins).digest('hex').slice(0, 10)}.config.cjs`);
  const pluginRequires = plugins
    .map((name) => {
      if (!PLUGIN_MODULES[name]) throw new Error(`Unknown Tailwind CDN plugin "${name}"`);
      return `require(${JSON.stringify(require_resolve(PLUGIN_MODULES[name]))})`;
    })
    .join(', ');
  fs.writeFileSync(configFile, `module.exports = {
  ...(${configSource}),
  content: ${JSON.stringify(CONTENT)},
  plugins: [${pluginRequires}]
};
`);
  const inputFile = path.join(cacheDir, 'input.css');
  fs.writeFileSync(inputFile, '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
  const outFile = path.join(cacheDir, path.basename(configFile, '.config.cjs') + '.css');
  execFileSync(TAILWIND_BIN, ['-c', configFile, '-i', inputFile, '-o', outFile, '--minify'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  return fs.readFileSync(outFile, 'utf8');
}

function require_resolve(mod) {
  return path.join(ROOT, 'node_modules', mod);
}

function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(path.join(DIST, 'css'), { recursive: true });
  const cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ifai-build-'));

  for (const dir of PUBLIC_DIRS) copyRecursive(path.join(ROOT, dir), path.join(DIST, dir));
  for (const file of PUBLIC_FILES) fs.copyFileSync(path.join(ROOT, file), path.join(DIST, file));

  const cssByConfig = new Map(); // same config + plugins -> one shared CSS file
  const pages = fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')).sort();

  for (const page of pages) {
    let html = fs.readFileSync(path.join(ROOT, page), 'utf8');
    const cdn = html.match(CDN_SCRIPT);

    if (cdn && !KEEP_CDN.has(page)) {
      const config = html.match(CONFIG_SCRIPT);
      if (!config) throw new Error(`${page}: Tailwind CDN found but no inline tailwind.config`);
      const plugins = (cdn[1] || '').split(',').map((p) => p.trim()).filter(Boolean);
      const key = config[1] + '|' + plugins.join(',');

      if (!cssByConfig.has(key)) {
        const css = compileCss(config[1], plugins, cacheDir);
        const name = `tw-${createHash('sha1').update(css).digest('hex').slice(0, 10)}.css`;
        fs.writeFileSync(path.join(DIST, 'css', name), css);
        cssByConfig.set(key, name);
      }

      // The CDN appends its generated <style> to the end of <head>, so the
      // compiled stylesheet goes there too to keep the same cascade order
      // relative to each page's own <style> blocks.
      html = html.replace(CDN_SCRIPT, '').replace(CONFIG_SCRIPT, '');
      if (!html.includes('</head>')) throw new Error(`${page}: no </head>`);
      html = html.replace('</head>', `<link rel="stylesheet" href="/css/${cssByConfig.get(key)}"/>\n</head>`);
      console.log(`${page} -> /css/${cssByConfig.get(key)}`);
    } else {
      console.log(`${page} (copied as is)`);
    }

    if (!NO_ANALYTICS.has(page)) html = html.replace('</head>', GA_SNIPPET + '</head>');

    fs.writeFileSync(path.join(DIST, page), html);
  }

  fs.rmSync(cacheDir, { recursive: true, force: true });
}

main();
