'use client';

import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import { LatLngExpression, DivIcon } from 'leaflet';
import L from 'leaflet';
import { type BartStation } from '@/lib/actions';

type CrowdingLevel = 'LOW' | 'MODERATE' | 'HIGH';

// Extend BartStation with crowding property
interface Station extends BartStation {
  crowding?: CrowdingLevel;
}

interface StationMarkerProps {
  station: Station;
  isSelected: boolean;
  onSelect: (station: Station) => void;
}

// Create a custom marker icon with crowd visualization
const createStationMarker = (
  size: number = 12, 
  color: string = '#00ff00',
  crowdingLevel: CrowdingLevel = 'LOW'
): DivIcon => {
  // Only add dots for MODERATE and HIGH crowding
  const showCrowding = crowdingLevel !== 'LOW';
  const dotCount = crowdingLevel === 'HIGH' ? 12 : 6;
  const dotColor = crowdingLevel === 'HIGH' ? '#ef4444' : '#f59e0b';
  
  // Generate random dot positions
  const dots = showCrowding
    ? Array.from({ length: dotCount }).map((_, i) => {
        const angle = (i / dotCount) * 2 * Math.PI;
        const distance = Math.random() * 15 + 15; // Random distance between 15-30px
        const x = Math.cos(angle) * distance;
        const y = Math.sin(angle) * distance;
        
        return `
          <div class="crowd-dot" style="
            position: absolute;
            width: 3px;
            height: 3px;
            background-color: ${dotColor};
            border-radius: 50%;
            opacity: ${Math.random() * 0.4 + 0.3};
            left: ${x + 25}px;
            top: ${y + 25}px;
            animation: move${i} ${crowdingLevel === 'HIGH' ? 3 : 4}s infinite linear;
          "></div>
        `;
      }).join('')
    : '';
    
  // Create animation keyframes for each dot
  const animations = showCrowding
    ? Array.from({ length: dotCount }).map((_, i) => {
        const rx1 = Math.random() * 6 - 3;
        const ry1 = Math.random() * 6 - 3;
        const rx2 = Math.random() * 6 - 3;
        const ry2 = Math.random() * 6 - 3;
        
        return `
          @keyframes move${i} {
            0% { transform: translate(0, 0); }
            25% { transform: translate(${rx1}px, ${ry1}px); }
            50% { transform: translate(${rx2}px, ${ry2}px); }
            75% { transform: translate(${-rx1}px, ${-ry2}px); }
            100% { transform: translate(0, 0); }
          }
        `;
      }).join('')
    : '';

  return L.divIcon({
    html: `
      <div style="position: relative; width: 50px; height: 50px;">
        ${dots}
        <div style="
          position: absolute;
          left: 25px;
          top: 25px;
          transform: translate(-50%, -50%);
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          box-shadow: 0 0 10px ${color}, 0 0 20px ${color};
          opacity: 0.9;
          animation: pulse 2s infinite;
          z-index: 10;
        "></div>
        <style>
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
            50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.7; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 0.9; }
          }
          ${animations}
        </style>
      </div>
    `,
    className: 'station-marker',
    iconSize: [50, 50],
    iconAnchor: [25, 25],
  });
};

export function StationMarker({ station, isSelected, onSelect }: StationMarkerProps) {
  const position = [
    parseFloat(station.gtfs_latitude),
    parseFloat(station.gtfs_longitude),
  ] as LatLngExpression;
  
  const crowdingLevel = station.crowding || 'LOW';
  
  return (
    <Marker
      position={position}
      icon={createStationMarker(
        isSelected ? 16 : 12,
        isSelected ? '#ffffff' : '#00ff00',
        crowdingLevel
      )}
      eventHandlers={{
        click: () => onSelect(station),
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

          {/* Crowding information */}
          <div className='border-t border-gray-800 pt-2'>
            <div className='flex items-center gap-2'>
              <span className='text-sm'>Crowd Level:</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  crowdingLevel === 'LOW'
                    ? 'bg-green-900/30 text-green-400'
                    : crowdingLevel === 'MODERATE'
                    ? 'bg-yellow-900/30 text-yellow-400'
                    : 'bg-red-900/30 text-red-400'
                }`}
              >
                {crowdingLevel}
              </span>
            </div>
          </div>
          
          {/* Debug info */}
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
  );
} 