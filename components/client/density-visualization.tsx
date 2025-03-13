'use client';

import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
// Note: leaflet.heat needs to be installed with: pnpm add leaflet.heat
import 'leaflet.heat';

// Extend the Leaflet type declarations for heatLayer
declare module 'leaflet' {
  export function heatLayer(
    latlngs: Array<[number, number, number?]>,
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: Record<number, string>;
    }
  ): L.Layer;
}

// Define density point interface
export interface DensityPoint {
  lat: number;
  lng: number;
  intensity: number; // 0-1 value representing density
  time: number; // Hour of day (0-23)
}

// Bay Area density data generator (simulated)
function generateBayAreaDensityData(): DensityPoint[] {
  // Key BART locations
  const locations = [
    { name: 'San Francisco Downtown', lat: 37.789, lng: -122.401 },
    { name: 'Oakland', lat: 37.804, lng: -122.271 },
    { name: 'Berkeley', lat: 37.873, lng: -122.283 },
    { name: 'San Jose', lat: 37.330, lng: -121.889 },
    { name: 'Fremont', lat: 37.557, lng: -121.976 },
    { name: 'Richmond', lat: 37.937, lng: -122.353 },
    { name: 'Walnut Creek', lat: 37.905, lng: -122.067 },
    { name: 'Millbrae', lat: 37.600, lng: -122.386 },
  ];

  const densityPoints: DensityPoint[] = [];
  
  // Generate density for each hour (0-23)
  for (let hour = 0; hour < 24; hour++) {
    const isPeakMorning = hour >= 7 && hour <= 9;
    const isPeakEvening = hour >= 16 && hour <= 19;
    const isNight = hour >= 22 || hour <= 5;
    
    locations.forEach(location => {
      // Base intensity
      let baseIntensity = 0.3;
      
      // Peak hours have higher intensity
      if (isPeakMorning || isPeakEvening) {
        baseIntensity = 0.8;
      } else if (isNight) {
        baseIntensity = 0.1;
      }
      
      // Downtown areas have higher intensity during work hours
      const isDowntown = location.name.includes('Downtown') || 
                         location.name.includes('Oakland') || 
                         location.name.includes('Berkeley');
      
      // Residential areas have higher intensity in evenings
      const isResidential = location.name.includes('Fremont') || 
                           location.name.includes('Walnut Creek') ||
                           location.name.includes('Richmond');
      
      let intensityMultiplier = 1;
      
      if (isDowntown && (hour >= 8 && hour <= 18)) {
        intensityMultiplier = 1.5;
      } else if (isResidential && (hour >= 18 || hour <= 8)) {
        intensityMultiplier = 1.3;
      }
      
      const finalIntensity = baseIntensity * intensityMultiplier;
      
      // Generate a cluster of points around each location
      const pointCount = Math.floor(finalIntensity * 25);
      for (let i = 0; i < pointCount; i++) {
        // Random offset (up to ~1km)
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lngOffset = (Math.random() - 0.5) * 0.02;
        
        densityPoints.push({
          lat: location.lat + latOffset,
          lng: location.lng + lngOffset,
          intensity: finalIntensity * (0.7 + Math.random() * 0.6), // Some variation
          time: hour
        });
      }
    });
  }
  
  return densityPoints;
}

interface DensityHeatmapProps {
  currentTime: number;
  visible: boolean;
}

// Component that renders the density heatmap on the map
export function DensityHeatmap({ currentTime, visible }: DensityHeatmapProps) {
  const map = useMap();
  const heatLayerRef = useRef<L.Layer | null>(null);
  const densityData = useRef<DensityPoint[]>([]);
  
  // Generate or fetch density data on mount
  useEffect(() => {
    console.log("DensityHeatmap mounted, generating data...");
    densityData.current = generateBayAreaDensityData();
  }, []);
  
  // Update heat layer when time or visibility changes
  useEffect(() => {
    console.log(`DensityHeatmap visibility: ${visible}, time: ${currentTime}`);
    
    // Clean up function to remove the layer
    const cleanupLayer = () => {
      if (heatLayerRef.current) {
        console.log("Removing previous heat layer");
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
    
    // Remove existing layer
    cleanupLayer();
    
    if (visible) {
      console.log("Creating heat layer for time:", currentTime);
      
      // Filter points for current time (allow +/- 1 hour for smoother transition)
      const filteredPoints = densityData.current.filter(
        point => Math.abs(point.time - currentTime) <= 1
      );
      
      console.log(`Filtered ${filteredPoints.length} points for time ${currentTime}`);
      
      // Convert to format expected by heatLayer
      const heatData: Array<[number, number, number]> = filteredPoints.map(
        point => [point.lat, point.lng, point.intensity]
      );
      
      try {
        if (typeof L.heatLayer !== 'function') {
          console.error("L.heatLayer is not a function. Plugin may not be loaded correctly.");
          return;
        }
        
        // Create heat layer with a vibrant gradient
        const newHeatLayer = L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          max: 1.0,
          gradient: { 0.4: 'blue', 0.65: 'lime', 0.8: 'yellow', 1.0: 'red' }
        });
        
        // Add the layer to the map
        newHeatLayer.addTo(map);
        console.log("Heat layer added to map");
        
        // Store reference for cleanup
        heatLayerRef.current = newHeatLayer;
        
        // Add animation to the heatmap canvas
        setTimeout(() => {
          const heatmapCanvas = document.querySelector('.leaflet-heatmap-layer');
          if (heatmapCanvas instanceof HTMLElement) {
            // Apply CSS animations to fade in the heatmap
            heatmapCanvas.style.transition = 'opacity 0.5s ease-in-out';
            heatmapCanvas.style.opacity = '0';
            
            // Force a reflow before changing opacity
            void heatmapCanvas.offsetWidth;
            
            // Set to visible
            heatmapCanvas.style.opacity = '1';
            console.log("Applied animation to heatmap canvas");
          } else {
            console.error("Could not find heatmap canvas element");
          }
        }, 50);
      } catch (error) {
        console.error('Error creating heat layer:', error);
      }
    }
    
    // Clean up on component unmount or when dependencies change
    return cleanupLayer;
  }, [map, currentTime, visible]);
  
  return null;
}

// Time control UI component
export function TimeControl({ 
  currentTime, 
  setCurrentTime, 
  isPlaying,
  setIsPlaying
}: { 
  currentTime: number; 
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}) {
  const timeLabels = [
    '12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am',
    '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'
  ];
  
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] w-4/5 max-w-md bg-black/80 backdrop-blur-sm p-3 rounded-md">
      <div className="flex items-center justify-between mb-2">
        <button 
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-1 rounded"
        >
          {isPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>
        
        <div className="text-white text-sm font-medium">
          {timeLabels[currentTime]}
        </div>
        
        <div className="text-xs text-gray-300">
          Population Density
        </div>
      </div>
      
      <input
        type="range"
        min={0}
        max={23}
        value={currentTime}
        onChange={(e) => setCurrentTime(parseInt(e.target.value))}
        className="w-full accent-blue-500"
      />
    </div>
  );
} 