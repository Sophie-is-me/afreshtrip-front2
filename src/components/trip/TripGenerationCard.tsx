import { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPinIcon, 
  FlagIcon,
  ClockIcon,
  MapIcon,
  FireIcon,
  ArrowPathIcon,
  SparklesIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  PlayIcon as PlaySolidIcon,
  MapPinIcon as MapPinSolidIcon,
  FlagIcon as FlagSolidIcon
} from '@heroicons/react/24/solid';

// TripStation component with improved icons
const TripStation = ({
  name,
  isActive,
  onClick,
  index,
  isLast,
  isCompleted,
}: {
  name: string;
  isActive: boolean;
  onClick: () => void;
  index: number;
  isLast: boolean;
  isCompleted: boolean;
}) => {
  const getIcon = () => {
    if (index === 0) {
      return isActive ? <MapPinSolidIcon className="w-5 h-5" /> : <MapPinIcon className="w-5 h-5" />;
    } else if (isLast) {
      return isActive ? <FlagSolidIcon className="w-5 h-5" /> : <FlagIcon className="w-5 h-5" />;
    } else {
      return isActive ? <MapPinSolidIcon className="w-5 h-5" /> : <MapPinIcon className="w-5 h-5" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative flex items-start mb-6 cursor-pointer"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all duration-300 ${
        isActive ? 'bg-teal-500 shadow-lg' : isCompleted ? 'bg-teal-300' : 'bg-white border-2 border-gray-300'
      }`}>
        {getIcon()}
      </div>
      {!isLast && (
        <div className={`absolute left-6 top-12 w-0.5 h-8 transition-colors duration-300 ${
          isCompleted ? 'bg-teal-300' : 'bg-gray-200'
        }`}></div>
      )}
      <div className="ml-4 mt-2">
        <span className={`font-medium transition-colors duration-300 ${
          isActive ? 'text-teal-700' : isCompleted ? 'text-gray-700' : 'text-gray-500'
        }`}>{name}</span>
      </div>
      {isCompleted && (
        <div className="absolute left-10 top-10">
          <CheckCircleIcon className="w-5 h-5 text-teal-500" />
        </div>
      )}
    </motion.div>
  );
};

const TripGenerationCard = ({
  generatedStops,
  selectedStop,
  setSelectedStop,
  tripDetails,
  isGenerating,
  onGenerateTrip,
  onStartNavigation,
}: {
  generatedStops: string[];
  selectedStop: string | null;
  setSelectedStop: (stop: string) => void;
  tripDetails: { time: string; distance: string; co2: string } | null;
  isGenerating: boolean;
  onGenerateTrip: () => void;
  onStartNavigation: () => void;
}) => {
  const { t } = useTranslation();
  const [visibleStops, setVisibleStops] = useState<string[]>([]);
  const [isFullyRevealed, setIsFullyRevealed] = useState(false);

  // Animate stops appearing one by one
  useEffect(() => {
    if (generatedStops.length > 0 && !isFullyRevealed) {
      const timer = setTimeout(() => {
        if (visibleStops.length < generatedStops.length) {
          setVisibleStops(generatedStops.slice(0, visibleStops.length + 1));
          setSelectedStop(generatedStops[visibleStops.length]);
        } else {
          setIsFullyRevealed(true);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [generatedStops, visibleStops, isFullyRevealed, setSelectedStop]);

  // Reset when new trip generation starts
  useEffect(() => {
    if (isGenerating) {
      setVisibleStops([]);
      setIsFullyRevealed(false);
    }
  }, [isGenerating]);

  // Check if a stop is completed (before the selected stop)
  const isStopCompleted = (index: number) => {
    if (!selectedStop) return false;
    const selectedIndex = generatedStops.indexOf(selectedStop);
    return index < selectedIndex;
  };

  return (
    <div className="flex flex-row w-full">
      <div className="flex-1 flex flex-col space-y-4">
        <motion.div
          className="bg-white shadow-lg overflow-hidden flex-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Card Header with gradient and icon */}
          <div className="bg-linear-to-r from-teal-600 to-teal-700 p-4 flex items-center">
            <MapIcon className="w-6 h-6 text-white mr-2" />
            <h3 className="text-white font-semibold text-lg">{t('trips.tripGeneration')}</h3>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {/* Loading State with enhanced animation */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="relative w-16 h-16 mb-4"
                >
                  <SparklesIcon className="w-16 h-16 text-teal-500" />
                </motion.div>
                <p className="text-gray-600 font-medium">{t('trips.generatingYourTrip')}</p>
                <div className="w-64 mt-4 bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-teal-500 h-2 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 3 }}
                  />
                </div>
              </div>
            )}

            {/* Generated Stops List */}
            {generatedStops.length > 0 && (
              <div className="space-y-2 mb-4">
                <AnimatePresence>
                  {visibleStops.map((stop, index) => (
                    <TripStation
                      key={stop}
                      name={stop}
                      isActive={selectedStop === stop}
                      onClick={() => setSelectedStop(stop)}
                      index={index}
                      isLast={index === generatedStops.length - 1}
                      isCompleted={isStopCompleted(index)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>

        {/* Regenerate Trip Button with icon */}
        {generatedStops.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGenerateTrip}
            className="w-full py-3 bg-linear-to-r from-teal-600 to-teal-700 text-white font-medium hover:from-teal-700 hover:to-teal-800 transition-all shadow-md flex items-center justify-center"
          >
            <ArrowPathIcon className="w-5 h-5 mr-2" />
            {t('trips.regenerateTrip')}
          </motion.button>
        )}
      </div>

      <div className="flex-1 flex flex-col space-y-4 ml-4">
        {/* Trip Summary with enhanced visual cues */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: (isFullyRevealed && tripDetails) ? 1 : 0,
            x: (isFullyRevealed && tripDetails) ? 0 : 20
          }}
          transition={{ duration: 0.5 }}
          className={`bg-white shadow-lg overflow-hidden flex-1 ${
            (isFullyRevealed && tripDetails) ? '' : 'pointer-events-none'
          }`}
        >
          {/* Summary Header with gradient and icon */}
          <div className="bg-linear-to-r from-teal-600 to-teal-700 p-4 flex items-center">
            <ClockIcon className="w-6 h-6 text-white mr-2" />
            <h4 className="text-white font-semibold text-lg">{t('trips.tripSummary')}</h4>
          </div>

          {/* Summary Body with enhanced visuals */}
          <div className="p-6">
            <div className="space-y-4 mb-4">
              {/* Driving time with icon and visual bar */}
              <div className="flex items-center">
                <ClockIcon className="w-5 h-5 text-teal-500 mr-3" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{t('trips.drivingTime')}</span>
                    <span className="text-sm font-bold text-gray-800">
                      {tripDetails?.time || '0h 0min'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{width: '70%'}}></div>
                  </div>
                </div>
              </div>
              
              {/* Total distance with icon and visual bar */}
              <div className="flex items-center">
                <MapIcon className="w-5 h-5 text-teal-500 mr-3" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{t('trips.totalDistance')}</span>
                    <span className="text-sm font-bold text-gray-800">
                      {tripDetails?.distance || '0 km'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>
              
              {/* CO2 emissions with icon and visual bar */}
              <div className="flex items-center">
                <FireIcon className="w-5 h-5 text-teal-500 mr-3" />
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{t('trips.co2Emissions')}</span>
                    <span className="text-sm font-bold text-gray-800">
                      {tripDetails?.co2 || '0g'}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-teal-500 h-2 rounded-full" style={{width: '40%'}}></div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Eco-friendly badge */}
            <div className="mt-6 p-3 bg-green-50 border border-green-200 flex items-center">
              <SparklesIcon className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-sm text-green-700 font-medium">{t('trips.ecoFriendlyRouteSelected')}</span>
            </div>
          </div>
        </motion.div>

        {/* Start Navigation Button with enhanced styling */}
        {isFullyRevealed && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartNavigation}
            className="w-full py-3 bg-linear-to-r from-teal-600 to-teal-700 text-white font-medium hover:from-teal-700 hover:to-teal-800 transition-all shadow-md flex items-center justify-center"
          >
            <PlaySolidIcon className="w-5 h-5 mr-2" />
            {t('trips.startNavigation')}
          </motion.button>
        )}
      </div>
    </div>
  );
};

export default TripGenerationCard;