import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { 
  CloudIcon, 
  SunIcon, 
  ExclamationTriangleIcon, 
  ChevronDownIcon,
  MapPinIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { useTripStore } from '../../stores/tripStore';
import { tripService } from '../../services/tripService';
import { UmbrellaIcon } from 'lucide-react';

// --- Types ---

interface WeatherSummaryProps {
  onClick?: () => void;
  location?: string;
  time?: string;
  className?: string;
}

// --- Helper Functions ---

const getWeatherTheme = (condition: string = '') => {
  const lower = condition.toLowerCase();
  
  if (lower.includes('sun') || lower.includes('clear')) {
    return {
      container: 'from-orange-50/95 to-amber-50/90 border-orange-100',
      icon: 'text-amber-500',
      text: 'text-amber-900',
      subtext: 'text-amber-600/80',
      accent: 'bg-amber-100 text-amber-700'
    };
  } else if (lower.includes('cloud') || lower.includes('overcast')) {
    return {
      container: 'from-slate-50/95 to-gray-50/90 border-slate-100',
      icon: 'text-slate-500',
      text: 'text-slate-800',
      subtext: 'text-slate-500',
      accent: 'bg-slate-100 text-slate-600'
    };
  } else if (lower.includes('rain') || lower.includes('drizzle')) {
    return {
      container: 'from-blue-50/95 to-cyan-50/90 border-blue-100',
      icon: 'text-blue-500',
      text: 'text-blue-900',
      subtext: 'text-blue-600/80',
      accent: 'bg-blue-100 text-blue-700'
    };
  }
  // Default / Snow / Storm
  return {
    container: 'from-white/95 to-white/90 border-white/60',
    icon: 'text-teal-600',
    text: 'text-gray-800',
    subtext: 'text-gray-500',
    accent: 'bg-teal-50 text-teal-700'
  };
};

const getWeatherIcon = (condition: string, className = "h-6 w-6") => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
    return <SunIcon className={className} />;
  } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return <UmbrellaIcon className={className} />;
  } else if (lowerCondition.includes('storm')) {
    return <BoltIcon className={className} />;
  } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <CloudIcon className={className} />;
  } else {
    return <ExclamationTriangleIcon className={className} />;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      // Get forecast if available (mock fallback inside service if needed)
      let forecast = realtimeWeather.forecast;
      if (!forecast || forecast.length === 0) {
        try {
          const forecastData = await tripService.getWeatherForecast(location);
          if (forecastData && forecastData.length > 0) {
            forecast = forecastData;
          } else {
             forecast = Array.from({ length: 3 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() + i + 1);
              return {
                date: date.toISOString().split('T')[0],
                temp: realtimeWeather.temperature + Math.floor(Math.random() * 4) - 2,
                condition: realtimeWeather.condition,
              };
            });
          }
        } catch { /* Silent fail */ }
      }

      return { ...realtimeWeather, forecast };
    },
    enabled: !!location,
    staleTime: 1000 * 60 * 30, // 30 mins
  });

  if (error) return null;

  const theme = getWeatherTheme(weather?.condition);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative z-50 font-sans ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      onClick={() => {
        setIsExpanded(!isExpanded);
        onClick?.();
      }}
    >
      <motion.div 
        layout
        className={`
          backdrop-blur-md backdrop-saturate-150 shadow-lg border bg-gradient-to-br
          transition-all duration-300 overflow-hidden cursor-pointer
          ${theme.container}
          ${isExpanded ? 'rounded-3xl' : 'rounded-full hover:scale-[1.02] hover:shadow-xl'}
        `}
      >
        
        {/* Header (Always Visible) */}
        <motion.div layout="position" className="flex items-center justify-between px-5 py-3 gap-5">
          
          {/* Left: Info */}
          <div className="flex items-center gap-4">
            {/* Animated Icon Container */}
            <div className={`
              p-2.5 rounded-full shadow-inner bg-white/40 backdrop-blur-sm
              ${theme.icon}
            `}>
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
              ) : (
                getWeatherIcon(weather?.condition || '', "w-6 h-6")
              )}
            </div>
            
            <div className="flex flex-col justify-center">
              <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${theme.subtext}`}>
                <MapPinIcon className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{location}</span>
              </div>
              
              <div className={`text-xl font-serif font-bold leading-none mt-0.5 ${theme.text}`}>
                {isLoading ? (
                  <span className="w-12 h-5 bg-black/5 rounded animate-pulse block" />
                ) : (
                  <span>{Math.round(weather?.temperature || 0)}°<span className="text-sm ml-1 font-sans font-normal opacity-80">{weather?.condition}</span></span>
                )}
              </div>
            </div>
          </div>

          {/* Right: Toggle */}
          <motion.div 
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className={`opacity-50 ${theme.text}`}
          >
            <ChevronDownIcon className="w-4 h-4" />
          </motion.div>
        </motion.div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && weather && !isLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-5 pb-5"
            >
              <div className="w-full h-px bg-black/5 mb-4" />

              {/* Forecast Grid */}
              <div className="mb-4">
                <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60 ${theme.text}`}>Forecast</h4>
                <div className="grid grid-cols-3 gap-2">
                  {weather.forecast.slice(0, 3).map((day, idx) => (
                    <div key={idx} className="flex flex-col items-center bg-white/40 rounded-xl p-2 border border-white/20">
                      <span className={`text-[10px] font-bold mb-1 opacity-70 ${theme.text}`}>
                        {new Date(day.date).toLocaleDateString(getLocale(i18n.language), { weekday: 'short' })}
                      </span>
                      <div className={`mb-1 opacity-90 ${theme.icon}`}>
                        {getWeatherIcon(day.condition, "w-5 h-5")}
                      </div>
                      <span className={`text-xs font-bold ${theme.text}`}>{Math.round(day.temp)}°</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clothing / Extras */}
              {weather.clothing.length > 0 && (
                <div>
                  <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-3 opacity-60 ${theme.text}`}>Essentials</h4>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {weather.clothing.map((item, idx) => (
                      <div key={idx} className={`flex flex-col items-center min-w-[64px] p-2 rounded-xl border border-white/20 bg-white/40`}>
                         <div className={`w-5 h-5 mb-1.5 ${theme.icon}`} dangerouslySetInnerHTML={{__html: item.icon}} />
                         <span className={`text-[9px] font-bold text-center leading-tight ${theme.text}`}>{item.name}</span>
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