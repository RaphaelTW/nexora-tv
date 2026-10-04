<p align="center">
  <img src="./assets/readme-banner.svg" width="100%" alt="Nexora TV" />
</p>

<p align="center">
  <a href="#-comece-em-3-comandos"><img src="https://img.shields.io/badge/Expo-57-000000?style=for-the-badge&logo=expo&logoColor=white" /></a>
  <a href="#-android-tv"><img src="https://img.shields.io/badge/Android%20TV-ready-00E676?style=for-the-badge&logo=android&logoColor=000" /></a>
  <a href="#-web"><img src="https://img.shields.io/badge/Web-HLS.js-7C3AED?style=for-the-badge&logo=googlechrome&logoColor=white" /></a>
  <a href="https://github.com/iptv-org/iptv"><img src="https://img.shields.io/badge/Data-IPTV--ORG-A855F7?style=for-the-badge&logo=github&logoColor=white" /></a>
  <img src="https://img.shields.io/badge/Theme-OLED%20%23000000-000000?style=for-the-badge" />
</p>

<h1 align="center">NEXORA TV</h1>
<p align="center"><strong>O mundo inteiro, um sinal de cada vez.</strong></p>
<p align="center">Android • Android TV • Web • sem lista fixa de países • sem chave privada</p>

---

## ✦ O que é

**Nexora TV** é uma interface universal para navegar por transmissões públicas organizadas pelo ecossistema [IPTV-org](https://github.com/iptv-org/iptv). O app busca a lista mundial de países na API oficial e carrega a playlist de cada país somente quando ela é aberta.

> **Descrição curta para GitHub**  
> TV global ao vivo por país para Android, Android TV e Web, com Expo, player HLS, cache local e catálogo dinâmico via IPTV-org.

## ⚡ Comece em 3 comandos

```bash
npm install
npm run start
npm run web
```

> Expo SDK 57 exige **Node.js 22.13.x ou superior compatível**.

<details>
<summary><strong>📱 Rodar no Android celular</strong></summary>

```bash
npm run prebuild:mobile
npm run android:mobile
```

Ou, depois do prebuild:

```bash
npx expo run:android
```
</details>

<details>
<summary><strong>📺 Rodar no Android TV</strong></summary>

1. Instale uma imagem Android TV API 31+ no Android Studio.
2. Inicie o emulador Android TV.
3. Execute:

```bash
npm run android:tv
```

No PowerShell:

```powershell
.\scripts\run-tv-local.ps1
```

O mesmo código usa `react-native-tvos`. O plugin de TV é ativado por `EXPO_TV=1` e o prebuild é sempre feito com `--clean` ao trocar entre mobile e TV.
</details>

<details>
<summary><strong>🌐 Rodar no navegador</strong></summary>

```bash
npm run web
```

Build estático:

```bash
npm run build:web
```

A pasta final é `dist/`. O projeto já inclui `netlify.toml`.
</details>

---

## 🌍 Catálogo mundial e atualização

```mermaid
flowchart LR
  A[Abre o app] --> B[Cache local]
  A --> C[countries.json]
  C --> D[Todos os países]
  D --> E[Usuário toca numa bandeira]
  E --> F[countries/xx.m3u]
  F --> G[Parser M3U]
  G --> H[Cards de canais]
  H --> I[Player]
```

Fontes usadas:

```text
https://iptv-org.github.io/api/countries.json
https://iptv-org.github.io/api/categories.json
https://iptv-org.github.io/iptv/countries/{codigo}.m3u
```

O catálogo de países é carregado do cache imediatamente e atualizado em segundo plano **a cada abertura do app**. A playlist de um país segue o mesmo modelo: cache primeiro, rede logo depois.

## 🎨 Design system

| Elemento | Regra |
|---|---|
| Fundo | `#000000` OLED absoluto |
| Superfícies | `#050505` / `#0D0D0D` |
| Borda | gradiente `#7C3AED → #A855F7 → #00E676` |
| Loading | RGB animado |
| Foco TV | escala + borda neon |
| Navegação | bottom bar no mobile; sidebar em TV/desktop |
| Player | moldura neon + preto absoluto |

<p align="center">
  <img src="./assets/ui-concept.svg" width="92%" alt="Conceito da interface Nexora TV" />
</p>

## 📺 Android TV

O projeto usa a estratégia oficial do Expo para TV:

- `react-native` aponta para `react-native-tvos@0.86-stable`;
- `@react-native-tvos/config-tv` prepara o projeto nativo;
- `EXPO_TV=1` ativa launcher/banner de TV;
- cards são `focusable` e possuem estado visual para D-pad;
- a UI troca automaticamente para sidebar em TV.

### APK de Android TV

```bash
npm run build:apk:tv
```

ou:

```powershell
.\scripts\build-tv-apk.ps1
```

## 📱 APK Android

```bash
npm run build:apk:mobile
```

ou:

```powershell
.\scripts\build-mobile-apk.ps1
```

Os perfis `preview-*` do `eas.json` geram **APK instalável**. Os perfis `production-*` geram **AAB** para loja.

### Primeiro build com EAS

Na primeira vez, vincule o projeto à sua conta Expo/EAS:

```bash
npx eas login
npx eas build:configure
```

Depois use normalmente `npm run build:apk:mobile` ou `npm run build:apk:tv`. O `projectId` criado pelo EAS ficará associado ao seu projeto/conta.

### Publicar uma atualização de APK com segurança

O projeto usa um único fluxo de publicação, **manual assistido**: gere os APKs Mobile e TV no EAS, teste os dois arquivos e só então execute o script de publicação. O GitHub Actions apenas valida o código em pushes e pull requests; ele não cria builds, tags ou releases. Isso evita builds duplicados no EAS e troca acidental de assets já publicados.

O atualizador interno consulta somente a última GitHub Release pública e estável. Ao encontrar uma versão mais nova, ele mostra as notas, o tamanho do APK e o aviso de uso de Wi-Fi/dados móveis. O download só começa após a pessoa escolher **Baixar agora**. Depois do download, o APK é validado por SHA-256 e o Android pede a confirmação final de instalação.

Antes de gerar os dois APKs, altere em `app.config.ts`:

```ts
version: '1.1.11',      // mesma versão da tag/release: v1.1.11
android: {
  versionCode: 15,      // inteiro e sempre maior que o da release anterior
}
```

Gere os APKs de celular e TV, instale/teste cada variante no dispositivo correto e então publique:

```powershell
npm.cmd run build:apk:mobile
npm.cmd run build:apk:tv
```

Após os dois builds concluírem, baixe os APKs e execute:

```powershell
npm.cmd run release:publish -- -Version 1.1.11 -MobileApk C:\caminho\nexora-mobile.apk -TvApk C:\caminho\nexora-tv.apk
```

O comando valida a versão, calcula SHA-256, cria a tag e envia os dois APKs para a GitHub Release. Ele interrompe a publicação quando a versão informada não coincide com `app.config.ts`, a tag já existe, a versão não é maior que a última release ou o `versionCode` não avançou. A release deve conter os assets com estes sufixos, pois o app os seleciona conforme o dispositivo:

- `nexora-tv-v1.1.11-android.apk`
- `nexora-tv-v1.1.11-android-tv.apk`

O app exige o digest `sha256:` retornado pela GitHub Release; sem hash SHA-256 válido o APK não é baixado. Publique releases públicas, sem marcar como draft ou pre-release. Mantenha a mesma chave de assinatura Android em todos os builds: sem ela, Android não aceita a instalação como atualização.

Em Android 8 ou superior, caso o sistema bloqueie a instalação, toque em **Permitir instalação** na tela de atualização, habilite a instalação para o Nexora TV e volte para instalar o APK.

O app reutiliza a última consulta à GitHub Release por até seis horas, reduzindo consumo de rede e risco de limite da API. A verificação manual sempre consulta novamente. Em uma falha de rede, a tela de Ajustes mostra um aviso discreto e o download tenta novamente automaticamente antes de informar erro.

### PWA Web

O modo Web é instalável como PWA. O cache do aplicativo é versionado a cada build; páginas usam rede primeiro, enquanto ícones e arquivos estáticos usam cache primeiro. Quando uma nova versão do site for publicada, o app Web mostra **ATUALIZAR** para ativá-la sem depender de limpar o navegador manualmente.

## 🌐 Web

O player web usa **hls.js** para streams `.m3u8` em navegadores com Media Source Extensions. Streams progressivos são enviados diretamente ao elemento `<video>`.

> Alguns links podem funcionar no Android e falhar na Web por **CORS**, `Referer`, `User-Agent`, geobloqueio ou regras do provedor. Isso é uma limitação do navegador/fonte, não do catálogo.

## 🧠 Funcionalidades da v1.0.0

- [x] Todos os países retornados pelo IPTV-org
- [x] Bandeiras e códigos ISO
- [x] Playlist por país sob demanda
- [x] Busca de país
- [x] Busca dentro da playlist do país
- [x] Categorias vindas de `group-title`
- [x] Logos vindos do M3U quando disponíveis
- [x] Favoritos locais
- [x] Continuar assistindo / histórico local
- [x] Países fixados
- [x] Atualização manual + atualização em segundo plano
- [x] Player HLS Android
- [x] Headers `Referer` e `User-Agent` no player nativo quando presentes
- [x] Picture-in-Picture nativo
- [x] Android TV / D-pad
- [x] Web com HLS.js
- [x] Netlify pronto
- [x] Tema OLED + RGB loaders

## 🗂 Estrutura

```text
nexora-tv/
├─ app/
│  ├─ index.tsx
│  ├─ explore.tsx
│  ├─ search.tsx
│  ├─ favorites.tsx
│  ├─ settings.tsx
│  ├─ country/[code].tsx
│  └─ player/[id].tsx
├─ src/
│  ├─ components/
│  ├─ hooks/
│  ├─ services/
│  ├─ state/
│  ├─ theme/
│  └─ types/
├─ assets/
├─ scripts/
├─ eas.json
├─ app.config.ts
└─ netlify.toml
```

## 🔐 Segurança e privacidade

- nenhuma API key privada é embutida;
- favoritos/histórico ficam no armazenamento local;
- não há conta de usuário nem backend obrigatório;
- nenhuma transmissão é hospedada pelo Nexora TV;
- `usesCleartextTraffic` está habilitado no Android porque parte das playlists públicas utiliza HTTP. Se você quiser aceitar somente HTTPS, desative essa opção em `app.config.ts`.

## ⚖️ Aviso sobre conteúdo

Este projeto funciona como **agregador/player**. Os links e metadados vêm do IPTV-org e das fontes de transmissão indicadas por ele. Disponibilidade, região, direitos, estabilidade e conteúdo pertencem às respectivas emissoras/provedores. Revise as regras aplicáveis antes de publicar o aplicativo em uma loja.

## 🧪 Validação

```bash
npm run typecheck
npm run build:web
```

O GitHub Actions em `.github/workflows/ci.yml` executa todas as validações em pushes e pull requests. Ele não publica tags, releases ou APKs.

## 🧭 Roadmap

- [ ] EPG/programação por país usando fontes do ecossistema IPTV-org
- [ ] teste de saúde de stream antes de abrir
- [ ] fallback entre múltiplas URLs do mesmo canal
- [ ] busca global de canais com índice local opcional
- [ ] QR para enviar canal do celular para TV
- [ ] PWA instalável aprimorada
- [ ] sincronização opcional entre dispositivos

---

<p align="center">
  <strong>NEXORA TV</strong><br/>
  <sub>OLED BLACK • GLOBAL SIGNAL • MOBILE + TV + WEB</sub>
</p>


### Fontes alternativas gratuitas

### Downloads da versão 1.1.4

- [APK para celular Android](https://github.com/RaphaelTW/nexora-tv/releases/download/v1.1.4/nexora-tv-v1.1.4-android.apk)
- [APK para Android TV](https://github.com/RaphaelTW/nexora-tv/releases/download/v1.1.4/nexora-tv-v1.1.4-android-tv.apk)
- [Release e verificações SHA-256](https://github.com/RaphaelTW/nexora-tv/releases/tag/v1.1.4)

O player mantém o vídeo e os controles juntos no celular. As opções de fonte aparecem em uma faixa horizontal. Quando uma fonte falha ou não envia vídeo por 20 segundos, o app tenta os outros links sem repetir os que já falharam naquela tentativa.

Os catálogos ficam salvos em AsyncStorage no aparelho e são consultados novamente a cada 15 minutos de uso do player, ao voltar ao aplicativo e ao abrir um canal com dados antigos. Uma falha de rede mantém o último catálogo salvo. A última fonte que reproduziu vídeo é lembrada por 24 horas. Isso atualiza os links sem precisar baixar outro APK.

Além de IPTV-org e Free-TV, [TDTChannels](https://github.com/LaQuay/TDTChannels) fornece alternativas para o catálogo da Espanha quando o nome tem correspondência única. A disponibilidade depende da região e da emissora; nem todos os canais terão três fontes.

Os canais combinam as listas públicas [IPTV-org](https://github.com/iptv-org/iptv) e [Free-TV](https://github.com/Free-TV/IPTV). Fontes do mesmo país e com o mesmo `tvg-id` são agrupadas, sem duplicar URLs. O player permite selecionar a fonte e tenta a próxima automaticamente quando recebe um erro; ao esgotar as alternativas, oferece nova tentativa. Links com credenciais explícitas e páginas que não são streams diretos são descartados. Não é necessário cadastrar conta no aplicativo.

Cada fonte mantém seus próprios cabeçalhos. Falhas em uma lista não impedem carregar a outra, e o catálogo em cache é atualizado ao abrir o país. Nem todo canal possui alternativas; disponibilidade, restrições geográficas e compatibilidade do navegador dependem da transmissão original.
