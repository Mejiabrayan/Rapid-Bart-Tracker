'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-geometryutil';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import React from 'react';

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

// Custom glowing marker icon
const createGlowingMarker = (size: number = 12, color: string = '#00ff00') => {
  return L.divIcon({
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        border-radius: 50%;
        box-shadow: 0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}, 0 0 40px ${color};
        opacity: 0.9;
        animation: pulse 2s infinite;
      "></div>
      <style>
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 0.7; }
          100% { transform: scale(1); opacity: 0.9; }
        }
      </style>
    `,
    className: 'custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

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

  // Pre-render station markers
  const renderedStationMarkers = React.useMemo(() => {
    console.time('renderStationMarkers');
    const renderedStations = stations.map((station) => {
      const position = [
        parseFloat(station.gtfs_latitude),
        parseFloat(station.gtfs_longitude),
      ] as LatLngExpression;

      // Check if this station is selected
      const isSelected = stationSelected?.abbr === station.abbr;

      return (
        <React.Fragment key={station.abbr}>
          <Marker
            position={position}
            icon={createGlowingMarker(
              isSelected ? 16 : 12,
              isSelected ? '#ffffff' : '#00ff00'
            )}
            eventHandlers={{
              click: () => setSelectedStation(station),
            }}
          >
            <Popup maxWidth={350} minWidth={300} className='station-popup'>
              <div className='p-3 space-y-4'>
                <div className='flex items-center justify-between'>
                  <h3 className='font-bold text-lg'>{station.name}</h3>
                </div>

                <div className='space-y-1'>
                  <p className='text-sm text-gray-300'>{station.address}</p>
                  <p className='text-sm text-gray-400'>
                    {station.city}, {station.state}
                  </p>
                </div>

                {/* Debug info - will help troubleshoot */}
                <div className='text-xs text-gray-500 border-t border-gray-800 pt-2'>
                  <p>Station ID: {station.abbr}</p>
                  <p>Has ETD data: {station.etd ? 'Yes' : 'No'}</p>
                  {station.etd && <p>Number of destinations: {station.etd.length}</p>}
                </div>

                {/* Show loading state if station is selected but no ETD data yet */}
                {isSelected && !station.etd && (
                  <div className='space-y-3'>
                    <h4 className='text-sm font-medium border-b border-gray-700 pb-1'>
                      Next Departures
                    </h4>
                    <div className='flex items-center justify-center py-4'>
                      <div className='animate-pulse flex space-x-2 items-center'>
                        <div className='h-2 w-2 bg-green-500 rounded-full'></div>
                        <div className='h-2 w-2 bg-green-500 rounded-full'></div>
                        <div className='h-2 w-2 bg-green-500 rounded-full'></div>
                        <span className='text-xs text-gray-400 ml-2'>Loading departures...</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Only show departures section if we have data */}
                {station.etd && station.etd.length > 0 && (
                  <div className='space-y-3'>
                    <h4 className='text-sm font-medium border-b border-gray-700 pb-1'>
                      Next Departures
                    </h4>
                    <div className='max-h-60 overflow-y-auto space-y-2'>
                      {station.etd.slice(0, 5).map((departure, idx) => {
                        // Use safe type checking for the departure object
                        const destination = departure.destination || 'Unknown';

                        // Safely handle estimates
                        let minutes = 'N/A';
                        let departureColor = '#FFFFFF';

                        if (
                          Array.isArray(departure.estimate) &&
                          departure.estimate.length > 0
                        ) {
                          const firstEstimate = departure.estimate[0] as Record<
                            string,
                            unknown
                          >;
                          if (
                            typeof firstEstimate === 'object' &&
                            firstEstimate !== null
                          ) {
                            if ('minutes' in firstEstimate) {
                              minutes = String(firstEstimate.minutes);
                            }
                            if ('hexcolor' in firstEstimate) {
                              departureColor = String(firstEstimate.hexcolor);
                            }
                          }
                        }

                        return (
                          <div
                            key={`${destination}-${idx}`}
                            className='flex items-center justify-between text-sm'
                          >
                            <div className='flex items-center gap-2'>
                              <div
                                className='w-3 h-3 rounded-full'
                                style={{ backgroundColor: departureColor }}
                              />
                              <span>{destination}</span>
                            </div>
                            <span className='font-medium'>
                              {minutes === 'Leaving'
                                ? 'Leaving'
                                : `${minutes} min`}
                            </span>
                          </div>
                        );
                      })}

                      {station.etd.length > 5 && (
                        <div className='text-xs text-center text-gray-400 italic pt-1'>
                          + {station.etd.length - 5} more destinations
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Show message if no departures are available */}
                {station.etd && station.etd.length === 0 && (
                  <div className='space-y-3'>
                    <h4 className='text-sm font-medium border-b border-gray-700 pb-1'>
                      Next Departures
                    </h4>
                    <div className='py-3 text-center'>
                      <p className='text-sm text-gray-400'>No departures available</p>
                    </div>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      );
    });
    console.timeEnd('renderStationMarkers');
    return renderedStations;
  }, [stations, stationSelected, setSelectedStation]);

  // Log performance metrics after component mounts
  React.useEffect(() => {
    console.log(
      `⚡ Performance: Map component rendered with ${stations.length} stations and ${routes.length} routes`
    );
  }, [stations.length, routes.length]);

  return (
    <MapContainer
      preferCanvas={true}
      center={SF_CENTER}
      zoom={12}
      className='w-full h-full'
      zoomControl={false}
      maxZoom={18}
      minZoom={10}
      scrollWheelZoom={true}
    >
      {/* Base Map Layer - Higher quality dark theme with cache optimization */}
      <TileLayer
        url='https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
        attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>'
        maxZoom={18}
        minZoom={10}
        maxNativeZoom={18}
        minNativeZoom={10}
        tileSize={512}
        zoomOffset={-1}
        detectRetina={true}
        updateWhenIdle={true}
        updateInterval={500}
        keepBuffer={8}
        className='dark-map-tiles'
        crossOrigin='anonymous'
        subdomains='abcd'
        noWrap={true}
        updateWhenZooming={false}
      />

      {/* Route Lines */}
      {renderedRouteLines}

      {/* Station Markers */}
      {renderedStationMarkers}
    </MapContainer>
  );
}
