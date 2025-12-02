import { create } from 'zustand';
import type { Trip, TripSettings } from '../types/trip';

interface TripState {
  currentTrip: Trip | null;
  tripSettings: TripSettings | null;
  isLoading: boolean;
  error: string | null;
  // New state for synchronization
  generatedStops: string[];
  visibleStops: string[];
  selectedStop: string | null;
  isGenerating: boolean;
  tripDetails: { time: string; distance: string; co2: string } | null;
  // Existing methods
  setTrip: (trip: Trip) => void;
  setTripSettings: (settings: TripSettings) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearTrip: () => void;
  // New methods for synchronization
  setGeneratedStops: (stops: string[]) => void;
  setVisibleStops: (stops: string[]) => void;
  setSelectedStop: (stop: string | null) => void;
  setIsGenerating: (generating: boolean) => void;
  setTripDetails: (details: { time: string; distance: string; co2: string } | null) => void;
  addVisibleStop: (stop: string) => void;
  resetGenerationState: () => void;
}

export const useTripStore = create<TripState>((set) => ({
  currentTrip: null,
  tripSettings: null,
  isLoading: false,
  error: null,
  // New state
  generatedStops: [],
  visibleStops: [],
  selectedStop: null,
  isGenerating: false,
  tripDetails: null,
  // Existing methods
  setTrip: (trip) => set({ currentTrip: trip }),
  setTripSettings: (settings) => set({ tripSettings: settings }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  clearTrip: () => set({
    currentTrip: null,
    tripSettings: null,
    error: null,
    generatedStops: [],
    visibleStops: [],
    selectedStop: null,
    tripDetails: null
  }),
  // New methods
  setGeneratedStops: (stops) => set({ generatedStops: stops }),
  setVisibleStops: (stops) => set({ visibleStops: stops }),
  setSelectedStop: (stop) => set({ selectedStop: stop }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  setTripDetails: (details) => set({ tripDetails: details }),
  addVisibleStop: (stop) => set((state) => ({
    visibleStops: [...state.visibleStops, stop],
    selectedStop: stop
  })),
  resetGenerationState: () => set({
    generatedStops: [],
    visibleStops: [],
    selectedStop: null,
    isGenerating: false,
    tripDetails: null
  }),
}));