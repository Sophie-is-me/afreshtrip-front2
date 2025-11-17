import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { FaCar, FaBicycle } from 'react-icons/fa';
import { useTripStore } from '../../stores/tripStore';
import { mockApiClient } from '../../services/mockApi';
import type { TripSettings, Trip } from '../../types/trip';
import TripGenerationCard from './TripGenerationCard';
import { motion } from 'framer-motion';

// --- Helper Components for better structure ---

// Custom Radio Button for Trip Type and Transport (matching design)
const DesignRadio = ({ id, name, value, checked, onChange, children, icon }: { 
  id: string, 
  name: string, 
  value: string, 
  checked: boolean, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
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
      onChange={onChange}
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
  onChange: (checked: boolean) => void 
}) => (
  <div className="flex items-center">
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
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
  value: string | number, 
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

const TripSettingsPanel: React.FC = () => {
  const { setTripSettings, setTrip, setLoading, setError } = useTripStore();

  // --- STATE MANAGEMENT ---
  const [transport, setTransport] = useState<'car' | 'bike'>('car');
  const [tripType, setTripType] = useState<'one' | 'return'>('return');
  const [departureCity, setDepartureCity] = useState('Copenhagen');
  const [destinationCity, setDestinationCity] = useState('Copenhagen');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [stations, setStations] = useState(3);
  const [duration, setDuration] = useState(1);
  const [interests, setInterests] = useState<string[]>(['Outdoors & Sport']);
  
  // State for generated trip data
  const [generatedStops, setGeneratedStops] = useState<string[]>([]);
  const [selectedStop, setSelectedStop] = useState<string | null>(null);
  const [tripDetails, setTripDetails] = useState<{ time: string; distance: string; co2: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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

  const mockSuggestedStops = {
    'Outdoors & Sport': ['Dyrehaven', 'Amager Strandpark', 'Superkilen Park', 'Kastellet'],
    'Culture & Museum': ['Amalienborg Palace', 'Charlottenlund Palace', 'The Open Air Museum', 'Ny Carlsberg Glyptotek'],
    'Fjords & Mountains': ['Roskilde Fjord', 'Vejle Fjord', 'Møns Klint', 'Himmelbjerget'],
  };

  const generateTripMutation = useMutation({
    mutationFn: (tripSettings: TripSettings) => mockApiClient.generateTrip(tripSettings),
    onSuccess: (trip: Trip) => {
      // Simulate backend response
      const stops = interests.flatMap(interest => mockSuggestedStops[interest as keyof typeof mockSuggestedStops] || []).slice(0, stations);
      const uniqueStops = [...new Set(stops)]; // Ensure no duplicates
      
      setGeneratedStops(uniqueStops);
      
      // Simulate trip details based on generated stops
      const simulatedDistance = uniqueStops.length * 25 + Math.floor(Math.random() * 20);
      const simulatedTimeHours = Math.floor(simulatedDistance / 40);
      const simulatedTimeMinutes = Math.floor((simulatedDistance % 40) * 1.5);

      setTripDetails({
          time: `${simulatedTimeHours}h ${simulatedTimeMinutes}min`,
          distance: `${simulatedDistance} km`,
          co2: `${Math.round(simulatedDistance * 0.12)}g`
      });

      // Update global store
      setTrip(trip);
      setTripSettings(trip.settings);
      setLoading(false);
      setIsGenerating(false);
    },
    onError: (error: Error) => {
      setError(error.message);
      setLoading(false);
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
    setError(null);
    setGeneratedStops([]); // Clear previous results
    setTripDetails(null);

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



  return (
    <div className="h-full flex flex-col p-6 bg-transparent">
      {/* --- Transportation Section --- */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-teal-900 mb-4">Transportation</h3>
        <div className="flex space-x-4">
          <DesignRadio
            id="car"
            name="transport"
            value="car"
            checked={transport === 'car'}
            onChange={() => setTransport('car')}
            icon={<FaCar />}
          >
            Car Trip
          </DesignRadio>
          <DesignRadio
            id="bike"
            name="transport"
            value="bike"
            checked={transport === 'bike'}
            onChange={() => setTransport('bike')}
            icon={<FaBicycle />}
          >
            Bike Trip
          </DesignRadio>
        </div>
      </div>
      
      {/* --- Trip Type Section --- */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-teal-900 mb-4">Trip Type</h3>
        <div className="flex space-x-4">
          <DesignRadio
            id="one-way"
            name="tripType"
            value="one"
            checked={tripType === 'one'}
            onChange={() => setTripType('one')}
          >
            One way
          </DesignRadio>
          <DesignRadio
            id="return"
            name="tripType"
            value="return"
            checked={tripType === 'return'}
            onChange={() => setTripType('return')}
          >
            Return way
          </DesignRadio>
        </div>
      </div>
      
      {/* --- Route Section --- */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-teal-900 mb-4">Route</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Departure city</label>
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
                  useCurrentLocation ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <MapPinIcon className="w-5 h-5" />
              </button>
            </div>
            {useCurrentLocation && (
              <p className="text-xs text-teal-600 mt-1">Using your current location</p>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Destination City</label>
            <DesignInput
              value={destinationCity}
              onChange={(e) => setDestinationCity(e.target.value)}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Stations</label>
            <DesignInput
              type="number"
              value={stations}
              onChange={(e) => setStations(parseInt(e.target.value, 10))}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Duration</label>
            <div className="flex items-baseline">
              <DesignInput
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
              />
              <span className="ml-2 text-gray-600">days</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- Interests Section --- */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-teal-900 mb-4">Interests</h3>
        <div className="space-y-2 space-x-4 flex justify-around flex-row">
          {interestOptions.map(interest => (
            <DesignCheckbox
              key={interest}
              id={interest}
              label={interest}
              checked={interests.includes(interest)}
              onChange={() => handleToggleInterest(interest)}
            />
          ))}
        </div>
      </div>

      {/* --- Generate Trip Section --- */}
      <div className="mb-6">
        {!isGenerating && generatedStops.length === 0 && (
          <DesignButton
            onClick={handleGenerateTrip}
            disabled={!destinationCity}
            variant="primary"
            className="w-[50%] mx-auto"
          >
            Generate Trip
          </DesignButton>
        )}
      </div>

      {/* --- Testimonials Section --- */}
      {generatedStops.length === 0 && !isGenerating && (
        <div className="mb-6">
          <h3 className="text-lg font-bold text-teal-900 mb-4">Testimonials</h3>
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
            onGenerateTrip={handleGenerateTrip}
            onStartNavigation={() => {}}
          />
        )}
      </div>
    </div>
  );
};

export default TripSettingsPanel;