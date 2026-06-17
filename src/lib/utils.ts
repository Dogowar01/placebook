export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export const CATEGORY_EMOJI: Record<string, string> = {
  town: '🏘️', city: '🏙️', restaurant: '🍽️', attraction: '🎡',
  campsite: '⛺', hidden_gem: '💎', national_park: '🌲', beach: '🏖️',
  mountain: '⛰️', road_trip: '🚗',
};

export const CATEGORY_LABEL: Record<string, string> = {
  town: 'Town', city: 'City', restaurant: 'Restaurant', attraction: 'Attraction',
  campsite: 'Campsite', hidden_gem: 'Hidden Gem', national_park: 'National Park',
  beach: 'Beach', mountain: 'Mountain', road_trip: 'Road Trip',
};

export const PIN_COLORS: Record<string, string> = {
  town: '#6366F1', city: '#8B5CF6', restaurant: '#F59E0B', attraction: '#EC4899',
  campsite: '#10B981', hidden_gem: '#06B6D4', national_park: '#22C55E', beach: '#3B82F6',
  mountain: '#64748B', road_trip: '#EF4444',
};
