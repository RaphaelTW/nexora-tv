import { readFile, writeFile } from 'node:fs/promises';

const path = new URL('../dist/index.html', import.meta.url);
let html = await readFile(path, 'utf8');
const head = `<meta name="theme-color" content="#00e887" />
    <meta name="description" content="Nexora TV — TV global ao vivo por país para Android, Android TV e Web." />
    <meta name="application-name" content="Nexora TV" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta property="og:title" content="Nexora TV" />
    <meta property="og:description" content="TV global ao vivo por país." />
    <meta property="og:type" content="website" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="icon" href="/pwa-icon.svg" type="image/svg+xml" />`;
const register = `<script>if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}</script>`;
html = html.replace('</head>', `${head}\n  </head>`).replace('</body>', `${register}\n  </body>`);
await writeFile(path, html);
