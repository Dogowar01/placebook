import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlacebookStore } from '@/lib/store';
import { ACHIEVEMENTS, getUnlockedAchievements } from '@/lib/achievements';

const CAT_LABELS: Record<string, string> = {
  town: 'Towns', city: 'Cities', restaurant: 'Restaurants', attraction: 'Attractions',
  campsite: 'Campsites', hidden_gem: 'Hidden Gems', national_park: 'National Parks',
  beach: 'Beaches', mountain: 'Mountains', road_trip: 'Road Trips',
};
const CAT_EMOJI: Record<string, string> = {
  town: '🏘️', city: '🏙️', restaurant: '🍽️', attraction: '🎡',
  campsite: '⛺', hidden_gem: '💎', national_park: '🌲', beach: '🏖️',
  mountain: '⛰️', road_trip: '🚗',
};

export default function PassportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locations = usePlacebookStore((s) => s.locations);
  const unlocked = useMemo(() => getUnlockedAchievements(locations), [locations]);

  const stats = useMemo(() => {
    const countries = new Set(locations.map((l) => l.country)).size;
    const totalPhotos = locations.reduce((s, l) => s + l.photos.length, 0);
    const totalFood = locations.reduce((s, l) => s + l.food.length, 0);
    const totalGems = locations.reduce((s, l) => s + l.hiddenGems.length, 0);
    const fiveStars = locations.filter((l) => l.rating === 5).length;
    const byCategory = Object.entries(CAT_LABELS)
      .map(([key, label]) => ({ key, label, emoji: CAT_EMOJI[key], count: locations.filter((l) => l.category === key).length }))
      .filter((s) => s.count > 0)
      .sort((a, b) => b.count - a.count);
    const topCountries = Object.entries(locations.reduce<Record<string, number>>((acc, l) => { acc[l.country] = (acc[l.country] || 0) + 1; return acc; }, {}))
      .sort(([, a], [, b]) => b - a).slice(0, 5);
    return { countries, totalPhotos, totalFood, totalGems, fiveStars, byCategory, topCountries };
  }, [locations]);

  if (locations.length === 0) {
    return (
      <View style={[styles.empty, { paddingTop: insets.top }]}>
        <Text style={styles.emptyEmoji}>🏆</Text>
        <Text style={styles.emptyTitle}>Your passport</Text>
        <Text style={styles.emptyBody}>Build your collection and unlock achievements as you explore.</Text>
        <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/')}>
          <Text style={styles.emptyBtnText}>Start exploring →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = unlocked.length / ACHIEVEMENTS.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      {/* Header gradient */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} style={[styles.headerGrad, { paddingTop: insets.top + 16 }]}>
        <View style={styles.passportIcon}>
          <Text style={{ fontSize: 36 }}>📖</Text>
        </View>
        <Text style={styles.headerTitle}>My Passport</Text>
        <Text style={styles.headerSub}>{unlocked.length}/{ACHIEVEMENTS.length} achievements</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatCard emoji="📍" value={locations.length} label="Places" accent="#4F46E5" />
          <StatCard emoji="🌍" value={stats.countries} label="Countries" accent="#7C3AED" />
          <StatCard emoji="📸" value={stats.totalPhotos} label="Photos" accent="#EC4899" />
          <StatCard emoji="🍽️" value={stats.totalFood} label="Meals" accent="#F59E0B" />
          <StatCard emoji="💎" value={stats.totalGems} label="Hidden Gems" accent="#06B6D4" />
          <StatCard emoji="⭐" value={stats.fiveStars} label="5-Star Places" accent="#EAB308" />
        </View>

        {/* Collection */}
        {stats.byCategory.length > 0 && (
          <Section title="Collection">
            {stats.byCategory.map((cat) => {
              const max = Math.max(...stats.byCategory.map((c) => c.count));
              return (
                <View key={cat.key} style={styles.catRow}>
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catLabelRow}>
                      <Text style={styles.catName}>{cat.label}</Text>
                      <Text style={styles.catCount}>{cat.count}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${(cat.count / max) * 100}%` }]} />
                    </View>
                  </View>
                </View>
              );
            })}
          </Section>
        )}

        {/* Top countries */}
        {stats.topCountries.length > 0 && (
          <Section title="Top Countries">
            {stats.topCountries.map(([country, count], i) => (
              <View key={country} style={styles.countryRow}>
                <Text style={styles.countryRank}>#{i + 1}</Text>
                <Text style={styles.countryName}>{country}</Text>
                <Text style={styles.countryCount}>{count} place{count !== 1 ? 's' : ''}</Text>
              </View>
            ))}
          </Section>
        )}

        {/* Achievements */}
        <Section title={`Achievements · ${unlocked.length}/${ACHIEVEMENTS.length}`}>
          {ACHIEVEMENTS.map((a) => {
            const isUnlocked = unlocked.some((u) => u.id === a.id);
            return (
              <View key={a.id} style={[styles.achievement, isUnlocked && styles.achievementUnlocked]}>
                <Text style={[styles.achievementIcon, !isUnlocked && styles.locked]}>{a.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.achievementName, !isUnlocked && styles.lockedText]}>{a.name}</Text>
                  <Text style={styles.achievementDesc}>{a.description}</Text>
                </View>
                {isUnlocked && <Text style={styles.checkmark}>✓</Text>}
              </View>
            );
          })}
        </Section>
      </View>
    </ScrollView>
  );
}

function StatCard({ emoji, value, label, accent }: { emoji: string; value: number; label: string; accent: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
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

  headerGrad: { paddingHorizontal: 20, paddingBottom: 28, alignItems: 'center', gap: 8 },
  passportIcon: { width: 64, height: 64, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  progressBar: { width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginTop: 8 },
  progressFill: { height: '100%', backgroundColor: '#FFF', borderRadius: 3 },

  content: { padding: 16, gap: 16, marginTop: -12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '30%', flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 14, alignItems: 'center', gap: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 10, color: '#9CA3AF', textAlign: 'center' },

  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, paddingHorizontal: 4 },
  sectionCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },

  catRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  catEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  catLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  catName: { fontSize: 13, fontWeight: '500', color: '#374151' },
  catCount: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },
  barTrack: { height: 5, backgroundColor: '#F3F4F6', borderRadius: 3 },
  barFill: { height: '100%', backgroundColor: '#4F46E5', borderRadius: 3 },

  countryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  countryRank: { fontSize: 12, fontWeight: '700', color: '#D1D5DB', width: 24 },
  countryName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },
  countryCount: { fontSize: 13, fontWeight: '700', color: '#4F46E5' },

  achievement: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: 12 },
  achievementUnlocked: { backgroundColor: '#EEF2FF' },
  achievementIcon: { fontSize: 24 },
  locked: { opacity: 0.3 },
  achievementName: { fontSize: 13, fontWeight: '700', color: '#1E1B4B' },
  achievementDesc: { fontSize: 11, color: '#9CA3AF', marginTop: 1 },
  lockedText: { color: '#9CA3AF' },
  checkmark: { color: '#4F46E5', fontWeight: '700', fontSize: 16 },
});
