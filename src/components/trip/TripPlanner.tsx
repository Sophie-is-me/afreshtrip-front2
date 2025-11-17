import { useState } from 'react';
import TripSettingsPanel from './TripSettingsPanel';
import TripMap from './TripMap';
import WeatherSummary from './WeatherSummary';
import WeatherDialog from './WeatherDialog';
import BottomSheet from '../BottomSheet';
import FloatingActionButton from '../FloatingActionButton';
import { Bars3Icon } from '@heroicons/react/24/outline';

const TripPlanner = () => {
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showWeatherDialog, setShowWeatherDialog] = useState(false);

  return (
    <div className="w-full flex flex-col bg-linear-to-br from-slate-50 via-blue-50 to-teal-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Desktop: Two-panel layout */}
      <div className="hidden md:flex md:gap-4 md:ps-8 md:pb-4 md:min-h-[calc(100vh-64px)] relative z-10">
        {/* Left Panel - Trip Planning Components */}
        <div className="flex-[0_0_40%] flex flex-col gap-6 bg-transparent scrollbar-thin">
          <TripSettingsPanel />
        </div>

        {/* Center Panel - Map with Weather Overlay */}
        <div className="flex-1 relative md:sticky md:top-0 md:h-[calc(100vh-64px)] overflow-hidden shadow-2xl border-4 border-white/50">
          <TripMap />
          
          {/* Weather Widget Overlay - Top Right */}
          <div className="absolute top-4 right-4 z-20 w-80">
            <WeatherSummary onClick={() => setShowWeatherDialog(true)} />
          </div>
        </div>
      </div>

      {/* Mobile: Map + bottom sheet */}
      <div className="md:hidden h-full relative">
        {/* Map */}
        <div className="h-full relative">
          <TripMap />
          
          {/* Weather Widget Overlay - Top Right */}
          <div className="absolute top-4 right-4 z-20 w-72">
            <WeatherSummary onClick={() => setShowWeatherDialog(true)} />
          </div>
        </div>

        {/* Bottom Sheet for Mobile */}
        <BottomSheet
          isOpen={showBottomSheet}
          onClose={() => setShowBottomSheet(false)}
          title="Plan Your Trip"
        >
          <div className="space-y-6">
            <TripSettingsPanel />
          </div>
        </BottomSheet>

        {/* Mobile FAB */}
        <FloatingActionButton
          onClick={() => setShowBottomSheet(!showBottomSheet)}
          icon={<Bars3Icon className="h-6 w-6" />}
          label="Open trip planner"
          position="bottom-right"
          variant="primary"
        />
      </div>

      {/* Weather Dialog */}
      <WeatherDialog
        isOpen={showWeatherDialog}
        onClose={() => setShowWeatherDialog(false)}
      />
    </div>
  );
};

export default TripPlanner;