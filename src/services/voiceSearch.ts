import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

export async function recognizeSearchVoice(): Promise<string | null> {
  if (Platform.OS === 'android') {
    const result = await IntentLauncher.startActivityAsync('android.speech.action.RECOGNIZE_SPEECH', {
      extra: {
        'android.speech.extra.LANGUAGE_MODEL': 'free_form',
        'android.speech.extra.LANGUAGE': 'pt-BR',
        'android.speech.extra.PROMPT': 'Diga o nome do canal ou país'
      }
    });
    const extras = result.extra as Record<string, unknown> | undefined;
    const values = extras?.['android.speech.extra.RESULTS'] || extras?.results;
    return Array.isArray(values) && typeof values[0] === 'string' ? values[0] : null;
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) throw new Error('Este navegador não oferece reconhecimento de voz.');
    return await new Promise<string | null>((resolve, reject) => {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR'; recognition.interimResults = false; recognition.maxAlternatives = 1;
      recognition.onresult = (event: any) => resolve(event.results?.[0]?.[0]?.transcript || null);
      recognition.onerror = (event: any) => reject(new Error(event.error === 'not-allowed' ? 'Permissão do microfone negada.' : 'Não foi possível reconhecer a voz.'));
      recognition.onnomatch = () => resolve(null);
      recognition.start();
    });
  }
  throw new Error('Busca por voz indisponível nesta plataforma.');
}
