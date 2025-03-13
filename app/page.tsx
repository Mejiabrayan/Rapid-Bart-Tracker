'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  fetchInitialAppData,
  type BartStation,
  type Route,
} from '@/lib/actions';

// Dynamically import the Map component with SSR disabled
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  )
});

export default function Home() {
  const [stations, setStations] = useState<BartStation[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedStation, setSelectedStation] = useState<BartStation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // Use the server action to fetch initial data
        const { stations, routes } = await fetchInitialAppData();
        
        setStations(stations);
        setRoutes(routes);
        console.log('Loaded', stations.length, 'stations and', routes.length, 'routes');
      } catch (error) {
        console.error('Error loading initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <Map
        stations={stations}
        selectedStation={selectedStation}
        setSelectedStation={setSelectedStation}
        routes={routes}
      />
    </div>
  );
}