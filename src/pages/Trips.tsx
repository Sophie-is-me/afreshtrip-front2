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

import { useAuth } from '../contexts/AuthContext';
import { type ApiTrip } from '../services/api/tripApiService';

const TripsContent: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- State ---
  const [activeTab, setActiveTab] = useState<TripTab>('upcoming');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

//  const { hasFeatureAccess } = useFeatureAccess();
  const [hasAccess, setHasAccess] = useState(false);



  // Note: We fetch a larger page size to simulate a "Library" feel.
  // In a real app with 1000s of trips, filters should be server-side.
  //const { data: tripsData } = useTrips(1, 50, hasAccess);




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