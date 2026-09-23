# Changelog

## 1.1.4 — 2026-09-23

- Corrige espaços vazios no player mobile com altura explícita de vídeo e fontes em uma faixa horizontal.
- Alterna fontes ao detectar erro ou 20 segundos sem vídeo, sem repetir indefinidamente links indisponíveis.
- Atualiza e salva os catálogos no aparelho a cada 15 minutos de uso do player e ao retornar ao app.
- Lembra a última fonte que reproduziu vídeo e consulta links atualizados quando as alternativas falham.
- Adiciona TDTChannels por correspondência única de canal, junto de IPTV-org e Free-TV.
- Corrige a seleção do APK de celular e Android TV no atualizador interno.

## 1.1.3 - 2026-09-15

- Integra Free-TV ao catalogo de fontes publicas.
- Permite selecionar fontes e alterna automaticamente ao ocorrer erro.
- Preserva os cabecalhos de cada fonte e atualiza o catalogo em cache.

## 1.1.2 — 2026-08-23

- Baixa e valida novas atualizações automaticamente dentro do aplicativo no Android.
- Exibe o modal personalizado do Nexora durante o download e a verificação.
- Solicita confirmação apenas quando o APK estiver pronto para ser instalado.
- Compacta o player no Mobile, Android TV e Web, mantendo ações e descrição logo abaixo do vídeo sem rolagem.

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
