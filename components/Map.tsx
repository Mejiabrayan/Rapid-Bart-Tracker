'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-geometryutil';
import {
  MapContainer,
  TileLayer,
  Polyline,
} from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import React from 'react';
import { StationMarker } from '@/components/client/station-marker';

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
  crowding?: 'LOW' | 'MODERATE' | 'HIGH';
}

interface Route {
  name: string;
  number: string;
  color: string;
  stations: string[];
}

interface MapProps {
  stations: Station[];
  selectedStation: Station | null;
  setSelectedStation: (station: Station) => void;
  routes: Route[];
}

const SF_CENTER: LatLngExpression = [37.7749, -122.4194];

export default function Map({
  stations,
  selectedStation: stationSelected,
  setSelectedStation,
  routes,
}: MapProps) {
  console.log('Routes received:', routes);
  console.log('Selected station:', stationSelected?.name || 'None');

  // Create route lines by connecting stations in order - memoized to prevent recalculation
  const routeLines = React.useMemo(() => {
    console.time('createRouteLines');
    const lines = routes.map((route) => {
      // Get stations in the order specified by the route
      const routeStations = route.stations
        .map((stationAbbr) => stations.find((s) => s.abbr === stationAbbr))
        .filter((station) => station != null); // Remove any stations not found

      const coordinates = routeStations.map(
        (station) =>
          [
            parseFloat(station.gtfs_latitude),
            parseFloat(station.gtfs_longitude),
          ] as LatLngExpression
      );

      return {
        name: route.name,
        number: route.number,
        color: route.color,
        coordinates,
      };
    });
    console.timeEnd('createRouteLines');

    // Log performance after render using setTimeout
    setTimeout(() => {
      console.log('Route lines created:', lines);
    }, 0);

    return lines;
  }, [routes, stations]); // Only recalculate when routes or stations change

  // Pre-render route lines
  const renderedRouteLines = React.useMemo(() => {
    console.time('renderRouteLines');
    const renderedRoutes = routeLines.map((route, index) => {
      if (!route || !route.coordinates || route.coordinates.length < 2) {
        return null; // Skip invalid routes
      }

      // Ensure color is properly formatted
      const routeColor =
        route.color && typeof route.color === 'string'
          ? route.color.startsWith('#')
            ? route.color
            : `#${route.color}`
          : '#CCCCCC'; // Default fallback color

      return (
        <React.Fragment key={`route-${route.name || 'unknown'}-${index}`}>
          {/* Outer glow */}
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: routeColor,
              weight: 8,
              opacity: 0.15,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Inner glow */}
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: routeColor,
              weight: 4,
              opacity: 0.3,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
          {/* Main line */}
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: routeColor,
              weight: 2.5,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </React.Fragment>
      );
    });
    console.timeEnd('renderRouteLines');
    return renderedRoutes;
  }, [routeLines]);

  // Pre-render station markers with crowd visualization
  const renderedStationMarkers = React.useMemo(() => {
    console.time('renderStationMarkers');
    const renderedStations = stations.map((station) => {
      // Add random crowding levels for testing if not specified
      // In a real app, this would come from your backend
      if (!station.crowding) {
        const crowdingLevels: ('LOW' | 'MODERATE' | 'HIGH')[] = ['LOW', 'MODERATE', 'HIGH'];
        station.crowding = crowdingLevels[Math.floor(Math.random() * crowdingLevels.length)];
        
        // Make high traffic more rare (25% of stations)
        if (station.crowding === 'HIGH' && Math.random() > 0.25) {
          station.crowding = 'MODERATE';
        }
      }

      // Use our new StationMarker component
      return (
        <StationMarker
          key={station.abbr}
          station={station}
          isSelected={stationSelected?.abbr === station.abbr}
          onSelect={setSelectedStation}
        />
      );
    });
    console.timeEnd('renderStationMarkers');
    return renderedStations;
  }, [stationSelected, stations, setSelectedStation]);

  // Log performance metrics after component mounts
  React.useEffect(() => {
    console.log('Map component mounted with', stations.length, 'stations');
  }, [stations.length]);

  return (
    <MapContainer
      center={SF_CENTER}
      zoom={12}
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
      className="z-0 bg-gray-950"
    >
      <TileLayer
        attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>'
        url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key={apiKey}"
        apiKey={process.env.NEXT_PUBLIC_STADIA_API_KEY || ''}
        maxZoom={20}
      />
      {renderedRouteLines}
      {renderedStationMarkers}
    </MapContainer>
  );
}
