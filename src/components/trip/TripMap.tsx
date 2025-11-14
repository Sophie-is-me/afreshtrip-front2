// src/components/trip/TripMap.tsx
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { useTripStore } from '../../stores/tripStore';
import RouteInfoWidget from './RouteInfoWidget';
import TripSummary from './TripSummary';
import MapControls from './MapControls';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in react-leaflet
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const TripMap: React.FC = () => {
  const { currentTrip } = useTripStore();

  // Default center if no trip
  const defaultCenter: [number, number] = [48.8566, 2.3522]; // Paris
  const defaultZoom = 10;

  if (!currentTrip) {
    return (
      <div className="h-full w-full bg-gray-100 rounded-2xl flex items-center justify-center relative overflow-hidden">
        <MapContainer center={defaultCenter} zoom={defaultZoom} className="h-full z-10 w-full rounded-2xl">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </MapContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-1000">
          <div className="glass-effect p-6 rounded-2xl shadow-xl pointer-events-auto">
            <p className="text-gray-700 font-medium">Generate a trip to see the map</p>
          </div>
        </div>
        <MapControls />
      </div>
    );
  }

  const { places, route } = currentTrip;

  // Calculate center from places or route
  const center: [number, number] = places.length > 0
    ? [places[0].lat, places[0].lng]
    : route.waypoints.length > 0
    ? [route.waypoints[0].lat, route.waypoints[0].lng]
    : defaultCenter;

  const routePositions: [number, number][] = route.waypoints.map(wp => [wp.lat, wp.lng]);

  return (
    <div className="h-full w-full bg-gray-100 rounded-2xl relative overflow-hidden">
      <MapContainer center={center} zoom={13} className="h-full w-full rounded-2xl">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Route Polyline */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            color="#0d9488"
            weight={5}
            opacity={0.8}
          />
        )}

        {/* Place Markers */}
        {places.map((place) => (
          <Marker key={place.id} position={[place.lat, place.lng]}>
            <Popup className="zIndex={40}">
              <div>
                <h3 className="font-semibold">{place.name}</h3>
                <p className="text-sm text-gray-600">{place.description}</p>
                <p className="text-xs text-gray-500 capitalize">{place.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Controls */}
      <MapControls />

      {/* Route Info Overlay - Show on all platforms */}
      <div className="absolute bottom-4 left-4 z-40 hidden md:block">
        <RouteInfoWidget />
      </div>

      {/* Trip Summary Overlay - Only show on desktop in right side */}
      <div className="absolute bottom-4 right-4 z-40 hidden xl:block">
        <TripSummary />
      </div>
    </div>
  );
};

export default TripMap;