import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPinIcon,
  PlusIcon, 
  MinusIcon,
  SparklesIcon,
  GlobeEuropeAfricaIcon,
  BuildingLibraryIcon,
  CameraIcon,
  KeyIcon,
  TruckIcon,
  TrophyIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { FaCar, FaBicycle } from 'react-icons/fa';
import TripGenerationCard from './TripGenerationCard';
import { useTripStore } from '../../stores/tripStore';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---

export interface RentalPreferences {
  enabled: boolean;
  type: 'economy' | 'suv' | 'luxury';
  transmission: 'auto' | 'manual';
}

interface TripSettingsPanelProps {
  transport: 'car' | 'bike';
  setTransport: (transport: 'car' | 'bike') => void;
  tripType: 'one' | 'return';
  setTripType: (tripType: 'one' | 'return') => void;
  departureCity: string;
  setDepartureCity: (city: string) => void;
  destinationCity: string;
  setDestinationCity: (city: string) => void;
  useCurrentLocation: boolean;
  setUseCurrentLocation: (use: boolean) => void;
  stations: number;
  setStations: (stations: number) => void;
  duration: number;
  setDuration: (duration: number) => void;
  interests: string[];
  onToggleInterest: (interest: string) => void;
  onGenerateTrip: () => void;
  onStartNavigation: () => void;
}

// --- Helper Components ---

interface TransportCardProps {
  type: 'car' | 'bike';
  selected: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}

const TransportCard: React.FC<TransportCardProps> = ({ selected, onClick, label, icon }) => (
  <button
    onClick={onClick}
    className={`
      relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 w-full group
      ${selected 
        ? 'border-teal-600 bg-teal-50/50 shadow-lg shadow-teal-900/5' 
        : 'border-gray-100 bg-white hover:border-teal-200 hover:bg-gray-50'
      }
    `}
  >
    <div className={`text-2xl mb-2 transition-colors ${selected ? 'text-teal-700' : 'text-gray-400 group-hover:text-teal-500'}`}>
      {icon}
    </div>
    <span className={`text-sm font-bold ${selected ? 'text-teal-900' : 'text-gray-500'}`}>
      {label}
    </span>
    {selected && (
      <motion.div 
        layoutId="activeTransport"
        className="absolute -top-2 -right-2 w-6 h-6 bg-teal-600 rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
      </motion.div>
    )}
  </button>
);

interface CounterProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
}

const Counter: React.FC<CounterProps> = ({ value, onChange, label, unit, min = 1, max = 30 }) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-1.5 shadow-sm hover:border-gray-300 transition-colors">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-teal-50 hover:text-teal-600 transition-colors disabled:opacity-50"
        disabled={value <= min}
      >
        <MinusIcon className="w-4 h-4" />
      </button>
      
      <span className="font-bold text-gray-800 tabular-nums">
        {value} <span className="text-gray-400 text-xs font-medium ml-0.5">{unit}</span>
      </span>
      
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 hover:bg-teal-50 hover:text-teal-600 transition-colors disabled:opacity-50"
        disabled={value >= max}
      >
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  </div>
);

interface InterestChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const InterestChip: React.FC<InterestChipProps> = ({ label, selected, onClick, icon }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`
      flex flex-col items-center justify-center p-3 h-20 rounded-2xl border transition-all duration-200
      ${selected 
        ? 'border-orange-200 bg-orange-50 text-orange-900 shadow-sm ring-1 ring-orange-200' 
        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm'
      }
    `}
  >
    <div className={`mb-1.5 ${selected ? 'text-orange-500' : 'text-gray-400'}`}>
      {icon}
    </div>
    <span className="text-xs font-semibold text-center leading-tight max-w-[90%] truncate">{label}</span>
  </motion.button>
);

const VehicleSelectionCard = ({ 
  label, 
  selected, 
  onClick, 
  icon, 
  price 
}: { 
  label: string, 
  selected: boolean, 
  onClick: () => void, 
  icon: React.ReactNode,
  price: string
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center p-2 py-3 rounded-xl border transition-all duration-200 ${
      selected 
        ? 'border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500 shadow-sm' 
        : 'border-gray-200 bg-white hover:border-teal-200 hover:bg-gray-50'
    }`}
  >
    <div className={`mb-1 ${selected ? 'text-teal-600' : 'text-gray-400'}`}>
      {icon}
    </div>
    <div className="text-xs font-bold">{label}</div>
    <div className="text-[10px] text-gray-500 font-medium">{price}/day</div>
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
  useCurrentLocation,
  setUseCurrentLocation,
  stations,
  setStations,
  duration,
  setDuration,
  interests,
  onToggleInterest,
  onGenerateTrip,
  onStartNavigation,
}) => {
  const { t } = useTranslation();
  const { generatedStops, isGenerating } = useTripStore();
  
  // Local state for Rental
  const [rentalPrefs, setRentalPrefs] = useState<RentalPreferences>({
    enabled: false,
    type: 'economy',
    transmission: 'auto'
  });

  const [hasStartedTyping, setHasStartedTyping] = useState(false);

  // Trigger progressive disclosure when destination is entered
  useEffect(() => {
    if (destinationCity.length > 2 && !hasStartedTyping) {
      setHasStartedTyping(true);
    }
  }, [destinationCity, hasStartedTyping]);

  const interestConfig = [
    { id: 'outdoorsSport', icon: <CameraIcon className="w-5 h-5" /> },
    { id: 'cultureMuseum', icon: <BuildingLibraryIcon className="w-5 h-5" /> },
    { id: 'fjordsMountains', icon: <GlobeEuropeAfricaIcon className="w-5 h-5" /> },
  ];

  const hasTrip = generatedStops.length > 0;

  const toggleRental = () => {
    setRentalPrefs(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  return (
    <div className="h-full flex flex-col relative bg-white/0">
      
      {/* 1. Header Section */}
      <div className="px-6 pt-8 pb-4 shrink-0">
        <h2 className="font-serif text-3xl font-bold text-teal-900 tracking-tight">
          {t('trips.planYourTrip')}
        </h2>
        <p className="text-sm font-medium text-gray-400 mt-1">Design your perfect Nordic adventure</p>
      </div>

      {/* 2. Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-8 scrollbar-hide">
        
        {/* --- A. HERO DESTINATION INPUT --- */}
        <div className="space-y-4">
          <div className="relative group">
            <div className={`absolute top-4 left-0 transition-colors duration-300 ${destinationCity ? 'text-teal-600' : 'text-gray-300'}`}>
              <SparklesIcon className="w-6 h-6" />
            </div>
            <input
              type="text"
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
              placeholder="Where to next?"
              className="w-full bg-transparent border-b-2 border-gray-100 py-3 pl-9 text-2xl md:text-3xl font-serif font-bold text-gray-800 placeholder-gray-300 focus:border-teal-500 focus:outline-none transition-all placeholder:font-serif"
            />
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex-1 relative group">
              <div className="absolute top-3 left-0 text-gray-300">
                <MapPinIcon className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={departureCity}
                onChange={(e) => setDepartureCity(e.target.value)}
                placeholder="Starting point"
                className="w-full bg-transparent border-b border-gray-100 py-2.5 pl-8 text-sm font-medium text-gray-600 focus:border-teal-500 focus:outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setUseCurrentLocation(!useCurrentLocation)}
              className={`p-2 rounded-full border transition-all ${
                useCurrentLocation 
                  ? 'bg-teal-50 border-teal-200 text-teal-600 shadow-sm' 
                  : 'bg-white border-gray-200 text-gray-400 hover:border-teal-200 hover:text-teal-500'
              }`}
              title={t('trips.usingCurrentLocation')}
            >
              <MapPinIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* --- B. PROGRESSIVE DETAILS --- */}
        <AnimatePresence>
          {hasStartedTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="space-y-8"
            >
              
              {/* Dates & Stations Row */}
              <div className="grid grid-cols-2 gap-4">
                <Counter
                  label={t('trips.duration')}
                  value={duration}
                  onChange={setDuration}
                  unit={t('trips.days')}
                  min={1}
                  max={14}
                />
                <Counter
                  label={t('trips.stations')}
                  value={stations}
                  onChange={setStations}
                  unit="stops"
                  min={1}
                  max={8}
                />
              </div>

              {/* Transport Selection */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('trips.transportation')}</span>
                   <div className="flex bg-gray-100 rounded-lg p-0.5">
                     <button 
                        onClick={() => setTripType('one')}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${tripType === 'one' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}
                     >
                       One-Way
                     </button>
                     <button 
                        onClick={() => setTripType('return')}
                        className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${tripType === 'return' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}
                     >
                       Round-Trip
                     </button>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <TransportCard 
                    type="car" 
                    label="Road Trip"
                    icon={<FaCar />} 
                    selected={transport === 'car'}
                    onClick={() => setTransport('car')}
                  />
                  <TransportCard 
                    type="bike" 
                    label="Cycling"
                    icon={<FaBicycle />} 
                    selected={transport === 'bike'}
                    onClick={() => setTransport('bike')}
                  />
                </div>
              </div>

              {/* Conditional Car Rental */}
              <AnimatePresence>
                {transport === 'car' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-gray-50/80 border border-gray-100 rounded-2xl p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <KeyIcon className="w-4 h-4 text-teal-600" />
                          <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Add Rental Car?</span>
                        </div>
                        <button
                          onClick={toggleRental}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                            rentalPrefs.enabled ? 'bg-teal-600' : 'bg-gray-300'
                          }`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${rentalPrefs.enabled ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>

                      {/* Options */}
                      {rentalPrefs.enabled && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                          <div className="grid grid-cols-3 gap-2">
                            <VehicleSelectionCard
                              label="Economy"
                              price="$45"
                              selected={rentalPrefs.type === 'economy'}
                              onClick={() => setRentalPrefs(p => ({...p, type: 'economy'}))}
                              icon={<BoltIcon className="w-5 h-5" />}
                            />
                            <VehicleSelectionCard
                              label="SUV"
                              price="$75"
                              selected={rentalPrefs.type === 'suv'}
                              onClick={() => setRentalPrefs(p => ({...p, type: 'suv'}))}
                              icon={<TruckIcon className="w-5 h-5" />}
                            />
                            <VehicleSelectionCard
                              label="Luxury"
                              price="$120"
                              selected={rentalPrefs.type === 'luxury'}
                              onClick={() => setRentalPrefs(p => ({...p, type: 'luxury'}))}
                              icon={<TrophyIcon className="w-5 h-5" />}
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Interests */}
              <div className="space-y-3 pb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{t('trips.interests')}</span>
                <div className="grid grid-cols-3 gap-3">
                  {interestConfig.map((config) => (
                    <InterestChip
                      key={config.id}
                      label={t(`trips.${config.id}`)}
                      selected={interests.includes(config.id)}
                      onClick={() => onToggleInterest(config.id)}
                      icon={config.icon}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 3. Action Footer (Sticky) */}
      <div className="p-6 pt-4 bg-white/80 backdrop-blur-md border-t border-gray-100 shrink-0 absolute bottom-0 inset-x-0 md:relative md:bg-transparent md:border-none md:p-6 md:pt-0">
        {!hasTrip && (
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)" }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerateTrip}
            disabled={!destinationCity || isGenerating}
            className={`
              w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
              ${!destinationCity || isGenerating
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                : 'bg-teal-900 text-white shadow-xl shadow-teal-900/20 border border-teal-800'
              }
            `}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span className="font-medium">Crafting your journey...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-5 h-5 text-teal-300" />
                <span className="font-serif tracking-wide">{t('trips.generateTrip')}</span>
              </>
            )}
          </motion.button>
        )}

        {(hasTrip || isGenerating) && (
          <div className="mt-0">
             <TripGenerationCard
              onGenerateTrip={onGenerateTrip}
              onStartNavigation={onStartNavigation}
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default TripSettingsPanel;