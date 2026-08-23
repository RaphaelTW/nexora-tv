import type { ComponentType } from 'react';
import type { Channel } from '@/types/iptv';

export const StreamPlayer: ComponentType<{
  channel: Channel;
  onError?: (message: string) => void;
  onPlaying?: () => void;
  retryToken?: number;
}>;
