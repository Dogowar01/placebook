import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePlacebookStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { CATEGORY_EMOJI } from '@/lib/utils';
import StarRating from '@/components/StarRating';

export default function TimelineScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locations = usePlacebookStore((s) => s.locations);

  const byYear = useMemo(() => {
    const sorted = [...locations].sort((a, b) => new Date(b.visitedAt).getTime() - new Date(a.visitedAt).getTime());
    const groups: Record<string, typeof sorted> = {};
    sorted.forEach((loc) => {
      const year = new Date(loc.visitedAt).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(loc);
    });
    return Object.entries(groups).sort(([a], [b]) => parseInt(b) - parseInt(a));
  }, [locations]);

  if (locations.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top }]}>
        <Text style={styles.emptyEmoji}>⏳</Text>
        <Text style={styles.emptyTitle}>Your timeline awaits</Text>
        <Text style={styles.emptyBody}>Add places on the map to see your life scroll out here.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/')}>
          <Text style={styles.emptyBtnText}>Go to Map →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Timeline</Text>
        <Text style={styles.subtitle}>{locations.length} places across your life</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {byYear.map(([year, locs]) => (
          <View key={year} style={styles.yearGroup}>
            <View style={styles.yearHeader}>
              <View style={styles.yearBadge}>
                <Text style={styles.yearBadgeText}>{year.slice(2)}</Text>
              </View>
              <View>
                <Text style={styles.yearText}>{year}</Text>
                <Text style={styles.yearCount}>{locs.length} place{locs.length !== 1 ? 's' : ''}</Text>
              </View>
            </View>

            <View style={styles.timeline}>
              {locs.map((loc) => {
                const th = THEMES[loc.theme];
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={styles.timelineItem}
                    onPress={() => router.push(`/location/${loc.id}`)}
                    activeOpacity={0.85}
                  >
                    <View style={[styles.dot, { backgroundColor: loc.rating >= 4 ? '#4F46E5' : '#D1D5DB' }]} />
                    <View style={[styles.card, { backgroundColor: th.card, borderColor: th.cardBorder }]}>
                      {loc.photos[0] && (
                        <Image source={{ uri: loc.photos[0].uri }} style={styles.cardImg} contentFit="cover" />
                      )}
                      <View style={styles.cardBody}>
                        <View style={styles.cardTop}>
                          <View style={{ flex: 1 }}>
                            <View style={styles.nameRow}>
                              <Text style={styles.cardEmoji}>{CATEGORY_EMOJI[loc.category]}</Text>
                              <Text style={[styles.cardName, { color: th.text }]} numberOfLines={1}>{loc.name}</Text>
                            </View>
                            <Text style={[styles.cardSub, { color: th.textMuted }]} numberOfLines={1}>
                              {loc.region ? `${loc.region}, ` : ''}{loc.country}
                            </Text>
                          </View>
                          <StarRating value={loc.rating} readonly size="sm" />
                        </View>
                        <Text style={[styles.cardDate, { color: th.textMuted }]}>
                          <Ionicons name="time-outline" size={11} color={th.textMuted} />
                          {' '}{new Date(loc.visitedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}
                        </Text>
                        {loc.highlights[0] && (
                          <Text style={[styles.cardHighlight, { color: th.textMuted }]} numberOfLines={1}>
                            ✦ {loc.highlights[0]}
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
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

  scroll: { padding: 20 },
  yearGroup: { marginBottom: 28 },
  yearHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  yearBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  yearBadgeText: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  yearText: { fontWeight: '800', color: '#111827', fontSize: 16 },
  yearCount: { fontSize: 12, color: '#9CA3AF' },

  timeline: { marginLeft: 20, paddingLeft: 20, borderLeftWidth: 2, borderLeftColor: '#E0E7FF', gap: 12 },
  timelineItem: { position: 'relative' },
  dot: { position: 'absolute', left: -27, top: 16, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 2, elevation: 2 },

  card: { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5 },
  cardImg: { width: '100%', height: 120 },
  cardBody: { padding: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  cardEmoji: { fontSize: 15 },
  cardName: { fontSize: 14, fontWeight: '700', flex: 1 },
  cardSub: { fontSize: 12 },
  cardDate: { fontSize: 11, marginBottom: 4 },
  cardHighlight: { fontSize: 12, fontStyle: 'italic' },
});
