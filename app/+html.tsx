import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';

export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Nexora TV — TV global ao vivo por país para Android, Android TV e Web." />
        <meta name="application-name" content="Nexora TV" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta property="og:title" content="Nexora TV" />
        <meta property="og:description" content="TV global ao vivo por país." />
        <meta property="og:type" content="website" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/pwa-icon.svg" type="image/svg+xml" />
        <title>Nexora TV</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'html,body,#root{background:#000!important;min-height:100%;} *{box-sizing:border-box;} body{margin:0;}' }} />
      </head>
      <body>{children}<script dangerouslySetInnerHTML={{ __html: `if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));}` }} /></body>
    </html>
  );
}
