import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import {  SparklesIcon } from '@heroicons/react/24/outline';
import BottomSheet from '../BottomSheet';
import TripSettingsPanel from './TripSettingsPanel';
import TripMap from './TripMap';
import WeatherSummary from './WeatherSummary';
import { tripService } from '../../services/tripService';
import { useTripStore } from '../../stores/tripStore';
import { useRefreshTrips } from '../../hooks/queries/useTripQueries';
import { useCurrentLocation as useCurrentLocationHook } from '../../hooks/useCurrentLocation';
import type { TripSettings } from '../../types/trip';
import { tripApiService, type CreateTripRequest } from '../../services/api/tripApiService';

const TripPlanner = () => {
  // --- HOOKS ---
  const { location: currentLocation, loading: locationLoading } = useCurrentLocationHook();

  // --- LOCAL STATE ---
  const [transport, setTransport] = useState<'car' | 'bike'>('car');
  const [tripType, setTripType] = useState<'one' | 'return'>('return');
  const [departureCity, setDepartureCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [stations, setStations] = useState(3);
  const [duration, setDuration] = useState(1);
  const [interests, setInterests] = useState<string[]>(['outdoorsSport']);

  // --- EFFECTS ---
  useEffect(() => {
    if (currentLocation && !locationLoading) {
      setDepartureCity(currentLocation.city);
    }
  }, [currentLocation, locationLoading]);

  useEffect(() => {
    if (tripType === 'return') {
      setDestinationCity('');
    }
  }, [tripType, departureCity]);

  // --- STORE STATE ---
  const {
    currentTrip,
    setTrip,
    setGeneratedStops,
    setTripDetails,
    setIsGenerating,
    resetGenerationState,
    isMobilePanelOpen,
    setMobilePanelOpen
  } = useTripStore();

  const location = useLocation();
  const refreshTripsMutation = useRefreshTrips();

  // --- MUTATIONS ---
  const generateTripMutation = useMutation({
    mutationFn: async (tripSettings: TripSettings) => {
      const localTrip = await tripService.generateTrip(tripSettings);
      
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
      const stops = localTrip.places.map(place => place.name);

      setGeneratedStops(stops);
      setTrip(localTrip);

      const distance = localTrip.route.distance;
      const durationVal = localTrip.route.duration;
      const timeHours = Math.floor(durationVal / 60);
      const timeMinutes = durationVal % 60;

      setTripDetails({
          time: timeHours > 0 ? `${timeHours}h ${timeMinutes}min` : `${timeMinutes}min`,
          distance: `${distance} km`,
          co2: `${Math.round(distance * 0.12)}g`
      });

      refreshTripsMutation.mutate();
      setIsGenerating(false);
      
      if (window.innerWidth < 768) {
        setMobilePanelOpen(true);
      }
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
      budget: 1000,
      travelers: 1,
      preferences: interests,
      vehicle: transport,
    };
    generateTripMutation.mutate(settings);
  };

  const handleStartNavigation = () => {
    console.log('Starting navigation...');
  };

  return (
    <div className="relative w-full md:flex md:flex-row bg-[#F5F5F7] h-[calc(100vh-80px)] md:h-auto md:min-h-[calc(100vh-80px)]">
      
      {/* LEFT SIDEBAR */}
      <div className="hidden md:flex flex-col bg-[#F5F5F7] z-30 md:w-[480px] lg:w-[500px] md:shrink-0 border-r border-gray-200/50">
        <div className="flex-1 p-0">
          {location.state?.focusTripPlanner && (
            <div className="mx-6 mt-6 mb-2 bg-linear-to-r from-teal-600 to-teal-500 text-white px-4 py-3 rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
               <div className="flex items-center gap-2">
                 <SparklesIcon className="w-5 h-5" />
                 <span className="text-sm font-bold">Start your adventure here!</span>
               </div>
               <button className="opacity-80 hover:opacity-100 text-xs font-medium">Dismiss</button>
            </div>
          )}

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
      </div>

      {/* MAP AREA */}
      <div className="absolute inset-0 z-0 md:relative md:flex-1 md:p-1 md:pl-0">
        <div className={`
          relative w-full h-full
          md:rounded-xl md:border md:border-white md:overflow-hidden md:shadow-sm
          bg-blue-50
          md:h-[calc(100vh-90px)] md:sticky md:top-20
        `}>
            <TripMap trip={currentTrip} />
            
            {/* 
               Updated Weather Summary Positioning 
               Removed: shadow/border/blur classes (moved inside component)
            */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-1000 w-auto md:w-72">
              <WeatherSummary 
                onClick={() => {}} 
                className="origin-top-right transform scale-90 md:scale-100"
              />
            </div>
        </div>
      </div>

      {/* MOBILE BOTTOM SHEET */}
      <div className="md:hidden z-30">
        <BottomSheet
          isOpen={isMobilePanelOpen}
          onClose={() => setMobilePanelOpen(false)}
          title="Trip Settings"
        >
          <div className="flex-1 p-0 pb-24">
            {location.state?.focusTripPlanner && (
              <div className="mx-6 mt-6 mb-2 bg-linear-to-r from-teal-600 to-teal-500 text-white px-4 py-3 rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <SparklesIcon className="w-5 h-5" />
                   <span className="text-sm font-bold">Start your adventure here!</span>
                 </div>
                 <button className="opacity-80 hover:opacity-100 text-xs font-medium">Dismiss</button>
              </div>
            )}

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
        </BottomSheet>
      </div>
    </div>
  );
};

export default TripPlanner;