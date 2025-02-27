'use client';

import { useEffect, useState } from 'react';
import type { LatLngExpression } from 'leaflet';
import dynamic from 'next/dynamic';
import {
  getBartStations,
  getDepartures,
  getTrainLocations,
  getBartRoutes,
  getRouteInfo,
  getSystemAlerts,
  getTrainCount,
  getElevatorStatus,
  type Departure,
  type Train,
  type Route,
  type SystemStatus
} from '@/lib/bart';

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

// Dynamically import the map component to avoid SSR issues
const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <LoadingScreen />
});

export default function Home() {
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStation, setSelectedStation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [trains, setTrains] = useState<Train[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCounty, setSelectedCounty] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    trainCount: 0,
    alerts: [],
    elevatorStatus: []
  });

  // Fetch stations on mount
  useEffect(() => {
    getBartStations()
      .then(setStations)
      .catch((e) =>
        setError('Failed to load BART stations. Please try again later.')
      );
  }, []);

  // Real-time departure updates
  useEffect(() => {
    if (!selectedStation) return;

    const updateDepartures = async () => {
      const data = await getDepartures(selectedStation.abbr);
      setDepartures(data || []);
      setLastUpdated(new Date());
    };

    // Initial fetch
    updateDepartures();

    // Set up polling every 15 seconds
    const interval = setInterval(updateDepartures, 15000);

    return () => clearInterval(interval);
  }, [selectedStation]);

  // Real-time train locations
  useEffect(() => {
    const updateTrainLocations = async () => {
      const stationData = await getTrainLocations();
      const activeTrains: Train[] = [];

      stationData.forEach((station: any) => {
        if (station.etd) {
          station.etd.forEach((departure: any) => {
            departure.estimate.forEach((est: any) => {
              if (est.minutes !== 'Leaving' && parseInt(est.minutes) <= 5) {
                activeTrains.push({
                  destination: departure.destination,
                  position: [parseFloat(station.gtfs_latitude), parseFloat(station.gtfs_longitude)],
                  minutes: est.minutes
                });
              }
            });
          });
        }
      });

      setTrains(activeTrains);
      setLastUpdated(new Date());
    };

    updateTrainLocations();
    const interval = setInterval(updateTrainLocations, 15000);
    return () => clearInterval(interval);
  }, []);

  // Fetch routes on mount
  useEffect(() => {
    const fetchRoutes = async () => {
      const routesList = await getBartRoutes();
      const routesWithInfo = await Promise.all(
        routesList.map(async (route: any) => {
          const info = await getRouteInfo(route.number);
          return {
            name: route.name,
            number: route.number,
            color: route.hexcolor,
            stations: info?.stations || []
          };
        })
      );
      setRoutes(routesWithInfo.filter(route => route.stations.length > 0));
    };
    fetchRoutes();
  }, []);

  // Add new useEffect for system status
  useEffect(() => {
    const updateSystemStatus = async () => {
      const [alerts, count, elevStatus] = await Promise.all([
        getSystemAlerts(),
        getTrainCount(),
        getElevatorStatus()
      ]);
      
      setSystemStatus({
        trainCount: count,
        alerts: Array.isArray(alerts) ? alerts : [alerts].filter(Boolean),
        elevatorStatus: Array.isArray(elevStatus) ? elevStatus : [elevStatus].filter(Boolean)
      });
      setLastUpdated(new Date());
    };

    updateSystemStatus();
    const interval = setInterval(updateSystemStatus, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  // Validate coordinates before using them
  const isValidCoordinate = (lat: string, lng: string) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    return !isNaN(latitude) && !isNaN(longitude) && 
           latitude >= -90 && latitude <= 90 && 
           longitude >= -180 && longitude <= 180;
  };

  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCounty = !selectedCounty || station.county === selectedCounty;
    return matchesSearch && matchesCounty;
  });

  const validStations = stations.filter(station => 
    isValidCoordinate(station.gtfs_latitude, station.gtfs_longitude)
  );

  const validTrains = trains.filter(train => {
    const [lat, lng] = train.position as number[];
    return isValidCoordinate(lat.toString(), lng.toString());
  });

  const counties = [...new Set(stations.map((station) => station.county))];

  const SF_CENTER: LatLngExpression = [37.7749, -122.4194];

  return (
    <div className="flex h-full relative">
      <div className="flex-1">
        <Map 
          stations={validStations}
          trains={validTrains}
          selectedStation={selectedStation}
          setSelectedStation={setSelectedStation}
          routes={routes}
        />
      </div>
      
      {/* Info Panel */}
      {selectedStation && (
        <div className="w-96 border-l border-border bg-card">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">{selectedStation.name}</h3>
              <button 
                onClick={() => setSelectedStation(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Last updated: {lastUpdated?.toLocaleTimeString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedStation.city}, {selectedStation.county}
            </p>
            <p className="text-sm text-muted-foreground">{selectedStation.address}</p>

            {departures.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Departures</h3>
                <div className="space-y-1">
                  {departures.map((departure) => (
                    <div
                      key={departure.destination}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{departure.destination}</span>
                      <span className="font-medium">
                        {departure.estimate?.[0]?.minutes} min
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
