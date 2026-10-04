import type { ChannelSource } from '@/types/iptv';

export type PlaybackFailureKind = 'forbidden' | 'geo-blocked' | 'cors' | 'not-found' | 'timeout' | 'offline';
export type PlaybackFailure = {
  source: ChannelSource;
  kind: PlaybackFailureKind;
  title: string;
  detail: string;
};

export const CHANNEL_UNAVAILABLE_MESSAGE = 'Este canal está indisponível agora. Alguns sinais voltam em alguns minutos. Tente novamente mais tarde ou veja outros canais.';

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
  if (/timeout|timed out|20 segundos|20 seconds/.test(normalized)) {
    return { source, kind: 'timeout', title: 'Sinal sem resposta', detail: 'O canal pode estar instável e voltar em alguns minutos. Tente novamente mais tarde.' };
  }
  return { source, kind: 'offline', title: 'Canal fora do ar', detail: 'O provedor não consegue transmitir este canal agora. Tente novamente mais tarde ou escolha outro canal.' };
}
