import type { Channel, Country } from '@/types/iptv';

export const IPTV_ENDPOINTS = {
  countries: 'https://iptv-org.github.io/api/countries.json',
  categories: 'https://iptv-org.github.io/api/categories.json',
  countryPlaylist: (code: string) =>
    `https://iptv-org.github.io/iptv/countries/${code.toLowerCase()}.m3u`
} as const;

const TIMEOUT_MS = 15000;

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json,text/plain,*/*' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCountries(): Promise<Country[]> {
  const text = await fetchText(IPTV_ENDPOINTS.countries);
  const countries = JSON.parse(text) as Country[];
  return countries
    .filter((item) => item.code && item.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchCountryChannels(code: string): Promise<Channel[]> {
  const text = await fetchText(IPTV_ENDPOINTS.countryPlaylist(code));
  return parseM3U(text, code.toUpperCase());
}

function stableHash(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function parseAttributes(line: string) {
  const attrs: Record<string, string> = {};
  const regex = /([\w-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line))) attrs[match[1]] = match[2];
  return attrs;
}

export function parseM3U(content: string, countryCode: string): Channel[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const output: Channel[] = [];
  let pending: {
    name: string;
    attrs: Record<string, string>;
    referrer?: string;
    userAgent?: string;
  } | null = null;

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      const attrs = parseAttributes(line);
      const comma = line.lastIndexOf(',');
      const name = comma >= 0 ? line.slice(comma + 1).trim() : attrs['tvg-name'] || 'Canal';
      pending = { name, attrs };
      continue;
    }
    if (!pending) continue;
    if (line.startsWith('#EXTVLCOPT:http-referrer=')) {
      pending.referrer = line.split('=').slice(1).join('=').trim();
      continue;
    }
    if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
      pending.userAgent = line.split('=').slice(1).join('=').trim();
      continue;
    }
    if (line.startsWith('#')) continue;

    const url = line;
    const tvgId = pending.attrs['tvg-id'];
    const id = tvgId || `${countryCode}-${stableHash(`${pending.name}|${url}`)}`;
    output.push({
      id,
      name: pending.name || pending.attrs['tvg-name'] || 'Canal',
      countryCode,
      logo: pending.attrs['tvg-logo'] || undefined,
      group: pending.attrs['group-title'] || 'Geral',
      quality: pending.attrs['quality'] || undefined,
      url,
      referrer: pending.referrer,
      userAgent: pending.userAgent
    });
    pending = null;
  }

  const merged = new Map<string, Channel>();
  for (const channel of output) {
    const key = channel.id || `${channel.name}|${channel.countryCode}`;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, channel);
      continue;
    }
    const urls = new Set([existing.url, ...(existing.alternativeUrls || []), channel.url]);
    existing.alternativeUrls = [...urls].filter((url) => url !== existing.url);
  }
  return [...merged.values()];
}
