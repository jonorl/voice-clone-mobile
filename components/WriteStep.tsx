import { useState, useEffect } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '@/styles/shared'
import { EXAMPLES } from '@/constants/examples';

const LOADING_MESSAGES = [
  'Generating...',
  'Loading voice model...',
  'Creating phonemes...',
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

  // Picked once per mount, so the placeholder does not change while typing.
  const [placeholder] = useState(() => EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]);

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
          maxLength={1000}
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
            {loading ? <LoadingMessage /> : '✦  Generate Voice'}
          </Text>
        </TouchableOpacity>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </>
  );
}

// Mounted only while generating, so each run starts from the first message.
function LoadingMessage() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setIndex(i => (i + 1) % LOADING_MESSAGES.length), 2500);
    return () => clearInterval(interval);
  }, []);

  return <>{LOADING_MESSAGES[index]}</>;
}
