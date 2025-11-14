// src/components/trip/TripSettingsPanel.tsx
import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CogIcon, TruckIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useTripStore } from '../../stores/tripStore';
import { mockApiClient } from '../../services/mockApi';
import type { TripSettings } from '../../types/trip';
import LoadingSpinner from '../LoadingSpinner';

const TripSettingsPanel: React.FC = () => {
  const { setTripSettings, setTrip, setLoading, setError } = useTripStore();

  const [settings, setSettings] = useState<TripSettings>({
    destination: '',
    duration: 1,
    budget: 1000,
    travelers: 1,
    preferences: [],
    vehicle: 'car',
  });

  const [transport, setTransport] = useState<string>('car');
  const [tripType, setTripType] = useState<string>('one-way');
  const [origin, setOrigin] = useState<string>('');
  const [interestCategory, setInterestCategory] = useState<string>('Outdoors & Sport');
  const [suggestedStops, setSuggestedStops] = useState<string[]>([]);

  // Update settings when transport changes
  useEffect(() => {
    setSettings(prev => ({ ...prev, vehicle: transport as 'car' | 'bike' }));
  }, [transport]);

  const transportOptions = [
    { value: 'car', label: 'Car Trip', icon: TruckIcon },
    { value: 'bike', label: 'Bike Trip', icon: AdjustmentsHorizontalIcon },
  ];

  const tripTypeOptions = [
    { value: 'one-way', label: 'One way' },
    { value: 'return', label: 'Return way' },
  ];

  const interestCategoryOptions = [
    'Outdoors & Sport',
    'Historical Sites',
    'Museums',
    'Food & Drink',
    'Shopping',
    'Nature',
    'Culture',
  ];

  const mockSuggestedStops = {
    'Outdoors & Sport': ['Amalienborg Palace', 'Charlottenlund Palace', 'The Open Air Museum', 'Charlottenlund Beach Park'],
    'Historical Sites': ['Christiansborg Palace', 'Rosenborg Castle', 'Frederiksborg Castle'],
    'Museums': ['National Museum', 'Danish Museum of Art & Design', 'Experimentarium'],
    'Food & Drink': ['Torvehallerne Market', 'Geranium Restaurant', 'BrewDog Copenhagen'],
    'Shopping': ['Strøget', 'Magasin du Nord', 'Illum'],
    'Nature': ['Dyrehaven', 'Langelinie Park', 'Superkilen'],
    'Culture': ['Royal Danish Theatre', 'Copenhagen Opera House', 'Tivoli Gardens'],
  };

  const generateTripMutation = useMutation({
    mutationFn: (tripSettings: TripSettings) => mockApiClient.generateTrip(tripSettings),
    onSuccess: (trip) => {
      setTrip(trip);
      setTripSettings(settings);
      setLoading(false);
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  const handleGenerateTrip = () => {
    setLoading(true);
    setError(null);
    // Generate suggested stops based on interest category
    const stops = mockSuggestedStops[interestCategory as keyof typeof mockSuggestedStops] || [];
    setSuggestedStops(stops);
    generateTripMutation.mutate(settings);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-7 h-full shadow-xl border border-gray-100 hover:shadow-2xl smooth-transition">
      {/* Header with gradient accent */}
      <div className="flex items-center mb-8 pb-5 border-b border-gray-100">
        <div className="w-12 h-12 bg-linear-to-br from-teal-500 to-blue-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-teal-500/30">
          <CogIcon className="h-7 w-7 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Plan Your Journey</h2>
          <p className="text-xs text-gray-500 mt-0.5">Customize your perfect trip</p>
        </div>
      </div>

      <div className="space-y-5">
        {/* Transportation Selection with Icons */}
        <div className="group">
          <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
            <TruckIcon className="h-4 w-4 mr-2 text-teal-600" />
            Transportation Mode
          </label>
          <div className="relative">
            <select
              value={transport}
              onChange={(e) => setTransport(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-linear-to-br from-gray-50 to-white smooth-transition hover:border-teal-300 appearance-none cursor-pointer font-medium text-gray-700 shadow-sm"
            >
              {transportOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Trip Type with modern styling */}
        <div className="group">
          <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
            <AdjustmentsHorizontalIcon className="h-4 w-4 mr-2 text-teal-600" />
            Trip Type
          </label>
          <div className="relative">
            <select
              value={tripType}
              onChange={(e) => setTripType(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-linear-to-br from-gray-50 to-white smooth-transition hover:border-teal-300 appearance-none cursor-pointer font-medium text-gray-700 shadow-sm"
            >
              {tripTypeOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Location Inputs with enhanced design */}
        <div className="space-y-4 p-5 bg-linear-to-br from-blue-50/50 to-teal-50/50 rounded-2xl border border-blue-100/50">
          <div className="group">
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Starting Point
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Where are you starting from?"
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white smooth-transition placeholder:text-gray-400 hover:border-blue-300 font-medium shadow-sm"
            />
          </div>

          <div className="group">
            <label className="flex items-center text-sm font-bold text-gray-700 mb-2">
              <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Dream Destination
            </label>
            <input
              type="text"
              value={settings.destination}
              onChange={(e) => setSettings(prev => ({ ...prev, destination: e.target.value }))}
              placeholder="Where do you want to go?"
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white smooth-transition placeholder:text-gray-400 hover:border-teal-300 font-medium shadow-sm"
            />
          </div>
        </div>

        {/* Interest Category with modern card design */}
        <div className="group">
          <label className="flex items-center text-sm font-bold text-gray-700 mb-3">
            <svg className="w-4 h-4 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            What Interests You?
          </label>
          <div className="relative">
            <select
              value={interestCategory}
              onChange={(e) => setInterestCategory(e.target.value)}
              className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-linear-to-br from-gray-50 to-white smooth-transition hover:border-purple-300 appearance-none cursor-pointer font-medium text-gray-700 shadow-sm"
            >
              {interestCategoryOptions.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Generate Button with enhanced styling */}
        <button
          onClick={handleGenerateTrip}
          disabled={generateTripMutation.isPending || !settings.destination}
          className="group w-full bg-linear-to-r from-teal-600 via-teal-500 to-blue-600 text-white py-4 px-6 rounded-2xl hover:from-teal-700 hover:via-teal-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-bold text-base shadow-xl shadow-teal-500/40 smooth-transition hover:shadow-2xl hover:shadow-teal-500/50 hover:scale-[1.02] active:scale-[0.98]"
        >
          {generateTripMutation.isPending ? (
            <>
              <LoadingSpinner size="sm" className="mr-3" />
              <span>Creating Your Adventure...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2 group-hover:rotate-90 smooth-transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate My Trip
            </>
          )}
        </button>

        {/* Suggested Stops with beautiful cards */}
        {suggestedStops.length > 0 && (
          <div className="pt-4">
            <h3 className="flex items-center text-sm font-bold text-gray-900 mb-4">
              <svg className="w-5 h-5 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              Suggested Stops Along Your Route
            </h3>
            <div className="space-y-2.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
              {suggestedStops.map((stop, index) => (
                <div
                  key={index}
                  className="group p-4 bg-linear-to-r from-teal-50 via-blue-50 to-purple-50 rounded-xl border-2 border-teal-100 hover:border-teal-300 smooth-transition hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-start">
                    <div className="shrink-0 w-8 h-8 bg-linear-to-br from-teal-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm mr-3 shadow-md">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 font-semibold group-hover:text-teal-700 smooth-transition">{stop}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Car Rent Feature with modern design */}
        <div className="pt-4 border-t border-gray-100">
          <button className="group w-full bg-linear-to-r from-emerald-600 via-green-600 to-teal-600 text-white py-4 px-6 rounded-2xl hover:from-emerald-700 hover:via-green-700 hover:to-teal-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 font-bold shadow-xl shadow-emerald-500/40 smooth-transition hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center">
            <svg className="w-5 h-5 mr-2 group-hover:translate-x-1 smooth-transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            Rent a Car for Your Journey
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripSettingsPanel;