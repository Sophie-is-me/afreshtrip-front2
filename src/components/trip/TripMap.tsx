import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { useTripStore } from '../../stores/tripStore';
import type { Trip } from '../../types/trip';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- Styles Injection ---
// Customizing Leaflet via global styles for specific marker animations and popup overrides
const mapGlobalStyles = `
  /* Reset default marker styling quirks */
  .custom-marker-icon {
    background: transparent !important;
    border: none !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* Popup Styling */
  .modern-popup .leaflet-popup-content-wrapper {
    padding: 0;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }
  .modern-popup .leaflet-popup-content {
    margin: 0;
    width: 280px !important;
  }
  .modern-popup .leaflet-popup-tip {
    background: white;
  }
  .modern-popup a.leaflet-popup-close-button {
    color: white;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    font-size: 24px;
    padding: 8px;
    z-index: 10;
  }
  
  /* Pulse Animation for Active Marker */
  @keyframes pulse-ring {
    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(13, 148, 136, 0); }
    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(13, 148, 136, 0); }
  }
  .marker-active .marker-ring {
    animation: pulse-ring 2s infinite;
  }
`;

// Inject styles once
if (typeof document !== 'undefined' && !document.getElementById('map-custom-styles')) {
  const style = document.createElement('style');
  style.id = 'map-custom-styles';
  style.textContent = mapGlobalStyles;
  document.head.appendChild(style);
}

// Fix Leaflet default icon issues in React
delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// --- Types ---

interface TripMapProps {
  trip: Trip | null;
}

// --- Controller Component ---
// Handles programmatic map moves (Flying to active stops, fitting bounds)
const MapController: React.FC<{ trip: Trip | null }> = ({ trip }) => {
  const map = useMap();
  const { selectedStop, generatedStops } = useTripStore();

  console.log(generatedStops);
  // 1. Fit bounds on trip load
  useEffect(() => {
    if (trip && trip.places.length > 0) {
      const allPoints: [number, number][] = [
        ...trip.places.map(p => [p.lat, p.lng] as [number, number]),
      ];
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1 });
    }
  }, [trip, map]);

  // 2. Fly to active stop
  useEffect(() => {
    if (trip && selectedStop) {
      const place = trip.places.find(p => p.name === selectedStop);
      if (place) {
        map.flyTo([place.lat, place.lng], 13, {
          animate: true,
          duration: 1.5 // Slower, smoother animation
        });
      }
    }
  }, [selectedStop, trip, map]);

  return null;
};

// --- Main Component ---

const TripMap: React.FC<TripMapProps> = ({ trip }) => {
  const { t } = useTranslation();
  const { selectedStop, visibleStops } = useTripStore();
  
  const defaultCenter: [number, number] = [48.8566, 2.3522]; // Paris fallback
  const defaultZoom = 5;

  // Memoize visible places to avoid re-renders
  const visiblePlaces = useMemo(() => {
    if (!trip) return [];
    return trip.places.filter(place => visibleStops.includes(place.name));
  }, [trip, visibleStops]);

  // Create route path only for visible stops
  const routePositions: [number, number][] = useMemo(() => {
    return visiblePlaces.map(place => [place.lat, place.lng]);
  }, [visiblePlaces]);

  // --- Render Empty State ---
  if (!trip) {
    return (
      <div className="h-full w-full relative bg-gray-100">
        <MapContainer 
          center={defaultCenter} 
          zoom={defaultZoom} 
          className="h-full w-full opacity-60 grayscale-50" 
          zoomControl={false}
          scrollWheelZoom={false}
          doubleClickZoom={false}
          dragging={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
        </MapContainer>
        
        {/* Glass Overlay */}
        <div className="absolute inset-0 flex items-center justify-center z-400">
          <div className="bg-white/30 backdrop-blur-md border border-white/40 p-8 rounded-2xl shadow-xl max-w-sm text-center">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-1.447-.894L15 7m0 13V7m0 0L9 17" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-teal-900 mb-2">{t('trips.planYourTrip')}</h3>
            <p className="text-gray-700 text-sm font-medium">
              {t('trips.generateTripToSeeMap')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer 
        center={defaultCenter} 
        zoom={defaultZoom} 
        className="h-full w-full"
        zoomControl={false} // We can add custom controls later if needed
      >
        <TileLayer
          // Using CartoDB Light for a cleaner, modern look suitable for travel apps
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        <MapController trip={trip} />

        {/* Route Line */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#0d9488', // Teal-600
              weight: 4,
              opacity: 0.8,
              dashArray: '1, 8', // Dotted line style
              dashOffset: '10',
              lineCap: 'round'
            }}
          />
        )}

        {/* Markers */}
        {visiblePlaces.map((place, index) => {
          const isSelected = selectedStop === place.name;

          // HTML for the Marker Icon
          // We use separate styles for Active vs Default to make it pop
          const markerHtml = `
            <div class="${isSelected ? 'marker-active' : ''}" style="
              position: relative;
              width: ${isSelected ? '48px' : '32px'};
              height: ${isSelected ? '48px' : '32px'};
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.3s ease;
            ">
              <!-- Pulse Ring (Only visible when active via CSS) -->
              <div class="marker-ring" style="
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background-color: rgba(13, 148, 136, 0.3);
                z-index: 0;
              "></div>
              
              <!-- Core Marker -->
              <div style="
                position: relative;
                z-index: 1;
                width: ${isSelected ? '40px' : '32px'};
                height: ${isSelected ? '40px' : '32px'};
                background-color: ${isSelected ? '#0d9488' : '#ffffff'};
                border: 2px solid ${isSelected ? '#ffffff' : '#0d9488'};
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: ${isSelected ? '#ffffff' : '#0d9488'};
                font-weight: 700;
                font-size: ${isSelected ? '16px' : '14px'};
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              ">
                ${index + 1}
              </div>
            </div>
          `;

          const customIcon = L.divIcon({
            className: 'custom-marker-icon',
            html: markerHtml,
            iconSize: isSelected ? [48, 48] : [32, 32],
            iconAnchor: isSelected ? [24, 24] : [16, 16],
            popupAnchor: [0, -20],
          });

          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={customIcon}
              zIndexOffset={isSelected ? 1000 : 100}
            >
              <Popup className="modern-popup" closeButton={true} maxWidth={280}>
                <div className="flex flex-col">
                  {/* Image Header */}
                  <div className="relative h-32 w-full bg-gray-100">
                    <img
                      src={place.image || `https://picsum.photos/400/200?random=${index}`}
                      alt={place.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-teal-800 shadow-sm">
                      Stop {index + 1}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 leading-tight mb-1">{place.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-teal-50 text-teal-700 rounded-full border border-teal-100">
                        {place.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {place.description}
                    </p>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default TripMap;