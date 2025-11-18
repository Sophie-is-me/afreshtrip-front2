import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { useTranslation } from 'react-i18next';
import type { Trip } from '../../types/trip';
// import MapControls from './MapControls';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TripMapProps {
  trip: Trip | null;
}

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
        map.fitBounds(bounds, { padding: [20, 20], animate: true, duration: 500 });
      }
    }
  }, [trip, map]);

  return null;
};

const TripMap: React.FC<TripMapProps> = ({ trip }) => {
  const { t } = useTranslation();

  // Default center if no trip
  const defaultCenter: [number, number] = [48.8566, 2.3522]; // Paris
  const defaultZoom = 10;

  if (!trip) {
    return (
      <div className="h-full w-full bg-gray-100 flex items-center justify-center relative overflow-hidden">
        <MapContainer center={defaultCenter} zoom={defaultZoom} className="h-full z-10 w-full ">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-1000">
          <div className="glass-effect p-6 boder-gray-400 border-2 shadow-xl pointer-events-auto">
            <p className="text-gray-700 font-medium">{t('trips.generateTripToSeeMap')}</p>
          </div>
        </div>
      </div>
    );
  }

  const { places, route } = trip;

  const routePositions: [number, number][] = route.waypoints.map(wp => [wp.lat, wp.lng]);

  // Debug logging
  console.log('TripMap - Route positions:', routePositions);
  console.log('TripMap - Places:', places);

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
        {places.map((place, index) => (
          <Marker key={place.id} position={[place.lat, place.lng]}>
            <Popup className="zIndex={40}">
              <div className="max-w-xs">
                {place.image && (
                  <img
                    src={place.image}
                    alt={place.name}
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                )}
                <h3 className="font-semibold text-lg mb-1">{place.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded capitalize">
                    {place.category}
                  </span>
                  <span className="text-xs text-gray-500">Stop {index + 1}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default TripMap;