import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, Tooltip, Popup } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import { useTripStore } from '../../stores/tripStore';
import type { Trip } from '../../types/trip';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// --- 1. Fix Styles for Leaflet Components ---
// We override default Leaflet tooltip/popup styles to create your custom "floating image" look.
const mapStyles = `
  /* Remove default marker background/border */
  .custom-marker-icon {
    background: none !important;
    border: none !important;
  }

  /* Make the tooltip transparent so only the image shows */
  .image-tooltip {
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
    margin: 0 !important;
  }
  /* Remove the little triangle pointer from the tooltip */
  .image-tooltip::before {
    display: none !important;
  }

  /* Custom Popup Styles */
  .custom-popup .leaflet-popup-content-wrapper {
    padding: 0 !important;
    border-radius: 12px !important;
    overflow: hidden !important;
  }
  .custom-popup .leaflet-popup-content {
    margin: 0 !important;
    width: 300px !important;
  }
  .custom-popup a.leaflet-popup-close-button {
    color: white !important;
    z-index: 1000 !important;
    text-shadow: 0 0 4px rgba(0,0,0,0.5);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = mapStyles;
  document.head.appendChild(style);
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TripMapProps {
  trip: Trip | null;
}

// Component to handle auto-zooming to fit markers
const MapUpdater: React.FC<{ trip: Trip | null }> = ({ trip }) => {
  const map = useMap();

  useEffect(() => {
    if (trip) {
      const allPoints: [number, number][] = [
        ...trip.places.map(p => [p.lat, p.lng] as [number, number]),
        ...trip.route.waypoints.map(wp => [wp.lat, wp.lng] as [number, number])
      ];

      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 500 });
      }
    }
  }, [trip, map]);

  return null;
};

const TripMap: React.FC<TripMapProps> = ({ trip }) => {
  const { t } = useTranslation();
  const { selectedStop, visibleStops } = useTripStore();
  
  // Note: We don't need expandedPlace state strictly if we use Leaflet Popups, 
  // but we can keep it if you want to control which popup is open programmatically.
  // For standard Leaflet behavior, the Popup component handles its own open/close state.

  const defaultCenter: [number, number] = [48.8566, 2.3522];
  const defaultZoom = 10;

  if (!trip) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
        <MapContainer center={defaultCenter} zoom={defaultZoom} className="h-full z-10 w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[1000]">
          <div className="glass-effect p-6 border-gray-400 border-2 shadow-xl pointer-events-auto bg-white/80 backdrop-blur rounded-lg">
            <p className="text-gray-700 font-medium">{t('trips.generateTripToSeeMap')}</p>
          </div>
        </div>
      </div>
    );
  }

  const { places } = trip;
  const visiblePlaces = places.filter(place => visibleStops.includes(place.name));
  const routePositions: [number, number][] = visiblePlaces.map(place => [place.lat, place.lng]);

  return (
    <div className="h-full w-full bg-gray-100 relative overflow-hidden">
      <MapContainer center={defaultCenter} zoom={defaultZoom} className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapUpdater trip={trip} />

        {/* Route Polyline */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            color="#0d9488"
            weight={6}
            opacity={0.9}
            dashArray="10, 10"
          />
        )}

        {/* Place Markers */}
        {visiblePlaces.map((place, index) => {
          const isSelected = selectedStop === place.name;

          // Create the custom numbered circle icon
          const customIcon = L.divIcon({
            className: 'custom-marker-icon',
            html: `<div style="
              background-color: ${isSelected ? '#0d9488' : '#ffffff'};
              border: 2px solid ${isSelected ? '#0d9488' : '#6b7280'};
              border-radius: 50%;
              width: 28px;
              height: 28px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: ${isSelected ? '#ffffff' : '#374151'};
              font-weight: bold;
              font-size: 14px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">${index + 1}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14], // Center the icon
            popupAnchor: [0, -14], // Point popup above the icon
          });

          return (
            <Marker
              key={place.id}
              position={[place.lat, place.lng]}
              icon={customIcon}
              zIndexOffset={isSelected ? 1000 : 0}
            >
              {/* 
                 1. ADJACENT IMAGE 
                 We use a Permanent Tooltip with custom CSS to make it look like a floating image.
                 direction="right" puts it to the side. offset moves it slightly away from the marker.
              */}
              <Tooltip 
                permanent 
                direction="right" 
                offset={[15, 0]} 
                className="image-tooltip"
                opacity={1}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: `2px solid ${isSelected ? '#0d9488' : '#ffffff'}`,
                    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                    background: 'white',
                    cursor: 'pointer',
                  }}
                >
                  {place.image && (
                    <img
                      src={place.image}
                      alt={place.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://picsum.photos/60/60?random=${Math.random()}`;
                      }}
                    />
                  )}
                </div>
              </Tooltip>

              {/* 
                 2. EXPANDED DETAILS 
                 We use a Popup component. This handles the geometry automatically.
              */}
              <Popup className="custom-popup" maxWidth={320} closeButton={true}>
                <div>
                  <div style={{ position: 'relative', height: '180px', width: '100%' }}>
                    {place.image && (
                      <img
                        src={place.image}
                        alt={place.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://picsum.photos/320/180?random=${Math.random()}`;
                        }}
                      />
                    )}
                  </div>
                  
                  <div style={{ padding: '16px' }}>
                    <h3 style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: '#1f2937',
                      margin: 0
                    }}>
                      {place.name}
                    </h3>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      lineHeight: '1.5',
                      marginBottom: '12px',
                      margin: '0 0 12px 0'
                    }}>
                      {place.description}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        fontSize: '12px',
                        backgroundColor: '#ccfbf1',
                        color: '#0f766e',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        fontWeight: '500',
                        textTransform: 'capitalize'
                      }}>
                        {place.category}
                      </span>
                      <span style={{
                        fontSize: '12px',
                        color: '#9ca3af',
                        backgroundColor: '#f3f4f6',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}>
                        Stop {index + 1}
                      </span>
                    </div>
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