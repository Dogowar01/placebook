import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ value, onChange, readonly, size = 'md' }: Props) {
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 28 : 20;

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          disabled={readonly}
          onPress={() => onChange?.(star)}
          style={styles.star}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize }}>{star <= value ? '⭐' : '☆'}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  star: { padding: 1 },
});
