// src/components/trip/WeatherSummary.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CloudIcon, SunIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTripStore } from '../../stores/tripStore';
import { tripService } from '../../services/tripService';
import LoadingSpinner from '../LoadingSpinner';

interface WeatherSummaryProps {
  onClick: () => void;
  location?: string;
  time?: string;
}

const WeatherSummary: React.FC<WeatherSummaryProps> = ({ onClick, location: propLocation, time: propTime }) => {
  const { t, i18n } = useTranslation();
  const { currentTrip } = useTripStore();
  const location = propLocation || currentTrip?.weather?.location || 'Paris';
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
          const cityCodeMap: Record<string, string> = {
            'Copenhagen': 'CPH',
            'Paris': 'PAR',
            'London': 'LON',
            'Berlin': 'BER',
          };
          const cityCode = cityCodeMap[location] || 'CPH';
          forecast = await tripService.getWeatherForecast(cityCode);
        } catch {
          // Use default forecast if API fails
          forecast = Array.from({ length: 5 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() + i);
            return {
              date: date.toISOString().split('T')[0],
              temp: realtimeWeather.temperature + Math.floor(Math.random() * 5) - 2,
              condition: realtimeWeather.condition,
            };
          });
        }
      }

      return {
        ...realtimeWeather,
        forecast,
      };
    },
    enabled: !!location,
  });

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return <SunIcon className="h-6 w-6 text-orange-400" />;
    } else if (lowerCondition.includes('cloud')) {
      return <CloudIcon className="h-6 w-6 text-gray-500" />;
    } else {
      return <ExclamationTriangleIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getConditionIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return <SunIcon className="h-6 w-6 text-orange-400" />;
    }
    return <CloudIcon className="h-6 w-6 text-gray-600" />;
  };

  const getLocale = () => {
    switch (i18n.language) {
      case 'fr': return 'fr-FR';
      case 'es': return 'es-ES';
      case 'zh': return 'zh-CN';
      default: return 'en-US';
    }
  };


  return (
    <div
      onClick={onClick}
      className="bg-white border-gray-400 border-2 p-4 w-full max-w-sm mx-auto shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-300 rounded-lg p-4 text-center">
          <p className="text-red-700 text-sm font-medium">{t('trips.failedToLoadWeather')}</p>
        </div>
      ) : weather ? (
        <>
          {/* Date Header */}
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h2 className="text-lg font-semibold text-gray-800">
              {new Date(weather.forecast[0].date).toLocaleDateString(getLocale(), { weekday: 'short', day: '2-digit', month: 'long' })}
            </h2>
          </div>

          {/* Current Weather */}
          <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between mb-4">
            <span className="text-4xl font-bold text-gray-800">{weather.temperature}°</span>
            <div className="flex items-center">
              {getWeatherIcon(weather.condition)}
              <span className="text-lg font-medium text-gray-700 ml-2">{weather.condition}</span>
            </div>
          </div>

          {/* 3-days forecast */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-700 mb-2">{t('trips.threeDaysForecast')}</h3>
            <div className="space-y-1">
              {weather.forecast.slice(0, 3).map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  {getConditionIcon(day.condition)}
                  <span className="text-base font-medium text-gray-600">{day.temp} ° C</span>
                </div>
              ))}
            </div>
          </div>

          {/* Clothes Suggestion */}
          <div>
            <h3 className="text-base font-semibold text-gray-700 mb-2">{t('trips.clothes')}</h3>
            <div className="flex justify-around items-center space-x-3 text-gray-500">
              {weather.clothing.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className="w-6 h-6" dangerouslySetInnerHTML={{__html: item.icon}} />
                  <span className="text-xs mt-1">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-sm text-center">{t('trips.noWeatherData')}</p>
      )}
    </div>
  );
};

export default WeatherSummary;