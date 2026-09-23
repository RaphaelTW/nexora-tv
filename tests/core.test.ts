import assert from 'node:assert/strict';
import test from 'node:test';
import { parseM3U, mergeChannels, getChannelSources, isPublicStream } from '../src/services/iptv';
import { filterChannels, filterUnavailableChannels, toggleFavoriteInList } from '../src/services/channelUtils';
import { isNewerVersion } from '../src/services/version';
import type { Channel } from '../src/types/iptv';
import { sha256Chunks } from '../src/services/sha256';
import { nextAvailableSource, playerDimensions, selectApk } from '../src/services/playback';
import { matchAdditionalSources, fetchCountryChannels } from '../src/services/iptv';

test('player mobile calcula altura proporcional sem grandes espacos', () => {
  const portrait = playerDimensions(390, 844, 16);
  assert.equal(portrait.width, 358);
  assert.equal(portrait.height, 201.375);
  assert.ok(playerDimensions(844, 390, 16).height <= 160);
});

test('troca de fonte nao repete URLs que falharam e encerra ao esgotar', () => {
  const sources = [{ url: 'a', provider: 'one' }, { url: 'b', provider: 'two' }];
  assert.equal(nextAvailableSource(sources, new Set(['a']))?.url, 'b');
  assert.equal(nextAvailableSource(sources, new Set(['a', 'b'])), undefined);
});

test('atualizador diferencia android de android-tv apesar do nome nexora-tv', () => {
  const assets = [{ name: 'nexora-tv-v1.1.4-android-tv.apk' }, { name: 'nexora-tv-v1.1.4-android.apk' }];
  assert.equal(selectApk(assets, false), assets[1]);
  assert.equal(selectApk(assets, true), assets[0]);
});

test('catalogo adicional nao associa nomes ambiguos ou outros canais', () => {
  const channel = { id: 'a', name: 'News', countryCode: 'BR', url: 'https://one.test/live.m3u8' };
  const extra = { ...channel, id: 'other', url: 'https://two.test/live.m3u8' };
  assert.equal(matchAdditionalSources([channel], [extra])[0].id, 'a');
  assert.deepEqual(matchAdditionalSources([channel, { ...channel, id: 'b' }], [extra]), []);
  assert.deepEqual(matchAdditionalSources([channel], [{ ...extra, name: 'News local' }]), []);
});

test('falha parcial do provedor preserva suas fontes anteriores', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes('countries/')) throw new Error('offline');
    return new Response('#EXTM3U\n#EXTINF:-1 tvg-id="new" tvg-country="BR",Other\nhttps://new.test/live.m3u8');
  };
  try {
    const previous: Channel = { id: 'old', name: 'Old', countryCode: 'BR', url: 'https://old.test/live.m3u8', sources: [{ url: 'https://old.test/live.m3u8', provider: 'IPTV-org' }] };
    const result = await fetchCountryChannels('BR', [previous]);
    assert.ok(result.some(channel => channel.id === 'old'));
    assert.ok(result.some(channel => channel.id === 'new'));
  } finally { globalThis.fetch = original; }
});

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


test('fontes de catalogos distintos preservam cabecalhos e removem duplicatas', () => {
  const first = parseM3U('#EXTINF:-1 tvg-id="news",News\n#EXTVLCOPT:http-referrer=https://first.test\nhttps://one.test/live.m3u8', 'BR');
  const second = parseM3U('#EXTINF:-1 tvg-id="news" tvg-country="BR",News\n#EXTVLCOPT:http-referrer=https://second.test\nhttps://two.test/live.m3u8', 'BR', 'Free-TV', true);
  const result = mergeChannels([...first, ...second, ...second]);
  assert.equal(result.length, 1);
  assert.equal(getChannelSources(result[0]).length, 2);
  assert.equal(result[0].sources?.[1].referrer, 'https://second.test');
  assert.equal(result[0].sources?.[1].provider, 'Free-TV');
});

test('catalogo global filtra pais, paginas e credenciais', () => {
  const result = parseM3U('#EXTINF:-1 tvg-country="US",News\nhttps://one.test/live.m3u8\n#EXTINF:-1 tvg-country="BR",News\nhttps://two.test/live.m3u8', 'BR', 'Free-TV', true);
  assert.equal(result.length, 1);
  assert.equal(result[0].url, 'https://two.test/live.m3u8');
  assert.equal(isPublicStream('https://user:pass@one.test/live.m3u8'), false);
  assert.equal(isPublicStream('https://one.test/live.m3u8?password=secret'), false);
  assert.equal(isPublicStream('https://youtube.com/@news/live'), false);
  assert.equal(isPublicStream('https://one.test/live.m3u8'), true);
});


test('ocultar uma fonte preserva as alternativas do canal', () => {
  const channel = { ...base, alternativeUrls: ['https://two.test/live.m3u8'] };
  const result = filterUnavailableChannels([channel], { [`${base.id}|${base.url}`]: 100 }, 200);
  assert.equal(result.length, 1);
  assert.equal(result[0].url, 'https://two.test/live.m3u8');
});
