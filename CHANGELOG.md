# Changelog

## 1.1.1 — 2026-08-23

- Corrige a ocultação de canais também ao restaurar playlists do cache.
- Valida APKs com SHA-256 incremental sem carregar o arquivo inteiro na memória.
- Adiciona fila persistida, canal anterior/próximo e reconexão automática no player.
- Implementa busca global pelo índice oficial IPTV-org e pesquisa por voz.
- Padroniza editores com EditorConfig e fortalece o workflow de releases.

## 1.1.0 — 2026-08-22

- Adiciona player resiliente, retry, fontes alternativas e ocultação temporária de canais indisponíveis.
- Implementa download interno de atualizações, progresso, validação SHA-256 e instalação Android.
- Adiciona PWA, tela offline, metadados web, atalhos de teclado e rotas amigáveis.
- Virtualiza países, canais, favoritos e filtros para melhorar desempenho no mobile e Android TV.
- Melhora foco por controle remoto, fullscreen, PiP, cache e diagnósticos locais sem dados pessoais.
- Adiciona testes automatizados e workflow de release com APKs e hashes SHA-256.

## 1.0.2 — 2026-08-22

- Corrige a responsividade do painel de país e bandeira em telas mobile.
- Melhora o desempenho do scroll em catálogos grandes com renderização virtualizada.
- Adiciona verificação automática e manual de atualizações pelas GitHub Releases.
- Exibe a versão atual e os dados do desenvolvedor em Ajustes.

## 1.0.1 — 2026-08-21

- Corrige a responsividade da tela inicial em celulares.
- Respeita as áreas seguras do Android e amplia os alvos de toque.
- Centraliza o player Web conforme a largura e a altura disponíveis.
- Atualiza TypeScript e React Native Web para as versões do Expo SDK 57.
- Padroniza os comandos de build mobile e Android TV com o EAS CLI oficial.

## 1.0.0 — 2026-08-21

- Catálogo mundial de países via IPTV-org.
- Playlists por país carregadas sob demanda.
- Cache local com atualização em segundo plano.
- Player Android/Android TV via `expo-video`.
- Player Web HLS via `hls.js`.
- Favoritos, histórico e países fixados.
- Interface OLED preto absoluto com bordas roxo→verde.
- Loaders RGB animados.
- Navegação responsiva para celular, desktop e TV.
- Perfis EAS para APK/AAB mobile e Android TV.
