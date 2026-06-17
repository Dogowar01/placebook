import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePlacebookStore } from '@/lib/store';
import StarRating from '@/components/StarRating';

type Cat = 'all' | 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink' | 'dessert';

const CATS: { value: Cat; emoji: string; label: string }[] = [
  { value: 'all', emoji: '🍽️', label: 'All' },
  { value: 'breakfast', emoji: '🥐', label: 'Breakfast' },
  { value: 'lunch', emoji: '🥗', label: 'Lunch' },
  { value: 'dinner', emoji: '🍖', label: 'Dinner' },
  { value: 'snack', emoji: '🍿', label: 'Snack' },
  { value: 'drink', emoji: '☕', label: 'Drink' },
  { value: 'dessert', emoji: '🍰', label: 'Dessert' },
];

export default function FoodScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locations = usePlacebookStore((s) => s.locations);
  const [activeCat, setActiveCat] = useState<Cat>('all');
  const [sortBy, setSortBy] = useState<'rating' | 'recent'>('rating');

  const allFood = useMemo(() => {
    return locations
      .flatMap((loc) => loc.food.map((f) => ({ ...f, locationName: loc.name, locationId: loc.id, visitedAt: loc.visitedAt, country: loc.country })))
      .filter((f) => activeCat === 'all' || f.category === activeCat)
      .sort((a, b) => sortBy === 'rating' ? b.rating - a.rating : new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());
  }, [locations, activeCat, sortBy]);

  const totalFood = locations.reduce((s, l) => s + l.food.length, 0);

  if (totalFood === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top }]}>
        <Text style={styles.emptyEmoji}>🍽️</Text>
        <Text style={styles.emptyTitle}>Your food journal</Text>
        <Text style={styles.emptyBody}>Log meals when adding places to build your personal food collection.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/')}>
          <Text style={styles.emptyBtnText}>Add a place →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Food Journal</Text>
        <Text style={styles.subtitle}>{totalFood} meals & drinks logged</Text>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catBar} contentContainerStyle={styles.catBarContent}>
        {CATS.map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.catPill, activeCat === c.value && styles.catPillActive]}
            onPress={() => setActiveCat(c.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.catEmoji}>{c.emoji}</Text>
            <Text style={[styles.catLabel, activeCat === c.value && styles.catLabelActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sort */}
      <View style={styles.sortRow}>
        {(['rating', 'recent'] as const).map((s) => (
          <TouchableOpacity key={s} style={[styles.sortBtn, sortBy === s && styles.sortBtnActive]} onPress={() => setSortBy(s)}>
            <Text style={[styles.sortText, sortBy === s && styles.sortTextActive]}>
              {s === 'rating' ? 'Top Rated' : 'Most Recent'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {allFood.length === 0 ? (
          <View style={styles.emptyFilter}>
            <Text style={styles.emptyFilterText}>No {activeCat} entries yet</Text>
          </View>
        ) : (
          allFood.map((f, i) => {
            const cat = CATS.find((c) => c.value === f.category);
            return (
              <TouchableOpacity key={`${f.id}-${i}`} style={styles.foodItem} onPress={() => router.push(`/location/${f.locationId}`)} activeOpacity={0.8}>
                <View style={styles.foodIcon}>
                  <Text style={styles.foodIconEmoji}>{cat?.emoji || '🍽️'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.foodName} numberOfLines={1}>{f.name}</Text>
                  <Text style={styles.foodSub} numberOfLines={1}>{f.locationName} · {f.country}</Text>
                </View>
                <StarRating value={f.rating} readonly size="sm" />
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  empty: { flex: 1, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyEmoji: { fontSize: 52, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },

  catBar: { backgroundColor: '#FFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F3F4F6' },
  catBarContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  catPillActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  catEmoji: { fontSize: 14 },
  catLabel: { fontSize: 13, fontWeight: '500', color: '#374151' },
  catLabelActive: { color: '#FFF', fontWeight: '600' },

  sortRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E5E7EB' },
  sortBtnActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  sortText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  sortTextActive: { color: '#4338CA', fontWeight: '600' },

  list: { padding: 16, gap: 10 },
  emptyFilter: { alignItems: 'center', paddingVertical: 40 },
  emptyFilterText: { color: '#9CA3AF', fontSize: 14 },

  foodItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderRadius: 16, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  foodIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FEF3C7', alignItems: 'center', justifyContent: 'center' },
  foodIconEmoji: { fontSize: 22 },
  foodName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  foodSub: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
