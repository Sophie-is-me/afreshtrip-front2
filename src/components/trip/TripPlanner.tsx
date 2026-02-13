// src/components/trip/TripPlanner.tsx
// ✅ FINAL: Conditional Google Maps or Leaflet, fixed coordinates

import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SparklesIcon } from '@heroicons/react/24/outline';
import BottomSheet from '../BottomSheet';
import TripSettingsPanel from './TripSettingsPanel';
import TripGenerationPanel from './TripGenerationPanel';
import GoogleTripMap from './GoogleTripMap';
import LeafletTripMap from './LeafletTripMap';
import WeatherSummary from './WeatherSummary';
import { useCurrentLocation as useCurrentLocationHook } from '../../hooks/useCurrentLocation';
import { useGoogleMapsScript } from '../../hooks/useGoogleMapsScript';
import type { RouteInfo, TripStop } from '../../types/trip';

const TripPlanner = () => {
  // --- ENVIRONMENT CHECKS ---
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const IS_CHINESE_VERSION = import.meta.env.VITE_IS_CHINESE_VERSION === 'true';
  
  // Use Google Maps only if:
  // 1. API key exists
  // 2. NOT Chinese version
  const USE_GOOGLE_MAPS = Boolean(GOOGLE_MAPS_API_KEY) && !IS_CHINESE_VERSION;

  console.log('🗺️ Map Mode:', USE_GOOGLE_MAPS ? 'Google Maps' : 'Leaflet.js');

  // --- HOOKS ---
  const { location: currentLocation, loading: locationLoading } = useCurrentLocationHook();
  const { loaded: mapsLoaded, error: mapsError } = useGoogleMapsScript();
  const location = useLocation();

  // --- LOCAL STATE ---
  const [transport, setTransport] = useState<'car' | 'bike'>('car');
  const [tripType, setTripType] = useState<'one' | 'return'>('one');
  const [departureCity, setDepartureCity] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [departureLat, setDepartureLat] = useState<number | null>(null);
  const [departureLng, setDepartureLng] = useState<number | null>(null);
  const [destinationLat, setDestinationLat] = useState<number | null>(null);
  const [destinationLng, setDestinationLng] = useState<number | null>(null);
  const [interests, setInterests] = useState<string[]>(['outdoorsSport']);
  const [isMobilePanelOpen, setMobilePanelOpen] = useState(false);
  
  // Route state
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [generatedStops, setGeneratedStops] = useState<TripStop[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- EFFECTS ---
  // Auto-detect and geocode current location
  useEffect(() => {
    if (!currentLocation || locationLoading) return;

    console.log('🌍 Current location detected:', currentLocation);
    
    // ✅ FIX: currentLocation has 'latitude' and 'longitude', not 'lat' and 'lng'
    const lat = currentLocation.latitude || currentLocation.lat;
    const lng = currentLocation.longitude || currentLocation.lng;
    
    if (!lat || !lng) {
      console.warn('⚠️ Invalid coordinates:', currentLocation);
      return;
    }

    // Set coordinates immediately
    setDepartureLat(lat);
    setDepartureLng(lng);
    setDepartureCity(currentLocation.city || currentLocation.address);
    
    // Reverse geocode to get full address (only if using Google Maps)
    if (USE_GOOGLE_MAPS && mapsLoaded && window.google) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { location: { lat, lng } },
        (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const address = results[0].formatted_address;
            console.log('✅ Geocoded address:', address);
            setDepartureCity(address);
          }
        }
      );
    }
  }, [currentLocation, locationLoading, USE_GOOGLE_MAPS, mapsLoaded]);

  // --- HANDLERS ---
  const handleToggleInterest = (interest: string) => {
    setInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleDepartureSelect = (city: string, lat: number, lng: number) => {
    console.log('📍 Departure selected:', city, lat, lng);
    setDepartureCity(city);
    setDepartureLat(lat);
    setDepartureLng(lng);
  };

  const handleDestinationSelect = (city: string, lat: number, lng: number) => {
    console.log('📍 Destination selected:', city, lat, lng);
    setDestinationCity(city);
    setDestinationLat(lat);
    setDestinationLng(lng);
  };

  const handleGenerateTrip = () => {
    if (!departureLat || !departureLng || !destinationLat || !destinationLng) {
      alert('Please select both departure and destination cities from the dropdown suggestions');
      return;
    }

    console.log('🚀 Generating trip...');
    setIsGenerating(true);
  };

  const handleRouteCalculated = (info: RouteInfo, stops: TripStop[]) => {
    console.log('✅ Route calculated:', info);
    setRouteInfo(info);
    setGeneratedStops(stops);
    setIsGenerating(false);
    
    if (window.innerWidth < 768) {
      setMobilePanelOpen(true);
    }
  };

  const handleStartNavigation = () => {
    if (!departureLat || !departureLng || !destinationLat || !destinationLng) return;
    
    const origin = `${departureLat},${departureLng}`;
    const destination = `${destinationLat},${destinationLng}`;
    const travelMode = transport === 'car' ? 'driving' : 'bicycling';
    
    const waypoints = generatedStops
      .map(stop => `${stop.lat},${stop.lng}`)
      .join('|');
    
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelMode}`;
    
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    
    console.log('🧭 Opening Google Maps:', url);
    window.open(url, '_blank');
  };

  const handleResetTrip = () => {
    setRouteInfo(null);
    setGeneratedStops([]);
    setDestinationCity('');
    setDestinationLat(null);
    setDestinationLng(null);
  };

  // Show error if Google Maps failed to load (when using Google Maps)
  if (USE_GOOGLE_MAPS && mapsError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p className="font-bold">Failed to load Google Maps</p>
          <p className="text-sm">{mapsError.message}</p>
        </div>
      </div>
    );
  }

  // Show loading state (only for Google Maps)
  if (USE_GOOGLE_MAPS && !mapsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full md:flex md:flex-row bg-[#F5F5F7] h-[calc(100vh-80px)] md:h-auto md:min-h-[calc(100vh-80px)]">
      
      {/* LEFT SIDEBAR */}
      <div className="hidden md:flex flex-col bg-[#F5F5F7] z-30 md:w-[420px] lg:w-[450px] md:shrink-0 border-r border-gray-200/50">
        <div className="flex-1 overflow-y-auto">
          {location.state?.focusTripPlanner && (
            <div className="mx-6 mt-6 mb-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white px-4 py-3 rounded-xl shadow-lg shadow-teal-600/20 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
               <div className="flex items-center gap-2">
                 <SparklesIcon className="w-5 h-5" />
                 <span className="text-sm font-bold">Plan your perfect route!</span>
               </div>
            </div>
          )}

          {!routeInfo ? (
            <TripSettingsPanel
              transport={transport}
              setTransport={setTransport}
              tripType={tripType}
              setTripType={setTripType}
              departureCity={departureCity}
              setDepartureCity={setDepartureCity}
              destinationCity={destinationCity}
              setDestinationCity={setDestinationCity}
              onDepartureSelect={handleDepartureSelect}
              onDestinationSelect={handleDestinationSelect}
              interests={interests}
              onToggleInterest={handleToggleInterest}
              onGenerateTrip={handleGenerateTrip}
              isGenerating={isGenerating}
              useGoogleMaps={USE_GOOGLE_MAPS}
            />
          ) : (
            <TripGenerationPanel
              routeInfo={routeInfo}
              stops={generatedStops}
              onStartNavigation={handleStartNavigation}
              onResetTrip={handleResetTrip}
              transport={transport}
            />
          )}
        </div>
      </div>

      {/* MAP AREA */}
      <div className="absolute inset-0 z-0 md:relative md:flex-1 md:p-1 md:pl-0">
        <div className="relative w-full h-full md:rounded-xl md:border md:border-white md:overflow-hidden md:shadow-sm bg-blue-50 md:h-[calc(100vh-90px)] md:sticky md:top-20">
          
          {/* ✅ CONDITIONAL MAP RENDERING */}
          {USE_GOOGLE_MAPS ? (
            <GoogleTripMap
              departureCoords={departureLat && departureLng ? { lat: departureLat, lng: departureLng } : null}
              destinationCoords={destinationLat && destinationLng ? { lat: destinationLat, lng: destinationLng } : null}
              transport={transport}
              tripType={tripType}
              interests={interests}
              isGenerating={isGenerating}
              onRouteCalculated={handleRouteCalculated}
            />
          ) : (
            <LeafletTripMap
              departureCoords={departureLat && departureLng ? { lat: departureLat, lng: departureLng } : null}
              destinationCoords={destinationLat && destinationLng ? { lat: destinationLat, lng: destinationLng } : null}
              transport={transport}
              onRouteCalculated={handleRouteCalculated}
            />
          )}
            
          {/* Weather Summary */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6 z-[1000] w-auto md:w-72">
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
          title={routeInfo ? "Trip Details" : "Trip Settings"}
        >
          <div className="flex-1 p-0 pb-24">
            {!routeInfo ? (
              <TripSettingsPanel
                transport={transport}
                setTransport={setTransport}
                tripType={tripType}
                setTripType={setTripType}
                departureCity={departureCity}
                setDepartureCity={setDepartureCity}
                destinationCity={destinationCity}
                setDestinationCity={setDestinationCity}
                onDepartureSelect={handleDepartureSelect}
                onDestinationSelect={handleDestinationSelect}
                interests={interests}
                onToggleInterest={handleToggleInterest}
                onGenerateTrip={handleGenerateTrip}
                isGenerating={isGenerating}
                useGoogleMaps={USE_GOOGLE_MAPS}
              />
            ) : (
              <TripGenerationPanel
                routeInfo={routeInfo}
                stops={generatedStops}
                onStartNavigation={handleStartNavigation}
                onResetTrip={handleResetTrip}
                transport={transport}
              />
            )}
          </div>
        </BottomSheet>
      </div>
    </div>
  );
};

export default TripPlanner;
