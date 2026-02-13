// src/components/trip/LeafletTripMap.tsx
// ✅ UPDATED: CARTO tiles (clean design like original)

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteInfo, TripStop } from '../../types/trip';

interface LeafletTripMapProps {
  departureCoords: { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
  transport: 'car' | 'bike';
  onRouteCalculated?: (info: RouteInfo, stops: TripStop[]) => void;
}

// Fix Leaflet default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LeafletTripMap: React.FC<LeafletTripMapProps> = ({
  departureCoords,
  destinationCoords,
  transport,
  onRouteCalculated
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [routeLayer, setRouteLayer] = useState<L.Polyline | null>(null);
  const [departureMarker, setDepartureMarker] = useState<L.Marker | null>(null);
  const [destinationMarker, setDestinationMarker] = useState<L.Marker | null>(null);
  
  // Track last calculated route to prevent infinite loop
  const lastCalculatedRef = useRef<string>('');

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const center = departureCoords || { lat: 30.2741, lng: 120.1551 }; // Hangzhou default
    
    const map = L.map(mapContainerRef.current).setView([center.lat, center.lng], 13);

    // ✅ CARTO Voyager tiles (clean design, no Chinese labels)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update map center when departure changes
  useEffect(() => {
    if (mapRef.current && departureCoords) {
      mapRef.current.setView([departureCoords.lat, departureCoords.lng], 13);
    }
  }, [departureCoords]);

  // Add departure marker
  useEffect(() => {
    if (!mapRef.current || !departureCoords) return;

    if (departureMarker) {
      departureMarker.setLatLng([departureCoords.lat, departureCoords.lng]);
    } else {
      // ✅ Create custom teal marker icon for departure
      const tealIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: #0d9488;
            width: 40px;
            height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: 18px;
              text-align: center;
              line-height: 34px;
            ">📍</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([departureCoords.lat, departureCoords.lng], { icon: tealIcon })
        .addTo(mapRef.current)
        .bindPopup('Departure');
      
      setDepartureMarker(marker);
    }
  }, [departureCoords, departureMarker]);

  // Add destination marker
  useEffect(() => {
    if (!mapRef.current || !destinationCoords) return;

    if (destinationMarker) {
      destinationMarker.setLatLng([destinationCoords.lat, destinationCoords.lng]);
    } else {
      // ✅ Create custom red marker icon for destination
      const redIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `
          <div style="
            background-color: #ef4444;
            width: 40px;
            height: 40px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          ">
            <div style="
              transform: rotate(45deg);
              color: white;
              font-weight: bold;
              font-size: 18px;
              text-align: center;
              line-height: 34px;
            ">🎯</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
      });

      const marker = L.marker([destinationCoords.lat, destinationCoords.lng], { icon: redIcon })
        .addTo(mapRef.current)
        .bindPopup('Destination');
      
      setDestinationMarker(marker);
    }
  }, [destinationCoords, destinationMarker]);

  // Draw route
  useEffect(() => {
    if (!mapRef.current || !departureCoords || !destinationCoords) return;

    // Create unique key for this route
    const routeKey = `${departureCoords.lat},${departureCoords.lng}-${destinationCoords.lat},${destinationCoords.lng}-${transport}`;
    
    // Skip if already calculated this exact route
    if (lastCalculatedRef.current === routeKey) {
      console.log('⏭️ Route already calculated, skipping');
      return;
    }

    console.log('🗺️ Calculating new route...');
    
    // Update ref BEFORE calling callback
    lastCalculatedRef.current = routeKey;

    // Remove old route
    if (routeLayer) {
      routeLayer.remove();
    }

    // Simple straight line route (for basic visualization)
    const latlngs: [number, number][] = [
      [departureCoords.lat, departureCoords.lng],
      [destinationCoords.lat, destinationCoords.lng]
    ];

    const polyline = L.polyline(latlngs, {
      color: '#0d9488', // Teal
      weight: 5,
      opacity: 0.8
    }).addTo(mapRef.current);

    setRouteLayer(polyline);

    // Fit bounds to show entire route
    mapRef.current.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    // Calculate approximate distance
    const distance = mapRef.current.distance(
      [departureCoords.lat, departureCoords.lng],
      [destinationCoords.lat, destinationCoords.lng]
    ) / 1000; // Convert to km

    // Estimate duration (assuming 60 km/h for car, 20 km/h for bike)
    const speed = transport === 'car' ? 60 : 20;
    const duration = Math.round((distance / speed) * 60); // Minutes

    const routeInfo: RouteInfo = {
      distance,
      duration,
      distanceText: `${distance.toFixed(1)} km`,
      durationText: duration > 60 
        ? `${Math.floor(duration / 60)}h ${duration % 60}min`
        : `${duration}min`
    };

    console.log('✅ Leaflet route calculated:', routeInfo);

    // Call callback only once
    if (onRouteCalculated) {
      onRouteCalculated(routeInfo, []);
    }
  }, [departureCoords, destinationCoords, transport]);

  return (
    <div ref={mapContainerRef} className="w-full h-full" />
  );
};

export default LeafletTripMap;
