import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';
import { styles } from '@/styles/shared'
import { EXAMPLES } from '@/constants/examples';

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
  return (
    <>

      <ScrollView contentContainerStyle={styles.stepContent}>
        <TextInput
          style={styles.textArea}
          multiline
          placeholder="Type the text to synthesise…"
          placeholderTextColor="#555"
          value={text}
          onChangeText={setText}
        />

        <Text style={styles.sectionLabel}>Examples</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsRow}
        >
          {EXAMPLES.map((ex, i) => (
            <TouchableOpacity
              key={i}
              style={styles.chip}
              onPress={() => setText(ex)}
            >
              <Text style={styles.chipText} numberOfLines={2}>
                {ex}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

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
            {loading ? 'Generating…' : '✦  Generate Voice'}
          </Text>
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </>
  )
}