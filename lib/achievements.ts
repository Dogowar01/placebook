import type { Achievement, Location } from "./types";

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_pin",
    name: "First Memory",
    description: "Add your very first location",
    icon: "📍",
    condition: (locs) => locs.length >= 1,
  },
  {
    id: "explorer_10",
    name: "Explorer",
    description: "Visit 10 different places",
    icon: "🗺️",
    condition: (locs) => locs.length >= 10,
  },
  {
    id: "world_traveller",
    name: "World Traveller",
    description: "Visit 50 different places",
    icon: "✈️",
    condition: (locs) => locs.length >= 50,
  },
  {
    id: "centurion",
    name: "Centurion",
    description: "Visit 100 different places",
    icon: "🏆",
    condition: (locs) => locs.length >= 100,
  },
  {
    id: "foodie",
    name: "Foodie",
    description: "Log 10 meals",
    icon: "🍽️",
    condition: (locs) =>
      locs.reduce((sum, l) => sum + l.food.length, 0) >= 10,
  },
  {
    id: "gourmet",
    name: "Gourmet",
    description: "Log 50 meals",
    icon: "👨‍🍳",
    condition: (locs) =>
      locs.reduce((sum, l) => sum + l.food.length, 0) >= 50,
  },
  {
    id: "photographer",
    name: "Photographer",
    description: "Add 25 photos",
    icon: "📸",
    condition: (locs) =>
      locs.reduce((sum, l) => sum + l.photos.length, 0) >= 25,
  },
  {
    id: "road_warrior",
    name: "Road Trip Warrior",
    description: "Add 3 road trip locations",
    icon: "🚗",
    condition: (locs) =>
      locs.filter((l) => l.category === "road_trip").length >= 3,
  },
  {
    id: "park_ranger",
    name: "Park Ranger",
    description: "Visit 5 national parks",
    icon: "🌲",
    condition: (locs) =>
      locs.filter((l) => l.category === "national_park").length >= 5,
  },
  {
    id: "coastal_explorer",
    name: "Coastal Explorer",
    description: "Visit 5 beaches",
    icon: "🏖️",
    condition: (locs) =>
      locs.filter((l) => l.category === "beach").length >= 5,
  },
  {
    id: "mountain_collector",
    name: "Mountain Collector",
    description: "Visit 5 mountains",
    icon: "⛰️",
    condition: (locs) =>
      locs.filter((l) => l.category === "mountain").length >= 5,
  },
  {
    id: "gem_hunter",
    name: "Gem Hunter",
    description: "Discover 10 hidden gems",
    icon: "💎",
    condition: (locs) =>
      locs.reduce((sum, l) => sum + l.hiddenGems.length, 0) >= 10,
  },
  {
    id: "five_star",
    name: "Five Star Life",
    description: "Give 5-star ratings to 10 places",
    icon: "⭐",
    condition: (locs) => locs.filter((l) => l.rating === 5).length >= 10,
  },
  {
    id: "globe_trotter",
    name: "Globe Trotter",
    description: "Visit 3 different countries",
    icon: "🌍",
    condition: (locs) =>
      new Set(locs.map((l) => l.country)).size >= 3,
  },
];

export function getUnlockedAchievements(locations: Location[]) {
  return ACHIEVEMENTS.filter((a) => a.condition(locations));
}
