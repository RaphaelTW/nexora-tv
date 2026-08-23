function versionParts(version: string) { return version.replace(/^v/i, '').split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0); }
export function isNewerVersion(latest: string, current: string) {
  const a = versionParts(latest); const b = versionParts(current);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) > (b[index] || 0);
  }
  return false;
}
