// src/components/trip/WeatherDialog.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { CloudIcon, SunIcon, ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useTripStore } from '../../stores/tripStore';
import { mockApiClient } from '../../services/mockApi';
import LoadingSpinner from '../LoadingSpinner';

interface WeatherDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const WeatherDialog: React.FC<WeatherDialogProps> = ({ isOpen, onClose }) => {
  const { currentTrip } = useTripStore();
  const location = currentTrip?.weather?.location || 'Paris';

  const { data: weather, isLoading, error } = useQuery({
    queryKey: ['weather', location],
    queryFn: () => mockApiClient.getWeather(location),
    enabled: !!location && isOpen,
  });

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return <SunIcon className="h-12 w-12 text-yellow-500" />;
    } else if (lowerCondition.includes('cloud')) {
      return <CloudIcon className="h-12 w-12 text-gray-500" />;
    } else {
      return <ExclamationTriangleIcon className="h-12 w-12 text-gray-500" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
              Detailed Weather Forecast
            </h2>
            <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl smooth-transition group"
            aria-label="Close weather dialog"
          >
            <XMarkIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-900" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-800 text-lg font-medium">Failed to load weather data</p>
            <p className="text-red-600 text-sm mt-2">Please try again later</p>
          </div>
        ) : weather ? (
          <div className="space-y-6">
            {/* Main weather display */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-teal-600 rounded-3xl p-8 text-white relative overflow-hidden">
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-400/20 rounded-full blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-white/80 text-lg font-medium mb-2">{weather.location}</p>
                    <p className="text-6xl font-bold">{weather.temperature}°</p>
                    <p className="text-white/90 text-xl font-medium mt-2">{weather.condition}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm p-4 rounded-2xl">
                    {getWeatherIcon(weather.condition)}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 rounded-xl p-4">
                    <p className="text-white/70 text-sm">Humidity</p>
                    <p className="text-white text-2xl font-bold">{weather.humidity}%</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-4">
                    <p className="text-white/70 text-sm">Feels like</p>
                    <p className="text-white text-2xl font-bold">{Math.round(weather.temperature * 0.9)}°</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Extended Forecast */}
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                7-Day Forecast
              </h3>
              <div className="space-y-3">
                {weather.forecast.map((day, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md smooth-transition"
                  >
                    <span className="text-gray-900 font-medium min-w-[120px]">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-600 text-sm bg-gray-100 px-3 py-1 rounded-lg">{day.condition}</span>
                      <span className="text-gray-900 font-bold text-lg min-w-[60px] text-right">{day.temp}°C</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Additional Weather Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                <p className="text-blue-600 text-sm font-medium mb-1">Wind Speed</p>
                <p className="text-blue-900 text-xl font-bold">15 km/h</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                <p className="text-green-600 text-sm font-medium mb-1">Visibility</p>
                <p className="text-green-900 text-xl font-bold">10 km</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 text-center border border-purple-100">
                <p className="text-purple-600 text-sm font-medium mb-1">UV Index</p>
                <p className="text-purple-900 text-xl font-bold">6</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No weather data available</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 smooth-transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeatherDialog;