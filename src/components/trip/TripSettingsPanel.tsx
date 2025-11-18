import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { FaCar, FaBicycle } from 'react-icons/fa';
import TripGenerationCard from './TripGenerationCard';
import { motion } from 'framer-motion';

// --- Helper Components for better structure ---

interface TripCustomizationProps {
  transport: 'car' | 'bike';
  setTransport: (transport: 'car' | 'bike') => void;
  tripType: 'one' | 'return';
  setTripType: (tripType: 'one' | 'return') => void;
  t: (key: string) => string;
}

interface RoutePlannerProps {
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
  t: (key: string) => string;
}

// Custom Radio Button for Trip Type and Transport (matching design)
const DesignRadio = ({ id, name, value, checked, onChange, children, icon }: {
  id: string,
  name: string,
  value: string,
  checked: boolean,
  onChange: () => void,
  children: React.ReactNode,
  icon?: React.ReactNode
}) => (
  <div className="flex items-center">
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={() => onChange()}
      className="hidden"
    />
    <label
      htmlFor={id}
      className={`flex items-center cursor-pointer transition-all duration-300 ${
        checked ? 'text-teal-600' : 'text-gray-600'
      }`}
    >
      <div className={`w-5 h-5 rounded-full border-2 mr-2 flex items-center justify-center ${
        checked ? 'border-teal-600 bg-teal-600' : 'border-gray-400'
      }`}>
        {checked && <div className="w-2 h-2 bg-white rounded-full"></div>}
      </div>
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </label>
  </div>
);

// Custom Checkbox for Interests (matching design)
const DesignCheckbox = ({ id, label, checked, onChange }: {
  id: string,
  label: string,
  checked: boolean,
  onChange: () => void
}) => (
  <div className="flex items-center">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={() => onChange()}
      className="hidden"
    />
    <label
      htmlFor={id}
      className={`flex items-center cursor-pointer transition-all duration-300 ${
        checked ? 'text-teal-600' : 'text-gray-600'
      }`}
    >
      <div className={`w-5 h-5 rounded border-2 mr-2 flex items-center justify-center ${
        checked ? 'border-teal-600 bg-teal-600' : 'border-gray-400'
      }`}>
        {checked && <div className="w-2 h-2 bg-white rounded-full"></div>}
      </div>
      {label}
    </label>
  </div>
);


// Styled button component matching the design
const DesignButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  variant = 'primary', 
  className = '' 
}: { 
  children: React.ReactNode, 
  onClick?: () => void, 
  disabled?: boolean, 
  variant?: 'primary' | 'secondary' | 'success' | 'outline',
  className?: string
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const variants = {
    primary: {
      bg: 'bg-teal-700',
      text: 'text-white',
      slideBg: 'bg-teal-800',
      focus: 'focus:ring-2 focus:ring-teal-500'
    },
    secondary: {
      bg: 'bg-gray-200',
      text: 'text-gray-800',
      slideBg: 'bg-gray-300',
      focus: 'focus:ring-2 focus:ring-gray-400'
    },
    success: {
      bg: 'bg-green-500',
      text: 'text-white',
      slideBg: 'bg-green-600',
      focus: 'focus:ring-2 focus:ring-green-400'
    },
    outline: {
      bg: 'bg-transparent',
      text: 'text-teal-700',
      slideBg: 'bg-teal-50',
      focus: 'focus:ring-2 focus:ring-teal-500'
    }
  };
  
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`py-3 px-4 font-semibold flex items-center justify-center relative overflow-hidden border-2 ${variant === 'outline' ? 'border-teal-700' : 'border-transparent'} ${variants[variant].text} ${variants[variant].bg} ${variants[variant].focus} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.98 }}
    >
      <motion.div
        className="absolute top-0 left-0 w-full h-full"
        initial={{ x: '-100%' }}
        animate={{ x: isHovered ? '0%' : '-100%' }}
        transition={{ duration: 0.3 }}
      >
        <div className={`w-full h-full ${variants[variant].slideBg}`}></div>
      </motion.div>
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

// Input field component matching the design
const DesignInput = ({
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  className = ''
}: {
  value: string,
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void,
  placeholder?: string,
  type?: string,
  disabled?: boolean,
  className?: string
}) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full p-2 border-b-2 border-gray-200 focus:outline-none focus:border-teal-500 transition ${className}`}
  />
);

const TripCustomization: React.FC<TripCustomizationProps> = ({ transport, setTransport, tripType, setTripType, t }) => (
    <div className="mb-6 p-4 border border-gray-200">
      {/* <h3 className="text-lg font-bold text-teal-900 mb-2">Customize Your Journey</h3>
      <p className="text-sm text-gray-600 mb-4">
        Select your preferred mode of transport and trip type to tailor the perfect journey.
      </p> */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* --- Transportation Section --- */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-2 font-semibold">{t('trips.transportation')}</label>
          <div className="flex space-x-4 bg-gray-50 p-3">
            <DesignRadio
              id="car"
              name="transport"
              value="car"
              checked={transport === 'car'}
              onChange={() => setTransport('car')}
              icon={<FaCar />}
            >
              {t('trips.carTrip')}
            </DesignRadio>
            <DesignRadio
              id="bike"
              name="transport"
              value="bike"
              checked={transport === 'bike'}
              onChange={() => setTransport('bike')}
              icon={<FaBicycle />}
            >
              {t('trips.bikeTrip')}
            </DesignRadio>
          </div>
        </div>
  
        {/* --- Trip Type Section --- */}
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-2 font-semibold">{t('trips.tripType')}</label>
          <div className="flex space-x-4 bg-gray-50 p-3">
            <DesignRadio
              id="one-way"
              name="tripType"
              value="one"
              checked={tripType === 'one'}
              onChange={() => setTripType('one')}
            >
              {t('trips.oneWay')}
            </DesignRadio>
            <DesignRadio
              id="return"
              name="tripType"
              value="return"
              checked={tripType === 'return'}
              onChange={() => setTripType('return')}
            >
              {t('trips.returnWay')}
            </DesignRadio>
          </div>
        </div>
      </div>
    </div>
);

const RoutePlanner: React.FC<RoutePlannerProps> = ({
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
    t,
  }) => (
    <div className="mb-6 p-4 border border-gray-200">
      {/* <h3 className="text-lg font-bold text-teal-900 mb-2">Define Your Route</h3>
      <p className="text-sm text-gray-600 mb-4">
        Tell us where you're starting, where you're going, and for how long.
      </p> */}
      
      {/* --- Cities --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-semibold">{t('trips.departureCity')}</label>
          <div className="flex items-center">
            <DesignInput
              value={departureCity}
              onChange={(e) => setDepartureCity(e.target.value)}
              disabled={useCurrentLocation}
            />
            <button
              type="button"
              onClick={() => setUseCurrentLocation(!useCurrentLocation)}
              className={`ml-2 p-2 rounded-lg transition-colors ${
                useCurrentLocation ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              aria-label="Use current location"
            >
              <MapPinIcon className="w-5 h-5" />
            </button>
          </div>
          {useCurrentLocation && (
            <p className="text-xs text-teal-600 mt-1">{t('trips.usingCurrentLocation')}</p>
          )}
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-semibold">{t('trips.destinationCity')}</label>
          <DesignInput
            value={destinationCity}
            onChange={(e) => setDestinationCity(e.target.value)}
          />
        </div>
      </div>
  
      {/* --- Stops and Duration --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-3">
          <label className="block text-xs text-gray-500 mb-1 font-semibold">{t('trips.stations')}</label>
          <DesignInput
            type="number"
            value={stations.toString()}
            onChange={(e) => setStations(parseInt(e.target.value, 10))}
            className="bg-transparent"
          />
        </div>
        <div className="bg-gray-50 p-3">
          <label className="block text-xs text-gray-500 mb-1 font-semibold">{t('trips.duration')}</label>
          <div className="flex items-baseline">
            <DesignInput
              type="number"
              value={duration.toString()}
              onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              className="bg-transparent"
            />
            <span className="ml-2 text-gray-600">{t('trips.days')}</span>
          </div>
        </div>
      </div>
    </div>
);

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
  generatedStops: string[];
  selectedStop: string | null;
  setSelectedStop: (stop: string) => void;
  tripDetails: { time: string; distance: string; co2: string } | null;
  isGenerating: boolean;
  onStartNavigation: () => void;
}

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
  generatedStops,
  selectedStop,
  setSelectedStop,
  tripDetails,
  isGenerating,
  onStartNavigation,
}) => {
  const { t } = useTranslation();

  const interestOptions = ['Outdoors & Sport', 'Culture & Museum', 'Fjords & Mountains'];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      image: '/assets/g-1.png',
      quote: 'AfreshTrip made planning my Denmark adventure effortless. The personalized recommendations were spot on!'
    },
    {
      name: 'Mike Chen',
      image: '/assets/g-2.png',
      quote: 'Incredible app! Saved me hours of research and helped me discover hidden gems I never knew existed.'
    },
    {
      name: 'Emma Larsen',
      image: '/assets/g-3.png',
      quote: 'The best travel planning experience ever. Highly recommend to anyone visiting Scandinavia!'
    },
    {
      name: 'David Nielsen',
      image: '/assets/g-4.png',
      quote: 'From route planning to local insights, AfreshTrip has everything you need for the perfect trip.'
    }
  ];



  return (
    <div className="h-full flex flex-col p-6 bg-transparent">
      <h2 className="text-xl font-bold text-teal-900 mb-6 text-center">{t('trips.planYourTrip')}</h2>
      
      <TripCustomization
        transport={transport}
        setTransport={setTransport}
        tripType={tripType}
        setTripType={setTripType}
        t={t}
      />
      
      <RoutePlanner
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
        t={t}
    />
      
      {/* --- Interests Section --- */}
      <div className="mb-6 p-4 border border-gray-200">
        <label className="block text-xs text-gray-500 mb-2 font-semibold">{t('trips.interests')}</label>
        <div className="bg-gray-50 p-3">
          <div className="flex space-x-4">
            {interestOptions.map(interest => (
              <DesignCheckbox
                key={interest}
                id={interest}
                label={interest}
                checked={interests.includes(interest)}
                onChange={() => onToggleInterest(interest)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* --- Generate Trip Section --- */}
      <div className="mb-6">
        {!isGenerating && generatedStops.length === 0 && (
          <DesignButton
            onClick={onGenerateTrip}
            disabled={!destinationCity}
            variant="primary"
            className="w-[50%] mx-auto"
          >
            {t('trips.generateTrip')}
          </DesignButton>
        )}
      </div>

      {/* --- Testimonials Section --- */}
      {generatedStops.length === 0 && !isGenerating && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-teal-900 mb-4">{t('trips.testimonials')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 p-4">
                <div className="flex items-center mb-2">
                  <img src={testimonial.image} alt={testimonial.name} className="w-12 h-12 rounded-full mr-3" />
                  <h4 className="font-semibold text-gray-800">{testimonial.name}</h4>
                </div>
                <p className="text-gray-600 text-sm italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- Trip Generation Section --- */}
      <div className="grow overflow-y-auto">
        {(isGenerating || generatedStops.length > 0) && (
          <TripGenerationCard
            generatedStops={generatedStops}
            selectedStop={selectedStop}
            setSelectedStop={setSelectedStop}
            tripDetails={tripDetails}
            isGenerating={isGenerating}
            onGenerateTrip={onGenerateTrip}
            onStartNavigation={onStartNavigation}
          />
        )}
      </div>
    </div>
  );
};

export default TripSettingsPanel;