import React from 'react';
import { useTranslation } from 'react-i18next';

export type TripStatusFilter = 'all' | 'planned' | 'active' | 'completed' | 'cancelled';
export type TripSortOption = 'date_desc' | 'date_asc';

interface TripFiltersProps {
  currentStatus: TripStatusFilter;
  onStatusChange: (status: TripStatusFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: TripSortOption;
  onSortChange: (sort: TripSortOption) => void;
}

const TripFilters: React.FC<TripFiltersProps> = ({
  currentStatus,
  onStatusChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
}) => {
  const { t } = useTranslation();

  const statuses: { value: TripStatusFilter; label: string }[] = [
    { value: 'all', label: t('trips.statuses.all', 'All') },
    { value: 'planned', label: t('trips.statuses.planned') },
    { value: 'active', label: t('trips.statuses.active') },
    { value: 'completed', label: t('trips.statuses.completed') },
    { value: 'cancelled', label: t('trips.statuses.cancelled') },
  ];

  return (
    <div className="space-y-4 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-0 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('trips.searchPlaceholder', 'Search by city...')}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 sm:text-sm transition-shadow"
          />
        </div>

        {/* Sort Dropdown (Desktop: Right aligned) */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 hidden sm:inline">{t('common.sortBy', 'Sort by')}:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as TripSortOption)}
            className="block w-full md:w-auto pl-3 pr-8 py-2 text-base border-gray-300 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm rounded-lg bg-white shadow-xs cursor-pointer"
          >
            <option value="date_desc">{t('trips.sort.newest', 'Date (Newest)')}</option>
            <option value="date_asc">{t('trips.sort.oldest', 'Date (Oldest)')}</option>
          </select>
        </div>
      </div>

      {/* Status Tabs - Scrollable on mobile */}
      <div className="border-b border-gray-200 overflow-x-auto scrollbar-hide">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          {statuses.map((status) => {
            const isActive = currentStatus === status.value;
            return (
              <button
                key={status.value}
                onClick={() => onStatusChange(status.value)}
                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                  ${isActive 
                    ? 'border-teal-500 text-teal-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {status.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default TripFilters;