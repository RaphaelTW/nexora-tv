import type { ChannelSource } from '@/types/iptv';

export type PlaybackFailureKind = 'forbidden' | 'geo-blocked' | 'cors' | 'not-found' | 'timeout' | 'network' | 'rate-limited' | 'server' | 'decoder' | 'offline';
export type PlaybackFailure = {
  source: ChannelSource;
  kind: PlaybackFailureKind;
  title: string;
  detail: string;
};

export const CHANNEL_UNAVAILABLE_MESSAGE = 'Este canal está indisponível agora. Alguns sinais voltam em alguns minutos. Tente novamente mais tarde ou veja outros canais.';
export const RETRY_DELAYS_MS = [15_000, 60_000, 5 * 60_000];
const TEMPORARY_FAILURES = new Set<PlaybackFailureKind>(['timeout', 'network', 'rate-limited', 'server', 'offline']);

export function shouldRetryPlaybackFailure(kind: PlaybackFailureKind, attempt: number) {
  return TEMPORARY_FAILURES.has(kind) && attempt >= 0 && attempt < RETRY_DELAYS_MS.length;
}

export function diagnosePlaybackFailure(source: ChannelSource, message: string): PlaybackFailure {
  const normalized = message.toLowerCase();
  if (/\b403\b|forbidden|access denied/.test(normalized)) {
    return { source, kind: 'forbidden', title: 'Acesso não disponível', detail: 'A emissora não permite este acesso no momento. Tente outro canal.' };
  }
  if (/geo|geogr|region|country blocked|country restriction/.test(normalized)) {
    return { source, kind: 'geo-blocked', title: 'Indisponível na sua região', detail: 'Esta fonte pode estar disponível apenas em outros países. Tente outro canal.' };
  }
  if (/cors|cross-origin/.test(normalized)) {
    return { source, kind: 'cors', title: 'Indisponível neste dispositivo', detail: 'A fonte não permite reprodução pelo navegador. Tente outro canal ou o aplicativo Android.' };
  }
  if (/\b404\b|not found/.test(normalized)) {
    return { source, kind: 'not-found', title: 'Link temporariamente indisponível', detail: 'O endereço pode ter mudado ou o canal pode estar fora do ar. Tente novamente mais tarde.' };
  }
  if (/\b429\b|too many requests|rate limit/.test(normalized)) {
    return { source, kind: 'rate-limited', title: 'Provedor temporariamente sobrecarregado', detail: 'O provedor recebeu muitas solicitações. O Nexora tentará novamente mais tarde.' };
  }
  if (/\b5\d\d\b|server error|service unavailable|bad gateway/.test(normalized)) {
    return { source, kind: 'server', title: 'Servidor do canal indisponível', detail: 'O servidor da emissora está com instabilidade. Tente novamente em alguns minutos.' };
  }
  if (/dns|enotfound|unable to resolve|network.*unreachable|network request failed|connection refused|no internet/.test(normalized)) {
    return { source, kind: 'network', title: 'Problema de conexão', detail: 'Não foi possível alcançar esta fonte. Teste sua internet ou tente novamente mais tarde.' };
  }
  if (/decoder|decode|codec|unsupported.*format|unrecognized.*format/.test(normalized)) {
    return { source, kind: 'decoder', title: 'Formato não suportado', detail: 'Este sinal não é compatível com este aparelho. Tente outra fonte ou outro canal.' };
  }
  if (/timeout|timed out|20 segundos|20 seconds/.test(normalized)) {
    return { source, kind: 'timeout', title: 'Sinal sem resposta', detail: 'O canal pode estar instável e voltar em alguns minutos. Tente novamente mais tarde.' };
  }
  return { source, kind: 'offline', title: 'Canal fora do ar', detail: 'O provedor não consegue transmitir este canal agora. Tente novamente mais tarde ou escolha outro canal.' };
}
