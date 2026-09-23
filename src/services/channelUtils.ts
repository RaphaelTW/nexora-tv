import { getChannelSources } from './iptv';
import type { Channel } from '@/types/iptv';

export function filterChannels(channels: Channel[], query: string, group = 'Todos') {
  const normalized = query.trim().toLowerCase();
  return channels.filter((channel) => {
    const matchesGroup = group === 'Todos' || channel.group === group;
    return matchesGroup && (!normalized || `${channel.name} ${channel.group || ''}`.toLowerCase().includes(normalized));
  });
}

export function toggleFavoriteInList(favorites: Channel[], channel: Channel, limit = 200) {
  return favorites.some((item) => item.id === channel.id)
    ? favorites.filter((item) => item.id !== channel.id)
    : [channel, ...favorites].slice(0, limit);
}

export function filterUnavailableChannels(channels: Channel[], unavailable: Record<string, number>, now = Date.now(), hiddenForMs = 6 * 60 * 60 * 1000) {
  return channels.flatMap((channel) => {
    const available = getChannelSources(channel).filter(source => {
      const hiddenAt = unavailable[`${channel.id}|${source.url}`];
      return !hiddenAt || now - hiddenAt >= hiddenForMs;
    });
    if (!available.length) return [];
    if (available.length === getChannelSources(channel).length) return [channel];
    return [{ ...channel, ...available[0], sources: available, alternativeUrls: available.slice(1).map(source => source.url) }];
  });
}
