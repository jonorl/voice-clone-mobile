import { useCallback, useState, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { File, Paths } from 'expo-file-system';
import { AudioPlayer } from 'expo-audio';
import { fetch } from 'expo/fetch';
import generateSpeech, { checkSpace } from '../api/gradioClient';

const HF_TOKEN = process.env.EXPO_PUBLIC_HF_TOKEN ?? '';
type SpaceStatus = 'checking' | 'ready' | 'sleeping' | 'error';

interface GenerateParams {
  player?: AudioPlayer,
  text: string;
  temperature: number;
  topK: number;
  topP: number;
  seed: number;
}

export default function useGenerateSpeech(player: AudioPlayer, onSuccess: () => void) {
  const [loading, setLoading] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [spaceStatus, setSpaceStatus] = useState<SpaceStatus>('checking');

  useEffect(() => {
    const checkStatus = async () => {
      setSpaceStatus('checking');
      const result = await checkSpace(HF_TOKEN);
      setSpaceStatus(result);
    };
    checkStatus();
  }, []);

  const generate = useCallback(async (params: GenerateParams) => {
    if (!params.text.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setError('');
    setAudioUri(null);

    try {
      const rawUrl = await generateSpeech(
        { text: params.text, temperature: params.temperature, top_p: params.topP, top_k: params.topK, seed: params.seed },
        HF_TOKEN
      );

      const audioResponse = await fetch(rawUrl, {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
      });
      if (!audioResponse.ok) throw new Error('Failed to fetch audio file');

      const outputFile = new File(Paths.cache, 'voice_clone_output.wav');
      if (outputFile.exists) outputFile.delete();
      outputFile.create();
      outputFile.write(await audioResponse.bytes());

      const uri = outputFile.uri;
      setAudioUri(uri);
      player.replace({ uri });
      setSpaceStatus('ready');
      onSuccess();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setSpaceStatus('sleeping');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  }, [player, onSuccess]);

  return { generate, loading, audioUri, error, spaceStatus, setSpaceStatus };
}