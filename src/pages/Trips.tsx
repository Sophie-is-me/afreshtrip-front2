import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapIcon } from '@heroicons/react/24/outline';

// Components
import Header from '../components/Header';
import Footer from '../components/Footer';
import FeatureGate from '../components/FeatureGate';
import { FeatureId } from '../types/features';
import EmptyState from '../components/ui/EmptyState';

// New Modular Components
import PassportHeader from '../components/trip/PassportHeader';
import ActiveTripHero from '../components/trip/ActiveTripHero';
import TripControls, { type TripTab, type ViewMode } from '../components/trip/TripControls';
import TripCard from '../components/trip/TripCard';

// Hooks & Types
import { useTrips } from '../hooks/queries/useTripQueries';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureAccess } from '../hooks/useFeatureAccess';
import { type ApiTrip } from '../services/api/tripApiService';

const TripsContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- State ---
  const [activeTab, setActiveTab] = useState<TripTab>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  const { hasFeatureAccess } = useFeatureAccess();
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    hasFeatureAccess(FeatureId.BASIC_TRIP_PLANNING).then(setHasAccess);
  }, [hasFeatureAccess]);

  // Note: We fetch a larger page size to simulate a "Library" feel.
  // In a real app with 1000s of trips, filters should be server-side.
  const { data: tripsData } = useTrips(1, 50, hasAccess);

  // --- Data Processing ---
  const {
    processedTrips,
    activeTrip,
    availableYears
  } = useMemo(() => {
    if (!tripsData?.trips) return { 
      processedTrips: [], 
      activeTrip: null, 
      stats: { total: 0, upcoming: 0, countries: 0 }, 
      availableYears: [] 
    };

    const rawTrips = tripsData.trips;
    const now = new Date();

    // 1. Sort trips by date (Newest first)
    const sorted = [...rawTrips].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );

    // 2. Identify Active Trip (The most relevant one happening right now)
    const active = sorted.find(t => {
      const start = new Date(t.startDate);
      const end = new Date(t.endDate);
      return now >= start && now <= end && t.status !== 'cancelled';
    });

    // 3. Filter & Categorize for the Main List
    let filtered = sorted.filter(t => {
      // Exclude active trip from the main list to avoid duplication if it's shown in Hero
      if (active && t.id === active.id) return false;
      
      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return t.destination.toLowerCase().includes(query) || 
               t.name.toLowerCase().includes(query);
      }
      return true;
    });

    // 4. Tab Filtering
    if (activeTab === 'upcoming') {
      filtered = filtered.filter(t => new Date(t.startDate) > now && t.status !== 'cancelled');
      // Sort upcoming: Nearest date first
      filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    } else if (activeTab === 'past') {
      filtered = filtered.filter(t => new Date(t.endDate) < now || t.status === 'completed');
    }

    // 5. Year Filter (Only for Past/All)
    const years = Array.from(new Set(rawTrips.map(t => new Date(t.startDate).getFullYear()))).sort((a, b) => b - a);
    
    if (selectedYear !== 'all') {
      filtered = filtered.filter(t => new Date(t.startDate).getFullYear() === selectedYear);
    }

    return {
      processedTrips: filtered,
      activeTrip: active,
      availableYears: years
    };
  }, [tripsData, searchQuery, activeTab, selectedYear]);


  // --- Helper: Trip Mapper ---
  const mapTripToCardData = (trip: ApiTrip) => ({
    id: trip.id,
    date: trip.startDate,
    endDate: trip.endDate,
    city: trip.destination,
    stops: trip.places?.length || 0,
    status: trip.status
  });

  const handleShare = (id: string) => console.log('Share', id);
  const handleRename = (id: string) => console.log('Rename', id);
  const handleDelete = (id: string) => console.log('Delete', id);


  // --- Render Sections ---

  return (
    <div className="animate-fade-in-up">

      {/* 3. Active Trip Hero (Conditional) */}
      {activeTrip && !searchQuery && (
        <ActiveTripHero trip={{
          id: activeTrip.id,
          destination: activeTrip.destination,
          startDate: activeTrip.startDate,
          endDate: activeTrip.endDate,
          weather: activeTrip.weather
        }} />
      )}

      {/* 4. Controls */}
      <TripControls
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewChange={setViewMode}
        years={availableYears}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />

      {/* 5. Trips Grid / Timeline */}
      {processedTrips.length === 0 ? (
        <EmptyState
          title={searchQuery ? t('trips.noSearchResults') : t('trips.noTrips')}
          description={searchQuery ? t('trips.tryDifferentSearch') : t('trips.noTripsDescription')}
          icon={<MapIcon className="h-10 w-10 text-slate-300" />}
          actionLabel={!searchQuery ? t('trips.planFirstTrip', {defaultValue: 'Start Planning'}) : undefined}
          onAction={!searchQuery ? () => navigate('/') : undefined}
          className="bg-white/50 backdrop-blur-sm border-slate-200"
        />
      ) : (
        <div className="space-y-12">
          {/* If sorting by Past + Grid view, Group by Year visually */}
          {activeTab === 'past' && viewMode === 'grid' && selectedYear === 'all' && !searchQuery ? (
             availableYears.map(year => {
               const yearTrips = processedTrips.filter(t => new Date(t.startDate).getFullYear() === year);
               if (yearTrips.length === 0) return null;

               return (
                 <div key={year}>
                   <div className="flex items-center gap-4 mb-6">
                     <h2 className="text-2xl font-bold text-slate-300">{year}</h2>
                     <div className="h-px bg-slate-200 grow" />
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {yearTrips.map(trip => (
                       <TripCard
                         key={trip.id}
                         trip={mapTripToCardData(trip)}
                         viewMode="grid"
                         onShare={handleShare}
                         onRename={handleRename}
                         onDelete={handleDelete}
                       />
                     ))}
                   </div>
                 </div>
               );
             })
          ) : (
            // Default Grid/List View
            <div className={
              viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "flex flex-col gap-4 max-w-4xl mx-auto"
            }>
              {processedTrips.map(trip => (
                <TripCard
                  key={trip.id}
                  trip={mapTripToCardData(trip)}
                  viewMode={viewMode}
                  onShare={handleShare}
                  onRename={handleRename}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Trips: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Header />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* 1. Header is always visible */}
        <PassportHeader user={user || null} stats={{ total: 0, upcoming: 0, countries: 0 }} />

        {/* 2. Feature Gate wraps the content */}
        <FeatureGate
          feature={FeatureId.BASIC_TRIP_PLANNING}
          restrictMode="blur" // Use the new blur mode we created
          fallback={null} // Default fallback handled by FeatureGate blur logic
        >
          <TripsContent />
        </FeatureGate>

      </main>

      <Footer />
    </div>
  );
};

export default Trips;