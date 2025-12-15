import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import TripSettingsPanel from './TripSettingsPanel';
import TripMap from './TripMap';
import WeatherSummary from './WeatherSummary';
import { tripService } from '../../services/tripService';
import { useTripStore } from '../../stores/tripStore';
import { useRefreshTrips } from '../../hooks/queries/useTripQueries';
import type { TripSettings } from '../../types/trip';
import { tripApiService, type CreateTripRequest } from '../../services/api/tripApiService';

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

  const location = useLocation();
  const refreshTripsMutation = useRefreshTrips();

  const generateTripMutation = useMutation({
    mutationFn: async (tripSettings: TripSettings) => {
      // Generate the trip locally first
      const localTrip = await tripService.generateTrip(tripSettings);
      
      // Convert to API format and save to backend
      const apiTripData: CreateTripRequest = {
        name: `${destinationCity} Trip`,
        destination: destinationCity,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        places: tripSettings.preferences.map((_, index) => ({
          name: `Stop ${index + 1}`,
          lat: localTrip.places[index]?.lat || 0,
          lng: localTrip.places[index]?.lng || 0,
          address: localTrip.places[index]?.name || `Location ${index + 1}`
        })),
        notes: `Generated trip with ${tripSettings.preferences.length} preferences`
      };
      
      const savedTrip = await tripApiService.createTrip(apiTripData);
      
      return { localTrip, savedTrip };
    },
    onSuccess: (result) => {
      const { localTrip } = result;
      
      // Use the actual places from the generated trip
      const stops = localTrip.places.map(place => place.name);

      setGeneratedStops(stops);
      setTrip(localTrip);

      // Use actual trip route data
      const distance = localTrip.route.distance;
      const duration = localTrip.route.duration;
      const timeHours = Math.floor(duration / 60);
      const timeMinutes = duration % 60;

      setTripDetails({
          time: timeHours > 0 ? `${timeHours}h ${timeMinutes}min` : `${timeMinutes}min`,
          distance: `${distance} km`,
          co2: `${Math.round(distance * 0.12)}g`
      });

      // Refresh trips data so the new trip appears in the trips page
      refreshTripsMutation.mutate();

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
        {/* Focus trip planner if navigated from trips page */}
        {location.state?.focusTripPlanner && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Ready to plan your trip! Fill in the details below.
          </div>
        )}
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