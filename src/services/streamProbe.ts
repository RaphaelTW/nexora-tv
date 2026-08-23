export async function probeStream(url: string, timeoutMs = 1500): Promise<'online' | 'offline' | 'unknown'> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { method: 'HEAD', signal: controller.signal, headers: { Accept: 'application/vnd.apple.mpegurl,video/*,*/*' } });
    if (response.ok || response.status === 405) return 'online';
    return response.status >= 400 ? 'offline' : 'unknown';
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return 'unknown';
    return typeof window !== 'undefined' ? 'unknown' : 'offline';
  } finally {
    clearTimeout(timeout);
  }
}
