import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import { Linking, Platform } from 'react-native';
import { selectApk } from './playback';
import { isNewerVersion } from './version';
import { sha256File } from './apkIntegrity';
import { formatBytes, hasEnoughStorage, isInstallPermissionBlocked, isSha256Digest, isUpdateCacheFresh, selectStableRelease, type GithubRelease, type ReleaseAsset } from './release';
import { isTVUpdateBuild } from './updatePlatform';

const LATEST_RELEASE = 'https://api.github.com/repos/RaphaelTW/nexora-tv/releases/latest';
const RELEASES_LIST = 'https://api.github.com/repos/RaphaelTW/nexora-tv/releases?per_page=5';
const DISMISSED_KEY = 'nexora:dismissed-update';
const RELEASE_CACHE_KEY = 'nexora:update:release';
const RELEASE_ETAG_KEY = 'nexora:update:etag';
const LAST_CHECK_KEY = 'nexora:update:last-check';
const LAST_ERROR_KEY = 'nexora:update:last-error';
const UPDATE_CACHE_MS = 6 * 60 * 60 * 1000;
const DOWNLOAD_ATTEMPTS = 3;
type Asset = ReleaseAsset;
type Release = GithubRelease;
export type UpdateState = {
  phase: 'idle' | 'checking' | 'available' | 'downloading' | 'verifying' | 'ready' | 'permission' | 'info' | 'error';
  progress: number;
  message?: string;
  version?: string;
  title?: string;
  notes?: string;
  platform?: string;
  assetName?: string;
  assetDigest?: string;
  assetSize?: number;
};
export type UpdateCheckHealth = { lastCheckedAt: number | null; lastError: string | null };

let state: UpdateState = { phase: 'idle', progress: 0 };
let pendingRelease: Release | null = null;
let pendingAsset: Asset | undefined;
let downloadedUpdateUri: string | null = null;
const listeners = new Set<(next: UpdateState) => void>();
const healthListeners = new Set<(next: UpdateCheckHealth) => void>();
let activeCheck: Promise<void> | null = null;
function isTVBuild() { return isTVUpdateBuild(Constants.expoConfig?.extra?.isTV, Boolean((Platform as any).isTV)); }
function publish(next: UpdateState) { state = next; listeners.forEach((listener) => listener(next)); }
function publishHealth(next: UpdateCheckHealth) { healthListeners.forEach((listener) => listener(next)); }
export function subscribeToUpdate(listener: (next: UpdateState) => void) { listener(state); listeners.add(listener); return () => { listeners.delete(listener); }; }
export function subscribeToUpdateCheckHealth(listener: (next: UpdateCheckHealth) => void) {
  void readUpdateCheckHealth().then(listener); healthListeners.add(listener); return () => { healthListeners.delete(listener); };
}
export async function readUpdateCheckHealth(): Promise<UpdateCheckHealth> {
  const [lastCheckedAt, lastError] = await AsyncStorage.multiGet([LAST_CHECK_KEY, LAST_ERROR_KEY]);
  return { lastCheckedAt: Number(lastCheckedAt[1]) || null, lastError: lastError[1] || null };
}
async function recordUpdateCheckSuccess() {
  const health = { lastCheckedAt: Date.now(), lastError: null };
  await AsyncStorage.multiSet([[LAST_CHECK_KEY, String(health.lastCheckedAt)], [LAST_ERROR_KEY, '']]); publishHealth(health);
}
async function recordUpdateCheckFailure(message: string) {
  const health = { lastCheckedAt: Date.now(), lastError: message };
  await AsyncStorage.multiSet([[LAST_CHECK_KEY, String(health.lastCheckedAt)], [LAST_ERROR_KEY, message]]); publishHealth(health);
}
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
      publish({ ...state, phase: isInstallPermissionBlocked(error) ? 'permission' : 'error', progress: 0, message: isInstallPermissionBlocked(error) ? 'O Android bloqueou instalações desta fonte. Permita a instalação e tente novamente.' : error instanceof Error ? error.message : 'Falha ao abrir o instalador.' });
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

export async function openInstallPermissionSettings() {
  if (Platform.OS !== 'android') return;
  const packageName = Constants.expoConfig?.android?.package;
  try {
    await IntentLauncher.startActivityAsync(IntentLauncher.ActivityAction.MANAGE_UNKNOWN_APP_SOURCES, packageName ? { data: `package:${packageName}` } : {});
  } catch (error) {
    publish({ ...state, phase: 'error', progress: 0, message: error instanceof Error ? error.message : 'Não foi possível abrir as configurações de instalação.' });
  }
}

async function readCachedRelease() {
  const value = await AsyncStorage.getItem(RELEASE_CACHE_KEY);
  if (!value) return null;
  try { return JSON.parse(value) as Release; } catch { return null; }
}
async function fetchLatestRelease(): Promise<Release> {
  const etag = await AsyncStorage.getItem(RELEASE_ETAG_KEY);
  const headers = {
    Accept: 'application/vnd.github+json',
    ...(etag ? { 'If-None-Match': etag } : {}),
    'X-GitHub-Api-Version': '2022-11-28'
  };
  const attempts = [LATEST_RELEASE, RELEASES_LIST];
  let lastStatus = 0;
  for (const url of attempts) {
    const response = await fetch(url, { headers, cache: 'no-store' });
    lastStatus = response.status;
    if (response.status === 304) {
      const cached = await readCachedRelease();
      if (cached) return cached;
      continue;
    }
    if (!response.ok) continue;
    const payload = await response.json() as Release | Release[];
    const releases = Array.isArray(payload) ? payload : [payload];
    const release = selectStableRelease(releases);
    if (release) {
      await AsyncStorage.multiSet([[RELEASE_CACHE_KEY, JSON.stringify(release)], [RELEASE_ETAG_KEY, response.headers.get('etag') || '']]);
      return release;
    }
  }
  throw new Error(lastStatus === 404 ? 'Release não encontrada. Confirme se o repositório e a release estão públicos.' : `GitHub respondeu ${lastStatus || 'sem conexão'}`);
}

function selectedAsset(release: Release) {
  const isTV = isTVBuild();
  return selectApk((release.assets || []).map(asset => ({ ...asset, name: asset.label || asset.name })), isTV);
}
function showDownloadError(error: unknown) {
  publish({ ...state, phase: 'error', progress: 0, message: error instanceof Error ? error.message : 'Falha na atualização.' });
}

async function downloadUpdate(asset: Asset) {
  const digest = asset.digest;
  if (!isSha256Digest(digest)) throw new Error('Esta release não fornece um SHA-256 válido para o APK. O download foi bloqueado por segurança.');
  if (!FileSystem.cacheDirectory) throw new Error('Armazenamento temporário indisponível.');
  const freeBytes = await FileSystem.getFreeDiskStorageAsync();
  if (!hasEnoughStorage(freeBytes, asset.size)) throw new Error(`Espaço insuficiente. Libere pelo menos ${formatBytes((asset.size || 0) + 20 * 1024 * 1024)} para baixar esta atualização.`);
  const destination = `${FileSystem.cacheDirectory}${asset.name}`;
  downloadedUpdateUri = null;
  let result: FileSystem.FileSystemDownloadResult | undefined;
  let lastError: unknown;
  for (let attempt = 1; attempt <= DOWNLOAD_ATTEMPTS; attempt += 1) {
    try {
      publish({ ...state, phase: 'downloading', progress: 0, message: attempt === 1 ? `Baixando ${asset.name}` : `Retomando download (${attempt}/${DOWNLOAD_ATTEMPTS})…` });
      const task = FileSystem.createDownloadResumable(asset.browser_download_url, destination, {}, ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
        publish({ ...state, phase: 'downloading', progress: totalBytesExpectedToWrite > 0 ? totalBytesWritten / totalBytesExpectedToWrite : 0, message: `Baixando ${asset.name} (${attempt}/${DOWNLOAD_ATTEMPTS})` });
      });
      result = await task.downloadAsync();
      if (result) break;
      lastError = new Error('Download cancelado.');
    } catch (error) { lastError = error; }
    if (attempt < DOWNLOAD_ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  if (!result) throw lastError instanceof Error ? lastError : new Error('Não foi possível concluir o download.');
  const info = await FileSystem.getInfoAsync(result.uri);
  if (!info.exists || (asset.size && info.size !== asset.size)) throw new Error('O tamanho do APK não corresponde à release.');
  publish({ ...state, phase: 'verifying', progress: 0, message: 'Validando assinatura SHA-256…' });
  const actual = await sha256File(result.uri, (progress) => publish({ ...state, phase: 'verifying', progress, message: 'Validando assinatura SHA-256…' }));
  if (actual.toLowerCase() !== digest.slice(7).toLowerCase()) throw new Error('A assinatura SHA-256 do APK é inválida.');
  downloadedUpdateUri = result.uri;
  publish({ ...state, phase: 'ready', progress: 1, message: 'Atualização baixada e verificada. Deseja instalar agora?' });
}

async function checkForUpdateInternal({ showUpToDate = false } = {}) {
  if (showUpToDate) publish({ phase: 'checking', progress: 0, message: 'Consultando a release mais recente…' });
  try {
    const lastCheck = Number(await AsyncStorage.getItem(LAST_CHECK_KEY)) || null;
    const cachedRelease = !showUpToDate && isUpdateCacheFresh(lastCheck, Date.now(), UPDATE_CACHE_MS) ? await readCachedRelease() : null;
    const release = cachedRelease || await fetchLatestRelease();
    if (!release) throw new Error('Release não encontrada. Tente novamente mais tarde.');
    await recordUpdateCheckSuccess();
    const current = Constants.expoConfig?.version || '0.0.0';
    if (!isNewerVersion(release.tag_name, current)) {
      if (showUpToDate) publish({ phase: 'info', progress: 1, title: 'Nexora TV atualizado', message: `Você já usa a versão mais recente (v${current}).` });
      return;
    }
    if (!showUpToDate && await AsyncStorage.getItem(DISMISSED_KEY) === release.tag_name) return;
    const isTV = isTVBuild();
    const platformName = isTV ? 'Android TV' : Platform.OS === 'web' ? 'Web' : 'Android Mobile';
    const asset = selectedAsset(release);
    if (Platform.OS === 'android' && !asset) throw new Error(`Não há APK compatível para ${platformName} nesta release.`);
    if (Platform.OS === 'android' && !isSha256Digest(asset?.digest)) throw new Error('A release foi encontrada, mas o APK não possui SHA-256 válido. Publique novamente com o hash da GitHub Release.');
    pendingRelease = release; pendingAsset = asset;
    publish({
      assetDigest: asset?.digest,
      phase: 'available', progress: 0, version: release.tag_name, title: release.name || `Nexora TV ${release.tag_name}`,
      notes: (release.body || 'Veja as melhorias e correções desta versão.').slice(0, 1200), platform: platformName, assetName: asset?.name, assetSize: asset?.size
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tente novamente mais tarde.';
    await recordUpdateCheckFailure(message);
    if (showUpToDate || /APK compatível|SHA-256 válido|Release não encontrada/i.test(message)) publish({ phase: 'error', progress: 0, message });
  }
}
export function checkForUpdate(options: { showUpToDate?: boolean } = {}) {
  if (activeCheck) return activeCheck;
  activeCheck = checkForUpdateInternal(options).finally(() => { activeCheck = null; });
  return activeCheck;
}
