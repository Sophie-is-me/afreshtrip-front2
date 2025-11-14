import { create } from 'zustand';
import type { Trip, TripSettings } from '../types/trip';

interface TripState {
  currentTrip: Trip | null;
  tripSettings: TripSettings | null;
  isLoading: boolean;
  error: string | null;
  setTrip: (trip: Trip) => void;
  setTripSettings: (settings: TripSettings) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTrip: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTrip: null,
  tripSettings: null,
  isLoading: false,
  error: null,
  setTrip: (trip) => set({ currentTrip: trip }),
  setTripSettings: (settings) => set({ tripSettings: settings }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearTrip: () => set({ currentTrip: null, tripSettings: null, error: null }),
}));