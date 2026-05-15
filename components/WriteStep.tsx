import { useMemo, useState, useEffect, useRef } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '@/styles/shared'
import { EXAMPLES } from '@/constants/examples';

const LOADING_MESSAGES = [
  'Analyzing text patterns...',
  'Loading voice model...',
  'Generating phonemes...',
  'Waking Pedro up...',
  'Pedro is getting a coffee...',
  'Now brushing his teeth...',
  'Gargling...',
  'Almost there, clearing his throat...',
  'Getting in front of the mic...',
  'Rendering speech output...',
];

interface WriteProps {
  text: string;
  setText: (t: string) => void;
  loading: boolean;
  handleGenerate: () => void;
  spaceStatus: string;
  error: string | null;
}

export default function Write({
  text,
  setText,
  loading,
  handleGenerate,
  spaceStatus,
  error
}: WriteProps) {

  const placeholder = useMemo(
    () => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)],
    []
  );

  const [msgIndex, setMsgIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) {
      setMsgIndex(0);
      intervalRef.current = setInterval(() => {
        setMsgIndex(i => (i + 1) % LOADING_MESSAGES.length);
      }, 2500);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loading]);

  return (
    <>
      <ScrollView contentContainerStyle={styles.stepContent}>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder={placeholder}
          placeholderTextColor="#555"
          value={text}
          onChangeText={setText}
        />
        <TouchableOpacity
          style={[
            styles.primaryButton,
            (!text.trim() || loading || spaceStatus !== 'ready') &&
            styles.primaryButtonDisabled,
          ]}
          disabled={!text.trim() || loading || spaceStatus !== 'ready'}
          onPress={handleGenerate}
        >
          <Text style={styles.primaryButtonText}>
            {loading ? LOADING_MESSAGES[msgIndex] : '✦  Generate Voice'}
          </Text>
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </>
  );
}