// src/components/trip/TripSettingsPanel.tsx
// ✅ FINAL: Conditional Google Autocomplete or simple inputs

import React, { useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { FaCar, FaBicycle } from 'react-icons/fa';
import TripGenerationCard from './TripGenerationCard';
import TestimonialsGallery from './TestimonialsGallery';
import CarRentalShowcase from './CarRentalShowcase';
import { useTripStore } from '../../stores/tripStore';

// --- Types ---

interface TripSettingsPanelProps {
  transport: 'car' | 'bike';
  setTransport: (transport: 'car' | 'bike') => void;
  tripType: 'one' | 'return';
  setTripType: (tripType: 'one' | 'return') => void;
  departureCity: string;
  setDepartureCity: (city: string) => void;
  destinationCity: string;
  setDestinationCity: (city: string) => void;
  onDepartureSelect: (city: string, lat: number, lng: number) => void;
  onDestinationSelect: (city: string, lat: number, lng: number) => void;
  interests: string[];
  onToggleInterest: (interest: string) => void;
  onGenerateTrip: () => void;
  isGenerating: boolean;
  useGoogleMaps: boolean;  // ✅ NEW: Determines if Google Autocomplete is available
}

// --- Helper Components ---

const RadioSelector = ({ 
  selected, 
  onClick, 
  label, 
  icon 
}: { 
  selected: boolean; 
  onClick: () => void; 
  label: string; 
  icon: React.ReactNode 
}) => (
  <button 
    onClick={onClick}
    className="flex items-center gap-2 group focus:outline-none"
  >
    <div className={`
      w-5 h-5 rounded-full border flex items-center justify-center transition-colors
      ${selected ? 'border-teal-900' : 'border-gray-300 group-hover:border-teal-500'}
    `}>
      {selected && <div className="w-2.5 h-2.5 bg-teal-900 rounded-full" />}
    </div>
    <div className={`text-xl ${selected ? 'text-teal-900' : 'text-gray-400'}`}>
      {icon}
    </div>
    <span className={`text-sm font-medium ${selected ? 'text-teal-900' : 'text-gray-500'}`}>
      {label}
    </span>
  </button>
);

const CheckboxSelector = ({
  checked,
  onClick,
  label
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) => (
  <button onClick={onClick} className="flex items-center gap-2 group">
    <div className={`
      w-4 h-4 rounded flex items-center justify-center transition-colors
      ${checked ? 'bg-teal-900 text-white' : 'bg-gray-200 text-transparent hover:bg-gray-300'}
    `}>
      <CheckCircleSolidIcon className="w-4 h-4" />
    </div>
    <span className={`text-sm font-bold ${checked ? 'text-teal-900' : 'text-gray-500'}`}>
      {label}
    </span>
  </button>
);

const InterestCheckbox = ({
  label,
  checked,
  onClick
}: {
  label: string;
  checked: boolean;
  onClick: () => void;
}) => (
  <button onClick={onClick} className="flex items-center gap-2 group">
    <div className={`transition-colors ${checked ? 'text-teal-900' : 'text-gray-300 group-hover:text-teal-500'}`}>
      {checked ? (
        <CheckCircleSolidIcon className="w-5 h-5" />
      ) : (
        <CheckCircleIcon className="w-5 h-5" />
      )}
    </div>
    <span className={`text-xs font-bold ${checked ? 'text-teal-900' : 'text-gray-400'}`}>
      {label}
    </span>
  </button>
);

// --- Main Component ---

const TripSettingsPanel: React.FC<TripSettingsPanelProps> = ({
  transport,
  setTransport,
  tripType,
  setTripType,
  departureCity,
  setDepartureCity,
  destinationCity,
  setDestinationCity,
  onDepartureSelect,
  onDestinationSelect,
  interests,
  onToggleInterest,
  onGenerateTrip,
  isGenerating,
  useGoogleMaps
}) => {
  const { t } = useTranslation();
  const { generatedStops } = useTripStore();
  
  const departureInputRef = useRef<HTMLInputElement>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const departureAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const destinationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const hasResult = generatedStops.length > 0;

  // Initialize Google Autocomplete (only if using Google Maps)
  useEffect(() => {
    if (!useGoogleMaps) return; // Skip if not using Google Maps
    if (!window.google?.maps?.places) {
      console.log('⏳ Waiting for Google Maps to load...');
      return;
    }

    // Departure autocomplete
    if (departureInputRef.current && !departureAutocompleteRef.current) {
      console.log('🔧 Initializing departure autocomplete');
      
      try {
        departureAutocompleteRef.current = new google.maps.places.Autocomplete(
          departureInputRef.current,
          { types: ['(cities)'] }
        );

        departureAutocompleteRef.current.addListener('place_changed', () => {
          const place = departureAutocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            const city = place.formatted_address || place.name || '';
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            console.log('📍 Departure place selected:', city);
            onDepartureSelect(city, lat, lng);
          }
        });
      } catch (error) {
        console.error('Error initializing departure autocomplete:', error);
      }
    }

    // Destination autocomplete
    if (destinationInputRef.current && !destinationAutocompleteRef.current) {
      console.log('🔧 Initializing destination autocomplete');
      
      try {
        destinationAutocompleteRef.current = new google.maps.places.Autocomplete(
          destinationInputRef.current,
          { types: ['(cities)'] }
        );

        destinationAutocompleteRef.current.addListener('place_changed', () => {
          const place = destinationAutocompleteRef.current?.getPlace();
          if (place?.geometry?.location) {
            const city = place.formatted_address || place.name || '';
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            console.log('📍 Destination place selected:', city);
            onDestinationSelect(city, lat, lng);
          }
        });
      } catch (error) {
        console.error('Error initializing destination autocomplete:', error);
      }
    }
  }, [useGoogleMaps, onDepartureSelect, onDestinationSelect]);

  // Simple geocoding fallback for Leaflet (when Google Maps not available)
  const handleSimpleGeocoding = async (city: string, isDestination: boolean) => {
    try {
      // Use Nominatim (OpenStreetMap) geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const displayName = data[0].display_name;
        
        console.log(`📍 ${isDestination ? 'Destination' : 'Departure'} geocoded:`, displayName);
        
        if (isDestination) {
          onDestinationSelect(displayName, lat, lng);
        } else {
          onDepartureSelect(displayName, lat, lng);
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F7] p-6 pb-20 md:pb-6">
      
      <div className={`transition-all duration-500 ${hasResult ? 'mb-4' : 'mb-8'}`}>
        
        {/* Row 1: Transport & Trip Type */}
        <div className="flex flex-wrap items-center flex-col justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <RadioSelector
              selected={transport === 'car'}
              onClick={() => setTransport('car')}
              label={t('trips.carTrip')}
              icon={<FaCar />}
            />
            <RadioSelector
              selected={transport === 'bike'}
              onClick={() => setTransport('bike')}
              label={t('trips.bikeTrip')}
              icon={<FaBicycle />}
            />
          </div>

          <div className="flex items-center gap-4">
            <CheckboxSelector
              checked={tripType === 'one'}
              onClick={() => setTripType('one')}
              label={t('trips.oneWay')}
            />
            <CheckboxSelector
              checked={tripType === 'return'}
              onClick={() => setTripType('return')}
              label={t('trips.returnWay')}
            />
          </div>
        </div>

        {/* Row 2: City Inputs */}
        <div className="space-y-4 mb-8">
          {/* Departure City */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
              {t('trips.departureCity')}
            </label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
              <input
                ref={departureInputRef}
                type="text"
                value={departureCity}
                onChange={(e) => {
                  console.log('✏️ Departure typing:', e.target.value);
                  setDepartureCity(e.target.value);
                }}
                onBlur={(e) => {
                  // For Leaflet mode, geocode on blur if not already geocoded
                  if (!useGoogleMaps && e.target.value && !departureAutocompleteRef.current) {
                    handleSimpleGeocoding(e.target.value, false);
                  }
                }}
                placeholder={t('trips.enterDepartureCity') || 'Enter departure city'}
                className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium text-gray-900"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {useGoogleMaps ? 'Start typing and select from suggestions' : 'Enter city name and press Enter'}
            </p>
          </div>

          {/* Destination City */}
          {tripType === 'one' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2">
                {t('trips.destinationCity')}
              </label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                <input
                  ref={destinationInputRef}
                  type="text"
                  value={destinationCity}
                  onChange={(e) => {
                    console.log('✏️ Destination typing:', e.target.value);
                    setDestinationCity(e.target.value);
                  }}
                  onBlur={(e) => {
                    // For Leaflet mode, geocode on blur
                    if (!useGoogleMaps && e.target.value && !destinationAutocompleteRef.current) {
                      handleSimpleGeocoding(e.target.value, true);
                    }
                  }}
                  onKeyDown={(e) => {
                    // For Leaflet mode, geocode on Enter
                    if (!useGoogleMaps && e.key === 'Enter' && e.currentTarget.value) {
                      handleSimpleGeocoding(e.currentTarget.value, true);
                    }
                  }}
                  placeholder={t('trips.enterDestinationCity') || 'Enter destination city'}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm font-medium text-gray-900"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {useGoogleMaps ? 'Start typing and select from suggestions' : 'Enter city name and press Enter'}
              </p>
            </div>
          )}
        </div>

        {/* Row 3: Interests */}
        <div className="flex flex-wrap gap-6 mb-8">
          <InterestCheckbox
            label={t('trips.outdoorsSport')}
            checked={interests.includes('outdoorsSport')}
            onClick={() => onToggleInterest('outdoorsSport')}
          />
          <InterestCheckbox
            label={t('trips.cultureMuseum')}
            checked={interests.includes('cultureMuseum')}
            onClick={() => onToggleInterest('cultureMuseum')}
          />
          <InterestCheckbox
            label={t('trips.fjordsMountains')}
            checked={interests.includes('fjordsMountains')}
            onClick={() => onToggleInterest('fjordsMountains')}
          />
        </div>

        {/* Row 4: Action Button */}
        <div className="flex items-center justify-center gap-4 mb-2">
           <h2 className="font-serif text-lg font-bold text-gray-800">{t('trips.tripGeneration')}</h2>
           {!hasResult && (
             <button
               onClick={onGenerateTrip}
               disabled={!destinationCity || isGenerating}
               className="px-6 py-1.5 bg-teal-800 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg shadow-teal-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isGenerating ? (
                 <>
                   <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                   {t('trips.generatingYourTrip')}
                 </>
               ) : (
                 <>
                   {t('trips.generateTrip')}
                   <MagnifyingGlassIcon className="w-4 h-4" />
                 </>
               )}
             </button>
           )}
        </div>
      </div>

      {/* --- RESULT SECTION --- */}
      {hasResult ? (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
           <TripGenerationCard 
             onGenerateTrip={onGenerateTrip}
             onStartNavigation={() => {}}
           />
        </div>
      ) : (
        /* Feature Showcase */
        <div className="flex-1">
           <TestimonialsGallery />
           <CarRentalShowcase />
        </div>
      )}

    </div>
  );
};

export default TripSettingsPanel;
