export type ReleaseAsset = { name: string; label?: string; browser_download_url: string; digest?: string; size?: number };
export type GithubRelease = { tag_name: string; name?: string; body?: string; html_url: string; assets?: ReleaseAsset[]; draft?: boolean; prerelease?: boolean };

export function isSha256Digest(value?: string): value is string {
  return /^sha256:[a-f0-9]{64}$/i.test(value || '');
}

export function selectStableRelease(releases: GithubRelease[]) {
  return releases.find((release) => Boolean(release.tag_name && release.assets && !release.draft && !release.prerelease));
}

export function formatBytes(bytes?: number) {
  if (!bytes || bytes < 0) return 'tamanho não informado';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 100 * 1024 * 1024 ? 0 : 1)} MB`;
}

export function isInstallPermissionBlocked(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /unknown sources|not allowed to install|install packages|permission denied|securityexception/i.test(message);
}

export function isUpdateCacheFresh(checkedAt: number | null, now = Date.now(), maxAgeMs = 6 * 60 * 60 * 1000) {
  return checkedAt !== null && checkedAt > 0 && now - checkedAt < maxAgeMs;
}

export function hasEnoughStorage(freeBytes: number, assetSize?: number) {
  if (!assetSize) return true;
  return freeBytes >= assetSize + 20 * 1024 * 1024;
}
