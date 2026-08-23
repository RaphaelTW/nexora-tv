import assert from 'node:assert/strict';
import test from 'node:test';
import { parseM3U } from '../src/services/iptv';
import { filterChannels, filterUnavailableChannels, toggleFavoriteInList } from '../src/services/channelUtils';
import { isNewerVersion } from '../src/services/version';
import type { Channel } from '../src/types/iptv';
import { sha256Chunks } from '../src/services/sha256';

const base: Channel = { id: 'news', name: 'News BR', countryCode: 'BR', group: 'Notícias', url: 'https://one.test/live.m3u8' };

test('parser preserva cabeçalhos e agrupa fontes alternativas', () => {
  const parsed = parseM3U(`#EXTM3U\n#EXTINF:-1 tvg-id="news" tvg-logo="logo.png" group-title="Notícias",News BR\n#EXTVLCOPT:http-referrer=https://site.test\nhttps://one.test/live.m3u8\n#EXTINF:-1 tvg-id="news" group-title="Notícias",News BR\nhttps://two.test/live.m3u8`, 'BR');
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].referrer, 'https://site.test');
  assert.deepEqual(parsed[0].alternativeUrls, ['https://two.test/live.m3u8']);
});

test('filtros combinam texto e categoria', () => {
  const sports = { ...base, id: 'sports', name: 'Arena', group: 'Esportes' };
  assert.deepEqual(filterChannels([base, sports], 'arena', 'Esportes'), [sports]);
  assert.deepEqual(filterChannels([base, sports], '', 'Notícias'), [base]);
});

test('favoritos alternam sem duplicar', () => {
  assert.deepEqual(toggleFavoriteInList([], base), [base]);
  assert.deepEqual(toggleFavoriteInList([base], base), []);
});

test('comparação de versões respeita semver numérico', () => {
  assert.equal(isNewerVersion('v1.0.10', '1.0.2'), true);
  assert.equal(isNewerVersion('v1.0.2', '1.0.2'), false);
  assert.equal(isNewerVersion('v1.0.1', '1.0.2'), false);
});

test('canais ocultos também são removidos do conteúdo recuperado do cache', () => {
  const now = 10 * 60 * 60 * 1000;
  assert.deepEqual(filterUnavailableChannels([base], { [`${base.id}|${base.url}`]: now - 1000 }, now), []);
  assert.deepEqual(filterUnavailableChannels([base], { [`${base.id}|${base.url}`]: now - 7 * 60 * 60 * 1000 }, now), [base]);
});

test('SHA-256 incremental produz o mesmo digest em blocos', () => {
  const encoder = new TextEncoder();
  assert.equal(sha256Chunks([encoder.encode('Nexora '), encoder.encode('TV')]), '37b728aaf283220cd50e7362288c23028290e8042d54502cb9b4636a730ff95b');
});
