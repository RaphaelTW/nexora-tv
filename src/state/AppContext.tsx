import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchCountries } from '@/services/iptv';
import { readCache, removeAllNexoraData, writeCache } from '@/services/cache';
import type { Channel, Country } from '@/types/iptv';
import { toggleFavoriteInList } from '@/services/channelUtils';

const FAVORITES_KEY = 'nexora:favorites';
const HISTORY_KEY = 'nexora:history';
const PINNED_KEY = 'nexora:pinned-countries';
const CURRENT_KEY = 'nexora:current-channel';
const QUEUE_KEY = 'nexora:current-queue';

type AppContextValue = {
  countries: Country[];
  loadingCountries: boolean;
  syncing: boolean;
  syncError: string | null;
  favorites: Channel[];
  history: Channel[];
  pinnedCountries: string[];
  currentChannel: Channel | null;
  currentQueue: Channel[];
  refreshCountries: () => Promise<void>;
  toggleFavorite: (channel: Channel) => Promise<void>;
  isFavorite: (id: string) => boolean;
  recordWatch: (channel: Channel) => Promise<void>;
  togglePinnedCountry: (code: string) => Promise<void>;
  setCurrentChannel: (channel: Channel, queue?: Channel[]) => Promise<void>;
  clearLocalData: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Channel[]>([]);
  const [history, setHistory] = useState<Channel[]>([]);
  const [pinnedCountries, setPinnedCountries] = useState<string[]>(['BR', 'PT', 'RU']);
  const [currentChannel, setCurrentChannelState] = useState<Channel | null>(null);
  const [currentQueue, setCurrentQueue] = useState<Channel[]>([]);

  const refreshCountries = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const latest = await fetchCountries();
      setCountries(latest);
      await writeCache('countries', latest);
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Falha ao atualizar países');
    } finally {
      setSyncing(false);
      setLoadingCountries(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [cachedCountries, storedFavorites, storedHistory, storedPinned, storedCurrent, storedQueue] = await Promise.all([
        readCache<Country[]>('countries', 24 * 60 * 60 * 1000),
        readJson<Channel[]>(FAVORITES_KEY, []),
        readJson<Channel[]>(HISTORY_KEY, []),
        readJson<string[]>(PINNED_KEY, ['BR', 'PT', 'RU']),
        readJson<Channel | null>(CURRENT_KEY, null),
        readJson<Channel[]>(QUEUE_KEY, [])
      ]);
      if (!active) return;
      if (cachedCountries?.data?.length) {
        setCountries(cachedCountries.data);
        setLoadingCountries(false);
      }
      setFavorites(storedFavorites);
      setHistory(storedHistory);
      setPinnedCountries(storedPinned);
      setCurrentChannelState(storedCurrent);
      setCurrentQueue(storedQueue);
      if (!cachedCountries?.data?.length) await refreshCountries();
    })();
    return () => { active = false; };
  }, [refreshCountries]);

  const toggleFavorite = useCallback(async (channel: Channel) => {
    const next = toggleFavoriteInList(favorites, channel);
    setFavorites(next);
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }, [favorites]);

  const recordWatch = useCallback(async (channel: Channel) => {
    const next = [channel, ...history.filter((item) => item.id !== channel.id)].slice(0, 30);
    setHistory(next);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  }, [history]);

  const togglePinnedCountry = useCallback(async (code: string) => {
    const next = pinnedCountries.includes(code)
      ? pinnedCountries.filter((item) => item !== code)
      : [code, ...pinnedCountries].slice(0, 12);
    setPinnedCountries(next);
    await AsyncStorage.setItem(PINNED_KEY, JSON.stringify(next));
  }, [pinnedCountries]);

  const setCurrentChannel = useCallback(async (channel: Channel, queue?: Channel[]) => {
    setCurrentChannelState(channel);
    await AsyncStorage.setItem(CURRENT_KEY, JSON.stringify(channel));
    if (queue?.length) {
      setCurrentQueue(queue);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    }
  }, []);

  const clearLocalData = useCallback(async () => {
    await removeAllNexoraData();
    await AsyncStorage.multiRemove([FAVORITES_KEY, HISTORY_KEY, PINNED_KEY, CURRENT_KEY, QUEUE_KEY]);
    setFavorites([]);
    setHistory([]);
    setPinnedCountries([]);
    setCurrentChannelState(null);
    setCurrentQueue([]);
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    countries,
    loadingCountries,
    syncing,
    syncError,
    favorites,
    history,
    pinnedCountries,
    currentChannel,
    currentQueue,
    refreshCountries,
    toggleFavorite,
    isFavorite: (id) => favorites.some((item) => item.id === id),
    recordWatch,
    togglePinnedCountry,
    setCurrentChannel,
    clearLocalData
  }), [countries, loadingCountries, syncing, syncError, favorites, history, pinnedCountries, currentChannel, currentQueue, refreshCountries, toggleFavorite, recordWatch, togglePinnedCountry, setCurrentChannel, clearLocalData]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp must be used inside AppProvider');
  return value;
}
