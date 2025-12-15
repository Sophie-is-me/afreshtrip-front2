import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Define the interface for the trip prop
// We extend the previous simple data structure to include an image
export interface TripCardData {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  stops: number;
  status: 'planned' | 'active' | 'completed' | 'cancelled';
  imageUrl?: string;
}

interface TripCardProps {
  trip: TripCardData;
  onDelete?: (id: string) => void;
}

const TripCard: React.FC<TripCardProps> = ({ trip, onDelete }) => {
  const { t } = useTranslation();

  // Helper to get status colors and labels
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          dot: 'bg-blue-500',
          label: t('trips.statuses.active')
        };
      case 'completed':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          dot: 'bg-green-500',
          label: t('trips.statuses.completed')
        };
      case 'cancelled':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          dot: 'bg-red-500',
          label: t('trips.statuses.cancelled')
        };
      case 'planned':
      default:
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          dot: 'bg-yellow-500',
          label: t('trips.statuses.planned')
        };
    }
  };

  const statusConfig = getStatusConfig(trip.status);

  // Format date range nicely (e.g., "Oct 12 - 15, 2024")
  const formatDateRange = (start: string, end: string) => {
    try {
      const s = new Date(start);
      const e = new Date(end);
      return `${s.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${e.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } catch {
      return start;
    }
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
      {/* Image Area */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {trip.imageUrl ? (
          <img 
            src={trip.imageUrl} 
            alt={trip.destination} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          // Fallback Gradient if no image
          <div className="w-full h-full bg-linear-to-br from-teal-500 to-teal-700 flex items-center justify-center">
            <span className="text-white text-4xl font-bold opacity-30">
              {trip.destination.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Status Badge - Floating on top right */}
        <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-xs backdrop-blur-md bg-white/90 ${statusConfig.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
          {statusConfig.label}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 line-clamp-1" title={trip.destination}>
            {trip.destination}
          </h3>
        </div>

        <div className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDateRange(trip.startDate, trip.endDate)}</span>
        </div>

        {/* Trip Meta Stats */}
        <div className="flex items-center gap-4 text-xs font-medium text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{trip.stops} {t('trips.stops')}</span>
          </div>
          <div className="w-px h-4 bg-gray-300"></div>
          <div className="flex items-center gap-1.5">
             {/* Placeholder for "Travelers" count if available in future API */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>1 {t('trips.travelers')}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
          <Link 
            to={`/trip-planner?tripId=${trip.id}`} 
            className="flex-1 text-center py-2 px-3 bg-teal-50 text-teal-700 text-sm font-medium rounded-lg hover:bg-teal-100 transition-colors"
          >
            {t('common.featureAccess.viewPlans')}
          </Link>
          
          {onDelete && (
            <button 
              onClick={() => onDelete(trip.id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title={t('common.error.delete')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripCard;