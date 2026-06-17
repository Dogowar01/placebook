import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { usePlacebookStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { CATEGORY_EMOJI, CATEGORY_LABEL } from '@/lib/utils';
import StarRating from '@/components/StarRating';

const { width } = Dimensions.get('window');

export default function LocationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const location = usePlacebookStore((s) => s.getLocation(id));
  const deleteLocation = usePlacebookStore((s) => s.deleteLocation);
  const [lightboxUri, setLightboxUri] = useState<string | null>(null);

  if (!location) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundEmoji}>🔍</Text>
        <Text style={styles.notFoundText}>Place not found</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const th = THEMES[location.theme];

  function confirmDelete() {
    Alert.alert(
      'Delete this place?',
      `This will permanently remove ${location!.name} and all its memories.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteLocation(location!.id); router.back(); } },
      ]
    );
  }

  const heroPhoto = location.photos[0];

  return (
    <View style={[styles.container, { backgroundColor: th.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Hero */}
        <View style={styles.hero}>
          {heroPhoto ? (
            <Image source={{ uri: heroPhoto.uri }} style={styles.heroImg} contentFit="cover" />
          ) : (
            <View style={[styles.heroPlaceholder, { backgroundColor: th.accentLight }]}>
              <Text style={styles.heroPlaceholderEmoji}>{CATEGORY_EMOJI[location.category]}</Text>
            </View>
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.5)']}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Nav buttons over hero */}
        <View style={[styles.navRow, { top: insets.top + 12 }]}>
          <TouchableOpacity style={styles.navBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={22} color="#FFF" />
          </TouchableOpacity>
          <View style={[styles.themeBadge, { backgroundColor: th.badgeBg }]}>
            <Text style={[styles.themeBadgeText, { color: th.badgeText }]}>{th.emoji} {th.name}</Text>
          </View>
          <TouchableOpacity style={styles.navBtn} onPress={confirmDelete}>
            <Ionicons name="trash-outline" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title card */}
          <Card th={th} style={{ marginBottom: 12 }}>
            <View style={[styles.categoryBadge, { backgroundColor: th.badgeBg }]}>
              <Text style={[styles.categoryBadgeText, { color: th.badgeText }]}>
                {CATEGORY_EMOJI[location.category]} {CATEGORY_LABEL[location.category]}
              </Text>
            </View>
            <Text style={[styles.locationName, { color: th.text }]}>{location.name}</Text>
            <Text style={[styles.locationSub, { color: th.textMuted }]}>
              <Ionicons name="location-outline" size={13} color={th.textMuted} />
              {' '}{location.region ? `${location.region}, ` : ''}{location.country}
            </Text>
            <View style={styles.ratingRow}>
              <StarRating value={location.rating} readonly size="md" />
              <Text style={[styles.dateText, { color: th.textMuted }]}>
                {new Date(location.visitedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            {location.mood && <Text style={[styles.moodText, { color: th.textMuted }]}>{location.mood}</Text>}
            {location.weather && <Text style={[styles.moodText, { color: th.textMuted }]}>{location.weather}</Text>}
          </Card>

          {/* Notes */}
          {!!location.notes && (
            <Card th={th} style={{ marginBottom: 12 }}>
              <SectionLabel label="Notes" th={th} />
              <Text style={[styles.notesText, { color: th.text, fontStyle: th.fontStyle }]}>
                "{location.notes}"
              </Text>
            </Card>
          )}

          {/* Highlights */}
          {location.highlights.length > 0 && (
            <Card th={th} style={{ marginBottom: 12 }}>
              <SectionLabel label="Highlights" th={th} />
              {location.highlights.map((h, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, { color: th.accent }]}>✦</Text>
                  <Text style={[styles.bulletText, { color: th.text }]}>{h}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Photos */}
          {location.photos.length > 0 && (
            <Card th={th} style={{ marginBottom: 12 }}>
              <SectionLabel label={`Photos · ${location.photos.length}`} th={th} />
              <View style={styles.photoGrid}>
                {location.photos.map((p) => (
                  <TouchableOpacity key={p.id} style={[styles.photoThumb, { borderColor: th.cardBorder }]} onPress={() => setLightboxUri(p.uri)}>
                    <Image source={{ uri: p.uri }} style={styles.photoImg} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            </Card>
          )}

          {/* Food */}
          {location.food.length > 0 && (
            <Card th={th} style={{ marginBottom: 12 }}>
              <SectionLabel label={`Food & Drink · ${location.food.length}`} th={th} />
              {location.food.map((f, i) => (
                <View key={f.id} style={[styles.foodRow, i < location.food.length - 1 && { borderBottomWidth: 1, borderBottomColor: th.divider, paddingBottom: 10, marginBottom: 10 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.foodName, { color: th.text }]}>{f.name}</Text>
                    <Text style={[styles.foodCat, { color: th.textMuted }]}>{f.category}</Text>
                  </View>
                  <StarRating value={f.rating} readonly size="sm" />
                </View>
              ))}
            </Card>
          )}

          {/* Hidden gems */}
          {location.hiddenGems.length > 0 && (
            <Card th={th} style={{ marginBottom: 12 }}>
              <SectionLabel label="Hidden Gems 💎" th={th} />
              {location.hiddenGems.map((g, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={{ color: '#06B6D4' }}>◆</Text>
                  <Text style={[styles.bulletText, { color: th.text }]}>{g}</Text>
                </View>
              ))}
            </Card>
          )}

          {/* Stats */}
          <Card th={th}>
            <View style={styles.statsRow}>
              <Stat value={location.photos.length} label="Photos" accent={th.accent} text={th.textMuted} />
              <View style={[styles.statDivider, { backgroundColor: th.divider }]} />
              <Stat value={location.food.length} label="Meals" accent={th.accent} text={th.textMuted} />
              <View style={[styles.statDivider, { backgroundColor: th.divider }]} />
              <Stat value={location.wouldReturn ? '✓' : '✗'} label="Return?" accent={th.accent} text={th.textMuted} />
            </View>
            {!!location.costs && (
              <Text style={[styles.costText, { color: th.textMuted, borderTopColor: th.divider }]}>
                Spent: <Text style={{ color: th.text, fontWeight: '700' }}>${location.costs.toFixed(0)}</Text>
              </Text>
            )}
          </Card>
        </View>
      </ScrollView>

      {/* Lightbox */}
      <Modal visible={!!lightboxUri} transparent animationType="fade">
        <TouchableOpacity style={styles.lightbox} activeOpacity={1} onPress={() => setLightboxUri(null)}>
          {lightboxUri && (
            <Image source={{ uri: lightboxUri }} style={styles.lightboxImg} contentFit="contain" />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function Card({ th, children, style }: { th: ReturnType<typeof THEMES[keyof typeof THEMES]> extends never ? any : any; children: React.ReactNode; style?: object }) {
  return (
    <View style={[styles.card, { backgroundColor: th.card, borderColor: th.cardBorder }, style]}>
      {children}
    </View>
  );
}

function SectionLabel({ label, th }: { label: string; th: any }) {
  return <Text style={[styles.sectionLabel, { color: th.textMuted }]}>{label.toUpperCase()}</Text>;
}

function Stat({ value, label, accent, text }: { value: number | string; label: string; accent: string; text: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundEmoji: { fontSize: 40, marginBottom: 8 },
  notFoundText: { fontSize: 16, color: '#6B7280' },
  back: { color: '#4F46E5', fontWeight: '600', marginTop: 12 },

  hero: { height: 260, overflow: 'hidden' },
  heroImg: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  heroPlaceholderEmoji: { fontSize: 80, opacity: 0.4 },

  navRow: {
    position: 'absolute',
    left: 16, right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  themeBadge: {
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
  },
  themeBadgeText: { fontSize: 12, fontWeight: '600' },

  content: { paddingHorizontal: 16, paddingTop: 12 },
  card: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 16,
  },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },

  categoryBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 8 },
  categoryBadgeText: { fontSize: 12, fontWeight: '600' },
  locationName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  locationSub: { fontSize: 13, marginBottom: 10 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateText: { fontSize: 12 },
  moodText: { fontSize: 13, marginTop: 4 },

  notesText: { fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bulletDot: { fontWeight: '700', fontSize: 14, marginTop: 1 },
  bulletText: { fontSize: 14, flex: 1, lineHeight: 20 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoThumb: { width: (width - 32 - 32 - 16) / 3, aspectRatio: 1, borderRadius: 10, overflow: 'hidden', borderWidth: 2 },
  photoImg: { width: '100%', height: '100%' },

  foodRow: { flexDirection: 'row', alignItems: 'center' },
  foodName: { fontSize: 14, fontWeight: '600' },
  foodCat: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },

  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statDivider: { width: 1, height: 36, marginHorizontal: 8 },
  statValue: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  costText: { fontSize: 13, textAlign: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1 },

  lightbox: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center' },
  lightboxImg: { width: '100%', height: '80%' },
});
