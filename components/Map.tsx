'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polyline,
  useMap
} from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import React, { ReactNode, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { createPortal } from 'react-dom';

interface AnimatedMarkerProps {
  position: LatLngExpression;
  size?: number;
  color?: string;
  children?: ReactNode;
}

const AnimatedMarker = ({ position, size = 12, color = '#00ff00', children }: AnimatedMarkerProps) => {
  const map = useMap();
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!markerRef.current) return;

    const updatePosition = () => {
      const latLng = L.latLng(position as [number, number]);
      const pos = map.latLngToLayerPoint(latLng);
      if (markerRef.current) {
        markerRef.current.style.transform = `translate(${pos.x - size/2}px, ${pos.y - size/2}px)`;
      }
    };

    updatePosition();
    map.on('zoom moveend viewreset', updatePosition);

    return () => {
      map.off('zoom moveend viewreset', updatePosition);
    };
  }, [map, position, size]);

  return createPortal(
    <motion.div
      ref={markerRef}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%',
        zIndex: 1000,
        willChange: 'transform',
      }}
      initial={{ scale: 1, opacity: 0.9 }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.9, 0.6, 0.9],
        boxShadow: [
          `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`,
          `0 0 20px ${color}, 0 0 40px ${color}, 0 0 60px ${color}`,
          `0 0 10px ${color}, 0 0 20px ${color}, 0 0 30px ${color}`
        ]
      }}
      transition={{
        duration: 2,
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {children}
    </motion.div>,
    document.querySelector('.leaflet-overlay-pane')!
  );
};

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

interface Route {
  name: string;
  number: string;
  color: string;
  stations: string[];
}

interface MapProps {
  stations: any[];
  trains: any[];
  selectedStation: any;
  setSelectedStation: (station: any) => void;
  routes: Route[];
}

const SF_CENTER: LatLngExpression = [37.7749, -122.4194];

export default function Map({
  stations,
  trains,
  selectedStation,
  setSelectedStation,
  routes,
}: MapProps) {
  console.log('Routes received:', routes);
  // Create route lines by connecting stations in order
  const routeLines = routes.map((route) => {
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
      color: route.color,
      coordinates,
    };
  });

  return (
    <MapContainer
      center={SF_CENTER}
      zoom={12}
      className='w-full h-full'
      zoomControl={false}
      maxZoom={18}
      minZoom={10}
      scrollWheelZoom={true}
    >
      {/* Base Map Layer - Higher quality dark theme */}
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
        updateInterval={100}
        keepBuffer={3}
        className='dark-map-tiles'
        crossOrigin='anonymous'
        subdomains='abcd'
      />

      {/* Route Lines - Outer glow effect */}
      {routeLines.map((route, index) => (
        <React.Fragment key={`route-${route.name}-${index}`}>
          {/* Outer glow */}
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: route.color.startsWith('#') ? route.color : `#${route.color}`,
              weight: 8,
              opacity: 0.15,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
          {/* Inner glow */}
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: route.color.startsWith('#') ? route.color : `#${route.color}`,
              weight: 4,
              opacity: 0.3,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
          {/* Main line */}
          <Polyline
            positions={route.coordinates}
            pathOptions={{
              color: route.color.startsWith('#') ? route.color : `#${route.color}`,
              weight: 2.5,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        </React.Fragment>
      ))}

      {/* Station Markers */}
      {stations.map((station) => {
        const position = [
          parseFloat(station.gtfs_latitude),
          parseFloat(station.gtfs_longitude),
        ] as LatLngExpression;
        
        return (
          <React.Fragment key={station.abbr}>
            <Marker
              position={position}
              icon={createGlowingMarker(12, '#00ff00')}
              eventHandlers={{
                click: () => setSelectedStation(station),
              }}
            >
              <Popup className='station-popup'>
                <div className='p-3 bg-black bg-opacity-90 text-white rounded-lg shadow-lg'>
                  <h3 className='font-bold text-sm mb-1'>{station.name}</h3>
                  <p className='text-xs text-gray-400'>{station.address}</p>
                  <p className='text-xs text-gray-400'>{station.city}</p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}

      {/* Train Markers */}
      {trains.map((train, index) => (
        <React.Fragment key={`${index}-${train.destination}`}>
          <Marker
            position={train.position}
            icon={createGlowingMarker(6, '#ffffff')}
          >
            <Popup>
              <div className='p-3 bg-black bg-opacity-90 text-white rounded-lg shadow-lg'>
                <p className='font-medium mb-1'>To: {train.destination}</p>
                <p className='text-sm text-gray-400'>{train.minutes} min away</p>
              </div>
            </Popup>
          </Marker>
        </React.Fragment>
      ))}
    </MapContainer>
  );
}
