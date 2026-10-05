const CONNECTIVITY_URL = 'https://iptv-org.github.io/api/countries.json';

export async function testCatalogConnection(timeoutMs = 8_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(CONNECTIVITY_URL, { cache: 'no-store', signal: controller.signal });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
