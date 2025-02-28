'use client';

import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  fetchStationDepartures,
  fetchInitialAppData,
  type BartStation,
  type Route,
} from '@/lib/actions';

// Extracted components for better organization
const LoadingScreen = () => (
  <div className="w-full h-full bg-black flex items-center justify-center">
    <div className="relative">
      {/* Outer glow rings */}
      <div className="absolute inset-0 animate-ping-slow rounded-full bg-green-500/20 scale-150" />
      <div className="absolute inset-0 animate-ping-slower rounded-full bg-green-500/10 scale-200" />
      
      {/* Center dot */}
      <div className="relative w-4 h-4 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50">
        <div className="absolute inset-0 rounded-full bg-green-400/50 animate-ping" />
      </div>
      
      {/* Loading text */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <p className="text-green-500 text-sm font-mono animate-pulse">
          Initializing BART System...
        </p>
      </div>
    </div>
  </div>
);

// Type definition for Station to match Map component's expected type
interface Station {
  name: string;
  abbr: string;
  gtfs_latitude: string;
  gtfs_longitude: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zipcode: string;
  etd?: { destination: string; abbreviation: string; estimate: unknown[] }[];
}

// Dynamically import the map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <LoadingScreen />
});

export default function Home() {
  // State management
  const [stations, setStations] = useState<BartStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<BartStation | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial data on mount using the server action
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Use the server action to fetch initial data
        const { stations, routes } = await fetchInitialAppData();
        
        setStations(stations);
        setRoutes(routes);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Real-time departure updates - update station ETD data
  useEffect(() => {
    if (!selectedStation) return;

    const updateDepartures = async () => {
      try {
        console.log(`Fetching departures for station: ${selectedStation.name} (${selectedStation.abbr})`);
        
        // Use the server action to fetch departures
        const departureData = await fetchStationDepartures(selectedStation.abbr);
        console.log(`Received departure data:`, departureData);
        
        // Transform Departure[] to BartEstimation[] format
        const transformedData = departureData.map(departure => ({
          destination: departure.destination,
          abbreviation: departure.abbreviation,
          color: departure.estimate[0]?.color || '',
          hexcolor: departure.estimate[0]?.hexcolor || '',
          estimate: departure.estimate.map(est => ({
            minutes: est.minutes,
            direction: est.direction,
            platform: est.platform,
            delay: est.delay,
            length: est.length
          }))
        }));
        
        console.log('Transformed ETD data:', transformedData);
        
        // Update the selected station's ETD data
        setStations(prevStations => 
          prevStations.map(station => {
            if (station.abbr === selectedStation.abbr) {
              console.log(`Updating station ${station.name} with new ETD data`);
              return { ...station, etd: transformedData };
            }
            return station;
          })
        );
        
        // Also update the selected station reference to trigger re-renders
        setSelectedStation(prev => {
          if (!prev) return prev;
          return { ...prev, etd: transformedData };
        });
      } catch (err) {
        console.error(`Error updating departures for ${selectedStation.name}:`, err);
      }
    };

    // Fetch immediately on selection
    updateDepartures();
    
    // Then set up interval for updates
    const interval = setInterval(updateDepartures, 15000);
    return () => clearInterval(interval);
  }, [selectedStation?.abbr]); // Only depend on the station abbr, not the whole object

  // Handle station selection - simplified to just update state
  const handleStationSelect = useCallback((station: Station) => {
    setSelectedStation(station as BartStation);
  }, []);

  // Just show loading screen if still loading
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-full relative">
      <div className="flex-1 relative">
        <Map 
          stations={stations}
          selectedStation={selectedStation}
          setSelectedStation={handleStationSelect}
          routes={routes}
        />
      </div>
    </div>
  );
}
