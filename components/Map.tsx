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
import { DensityHeatmap } from '@/components/client/density-visualization';
import { useDensityVisualization } from '@/lib/context/density-context';
import { type BartStation, type Route } from '@/lib/actions';

// Extended BartStation with crowding property
interface Station extends BartStation {
  crowding?: 'LOW' | 'MODERATE' | 'HIGH';
}

interface MapProps {
  stations: BartStation[];
  selectedStation: BartStation | null;
  setSelectedStation: (station: BartStation) => void;
  routes: Route[];
}

const SF_CENTER: LatLngExpression = [37.7749, -122.4194];

export default function Map({
  stations,
  selectedStation: stationSelected,
  setSelectedStation,
  routes,
}: MapProps) {
  // Get density state from context
  const { showDensity, currentTime } = useDensityVisualization();
  
  console.log('Map component rendering with showDensity:', showDensity, 'currentTime:', currentTime);
  console.log('Routes received:', routes, 'Routes length:', routes.length);
  console.log('Selected station:', stationSelected?.name || 'None');

  // Create route lines by connecting stations in order - memoized to prevent recalculation
  const routeLines = React.useMemo(() => {
    console.time('createRouteLines');
    
    // Debugging - log if we have routes data
    if (!routes || routes.length === 0) {
      console.warn('No routes data available to render lines');
      return [];
    }
    
    const lines = routes.map((route) => {
      // Get stations in the order specified by the route
      const routeStations = route.stations
        .map((stationAbbr) => stations.find((s) => s.abbr === stationAbbr))
        .filter((station): station is BartStation => station != null); // Remove any stations not found

      console.log(`Route ${route.name}: Found ${routeStations.length} of ${route.stations.length} stations`);
      
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
      console.log('Route lines created:', lines.length, 'lines');
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
      // Create a copy of the station with crowding added
      const stationWithCrowding: Station = {
        ...station,
        crowding: undefined
      };
      
      // Add random crowding levels for testing if not specified
      // In a real app, this would come from your backend
      if (!stationWithCrowding.crowding) {
        const crowdingLevels: ('LOW' | 'MODERATE' | 'HIGH')[] = ['LOW', 'MODERATE', 'HIGH'];
        stationWithCrowding.crowding = crowdingLevels[Math.floor(Math.random() * crowdingLevels.length)];
        
        // Make high traffic more rare (25% of stations)
        if (stationWithCrowding.crowding === 'HIGH' && Math.random() > 0.25) {
          stationWithCrowding.crowding = 'MODERATE';
        }
      }

      // Use our new StationMarker component
      return (
        <StationMarker
          key={station.abbr}
          station={stationWithCrowding}
          isSelected={stationSelected?.abbr === station.abbr}
          onSelect={(updatedStation) => {
            // Cast back to BartStation when calling the setter
            setSelectedStation(updatedStation);
          }}
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
        url={`https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?api_key=${process.env.NEXT_PUBLIC_STADIA_API_KEY || ''}`}
        maxZoom={20}
      />
      
      {/* Always render the routes */}
      {renderedRouteLines}
      
      {/* Always show station markers */}
      {renderedStationMarkers}
      
      {/* Population density heatmap - only shown when enabled */}
      {showDensity && (
        <DensityHeatmap 
          currentTime={currentTime}
          visible={showDensity}
        />
      )}
    </MapContainer>
  );
}
