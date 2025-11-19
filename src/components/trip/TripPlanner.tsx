import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import TripSettingsPanel from './TripSettingsPanel';
import TripMap from './TripMap';
import WeatherSummary from './WeatherSummary';
import { mockApiClient } from '../../services/mockApi';
import { useTripStore } from '../../stores/tripStore';
import type { TripSettings, Trip } from '../../types/trip';

const TripPlanner = () => {
  // --- STATE MANAGEMENT ---
  const [transport, setTransport] = useState<'car' | 'bike'>('car');
  const [tripType, setTripType] = useState<'one' | 'return'>('return');
  const [departureCity, setDepartureCity] = useState('Copenhagen');
  const [destinationCity, setDestinationCity] = useState('Copenhagen');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [stations, setStations] = useState(3);
  const [duration, setDuration] = useState(1);
  const [interests, setInterests] = useState<string[]>(['outdoorsSport']);

  // Use Zustand store for trip data
  const {
    currentTrip,
    setTrip,
    setGeneratedStops,
    setTripDetails,
    setIsGenerating,
    resetGenerationState
  } = useTripStore();

  const generateTripMutation = useMutation({
    mutationFn: (tripSettings: TripSettings) => mockApiClient.generateTrip(tripSettings),
    onSuccess: (trip: Trip) => {
      // Use the actual places from the generated trip
      const stops = trip.places.map(place => place.name);

      setGeneratedStops(stops);
      setTrip(trip);

      // Use actual trip route data
      const distance = trip.route.distance;
      const duration = trip.route.duration;
      const timeHours = Math.floor(duration / 60);
      const timeMinutes = duration % 60;

      setTripDetails({
          time: timeHours > 0 ? `${timeHours}h ${timeMinutes}min` : `${timeMinutes}min`,
          distance: `${distance} km`,
          co2: `${Math.round(distance * 0.12)}g`
      });

      setIsGenerating(false);
    },
    onError: (error: Error) => {
      console.error('Trip generation failed:', error);
      setIsGenerating(false);
    },
  });

  const handleToggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleGenerateTrip = () => {
    setIsGenerating(true);
    resetGenerationState();

    const settings: TripSettings = {
      destination: destinationCity,
      duration,
      budget: 1000, // Mock value
      travelers: 1, // Mock value
      preferences: interests,
      vehicle: transport,
    };
    generateTripMutation.mutate(settings);
  };

  const handleStartNavigation = () => {
    // TODO: Implement navigation start logic
    console.log('Starting navigation...');
  };

  return (
    <div className="w-full flex flex-col bg-linear-to-br from-slate-50 via-blue-50 to-teal-50 relative">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Desktop: Two-panel layout */}
      <div className="hidden md:flex md:gap-4 md:ps-8 md:pb-4 md:min-h-[calc(100vh-64px)] relative z-10">
        {/* Left Panel - Trip Planning Components */}
        <div className="flex-[0_0_35%] flex flex-col gap-6 bg-transparent scrollbar-thin">
          <TripSettingsPanel
            transport={transport}
            setTransport={setTransport}
            tripType={tripType}
            setTripType={setTripType}
            departureCity={departureCity}
            setDepartureCity={setDepartureCity}
            destinationCity={destinationCity}
            setDestinationCity={setDestinationCity}
            useCurrentLocation={useCurrentLocation}
            setUseCurrentLocation={setUseCurrentLocation}
            stations={stations}
            setStations={setStations}
            duration={duration}
            setDuration={setDuration}
            interests={interests}
            onToggleInterest={handleToggleInterest}
            onGenerateTrip={handleGenerateTrip}
            onStartNavigation={handleStartNavigation}
          />
        </div>

        {/* Center Panel - Map with Weather Overlay */}
        <div className="flex-1 sticky top-20 md:h-[calc(100vh-64px)] shadow-2xs border-4 border-white/50">
          <TripMap trip={currentTrip} />

          {/* Weather Widget Overlay - Top Right */}
          <div className="absolute top-4 right-4 z-20 w-80">
            <WeatherSummary onClick={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;