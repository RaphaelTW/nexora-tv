import type { ChannelSource } from '@/types/iptv';

export type PlaybackFailureKind = 'forbidden' | 'geo-blocked' | 'cors' | 'not-found' | 'timeout' | 'offline';
export type PlaybackFailure = {
  source: ChannelSource;
  kind: PlaybackFailureKind;
  title: string;
  detail: string;
};

export function diagnosePlaybackFailure(source: ChannelSource, message: string): PlaybackFailure {
  const normalized = message.toLowerCase();
  if (/\b403\b|forbidden|access denied/.test(normalized)) {
    return { source, kind: 'forbidden', title: 'Acesso recusado (403)', detail: 'A emissora bloqueou este player, IP ou região.' };
  }
  if (/geo|geogr|region|country blocked|country restriction/.test(normalized)) {
    return { source, kind: 'geo-blocked', title: 'Bloqueado na sua região', detail: 'Esta fonte só está disponível em determinados países.' };
  }
  if (/cors|cross-origin/.test(normalized)) {
    return { source, kind: 'cors', title: 'Bloqueio do navegador (CORS)', detail: 'O site de origem não permite reprodução pela Web.' };
  }
  if (/\b404\b|not found/.test(normalized)) {
    return { source, kind: 'not-found', title: 'Fonte não encontrada (404)', detail: 'O link foi removido ou mudou de endereço.' };
  }
  if (/timeout|timed out|20 segundos|20 seconds/.test(normalized)) {
    return { source, kind: 'timeout', title: 'Sem resposta da fonte', detail: 'O sinal não enviou vídeo dentro do tempo esperado.' };
  }
  return { source, kind: 'offline', title: 'Fonte indisponível', detail: 'O provedor não pôde entregar o sinal agora.' };
}
