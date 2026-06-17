import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Modal, StyleSheet, Pressable, Switch, Platform, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { usePlacebookStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { generateId, CATEGORY_EMOJI, CATEGORY_LABEL } from '@/lib/utils';
import StarRating from './StarRating';
import type { Location, LocationTheme, LocationCategory, FoodEntry } from '@/lib/types';

interface Props {
  lat: number;
  lng: number;
  onClose: () => void;
  onSaved: (id: string) => void;
}

type Step = 'basics' | 'theme' | 'details' | 'food' | 'memories';
const STEPS: Step[] = ['basics', 'theme', 'details', 'food', 'memories'];

const CATEGORIES: { value: LocationCategory; label: string }[] = [
  { value: 'town', label: 'Town' },
  { value: 'city', label: 'City' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'attraction', label: 'Attraction' },
  { value: 'campsite', label: 'Campsite' },
  { value: 'hidden_gem', label: 'Hidden Gem' },
  { value: 'national_park', label: 'National Park' },
  { value: 'beach', label: 'Beach' },
  { value: 'mountain', label: 'Mountain' },
  { value: 'road_trip', label: 'Road Trip' },
];

const MOODS = ['😄 Amazing', '😊 Good', '😐 Okay', '😴 Tired', '🤩 Blown Away', '😍 In Love'];
const WEATHER = ['☀️ Sunny', '⛅ Cloudy', '🌧️ Rainy', '❄️ Snowy', '🌫️ Foggy', '🌈 After Rain'];
const FOOD_CATS: FoodEntry['category'][] = ['breakfast', 'lunch', 'dinner', 'snack', 'drink', 'dessert'];

export default function AddLocationModal({ lat, lng, onClose, onSaved }: Props) {
  const insets = useSafeAreaInsets();
  const addLocation = usePlacebookStore((s) => s.addLocation);
  const [step, setStep] = useState<Step>('basics');
  const stepIndex = STEPS.indexOf(step);

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [region, setRegion] = useState('');
  const [category, setCategory] = useState<LocationCategory>('town');
  const [visitedAt] = useState(new Date().toISOString().split('T')[0]);
  const [theme, setTheme] = useState<LocationTheme>('modern');
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [highlights, setHighlights] = useState<string[]>(['']);
  const [hiddenGems, setHiddenGems] = useState<string[]>(['']);
  const [mood, setMood] = useState('');
  const [weather, setWeather] = useState('');
  const [wouldReturn, setWouldReturn] = useState(true);
  const [costs, setCosts] = useState('');
  const [food, setFood] = useState<FoodEntry[]>([]);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCat, setNewFoodCat] = useState<FoodEntry['category']>('lunch');
  const [newFoodRating, setNewFoodRating] = useState(3);
  const [photos, setPhotos] = useState<{ id: string; uri: string }[]>([]);

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo access to add memories.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      const saved = await Promise.all(
        result.assets.map(async (asset) => {
          const id = generateId();
          const ext = asset.uri.split('.').pop() || 'jpg';
          const dest = FileSystem.documentDirectory + `photo_${id}.${ext}`;
          await FileSystem.copyAsync({ from: asset.uri, to: dest });
          return { id, uri: dest };
        })
      );
      setPhotos((prev) => [...prev, ...saved]);
    }
  }

  function addFoodEntry() {
    if (!newFoodName.trim()) return;
    setFood((prev) => [...prev, { id: generateId(), name: newFoodName.trim(), category: newFoodCat, rating: newFoodRating }]);
    setNewFoodName('');
    setNewFoodRating(3);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleSave() {
    if (!name.trim() || !country.trim()) return;
    const location: Location = {
      id: generateId(),
      name: name.trim(),
      country: country.trim(),
      region: region.trim() || undefined,
      lat, lng, theme, category, visitedAt, rating,
      photos: photos.map((p) => ({ id: p.id, uri: p.uri })),
      highlights: highlights.filter(Boolean),
      notes, food,
      hiddenGems: hiddenGems.filter(Boolean),
      mood: mood || undefined,
      weather: weather || undefined,
      costs: costs ? parseFloat(costs) : undefined,
      wouldReturn,
      visitCount: 1,
    };
    addLocation(location);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSaved(location.id);
  }

  function next() {
    if (step === 'memories') handleSave();
    else setStep(STEPS[stepIndex + 1]);
  }

  function back() {
    if (stepIndex > 0) setStep(STEPS[stepIndex - 1]);
  }

  const canNext = step !== 'basics' || (name.trim().length > 0 && country.trim().length > 0);

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerBtn}>
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>New Place</Text>
            <View style={styles.dots}>
              {STEPS.map((s, i) => (
                <View key={s} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
              ))}
            </View>
          </View>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} keyboardShouldPersistTaps="handled">
          {/* BASICS */}
          {step === 'basics' && (
            <View style={styles.section}>
              <Field label="Place Name *">
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Grindelwald"
                  placeholderTextColor="#9CA3AF"
                  autoFocus
                />
              </Field>
              <View style={styles.row2}>
                <Field label="Country *" style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="Australia" placeholderTextColor="#9CA3AF" />
                </Field>
                <Field label="Region" style={{ flex: 1 }}>
                  <TextInput style={styles.input} value={region} onChangeText={setRegion} placeholder="Tasmania" placeholderTextColor="#9CA3AF" />
                </Field>
              </View>
              <Text style={styles.fieldLabel}>Category</Text>
              <View style={styles.grid2}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.pill, category === c.value && styles.pillActive]}
                    onPress={() => setCategory(c.value)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.pillEmoji}>{CATEGORY_EMOJI[c.value]}</Text>
                    <Text style={[styles.pillText, category === c.value && styles.pillTextActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* THEME */}
          {step === 'theme' && (
            <View style={styles.section}>
              <Text style={styles.hint}>Choose the look for this location&apos;s scrapbook page:</Text>
              <View style={styles.grid2}>
                {Object.values(THEMES).map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.themeCard, { backgroundColor: t.bg, borderColor: theme === t.id ? t.accent : t.cardBorder }, theme === t.id && styles.themeCardActive]}
                    onPress={() => { setTheme(t.id); Haptics.selectionAsync(); }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.themeEmoji}>{t.emoji}</Text>
                    <Text style={[styles.themeName, { color: t.text }]}>{t.name}</Text>
                    <Text style={[styles.themeDesc, { color: t.textMuted }]}>{t.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Preview */}
              <View style={[styles.preview, { backgroundColor: THEMES[theme].card, borderColor: THEMES[theme].cardBorder }]}>
                <Text style={[styles.previewLabel, { color: THEMES[theme].textMuted }]}>Preview</Text>
                <Text style={[styles.previewName, { color: THEMES[theme].text }]}>{name || 'Your Place'}</Text>
                <Text style={[styles.previewSub, { color: THEMES[theme].textMuted }]}>{country || 'Country'}</Text>
                <View style={[styles.previewBadge, { backgroundColor: THEMES[theme].badgeBg }]}>
                  <Text style={[styles.previewBadgeText, { color: THEMES[theme].badgeText }]}>
                    {CATEGORY_EMOJI[category]} {CATEGORY_LABEL[category]}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* DETAILS */}
          {step === 'details' && (
            <View style={styles.section}>
              <Field label="Your Rating">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </Field>
              <Field label="Notes">
                <TextInput
                  style={[styles.input, styles.textarea]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="What surprised you most? What will you remember?"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </Field>
              <Field label="Highlights">
                {highlights.map((h, i) => (
                  <View key={i} style={[styles.row2, { marginBottom: 8 }]}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={h}
                      onChangeText={(v) => setHighlights(highlights.map((x, idx) => idx === i ? v : x))}
                      placeholder="e.g. Lakeside walk at dawn"
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity onPress={() => setHighlights(highlights.filter((_, idx) => idx !== i))} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={20} color="#D1D5DB" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => setHighlights([...highlights, ''])} style={styles.addLink}>
                  <Ionicons name="add-circle-outline" size={16} color="#4F46E5" />
                  <Text style={styles.addLinkText}>Add highlight</Text>
                </TouchableOpacity>
              </Field>
              <Field label="Hidden Gems 💎">
                {hiddenGems.map((g, i) => (
                  <View key={i} style={[styles.row2, { marginBottom: 8 }]}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={g}
                      onChangeText={(v) => setHiddenGems(hiddenGems.map((x, idx) => idx === i ? v : x))}
                      placeholder="e.g. Unmarked track to the waterfall"
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity onPress={() => setHiddenGems(hiddenGems.filter((_, idx) => idx !== i))} style={styles.removeBtn}>
                      <Ionicons name="close-circle" size={20} color="#D1D5DB" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity onPress={() => setHiddenGems([...hiddenGems, ''])} style={styles.addLink}>
                  <Ionicons name="add-circle-outline" size={16} color="#4F46E5" />
                  <Text style={styles.addLinkText}>Add hidden gem</Text>
                </TouchableOpacity>
              </Field>
              <View style={styles.row2}>
                <Field label="Mood" style={{ flex: 1 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {MOODS.map((m) => (
                        <TouchableOpacity key={m} style={[styles.chip, mood === m && styles.chipActive]} onPress={() => setMood(mood === m ? '' : m)}>
                          <Text style={[styles.chipText, mood === m && styles.chipTextActive]}>{m}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </Field>
              </View>
              <View style={styles.row2}>
                <Field label="Weather" style={{ flex: 1 }}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {WEATHER.map((w) => (
                        <TouchableOpacity key={w} style={[styles.chip, weather === w && styles.chipActive]} onPress={() => setWeather(weather === w ? '' : w)}>
                          <Text style={[styles.chipText, weather === w && styles.chipTextActive]}>{w}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </Field>
              </View>
              <Field label="Estimated spend ($)">
                <TextInput
                  style={styles.input}
                  value={costs}
                  onChangeText={setCosts}
                  placeholder="0.00"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="decimal-pad"
                />
              </Field>
              <View style={styles.switchRow}>
                <Text style={styles.fieldLabel}>Would you return?</Text>
                <Switch value={wouldReturn} onValueChange={setWouldReturn} trackColor={{ true: '#4F46E5' }} />
              </View>
            </View>
          )}

          {/* FOOD */}
          {step === 'food' && (
            <View style={styles.section}>
              <Text style={styles.hint}>Log what you ate and drank:</Text>
              {food.map((f) => (
                <View key={f.id} style={styles.foodItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.foodName}>{f.name}</Text>
                    <Text style={styles.foodMeta}>{f.category} · {'⭐'.repeat(f.rating)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setFood(food.filter((x) => x.id !== f.id))}>
                    <Ionicons name="close-circle" size={20} color="#D1D5DB" />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.addFoodBox}>
                <Text style={styles.fieldLabel}>Add a meal / drink</Text>
                <TextInput
                  style={styles.input}
                  value={newFoodName}
                  onChangeText={setNewFoodName}
                  placeholder="e.g. Chicken schnitzel"
                  placeholderTextColor="#9CA3AF"
                />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                  <View style={styles.chipRow}>
                    {FOOD_CATS.map((c) => (
                      <TouchableOpacity key={c} style={[styles.chip, newFoodCat === c && styles.chipActive]} onPress={() => setNewFoodCat(c)}>
                        <Text style={[styles.chipText, newFoodCat === c && styles.chipTextActive]}>{c}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                <StarRating value={newFoodRating} onChange={setNewFoodRating} size="md" />
                <TouchableOpacity style={styles.addFoodBtn} onPress={addFoodEntry} activeOpacity={0.8}>
                  <Text style={styles.addFoodBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* MEMORIES / PHOTOS */}
          {step === 'memories' && (
            <View style={styles.section}>
              <Text style={styles.hint}>Add photos to your scrapbook:</Text>
              <View style={styles.photoGrid}>
                {photos.map((p, i) => (
                  <View key={p.id} style={styles.photoThumb}>
                    <Image source={{ uri: p.uri }} style={styles.photoImg} contentFit="cover" />
                    <TouchableOpacity style={styles.photoRemove} onPress={() => setPhotos(photos.filter((_, idx) => idx !== i))}>
                      <Ionicons name="close-circle" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity style={styles.photoAdd} onPress={pickPhoto} activeOpacity={0.7}>
                  <Ionicons name="camera" size={28} color="#9CA3AF" />
                  <Text style={styles.photoAddText}>Add photos</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.promptBox}>
                <Text style={styles.promptTitle}>Memory prompts:</Text>
                <Text style={styles.prompt}>🎯 What surprised you most about this place?</Text>
                <Text style={styles.prompt}>💡 What would you tell a friend visiting?</Text>
                <Text style={styles.prompt}>🔄 What would you do differently next time?</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {stepIndex > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={back} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={18} color="#374151" />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
            onPress={next}
            disabled={!canNext}
            activeOpacity={0.8}
          >
            <Text style={styles.nextBtnText}>
              {step === 'memories' ? 'Save Place 📍' : 'Next'}
            </Text>
            {step !== 'memories' && <Ionicons name="chevron-forward" size={18} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: object }) {
  return (
    <View style={[{ marginBottom: 16 }, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E5E7EB' },
  dotActive: { backgroundColor: '#4F46E5' },

  body: { flex: 1 },
  bodyContent: { padding: 20 },
  section: {},
  hint: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 18 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#FAFAFA',
  },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  row2: { flexDirection: 'row', gap: 12 },
  removeBtn: { padding: 6, alignSelf: 'center' },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  addLinkText: { color: '#4F46E5', fontSize: 13, fontWeight: '600' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },

  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  pillActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  pillEmoji: { fontSize: 14 },
  pillText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  pillTextActive: { color: '#4338CA', fontWeight: '600' },

  themeCard: {
    width: '47%', padding: 14, borderRadius: 16, borderWidth: 2,
    alignItems: 'flex-start',
  },
  themeCardActive: { shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  themeEmoji: { fontSize: 24, marginBottom: 4 },
  themeName: { fontWeight: '700', fontSize: 14 },
  themeDesc: { fontSize: 11, marginTop: 2 },

  preview: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginTop: 8 },
  previewLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  previewName: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  previewSub: { fontSize: 13 },
  previewBadge: { marginTop: 8, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  previewBadgeText: { fontSize: 12, fontWeight: '600' },

  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#E5E7EB' },
  chipActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  chipText: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  chipTextActive: { color: '#4338CA', fontWeight: '600' },

  foodItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8 },
  foodName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  foodMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  addFoodBox: { backgroundColor: '#F9FAFB', borderRadius: 16, padding: 16, marginTop: 8, gap: 8 },
  addFoodBtn: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  addFoodBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },

  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  photoThumb: { width: 100, height: 100, borderRadius: 12, overflow: 'hidden' },
  photoImg: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4 },
  photoAdd: {
    width: 100, height: 100, borderRadius: 12,
    borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  photoAddText: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },

  promptBox: { backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, gap: 8 },
  promptTitle: { fontWeight: '700', color: '#3730A3', fontSize: 13, marginBottom: 4 },
  prompt: { fontSize: 13, color: '#4338CA', lineHeight: 18 },

  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F3F4F6',
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  nextBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 14,
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
