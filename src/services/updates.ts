import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';
import { isNewerVersion } from './version';
import { sha256File } from './apkIntegrity';

const LATEST_RELEASE = 'https://api.github.com/repos/RaphaelTW/nexora-tv/releases/latest';
const RELEASES_LIST = 'https://api.github.com/repos/RaphaelTW/nexora-tv/releases?per_page=5';
const DISMISSED_KEY = 'nexora:dismissed-update';
type Asset = { name: string; browser_download_url: string; digest?: string; size?: number };
type Release = { tag_name: string; name?: string; body?: string; html_url: string; assets?: Asset[] };
export type UpdateState = {
  phase: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'ready' | 'info' | 'error';
  progress: number;
  message?: string;
  version?: string;
  title?: string;
  notes?: string;
  platform?: string;
  assetName?: string;
};

let state: UpdateState = { phase: 'idle', progress: 0 };
let pendingRelease: Release | null = null;
let pendingAsset: Asset | undefined;
let downloadedUpdateUri: string | null = null;
const listeners = new Set<(next: UpdateState) => void>();
function publish(next: UpdateState) { state = next; listeners.forEach((listener) => listener(next)); }
export function subscribeToUpdate(listener: (next: UpdateState) => void) { listener(state); listeners.add(listener); return () => { listeners.delete(listener); }; }
export function dismissUpdateProgress() { publish({ phase: 'idle', progress: 0 }); }
export async function postponeAvailableUpdate() {
  if (pendingRelease) await AsyncStorage.setItem(DISMISSED_KEY, pendingRelease.tag_name);
  pendingRelease = null; pendingAsset = undefined; downloadedUpdateUri = null; dismissUpdateProgress();
}
export async function installAvailableUpdate() {
  const release = pendingRelease; const asset = pendingAsset;
  if (!release) return;
  if (Platform.OS === 'android' && downloadedUpdateUri) {
    try {
      const contentUri = await FileSystem.getContentUriAsync(downloadedUpdateUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', { data: contentUri, type: 'application/vnd.android.package-archive', flags: 1 });
    } catch (error) {
      publish({ ...state, phase: 'error', progress: 0, message: error instanceof Error ? error.message : 'Falha ao abrir o instalador.' });
    }
    return;
  }
  if (Platform.OS === 'android' && asset) {
    await downloadUpdate(asset).catch(showDownloadError);
    return;
  }
  dismissUpdateProgress();
  await Linking.openURL(release.html_url);
}

async function fetchLatestRelease(): Promise<Release> {
  const cacheBuster = `nexora=${Date.now()}`;
  const headers = {
    Accept: 'application/vnd.github+json',
    'Cache-Control': 'no-cache, no-store',
    Pragma: 'no-cache',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  const attempts = [`${LATEST_RELEASE}?${cacheBuster}`, `${RELEASES_LIST}&${cacheBuster}`];
  let lastStatus = 0;
  for (const url of attempts) {
    const response = await fetch(url, { headers, cache: 'no-store' });
    lastStatus = response.status;
    if (!response.ok) continue;
    const payload = await response.json() as Release | Release[];
    const release = Array.isArray(payload) ? payload.find((item) => item.tag_name && item.assets) : payload;
    if (release?.tag_name) return release;
  }
  throw new Error(lastStatus === 404 ? 'Release não encontrada. Confirme se o repositório e a release estão públicos.' : `GitHub respondeu ${lastStatus || 'sem conexão'}`);
}

function selectedAsset(release: Release) {
  const isTV = Boolean((Platform as any).isTV);
  return (release.assets || []).find((asset) => {
    const name = asset.name.toLowerCase();
    return name.endsWith('.apk') && (isTV ? name.includes('tv') : !name.includes('tv'));
  });
}
function showDownloadError(error: unknown) {
  publish({ ...state, phase: 'error', progress: 0, message: error instanceof Error ? error.message : 'Falha na atualização.' });
}

async function downloadUpdate(asset: Asset) {
  if (!FileSystem.cacheDirectory) throw new Error('Armazenamento temporário indisponível.');
  const destination = `${FileSystem.cacheDirectory}${asset.name}`;
  downloadedUpdateUri = null;
  publish({ ...state, phase: 'downloading', progress: 0, message: `Baixando ${asset.name}` });
  const task = FileSystem.createDownloadResumable(asset.browser_download_url, destination, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
    publish({ ...state, phase: 'downloading', progress: totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0, message: `Baixando ${asset.name}` });
  });
  const result = await task.downloadAsync();
  if (!result) throw new Error('Download cancelado.');
  const info = await FileSystem.getInfoAsync(result.uri);
  if (!info.exists || (asset.size && info.size !== asset.size)) throw new Error('O tamanho do APK não corresponde à release.');
  if (asset.digest?.startsWith('sha256:')) {
    publish({ ...state, phase: 'verifying', progress: 0, message: 'Validando assinatura SHA-256…' });
    const actual = await sha256File(result.uri, (progress) => publish({ ...state, phase: 'verifying', progress, message: 'Validando assinatura SHA-256…' }));
    if (actual.toLowerCase() !== asset.digest.slice(7).toLowerCase()) throw new Error('A assinatura SHA-256 do APK é inválida.');
  }
  downloadedUpdateUri = result.uri;
  publish({ ...state, phase: 'ready', progress: 1, message: 'Atualização baixada e verificada. Deseja instalar agora?' });
}

export async function checkForUpdate({ showUpToDate = false } = {}) {
  if (showUpToDate) publish({ phase: 'checking', progress: 0, message: 'Consultando a release mais recente…' });
  try {
    const release = await fetchLatestRelease();
    const current = Constants.expoConfig?.version || '0.0.0';
    if (!isNewerVersion(release.tag_name, current)) {
      if (showUpToDate) publish({ phase: 'info', progress: 1, title: 'Nexora TV atualizado', message: `Você já usa a versão mais recente (v${current}).` });
      return;
    }
    if (!showUpToDate && await AsyncStorage.getItem(DISMISSED_KEY) === release.tag_name) return;
    const isTV = Boolean((Platform as any).isTV);
    const platformName = isTV ? 'Android TV' : Platform.OS === 'web' ? 'Web' : 'Android Mobile';
    const asset = selectedAsset(release);
    pendingRelease = release; pendingAsset = asset;
    publish({
      phase: 'available', progress: 0, version: release.tag_name, title: release.name || `Nexora TV ${release.tag_name}`,
      notes: (release.body || 'Veja as melhorias e correções desta versão.').slice(0, 1200), platform: platformName, assetName: asset?.name
    });
    if (Platform.OS === 'android') {
      if (!asset) throw new Error(`APK para ${platformName} não encontrado na release.`);
      void downloadUpdate(asset).catch(showDownloadError);
    }
  } catch (error) {
    if (showUpToDate) publish({ phase: 'error', progress: 0, message: error instanceof Error ? error.message : 'Tente novamente mais tarde.' });
  }
}
