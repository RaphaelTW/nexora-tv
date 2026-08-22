import Constants from 'expo-constants';
import { Alert, Linking, Platform } from 'react-native';

const LATEST_RELEASE = 'https://api.github.com/repos/RaphaelTW/nexora-tv/releases/latest';

type Release = {
  tag_name: string;
  name?: string;
  html_url: string;
  assets?: Array<{ name: string; browser_download_url: string }>;
};

function versionParts(version: string) {
  return version.replace(/^v/i, '').split(/[.-]/).map((part) => Number.parseInt(part, 10) || 0);
}

function isNewer(latest: string, current: string) {
  const a = versionParts(latest);
  const b = versionParts(current);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    if ((a[index] || 0) !== (b[index] || 0)) return (a[index] || 0) > (b[index] || 0);
  }
  return false;
}

function downloadUrl(release: Release) {
  const assets = release.assets || [];
  const isTV = Boolean((Platform as any).isTV);
  const preferred = assets.find((asset) => {
    const name = asset.name.toLowerCase();
    return name.endsWith('.apk') && (isTV ? name.includes('tv') : !name.includes('tv'));
  });
  return preferred?.browser_download_url || release.html_url;
}

export async function checkForUpdate({ showUpToDate = false } = {}) {
  if (Platform.OS === 'web') return;
  try {
    const response = await fetch(LATEST_RELEASE, {
      headers: { Accept: 'application/vnd.github+json' }
    });
    if (!response.ok) throw new Error(`GitHub respondeu ${response.status}`);
    const release = await response.json() as Release;
    const current = Constants.expoConfig?.version || '0.0.0';
    if (!isNewer(release.tag_name, current)) {
      if (showUpToDate) Alert.alert('Nexora TV', `Você já usa a versão mais recente (${current}).`);
      return;
    }
    Alert.alert(
      'Nova versão disponível',
      `${release.name || release.tag_name} está disponível. Deseja baixar e atualizar agora?`,
      [
        { text: 'Depois', style: 'cancel' },
        { text: 'Baixar atualização', onPress: () => void Linking.openURL(downloadUrl(release)) }
      ]
    );
  } catch (error) {
    if (showUpToDate) {
      Alert.alert('Não foi possível verificar', error instanceof Error ? error.message : 'Tente novamente mais tarde.');
    }
  }
}
