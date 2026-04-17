import { View, Text } from 'react-native';
import Slider from '@react-native-community/slider';
import { styles } from '@/styles/shared';
import { colors } from '@/constants/colors';

interface ParamRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}

export default function ParamRow({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: ParamRowProps) {
  return (
    <View style={styles.paramRow}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={styles.paramLabel}>{label}</Text>
          <Text style={styles.paramValue}>{value.toFixed(2)}</Text>
        </View>
        
        <Slider
          value={value}
          minimumValue={min}
          maximumValue={max}
          step={step}
          onValueChange={onChange} // This sends the new value back to TuneStep
          minimumTrackTintColor={colors.accent}
          maximumTrackTintColor={colors.border}
          thumbTintColor={colors.accent}
        />
      </View>
    </View>
  );
}