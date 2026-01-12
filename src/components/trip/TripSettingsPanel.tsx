import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircleIcon,
  MagnifyingGlassIcon,
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

const InputField = ({ 
  label, 
  value, 
  onChange, 
  suffix 
}: { 
  label: string; 
  value: string | number; 
  onChange: (val: string) => void;
  suffix?: string;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{label}</label>
    <div className="flex items-baseline border-b border-gray-200 pb-1 focus-within:border-teal-600 transition-colors">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-bold text-teal-900 focus:outline-none placeholder-gray-300"
      />
      {suffix && <span className="text-xs font-bold text-gray-400 ml-1">{suffix}</span>}
    </div>
  </div>
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
  stations,
  setStations,
  duration,
  setDuration,
  interests,
  onToggleInterest,
  onGenerateTrip,
  onStartNavigation,
}) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { t } = useTranslation();
  const { generatedStops, isGenerating } = useTripStore();
  
  const hasResult = generatedStops.length > 0;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F7] p-6 pb-20 md:pb-6">
      
      {/* --- FORM SECTION (Hidden if trip generated, or can persist based on preference) --- */}
      {/* For this UI, we keep the form header but maybe disable inputs or just let them edit to regenerate */}
      
      <div className={`transition-all duration-500 ${hasResult ? 'mb-4' : 'mb-8'}`}>
        
        {/* Row 1: Transport & Trip Type */}
        <div className="flex flex-wrap  flex-col justify-between gap-4 mb-8">
          <div className="flex items-center gap-6">
            <RadioSelector 
              selected={transport === 'car'} 
              onClick={() => setTransport('car')} 
              label="Car Trip" 
              icon={<FaCar />} 
            />
            <RadioSelector 
              selected={transport === 'bike'} 
              onClick={() => setTransport('bike')} 
              label="Bike Trip" 
              icon={<FaBicycle />} 
            />
          </div>

          <div className="flex items-center gap-4">
            <CheckboxSelector 
              checked={tripType === 'one'} 
              onClick={() => setTripType('one')} 
              label="One" 
            />
            <CheckboxSelector 
              checked={tripType === 'return'} 
              onClick={() => setTripType('return')} 
              label="Return way" 
            />
          </div>
        </div>

        {/* Row 2: Input Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <InputField 
            label="Departure city" 
            value={departureCity} 
            onChange={setDepartureCity} 
          />
          <InputField 
            label="Destination City" 
            value={destinationCity} 
            onChange={setDestinationCity} 
          />
          <InputField 
            label="Station" 
            value={stations} 
            onChange={(v) => setStations(Number(v))} 
          />
          <InputField 
            label="During Times" 
            value={duration} 
            onChange={(v) => setDuration(Number(v))} 
            suffix="days"
          />
        </div>

        {/* Row 3: Interests */}
        <div className="flex flex-wrap gap-6 mb-8">
          <InterestCheckbox 
            label="Outdoors&Sport" 
            checked={interests.includes('outdoorsSport')} 
            onClick={() => onToggleInterest('outdoorsSport')} 
          />
          <InterestCheckbox 
            label="Culture&Museum" 
            checked={interests.includes('cultureMuseum')} 
            onClick={() => onToggleInterest('cultureMuseum')} 
          />
          <InterestCheckbox 
            label="Fjords&Montains" 
            checked={interests.includes('fjordsMountains')} 
            onClick={() => onToggleInterest('fjordsMountains')} 
          />
        </div>

        {/* Row 4: Action Button (Header for Result) */}
        <div className="flex items-center gap-4 mb-2">
           <h2 className="font-serif text-lg font-bold text-gray-800">Trip Generation</h2>
           {!hasResult && (
             <button
               onClick={onGenerateTrip}
               disabled={!destinationCity || isGenerating}
               className="px-6 py-1.5 bg-teal-800 text-white text-sm font-medium rounded-md hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-lg shadow-teal-900/20"
             >
               {isGenerating ? 'Planning...' : 'Search'}
               {!isGenerating && <MagnifyingGlassIcon className="w-4 h-4" />}
             </button>
           )}
        </div>
      </div>

      {/* --- RESULT SECTION (Timeline) --- */}
      {hasResult ? (
        <div className="animate-in slide-in-from-bottom-4 fade-in duration-500">
           <TripGenerationCard 
             onGenerateTrip={onGenerateTrip} 
             onStartNavigation={onStartNavigation}
           />
        </div>
      ) : (
        /* Empty State Placeholder or Feature Showcase */
        <div className="flex-1">
           <TestimonialsGallery />
           <CarRentalShowcase />
        </div>
      )}

    </div>
  );
};

export default TripSettingsPanel;