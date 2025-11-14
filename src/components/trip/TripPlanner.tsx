import { useState } from 'react';
import TripSettingsPanel from './TripSettingsPanel';
import TripMap from './TripMap';
import WeatherSummary from './WeatherSummary';
import WeatherDialog from './WeatherDialog';
import TripSummary from './TripSummary';
import RouteInfoWidget from './RouteInfoWidget';
import BottomSheet from '../BottomSheet';
import FloatingActionButton from '../FloatingActionButton';
import { Bars3Icon, XMarkIcon, Cog6ToothIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const TripPlanner = () => {
  const [showSettings, setShowSettings] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showWeatherDialog, setShowWeatherDialog] = useState(false);

  return (
    <div className="w-full flex flex-col bg-linear-to-br from-slate-50 via-blue-50 to-teal-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Desktop: Two-panel layout */}
      <div className="hidden xl:flex xl:gap-8 xl:p-8 xl:min-h-[calc(100vh-64px)] relative z-10">
        {/* Left Panel - Trip Planning Components */}
        <div className="w-[420px] flex flex-col gap-6 bg-transparent scrollbar-thin">
          <TripSettingsPanel />
        </div>

        {/* Center Panel - Map with Weather Overlay */}
        <div className="flex-1 relative xl:sticky xl:top-0 xl:h-[calc(100vh-64px)] rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50">
          <TripMap />
          
          {/* Weather Widget Overlay - Top Right */}
          <div className="absolute top-4 right-4 z-20 w-80">
            <WeatherSummary onClick={() => setShowWeatherDialog(true)} />
          </div>
        </div>
      </div>

      {/* Tablet: Collapsible panels + map */}
      <div className="hidden md:block xl:hidden h-full relative">
        {/* Collapsible Left Panel */}
        <div className={`absolute left-0 top-0 h-full w-[420px] bg-white/95 backdrop-blur-lg shadow-2xl z-30 transform smooth-transition rounded-r-3xl border-r-4 border-white/50 ${
          showSettings ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-6 h-full overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Trip Settings</h2>
                <p className="text-xs text-gray-500 mt-1">Customize your journey</p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2.5 hover:bg-gray-100 rounded-2xl smooth-transition group"
                aria-label="Close settings"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-900" />
              </button>
            </div>
            <div className="space-y-6">
              <TripSettingsPanel />
            </div>
          </div>
        </div>

        {/* Collapsible Right Panel */}
        <div className={`absolute right-0 top-0 h-full w-[420px] bg-white/95 backdrop-blur-lg shadow-2xl z-30 transform smooth-transition rounded-l-3xl border-l-4 border-white/50 ${
          showSummary ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="p-6 h-full overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Trip Details</h2>
                <p className="text-xs text-gray-500 mt-1">Your journey overview</p>
              </div>
              <button
                onClick={() => setShowSummary(false)}
                className="p-2.5 hover:bg-gray-100 rounded-2xl smooth-transition group"
                aria-label="Close summary"
              >
                <XMarkIcon className="h-6 w-6 text-gray-600 group-hover:text-gray-900" />
              </button>
            </div>
            <div className="space-y-6">
              <TripSummary />
              <RouteInfoWidget />
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="h-full relative">
          <TripMap />
          
          {/* Weather Widget Overlay - Top Right */}
          <div className="absolute top-4 right-4 z-20 w-72">
            <WeatherSummary onClick={() => setShowWeatherDialog(true)} />
          </div>
        </div>

        {/* Tablet FABs with enhanced styling */}
        <FloatingActionButton
          onClick={() => setShowSettings(!showSettings)}
          icon={<Cog6ToothIcon className="h-6 w-6" />}
          label="Toggle settings"
          position="bottom-left"
          variant="white"
        />

        <FloatingActionButton
          onClick={() => setShowSummary(!showSummary)}
          icon={<ChartBarIcon className="h-6 w-6" />}
          label="Toggle summary"
          position="bottom-right"
          variant="white"
        />
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
            <div className="border-t border-gray-200 pt-6">
              <TripSettingsPanel />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <TripSummary />
            </div>
            <div className="border-t border-gray-200 pt-6">
              <RouteInfoWidget />
            </div>
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