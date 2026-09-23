import type { ChannelSource } from '@/types/iptv';

export function nextAvailableSource(sources: ChannelSource[], failed: Set<string>) {
  return sources.find(source => !failed.has(source.url));
}

export function playerDimensions(width: number, height: number, horizontalPadding: number) {
  const availableWidth = Math.max(0, width - horizontalPadding * 2);
  const landscape = width > height;
  const videoWidth = Math.min(1500, availableWidth, landscape ? Math.max(120, height - 230) * 16 / 9 : availableWidth);
  return { width: videoWidth, height: videoWidth * 9 / 16 };
}

export function selectApk<T extends { name: string }>(assets: T[], isTV: boolean) {
  return assets.find(asset => isTV ? /-android-tv\.apk$/i.test(asset.name) : /-android\.apk$/i.test(asset.name));
}
