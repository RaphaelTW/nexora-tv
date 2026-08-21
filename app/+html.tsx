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
        <title>Nexora TV</title>
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: 'html,body,#root{background:#000!important;min-height:100%;} *{box-sizing:border-box;} body{margin:0;}' }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
