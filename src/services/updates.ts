import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Alert, Linking, Platform } from 'react-native';
import { isNewerVersion } from './version';

const LATEST_RELEASE = 'https://api.github.com/repos/RaphaelTW/nexora-tv/releases/latest';
const DISMISSED_KEY = 'nexora:dismissed-update';
type Asset = { name: string; browser_download_url: string; digest?: string; size?: number };
type Release = { tag_name: string; name?: string; body?: string; html_url: string; assets?: Asset[] };
export type UpdateState = { phase: 'idle' | 'downloading' | 'verifying' | 'ready' | 'error'; progress: number; message?: string };

let state: UpdateState = { phase: 'idle', progress: 0 };
const listeners = new Set<(next: UpdateState) => void>();
function publish(next: UpdateState) { state = next; listeners.forEach((listener) => listener(next)); }
export function subscribeToUpdate(listener: (next: UpdateState) => void) { listener(state); listeners.add(listener); return () => { listeners.delete(listener); }; }
export function dismissUpdateProgress() { publish({ phase: 'idle', progress: 0 }); }

function selectedAsset(release: Release) {
  const isTV = Boolean((Platform as any).isTV);
  return (release.assets || []).find((asset) => {
    const name = asset.name.toLowerCase();
    return name.endsWith('.apk') && (isTV ? name.includes('tv') : !name.includes('tv'));
  });
}
function toHex(buffer: ArrayBuffer) { return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join(''); }

async function downloadAndInstall(asset: Asset) {
  if (!FileSystem.cacheDirectory) throw new Error('Armazenamento temporário indisponível.');
  const destination = `${FileSystem.cacheDirectory}${asset.name}`;
  publish({ phase: 'downloading', progress: 0, message: `Baixando ${asset.name}` });
  const task = FileSystem.createDownloadResumable(asset.browser_download_url, destination, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    publish({ phase: 'downloading', progress: totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0, message: `Baixando ${asset.name}` });
  });
  const result = await task.downloadAsync();
  if (!result) throw new Error('Download cancelado.');
  const info = await FileSystem.getInfoAsync(result.uri);
  if (!info.exists || (asset.size && info.size !== asset.size)) throw new Error('O tamanho do APK não corresponde à release.');
  if (asset.digest?.startsWith('sha256:')) {
    publish({ phase: 'verifying', progress: 1, message: 'Validando assinatura SHA-256…' });
    const { File } = await import('expo-file-system');
    const bytes = await new File(result.uri).arrayBuffer();
    const actual = toHex(await Crypto.digest(Crypto.CryptoDigestAlgorithm.SHA256, bytes));
    if (actual.toLowerCase() !== asset.digest.slice(7).toLowerCase()) throw new Error('A assinatura SHA-256 do APK é inválida.');
  }
  publish({ phase: 'ready', progress: 1, message: 'Download verificado. Abrindo o instalador…' });
  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: contentUri, type: 'application/vnd.android.package-archive', flags: 1 });
}

export async function checkForUpdate({ showUpToDate = false } = {}) {
  try {
    const response = await fetch(LATEST_RELEASE, { headers: { Accept: 'application/vnd.github+json' } });
    if (!response.ok) throw new Error(`GitHub respondeu ${response.status}`);
    const release = await response.json() as Release;
    const current = Constants.expoConfig?.version || '0.0.0';
    if (!isNewerVersion(release.tag_name, current)) {
      if (showUpToDate) Alert.alert('Nexora TV', `Você já usa a versão mais recente (${current}).`);
      return;
    }
    if (!showUpToDate && await AsyncStorage.getItem(DISMISSED_KEY) === release.tag_name) return;
    const isTV = Boolean((Platform as any).isTV);
    const platformName = isTV ? 'Android TV' : Platform.OS === 'web' ? 'Web' : 'Android Mobile';
    const asset = selectedAsset(release);
    const notes = (release.body || 'Veja as melhorias e correções desta versão.').slice(0, 700);
    Alert.alert(`Nova versão para ${platformName}`, `${release.name || release.tag_name}\n\n${notes}`, [
      { text: 'Depois', style: 'cancel', onPress: () => void AsyncStorage.setItem(DISMISSED_KEY, release.tag_name) },
      { text: Platform.OS === 'android' && asset ? 'Baixar e instalar' : 'Ver release', onPress: () => void (Platform.OS === 'android' && asset ? downloadAndInstall(asset).catch((error) => publish({ phase: 'error', progress: 0, message: error instanceof Error ? error.message : 'Falha na atualização.' })) : Linking.openURL(release.html_url)) }
    ]);
  } catch (error) {
    if (showUpToDate) Alert.alert('Não foi possível verificar', error instanceof Error ? error.message : 'Tente novamente mais tarde.');
  }
}
