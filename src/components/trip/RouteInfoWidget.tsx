// src/components/trip/RouteInfoWidget.tsx
import React from 'react';
import { MapIcon, ClockIcon, ArrowPathIcon, CloudIcon } from '@heroicons/react/24/outline';
import { useTripStore } from '../../stores/tripStore';

const RouteInfoWidget: React.FC = () => {
  const { currentTrip } = useTripStore();

  if (!currentTrip) {
    return (
      <div className="bg-white shadow-lg rounded-lg p-4 w-64">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Route Info</h3>
        <p className="text-gray-500 text-sm">No route data available</p>
      </div>
    );
  }

  const { route, settings } = currentTrip;
  const durationHours = Math.floor(route.duration / 60);
  const durationMinutes = route.duration % 60;

  // Calculate CO2 emissions (mock data)
  const calculateCO2 = (distance: number, vehicle: 'car' | 'bike'): number => {
    if (vehicle === 'bike') return 0;
    // Average car CO2 emission: ~130g/km
    return Math.round(distance * 130);
  };

  // Calculate segments between waypoints
  const calculateSegments = () => {
    const segments = [];
    for (let i = 0; i < route.waypoints.length - 1; i++) {
      const start = route.waypoints[i];
      const end = route.waypoints[i + 1];
      // Simple distance calculation (rough approximation)
      const distance = Math.sqrt((end.lat - start.lat) ** 2 + (end.lng - start.lng) ** 2) * 111; // km
      const time = Math.round(distance * 2); // minutes at 30 km/h
      segments.push({
        index: i + 1,
        distance: Math.round(distance * 10) / 10,
        time,
      });
    }
    return segments;
  };

  const co2Emission = calculateCO2(route.distance, settings.vehicle);
  const segments = calculateSegments();

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-gray-100 hover:shadow-2xl smooth-transition">
      <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
        <div className="w-11 h-11 bg-linear-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-blue-500/30">
          <MapIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Route Details</h3>
          <p className="text-xs text-gray-500 mt-0.5">Your travel information</p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="group flex items-center justify-between py-3.5 px-4 bg-linear-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-100 hover:border-blue-300 smooth-transition hover:shadow-md">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
              <ArrowPathIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-gray-700 font-semibold">Total Distance</span>
          </div>
          <span className="text-base font-bold text-blue-700">{route.distance} km</span>
        </div>

        <div className="group flex items-center justify-between py-3.5 px-4 bg-linear-to-r from-green-50 to-emerald-50 rounded-2xl border-2 border-green-100 hover:border-green-300 smooth-transition hover:shadow-md">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-green-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
              <ClockIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-gray-700 font-semibold">Travel Time</span>
          </div>
          <span className="text-base font-bold text-green-700">
            {durationHours > 0 ? `${durationHours}h ` : ''}{durationMinutes}m
          </span>
        </div>

        <div className="group flex items-center justify-between py-3.5 px-4 bg-linear-to-r from-red-50 to-orange-50 rounded-2xl border-2 border-red-100 hover:border-red-300 smooth-transition hover:shadow-md">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-red-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
              <CloudIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-sm text-gray-700 font-semibold">CO₂ Emissions</span>
          </div>
          <span className="text-base font-bold text-red-700">{co2Emission}g</span>
        </div>

        <div className="group flex items-center justify-between py-3.5 px-4 bg-linear-to-r from-purple-50 to-pink-50 rounded-2xl border-2 border-purple-100 hover:border-purple-300 smooth-transition hover:shadow-md">
          <div className="flex items-center">
            <div className="w-9 h-9 bg-purple-500 rounded-xl flex items-center justify-center mr-3 shadow-md">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span className="text-sm text-gray-700 font-semibold">Waypoints</span>
          </div>
          <span className="text-base font-bold text-purple-700">{route.waypoints.length}</span>
        </div>

        {/* Segment Details */}
        {segments.length > 0 && (
          <div className="pt-4 mt-4 border-t-2 border-gray-100">
            <h4 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide flex items-center">
              <svg className="w-4 h-4 mr-2 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Route Segments
            </h4>
            <div className="space-y-2">
              {segments.map((segment) => (
                <div
                  key={segment.index}
                  className="flex justify-between items-center bg-linear-to-r from-teal-50 to-blue-50 rounded-xl p-3 border border-teal-100 hover:border-teal-300 smooth-transition"
                >
                  <span className="text-sm text-gray-700 font-semibold">Segment {segment.index}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-white px-2 py-1 rounded-lg font-bold text-gray-700">{segment.time}min</span>
                    <span className="text-xs bg-white px-2 py-1 rounded-lg font-bold text-gray-700">{segment.distance}km</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-4 mt-4 border-t-2 border-gray-100">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">
              Estimated travel time at average speed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteInfoWidget;