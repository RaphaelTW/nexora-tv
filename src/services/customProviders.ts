import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nexora:custom-providers';
const LIMIT = 8;

export type CustomProvider = {
  id: string;
  name: string;
  countryCode: string;
  url: string;
};

export function isPublicPlaylistUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:'].includes(url.protocol)
      && !url.username
      && !url.password
      && ![...url.searchParams.keys()].some(key => /^(username|password|user|pass|token|key)$/i.test(key))
      && /\.m3u8?$/i.test(url.pathname);
  } catch { return false; }
}

export async function readCustomProviders(): Promise<CustomProvider[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const providers = JSON.parse(raw) as CustomProvider[];
    return providers.filter(provider => provider.id && provider.name && /^[A-Z]{2}$/.test(provider.countryCode) && isPublicPlaylistUrl(provider.url));
  } catch { return []; }
}

export async function addCustomProvider(input: Omit<CustomProvider, 'id'>) {
  const provider: CustomProvider = {
    ...input,
    name: input.name.trim() || 'Fonte própria',
    countryCode: input.countryCode.trim().toUpperCase(),
    url: input.url.trim(),
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  };
  if (!/^[A-Z]{2}$/.test(provider.countryCode) || !isPublicPlaylistUrl(provider.url)) {
    throw new Error('Use um país ISO de duas letras e uma URL pública .m3u ou .m3u8, sem chave ou credenciais.');
  }
  const current = await readCustomProviders();
  const next = [provider, ...current.filter(item => item.url !== provider.url)].slice(0, LIMIT);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export async function removeCustomProvider(id: string) {
  const next = (await readCustomProviders()).filter(provider => provider.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
  return next;
}
