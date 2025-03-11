'use client';

import React from 'react';
import { motion } from 'motion/react';

type CrowdingLevel = 'LOW' | 'MODERATE' | 'HIGH';

interface MapCrowdVisualizationProps {
  level: CrowdingLevel;
  size?: number;
  className?: string;
}

/**
 * A component to visualize crowd density on a map
 * Designed to be used with Leaflet markers or overlays
 */
export function MapCrowdVisualization({ 
  level, 
  size = 40, 
  className = '' 
}: MapCrowdVisualizationProps) {
  // Only show dots for MODERATE and HIGH crowding stations
  if (level === 'LOW') {
    return null;
  }
  
  const dotCount = level === 'MODERATE' ? 8 : 15;
  const color = level === 'MODERATE' ? '#f59e0b' : '#ef4444';
  
  return (
    <div 
      className={`absolute overflow-hidden rounded-full ${className}`}
      style={{ 
        width: size, 
        height: size,
        pointerEvents: 'none' // Ensures map clicks pass through 
      }}
    >
      {Array.from({ length: dotCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            backgroundColor: color,
            width: level === 'HIGH' ? 4 : 3,
            height: level === 'HIGH' ? 4 : 3,
          }}
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.3 + 0.3
          }}
          animate={{
            x: [
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`
            ],
            y: [
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`,
              `${Math.random() * 100}%`
            ],
            opacity: [0.3, 0.6, 0.4, 0.3]
          }}
          transition={{
            duration: level === 'HIGH' ? 2 : 3.5,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.33, 0.66, 1]
          }}
        />
      ))}
    </div>
  );
} 