export interface TripSettings {
  destination: string;
  duration: number; // in days
  budget: number;
  travelers: number;
  preferences: string[]; // e.g., ['adventure', 'relaxation']
  vehicle: 'car' | 'bike';
}

export interface Place {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  category: string; // e.g., 'attraction', 'restaurant'
}

export interface WeatherDay {
  date: string;
  temp: number;
  condition: string;
}

export interface ClothingSuggestion {
  name: string;
  icon: string; // SVG string for the clothing icon
}

export interface Weather {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  forecast: WeatherDay[];
  clothing: ClothingSuggestion[];
}

export interface Route {
  waypoints: { lat: number; lng: number }[];
  distance: number; // in km
  duration: number; // in minutes
}

export interface Trip {
  id: string;
  settings: TripSettings;
  places: Place[];
  route: Route;
  weather: Weather;
  createdAt: Date;
}