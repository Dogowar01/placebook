import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
  { name: 'index', label: 'Map', icon: 'map' as const },
  { name: 'timeline', label: 'Timeline', icon: 'time' as const },
  { name: 'food', label: 'Food', icon: 'restaurant' as const },
  { name: 'passport', label: 'Passport', icon: 'trophy' as const },
];

export default function PlacebookTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom || 8 }]}>
      {TABS.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => navigation.navigate(tab.name)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isFocused ? tab.icon : `${tab.icon}-outline` as any}
              size={24}
              color={isFocused ? '#4F46E5' : '#9CA3AF'}
            />
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  labelActive: {
    color: '#4F46E5',
  },
});
