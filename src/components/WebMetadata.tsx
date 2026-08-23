import { useEffect } from 'react';
import { Platform } from 'react-native';

export function WebMetadata({ title, description }: { title: string; description: string }) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.title = title;
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    meta.content = description;
  }, [description, title]);
  return null;
}
