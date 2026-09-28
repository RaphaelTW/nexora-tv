import { isNewerVersion } from './version';

export function validateReleaseVersion(version: string, configuredVersion: string, configuredVersionCode: number, previousVersion?: string, previousVersionCode?: number) {
  const normalized = version.replace(/^v/i, '');
  if (configuredVersion !== normalized) return `A versão informada (${normalized}) difere de app.config.ts (${configuredVersion}).`;
  if (!Number.isInteger(configuredVersionCode) || configuredVersionCode < 1) return 'android.versionCode deve ser um inteiro positivo.';
  if (previousVersion && !isNewerVersion(normalized, previousVersion)) return `A versão ${normalized} não é superior à última release (${previousVersion}).`;
  if (previousVersionCode !== undefined && configuredVersionCode <= previousVersionCode) return `android.versionCode (${configuredVersionCode}) deve ser maior que o da última release (${previousVersionCode}).`;
  return undefined;
}
