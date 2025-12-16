import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from "framer-motion";
import { useTripStore } from '../../stores/tripStore';
import {
  MapPinIcon,
  FlagIcon,
  ClockIcon,
  MapIcon,
  FireIcon,
  ArrowPathIcon,
  SparklesIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import {
  PlayIcon as PlaySolidIcon,
} from '@heroicons/react/24/solid';

// --- Types ---

interface TripGenerationCardProps {
  onGenerateTrip: () => void;
  onStartNavigation: () => void;
}

interface StopItemProps {
  name: string;
  index: number;
  isLast: boolean;
  isActive: boolean;
  onClick: () => void;
}

interface SummaryStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}

// --- Helper Components ---

const SummaryStat: React.FC<SummaryStatProps> = ({ icon, label, value, colorClass }) => (
  <div className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-xl border border-gray-100">
    <div className={`mb-1 ${colorClass}`}>
      {icon}
    </div>
    <span className="text-sm font-bold text-gray-800">{value}</span>
    <span className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</span>
  </div>
);

const StopItem: React.FC<StopItemProps> = ({ name, index, isLast, isActive, onClick }) => {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={onClick}
      className={`group w-full flex items-start text-left relative pl-2 py-1 ${isLast ? '' : 'pb-6'}`}
    >
      {/* Connecting Line */}
      {!isLast && (
        <div className="absolute left-[19px] top-8 bottom-0 w-0.5 bg-gray-200 group-hover:bg-gray-300 transition-colors" />
      )}

      {/* Marker Circle */}
      <div className={`relative z-10 shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 shadow-sm transition-all duration-300 ${
        isActive 
          ? 'bg-teal-600 border-teal-600 text-white scale-110' 
          : 'bg-white border-gray-300 text-gray-500 group-hover:border-teal-400 group-hover:text-teal-600'
      }`}>
        {index === 0 ? (
          <MapPinIcon className="w-4 h-4" />
        ) : isLast ? (
          <FlagIcon className="w-4 h-4" />
        ) : (
          <span className="text-xs font-bold">{index + 1}</span>
        )}
      </div>

      {/* Text Content */}
      <div className={`ml-4 mt-1 flex-1 transition-all duration-300 ${
        isActive 
          ? 'bg-teal-50 -mr-2 -ml-2 pl-6 pr-3 py-2 -mt-1 rounded-lg' 
          : ''
      }`}>
        <h4 className={`text-sm font-semibold transition-colors ${
          isActive ? 'text-teal-800' : 'text-gray-700 group-hover:text-teal-700'
        }`}>
          {name}
        </h4>
        {isActive && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="text-xs text-teal-600 flex items-center mt-1"
          >
            <span>Tap to view on map</span>
            <ChevronRightIcon className="w-3 h-3 ml-1" />
          </motion.div>
        )}
      </div>
    </motion.button>
  );
};

// --- Main Component ---

const TripGenerationCard: React.FC<TripGenerationCardProps> = ({
  onGenerateTrip,
  onStartNavigation,
}) => {
  const { t } = useTranslation();
  const {
    generatedStops,
    visibleStops,
    selectedStop,
    setSelectedStop,
    tripDetails,
    isGenerating,
    addVisibleStop
  } = useTripStore();

  const [isFullyRevealed, setIsFullyRevealed] = useState(false);

  // Animate stops appearing one by one
  useEffect(() => {
    if (generatedStops.length > 0 && !isFullyRevealed) {
      const timer = setTimeout(() => {
        if (visibleStops.length < generatedStops.length) {
          addVisibleStop(generatedStops[visibleStops.length]);
        } else {
          setIsFullyRevealed(true);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [generatedStops, visibleStops, isFullyRevealed, addVisibleStop]);

  // Reset when new trip generation starts
  useEffect(() => {
    if (isGenerating) {
      setIsFullyRevealed(false);
    }
  }, [isGenerating]);

  // Loading State
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { duration: 2, repeat: Infinity, ease: "linear" }, scale: { duration: 1, repeat: Infinity } }}
          className="relative w-12 h-12 mb-4 text-teal-500"
        >
          <SparklesIcon className="w-12 h-12" />
        </motion.div>
        <p className="text-gray-600 font-medium text-sm animate-pulse">{t('trips.generatingYourTrip')}</p>
        <div className="w-48 mt-4 bg-gray-200 rounded-full h-1 overflow-hidden">
          <motion.div
            className="bg-teal-500 h-1 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5 }}
          />
        </div>
      </div>
    );
  }

  // Empty State (Should normally be handled by parent, but safe guard here)
  if (generatedStops.length === 0) return null;

  return (
    <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Summary Stats Grid */}
      {tripDetails && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-3"
        >
          <SummaryStat 
            icon={<ClockIcon className="w-5 h-5" />}
            label={t('trips.drivingTime')}
            value={tripDetails.time}
            colorClass="text-blue-500"
          />
          <SummaryStat 
            icon={<MapIcon className="w-5 h-5" />}
            label={t('trips.totalDistance')}
            value={tripDetails.distance}
            colorClass="text-indigo-500"
          />
          <SummaryStat 
            icon={<FireIcon className="w-5 h-5" />}
            label="Est. CO2"
            value={tripDetails.co2}
            colorClass="text-green-500"
          />
        </motion.div>
      )}

      {/* 2. Itinerary List */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Your Route</h3>
          <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">
            {generatedStops.length} stops
          </span>
        </div>
        
        <div className="pl-2">
          <AnimatePresence>
            {visibleStops.map((stop, index) => (
              <StopItem
                key={stop}
                name={stop}
                index={index}
                isLast={index === generatedStops.length - 1}
                isActive={selectedStop === stop}
                onClick={() => setSelectedStop(selectedStop === stop ? null : stop)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* 3. Action Buttons */}
      {isFullyRevealed && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-3"
        >
          <button
            onClick={onStartNavigation}
            className="w-full py-4 bg-teal-600 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 hover:shadow-teal-600/30 transition-all flex items-center justify-center gap-2 group"
          >
            <PlaySolidIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            {t('trips.startNavigation')}
          </button>
          
          <button
            onClick={onGenerateTrip}
            className="w-full py-3 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            {t('trips.regenerateTrip')}
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default TripGenerationCard;