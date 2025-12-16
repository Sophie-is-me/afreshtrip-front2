import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  MapPinIcon, 
  PlayIcon, 
  PlusIcon, 
  MinusIcon,
  SparklesIcon,
  GlobeEuropeAfricaIcon,
  BuildingLibraryIcon,
  CameraIcon,
  KeyIcon,
  TruckIcon,
  TrophyIcon,
  BoltIcon
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

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string; icon?: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

const SegmentedControl = <T extends string>({ options, value, onChange, label }: SegmentedControlProps<T>) => (
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
    <div className="flex bg-gray-100/80 p-1 rounded-xl relative">
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              isActive 
                ? 'bg-white text-teal-700 shadow-sm ring-1 ring-black/5' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            {option.icon && <span className={isActive ? 'text-teal-600' : 'text-gray-400'}>{option.icon}</span>}
            {option.label}
          </button>
        );
      })}
    </div>
  </div>
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
  <div className="flex flex-col gap-2">
    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
    <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-2 px-3">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors"
        disabled={value <= min}
      >
        <MinusIcon className="w-5 h-5" />
      </button>
      
      <span className="font-semibold text-gray-800 tabular-nums">
        {value} <span className="text-gray-400 text-sm font-normal">{unit}</span>
      </span>
      
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-teal-600 transition-colors"
        disabled={value >= max}
      >
        <PlusIcon className="w-5 h-5" />
      </button>
    </div>
  </div>
);

interface InterestCardProps {
  id: string;
  label: string;
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}

const InterestCard: React.FC<InterestCardProps> = ({ label, selected, onClick, icon }) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`relative flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all duration-200 h-24 ${
      selected 
        ? 'border-teal-500 bg-teal-50 text-teal-800 shadow-sm' 
        : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200 hover:bg-gray-50'
    }`}
  >
    <div className={`mb-2 ${selected ? 'text-teal-600' : 'text-gray-400'}`}>
      {icon}
    </div>
    <span className="text-xs font-medium text-center leading-tight">{label}</span>
    {selected && (
      <div className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full" />
    )}
  </motion.button>
);

const HeroInput = ({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  icon,
  large = false 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string; 
  label?: string; 
  icon?: React.ReactNode;
  large?: boolean;
}) => (
  <div className="relative group">
    {label && <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5">{label}</label>}
    <div className={`relative flex items-center transition-all duration-300 ${large ? 'transform group-focus-within:scale-[1.01]' : ''}`}>
      <div className={`absolute left-3 md:left-4 text-gray-400 pointer-events-none ${large ? 'w-6 h-6' : 'w-5 h-5'}`}>
        {icon}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none text-gray-800 placeholder-gray-400 ${
          large 
            ? 'pl-12 py-4 text-lg md:text-xl font-bold shadow-sm' 
            : 'pl-10 py-2.5 text-sm font-medium'
        }`}
      />
    </div>
  </div>
);

// --- NEW COMPONENT: Vehicle Selector ---
const VehicleSelectionCard = ({ 
  // type, 
  label, 
  selected, 
  onClick, 
  icon, 
  price 
}: { 
  // type: string, 
  label: string, 
  selected: boolean, 
  onClick: () => void, 
  icon: React.ReactNode,
  price: string
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${
      selected 
        ? 'border-teal-500 bg-teal-50 text-teal-800 ring-1 ring-teal-500' 
        : 'border-gray-200 bg-white hover:border-teal-200 hover:bg-gray-50'
    }`}
  >
    <div className={`mb-2 ${selected ? 'text-teal-600' : 'text-gray-400'}`}>
      {icon}
    </div>
    <div className="text-sm font-bold">{label}</div>
    <div className="text-xs text-gray-500 font-medium">{price}/day</div>
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
  
  // Local state for Rental (can be lifted to parent if needed later)
  const [rentalPrefs, setRentalPrefs] = useState<RentalPreferences>({
    enabled: false,
    type: 'economy',
    transmission: 'auto'
  });

  const interestConfig = [
    { id: 'outdoorsSport', icon: <CameraIcon className="w-6 h-6" /> },
    { id: 'cultureMuseum', icon: <BuildingLibraryIcon className="w-6 h-6" /> },
    { id: 'fjordsMountains', icon: <GlobeEuropeAfricaIcon className="w-6 h-6" /> },
  ];

  const hasTrip = generatedStops.length > 0;

  const toggleRental = () => {
    setRentalPrefs(prev => ({ ...prev, enabled: !prev.enabled }));
  };

  return (
    <div className="h-full flex flex-col relative">
      
      {/* 1. Header Section */}
      <div className="px-5 pt-6 pb-2">
        <h2 className="text-2xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-teal-800 to-teal-600">
          {t('trips.planYourTrip')}
        </h2>
        <p className="text-sm text-gray-500 mt-1">Design your perfect Nordic adventure</p>
      </div>

      {/* 2. Form Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        
        {/* --- Locations --- */}
        <div className="space-y-4">
          <HeroInput
            label={t('trips.destinationCity')}
            value={destinationCity}
            onChange={setDestinationCity}
            placeholder="Where to?"
            icon={<SparklesIcon />}
            large={true}
          />

          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <HeroInput
                label={t('trips.departureCity')}
                value={departureCity}
                onChange={setDepartureCity}
                placeholder="Starting from..."
                icon={<MapPinIcon />}
              />
            </div>
            <button
              onClick={() => setUseCurrentLocation(!useCurrentLocation)}
              className={`p-2.5 rounded-xl border transition-all ${
                useCurrentLocation 
                  ? 'bg-teal-50 border-teal-200 text-teal-600' 
                  : 'bg-white border-gray-200 text-gray-400 hover:border-gray-300'
              }`}
              title={t('trips.usingCurrentLocation')}
            >
              <MapPinIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- Journey Details Grid --- */}
        <div className="grid grid-cols-2 gap-4">
          <SegmentedControl
            label={t('trips.tripType')}
            value={tripType}
            onChange={setTripType}
            options={[
              { value: 'one', label: t('trips.oneWay') },
              { value: 'return', label: t('trips.returnWay') }
            ]}
          />
          
          <SegmentedControl
            label={t('trips.transportation')}
            value={transport}
            onChange={setTransport}
            options={[
              { value: 'car', label: 'Car', icon: <FaCar /> },
              { value: 'bike', label: 'Bike', icon: <FaBicycle /> }
            ]}
          />
        </div>

        {/* --- CAR RENTAL SECTION (Conditional) --- */}
        <AnimatePresence>
          {transport === 'car' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-4 space-y-4">
                {/* Header / Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyIcon className="w-5 h-5 text-teal-700" />
                    <span className="text-sm font-bold text-teal-900">Need a rental vehicle?</span>
                  </div>
                  <button
                    onClick={toggleRental}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      rentalPrefs.enabled ? 'bg-teal-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        rentalPrefs.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Rental Options Grid */}
                {rentalPrefs.enabled && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3 pt-2"
                  >
                    <div className="grid grid-cols-3 gap-2">
                      <VehicleSelectionCard
                        // type="economy"
                        label="Economy"
                        price="$45"
                        selected={rentalPrefs.type === 'economy'}
                        onClick={() => setRentalPrefs(p => ({...p, type: 'economy'}))}
                        icon={<BoltIcon className="w-6 h-6" />}
                      />
                      <VehicleSelectionCard
                        // type="suv"
                        label="SUV"
                        price="$75"
                        selected={rentalPrefs.type === 'suv'}
                        onClick={() => setRentalPrefs(p => ({...p, type: 'suv'}))}
                        icon={<TruckIcon className="w-6 h-6" />}
                      />
                      <VehicleSelectionCard
                        // type="luxury"
                        label="Luxury"
                        price="$120"
                        selected={rentalPrefs.type === 'luxury'}
                        onClick={() => setRentalPrefs(p => ({...p, type: 'luxury'}))}
                        icon={<TrophyIcon className="w-6 h-6" />}
                      />
                    </div>
                    
                    <div className="flex justify-center bg-white rounded-lg p-1 border border-gray-200">
                      {(['auto', 'manual'] as const).map((trans) => (
                        <button
                          key={trans}
                          onClick={() => setRentalPrefs(p => ({...p, transmission: trans}))}
                          className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                            rentalPrefs.transmission === trans 
                              ? 'bg-gray-100 text-teal-800' 
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {trans === 'auto' ? 'Automatic' : 'Manual'}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- Counters --- */}
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

        {/* --- Interests --- */}
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{t('trips.interests')}</span>
          <div className="grid grid-cols-3 gap-3">
            {interestConfig.map((config) => (
              <InterestCard
                key={config.id}
                id={config.id}
                label={t(`trips.${config.id}`)}
                selected={interests.includes(config.id)}
                onClick={() => onToggleInterest(config.id)}
                icon={config.icon}
              />
            ))}
          </div>
        </div>

      </div>

      {/* 3. Action Footer */}
      <div className="p-5 pt-2 bg-linear-to-t from-white via-white to-transparent">
        {!hasTrip && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerateTrip}
            disabled={!destinationCity || isGenerating}
            className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg shadow-teal-900/10 flex items-center justify-center gap-2 transition-all ${
              !destinationCity || isGenerating
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-linear-to-r from-teal-600 to-teal-800 text-white hover:shadow-teal-900/20'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-6 h-6" />
                <span>{t('trips.generateTrip')}</span>
              </>
            )}
          </motion.button>
        )}

        {(hasTrip || isGenerating) && (
          <div className="mt-2">
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