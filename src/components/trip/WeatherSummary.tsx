// src/components/trip/WeatherSummary.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CloudIcon, SunIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTripStore } from '../../stores/tripStore';
import { mockApiClient } from '../../services/mockApi';
import LoadingSpinner from '../LoadingSpinner';

interface WeatherSummaryProps {
  onClick: () => void;
}

const WeatherSummary: React.FC<WeatherSummaryProps> = ({ onClick }) => {
  const { currentTrip } = useTripStore();
  const location = currentTrip?.weather?.location || 'Paris';

  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['weather', location],
    queryFn: () => mockApiClient.getWeather(location),
    enabled: !!location,
  });

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return <SunIcon className="h-8 w-8 text-yellow-500" />;
    } else if (lowerCondition.includes('cloud')) {
      return <CloudIcon className="h-8 w-8 text-gray-500" />;
    } else {
      return <ExclamationTriangleIcon className="h-8 w-8 text-gray-500" />;
    }
  };

  return (
    <div 
      onClick={onClick}
      className="bg-gradient-to-br from-blue-500 via-blue-600 to-teal-600 rounded-3xl p-6 w-full shadow-2xl border border-blue-400/30 relative overflow-hidden cursor-pointer hover:shadow-3xl transform hover:scale-[1.02] smooth-transition"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/20 rounded-full blur-2xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Weather Summary
            </h3>
            <p className="text-xs text-blue-100 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl shadow-lg">
            {getWeatherIcon(weather?.condition || 'unknown')}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
          </div>
        ) : error ? (
          <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-2xl p-4 text-center">
            <p className="text-white text-sm font-medium">Failed to load weather data</p>
          </div>
        ) : weather ? (
          <div className="bg-white/15 backdrop-blur-md rounded-2xl p-5 border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium mb-1">{weather.location}</p>
                <p className="text-4xl font-bold text-white">{weather.temperature}°</p>
                <p className="text-white/90 text-base font-medium mt-1">{weather.condition}</p>
              </div>
              <div className="text-right">
                <div className="bg-white/20 rounded-xl px-4 py-2">
                  <p className="text-white/70 text-xs">Humidity</p>
                  <p className="text-white text-lg font-bold">{weather.humidity}%</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-white/70 text-sm text-center">No weather data available</p>
        )}
        
        <div className="mt-4 text-center">
          <p className="text-white/80 text-sm">Click for detailed forecast</p>
        </div>
      </div>
    </div>
  );
};

export default WeatherSummary;