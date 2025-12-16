import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  CloudIcon, 
  SunIcon, 
  ExclamationTriangleIcon, 
  ChevronDownIcon,
  MapPinIcon 
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import { tripService } from '../../services/tripService';

// --- Types ---

interface WeatherSummaryProps {
  onClick?: () => void;
  location?: string;
  time?: string;
  className?: string;
}

// --- Helper Functions ---

const getWeatherIcon = (condition: string, className = "h-6 w-6") => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
    return <SunIcon className={`${className} text-orange-500`} />;
  } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <CloudIcon className={`${className} text-blue-400`} />;
  } else {
    return <ExclamationTriangleIcon className={`${className} text-gray-400`} />;
  }
};

const getLocale = (lang: string) => {
  switch (lang) {
    case 'fr': return 'fr-FR';
    case 'es': return 'es-ES';
    case 'zh': return 'zh-CN';
    case 'ar': return 'ar-SA';
    default: return 'en-US';
  }
};

// --- Main Component ---

const WeatherSummary: React.FC<WeatherSummaryProps> = ({ 
  onClick, 
  location: propLocation, 
  time: propTime,
  className = ""
}) => {
  const { t, i18n } = useTranslation();
  const { currentTrip } = useTripStore();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Prioritize prop location, then trip destination, then default
  const location = propLocation || currentTrip?.settings.destination || 'Copenhagen';
  const time = propTime;

  const queryKey = time ? ['weather', location, time] : ['weather', location];

  const { data: weather, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      // Get realtime weather
      const realtimeWeather = await tripService.getWeatherData(location);

      // Get forecast if available
      let forecast = realtimeWeather.forecast;
      if (forecast.length === 0) {
        try {
          // Try to get forecast using a city code mapping
          // In a real app, we'd use lat/lng from the geocoding service
          const forecastData = await tripService.getWeatherForecast(location);
          if (forecastData && forecastData.length > 0) {
            forecast = forecastData;
          } else {
            // Fallback mock generation if API returns empty
             forecast = Array.from({ length: 3 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i);
              return {
                date: date.toISOString().split('T')[0],
                temp: realtimeWeather.temperature + Math.floor(Math.random() * 4) - 2,
                condition: realtimeWeather.condition,
              };
            });
          }
        } catch {
          // Silent fail on forecast
        }
      }

      return {
        ...realtimeWeather,
        forecast,
      };
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  if (error) return null; // Hide widget on error to keep UI clean

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative z-50 ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={() => {
        setIsExpanded(!isExpanded);
        onClick?.();
      }}
    >
      {/* 
        Container:
        Glassmorphism effect with blur and semi-transparent white.
        Transitions shape from Pill (collapsed) to Card (expanded).
      */}
      <motion.div 
        layout
        className={`bg-white/90 backdrop-blur-md shadow-lg shadow-black/5 border border-white/50 overflow-hidden cursor-pointer transition-colors hover:bg-white/95 ${
          isExpanded ? 'rounded-2xl' : 'rounded-full'
        }`}
      >
        
        {/* Header / Summary View (Always Visible) */}
        <motion.div layout="position" className="flex items-center justify-between px-4 py-3 gap-4">
          
          {/* Left: Location & Icon */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isLoading ? 'bg-gray-100' : 'bg-blue-50'}`}>
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin" />
              ) : (
                getWeatherIcon(weather?.condition || '', "w-5 h-5")
              )}
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-500">
                <MapPinIcon className="w-3 h-3" />
                <span className="truncate max-w-[100px]">{location}</span>
              </div>
              <div className="text-sm font-bold text-gray-800">
                {isLoading ? (
                  <span className="w-16 h-4 bg-gray-200 rounded animate-pulse block mt-1" />
                ) : (
                  <span>{weather?.temperature}°C <span className="font-normal text-gray-500 mx-1">•</span> {weather?.condition}</span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Expand Indicator */}
          <motion.div 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="text-gray-400"
          >
            <ChevronDownIcon className="w-4 h-4" />
          </motion.div>
        </motion.div>

        {/* Expanded Content (Forecast & Clothes) */}
        <AnimatePresence>
          {isExpanded && weather && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 pb-4"
            >
              <div className="w-full h-px bg-gray-100 mb-4" />

              {/* 3-Day Forecast */}
              <div className="mb-4">
                <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">{t('trips.threeDaysForecast')}</h4>
                <div className="grid grid-cols-3 gap-2">
                  {weather.forecast.slice(0, 3).map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center bg-gray-50 rounded-lg p-2">
                      <span className="text-[10px] font-medium text-gray-500 mb-1">
                        {new Date(day.date).toLocaleDateString(getLocale(i18n.language), { weekday: 'short' })}
                      </span>
                      {getWeatherIcon(day.condition, "w-6 h-6 mb-1")}
                      <span className="text-xs font-bold text-gray-700">{Math.round(day.temp)}°</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clothing Suggestions */}
              {weather.clothing.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">{t('trips.clothes')}</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {weather.clothing.map((item, idx) => (
                      <div key={idx} className="flex flex-col items-center min-w-[60px] p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                         <div className="w-5 h-5 text-blue-600 mb-1" dangerouslySetInnerHTML={{__html: item.icon}} />
                         <span className="text-[10px] text-blue-800 font-medium text-center leading-tight">{item.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default WeatherSummary;