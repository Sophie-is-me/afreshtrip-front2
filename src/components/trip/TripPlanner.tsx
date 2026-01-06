import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { ChevronUpIcon, ChevronDownIcon, SparklesIcon } from '@heroicons/react/24/outline';
import TripSettingsPanel from './TripSettingsPanel';
import TripMap from './TripMap';
import WeatherSummary from './WeatherSummary';
import { tripService } from '../../services/tripService';
import { useTripStore } from '../../stores/tripStore';
import { useRefreshTrips } from '../../hooks/queries/useTripQueries';
import type { TripSettings } from '../../types/trip';
import { tripApiService, type CreateTripRequest } from '../../services/api/tripApiService';

const TripPlanner = () => {
  // --- LOCAL STATE ---
  const [transport, setTransport] = useState<'car' | 'bike'>('car');
  const [tripType, setTripType] = useState<'one' | 'return'>('return');
  const [departureCity, setDepartureCity] = useState('Copenhagen');
  const [destinationCity, setDestinationCity] = useState('Copenhagen');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [stations, setStations] = useState(3);
  const [duration, setDuration] = useState(1);
  const [interests, setInterests] = useState<string[]>(['outdoorsSport']);

  // --- STORE STATE ---
  const {
    currentTrip,
    setTrip,
    setGeneratedStops,
    setTripDetails,
    setIsGenerating,
    resetGenerationState,
    // Mobile Sheet Controls
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
      
      // On mobile, collapse the panel slightly to show the route on map
      if (window.innerWidth < 768) {
        setMobilePanelOpen(false);
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
    <div className="relative w-full h-[calc(100vh-64px)] bg-gray-50/50 overflow-hidden">
      
      {/* 
        1. MAP LAYER 
        Occupies full background.
      */}
      <div className="absolute inset-0 z-0">
        <TripMap trip={currentTrip} />
        
        {/* Desktop Weather Widget - Floating nicely top right */}
        <div className="hidden md:block absolute top-8 right-8 z-20 w-80">
          <WeatherSummary 
            onClick={() => {}} 
            className="shadow-xl shadow-teal-900/5 ring-1 ring-white/50 backdrop-blur-md"
          />
        </div>

        {/* Mobile Map Controls (Visible when panel is collapsed) */}
        {!isMobilePanelOpen && (
          <button 
            onClick={() => setMobilePanelOpen(true)}
            className="md:hidden absolute bottom-24 right-4 z-10 bg-teal-600 text-white p-3 rounded-full shadow-lg shadow-teal-600/30 animate-bounce"
          >
            <ChevronUpIcon className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* 
        2. INTERACTIVE PANEL LAYER ("Floating Island")
        Desktop: Floating Card with generous margins and glass effect
        Mobile: Bottom Sheet with snap-point feel
      */}
      <div 
        className={`
          absolute z-30 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
          
          /* Desktop: Floating Island */
          md:top-6 md:left-6 md:bottom-6 md:w-[480px] md:translate-y-0
          
          /* Mobile: Bottom Sheet */
          inset-x-0 bottom-0 
          ${isMobilePanelOpen ? 'top-14' : 'top-[88%]'} 
        `}
      >
        <div className={`
          h-full w-full flex flex-col overflow-hidden
          bg-white/90 backdrop-blur-xl border border-white/60
          shadow-2xl shadow-black/10
          
          /* Rounding */
          rounded-t-3xl md:rounded-3xl
        `}>
          
          {/* Mobile Handle / Toggle Area */}
          <div 
            className="md:hidden w-full bg-white/50 backdrop-blur-sm border-b border-gray-100/50 flex flex-col items-center pt-3 pb-3 cursor-pointer shrink-0 hover:bg-white/80 transition-colors"
            onClick={() => setMobilePanelOpen(!isMobilePanelOpen)}
          >
            {/* The Grab Handle Pill */}
            <div className="w-12 h-1.5 bg-gray-300 rounded-full mb-2" />
            
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
              {isMobilePanelOpen ? (
                <>
                  <ChevronDownIcon className="w-3 h-3" />
                  <span>View Map</span>
                </>
              ) : (
                <>
                  <ChevronUpIcon className="w-3 h-3" />
                  <span>Plan Trip</span>
                </>
              )}
            </div>
          </div>

          {/* Contextual Toast Notification (Desktop Only) */}
          {location.state?.focusTripPlanner && (
            <div className="hidden md:flex mx-6 mt-6 mb-2 bg-linear-to-r from-teal-600 to-teal-500 text-white px-4 py-3 rounded-xl shadow-lg shadow-teal-600/20 items-center justify-between animate-in fade-in slide-in-from-top-4">
               <div className="flex items-center gap-2">
                 <SparklesIcon className="w-5 h-5" />
                 <span className="text-sm font-bold">Start your adventure here!</span>
               </div>
               <button className="opacity-80 hover:opacity-100 text-xs font-medium">Dismiss</button>
            </div>
          )}

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent p-1">
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
      </div>
    </div>
  );
};

export default TripPlanner;