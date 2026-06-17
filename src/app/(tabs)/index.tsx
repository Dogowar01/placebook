import { useState, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import MapView, { Marker, Callout, MapPressEvent, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { usePlacebookStore } from '@/lib/store';
import { PIN_COLORS, CATEGORY_EMOJI } from '@/lib/utils';
import AddLocationModal from '@/components/AddLocationModal';
import type { Location } from '@/lib/types';

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const locations = usePlacebookStore((s) => s.locations);
  const [addMode, setAddMode] = useState(false);
  const [pendingCoord, setPendingCoord] = useState<{ lat: number; lng: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const mapRef = useRef<MapView>(null);

  const handleMapPress = useCallback((e: MapPressEvent) => {
    if (!addMode) return;
    const { latitude, longitude } = e.nativeEvent.coordinate;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPendingCoord({ lat: latitude, lng: longitude });
    setShowModal(true);
  }, [addMode]);

  function handleSaved(id: string) {
    setShowModal(false);
    setPendingCoord(null);
    setAddMode(false);
    router.push(`/location/${id}`);
  }

  function handleCancel() {
    setShowModal(false);
    setPendingCoord(null);
    setAddMode(false);
  }

  function enterAddMode() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAddMode(true);
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: -27,
          longitude: 134,
          latitudeDelta: 25,
          longitudeDelta: 25,
        }}
        onPress={handleMapPress}
        showsUserLocation
        showsCompass={false}
      >
        {locations.map((loc) => (
          <LocationMarker
            key={loc.id}
            location={loc}
            onPress={() => router.push(`/location/${loc.id}`)}
          />
        ))}

        {pendingCoord && (
          <Marker
            coordinate={{ latitude: pendingCoord.lat, longitude: pendingCoord.lng }}
            pinColor="#EF4444"
          />
        )}
      </MapView>

      {/* Top bar */}
      <View style={[styles.topBar, { top: insets.top + 12 }]}>
        <View style={styles.title}>
          <Text style={styles.titleEmoji}>📖</Text>
          <Text style={styles.titleText}>Placebook</Text>
          {locations.length > 0 && (
            <Text style={styles.count}>{locations.length}</Text>
          )}
        </View>
      </View>

      {/* Add mode banner */}
      {addMode && (
        <View style={[styles.banner, { top: insets.top + 72 }]}>
          <Text style={styles.bannerText}>📍 Tap the map to drop a pin</Text>
          <TouchableOpacity onPress={() => { setAddMode(false); setPendingCoord(null); }}>
            <Ionicons name="close" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Empty state */}
      {locations.length === 0 && !addMode && (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🗺️</Text>
            <Text style={styles.emptyTitle}>Your map awaits</Text>
            <Text style={styles.emptyBody}>
              Start building your personal history of everywhere you&apos;ve ever been.
            </Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={enterAddMode} activeOpacity={0.8}>
              <Text style={styles.emptyBtnText}>Drop your first pin 📍</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* FAB */}
      {!addMode && locations.length > 0 && (
        <TouchableOpacity
          style={[styles.fab, { bottom: 80 + insets.bottom }]}
          onPress={enterAddMode}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={30} color="#FFF" />
        </TouchableOpacity>
      )}

      {showModal && pendingCoord && (
        <AddLocationModal
          lat={pendingCoord.lat}
          lng={pendingCoord.lng}
          onSaved={handleSaved}
          onClose={handleCancel}
        />
      )}
    </View>
  );
}

function LocationMarker({ location, onPress }: { location: Location; onPress: () => void }) {
  const color = PIN_COLORS[location.category] || '#6366F1';
  const emoji = CATEGORY_EMOJI[location.category] || '📍';

  return (
    <Marker
      coordinate={{ latitude: location.lat, longitude: location.lng }}
      onCalloutPress={onPress}
    >
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Text style={styles.pinEmoji}>{emoji}</Text>
      </View>
      <Callout onPress={onPress}>
        <View style={styles.callout}>
          <Text style={styles.calloutName}>{location.name}</Text>
          <Text style={styles.calloutSub}>{location.country}</Text>
          <Text style={styles.calloutLink}>Open scrapbook →</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  titleEmoji: { fontSize: 20 },
  titleText: { fontSize: 16, fontWeight: '700', color: '#111827' },
  count: { fontSize: 12, color: '#9CA3AF', fontWeight: '500' },

  banner: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

  emptyOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyCard: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderRadius: 28,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 8 },
  emptyBody: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  emptyBtn: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  emptyBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },

  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },

  pin: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinEmoji: { fontSize: 16 },

  callout: { width: 180, padding: 10 },
  calloutName: { fontWeight: '700', fontSize: 14, color: '#111827' },
  calloutSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  calloutLink: { fontSize: 12, color: '#4F46E5', fontWeight: '600', marginTop: 6 },
});
