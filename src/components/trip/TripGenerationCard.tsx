import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayIcon } from '@heroicons/react/24/outline';

// TripStation component
const TripStation = ({
  name,
  isActive,
  onClick,
  index,
  isLast,
}: {
  name: string;
  isActive: boolean;
  onClick: () => void;
  index: number;
  isLast: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="relative flex items-start mb-6 cursor-pointer"
      onClick={onClick}
    >
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 ${isActive ? 'bg-teal-500 border-teal-500' : 'bg-white border-gray-400 text-gray-600'}`}>
        {index + 1}
      </div>
      {!isLast && <div className="absolute left-5 top-10 w-0.5 h-6 bg-gray-300"></div>}
      <div className="ml-4 mt-2">
        <span className={`font-medium ${isActive ? 'text-teal-700' : 'text-gray-700'}`}>{name}</span>
      </div>
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

  return (
    <div className="flex flex-row w-full">
      <motion.div
        className="bg-white shadow-md overflow-hidden flex-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Card Header */}
        <div className="bg-linear-to-r from-teal-700 to-teal-800 p-4">
          <h3 className="text-white font-semibold text-lg">Trip Generation</h3>
        </div>

        {/* Card Body */}
        <div className="p-4">
          {/* Loading State */}
          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-gray-200"></div>
                <div className="absolute top-0 left-0 w-full h-full rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
              </div>
              <p className="text-gray-600">Generating your trip...</p>
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
                    isLast={index === visibleStops.length - 1}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.div>
      {/* Trip Summary */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{
          opacity: (isFullyRevealed && tripDetails) ? 1 : 0,
          x: (isFullyRevealed && tripDetails) ? 0 : 20
        }}
        transition={{ duration: 0.5 }}
        className={`flex-1 ml-4 bg-white shadow-md overflow-hidden ${
          (isFullyRevealed && tripDetails) ? '' : 'pointer-events-none'
        }`}
      >
        {/* Summary Header */}
        <div className="bg-linear-to-r from-teal-700 to-teal-800 p-4">
          <h4 className="text-white font-semibold text-lg">Trip Summary</h4>
        </div>

        {/* Summary Body */}
        <div className="p-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Driving time</span>
              <span className="text-sm font-bold text-gray-800">
                {tripDetails?.time || '0h 0min'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total distance</span>
              <span className="text-sm font-bold text-gray-800">
                {tripDetails?.distance || '0 km'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">CO2 emissions</span>
              <span className="text-sm font-bold text-gray-800">
                {tripDetails?.co2 || '0g'}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGenerateTrip}
              className="flex-1 py-2 bg-teal-700 text-xs text-white font-medium hover:bg-teal-800 transition-colors"
            >
              Regenerate Trip
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartNavigation}
              className="flex-1 py-2 bg-teal-700 text-xs text-white font-medium hover:bg-teal-800 transition-colors flex items-center justify-center"
            >
              <PlayIcon className="w-5 h-5 mr-2" />
              Start Navigation
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TripGenerationCard;
