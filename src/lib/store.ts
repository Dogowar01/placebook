import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Location } from './types';

interface PlacebookStore {
  locations: Location[];
  addLocation: (location: Location) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;
  getLocation: (id: string) => Location | undefined;
}

export const usePlacebookStore = create<PlacebookStore>()(
  persist(
    (set, get) => ({
      locations: [],

      addLocation: (location) =>
        set((state) => ({ locations: [...state.locations, location] })),

      updateLocation: (id, updates) =>
        set((state) => ({
          locations: state.locations.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          ),
        })),

      deleteLocation: (id) =>
        set((state) => ({
          locations: state.locations.filter((l) => l.id !== id),
        })),

      getLocation: (id) => get().locations.find((l) => l.id === id),
    }),
    {
      name: 'placebook-data',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
