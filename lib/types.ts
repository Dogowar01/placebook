export type LocationTheme =
  | "modern"
  | "country"
  | "city"
  | "rural"
  | "coastal"
  | "mountain";

export type LocationCategory =
  | "town"
  | "city"
  | "restaurant"
  | "attraction"
  | "campsite"
  | "hidden_gem"
  | "national_park"
  | "beach"
  | "mountain"
  | "road_trip";

export interface FoodEntry {
  id: string;
  name: string;
  category: "breakfast" | "lunch" | "dinner" | "snack" | "drink" | "dessert";
  rating: number;
  notes?: string;
  restaurant?: string;
}

export interface PhotoEntry {
  id: string;
  dataUrl: string;
  caption?: string;
  takenAt?: string;
}

export interface Location {
  id: string;
  name: string;
  country: string;
  region?: string;
  lat: number;
  lng: number;
  theme: LocationTheme;
  category: LocationCategory;
  visitedAt: string;
  rating: number;
  photos: PhotoEntry[];
  highlights: string[];
  notes: string;
  food: FoodEntry[];
  peopleMet: string[];
  hiddenGems: string[];
  mood?: string;
  weather?: string;
  costs?: number;
  wouldReturn: boolean;
  visitCount: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  condition: (locations: Location[]) => boolean;
}
