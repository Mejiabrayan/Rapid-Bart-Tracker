'use client';

import React from 'react';
import { motion } from 'motion/react';

type CrowdingLevel = 'LOW' | 'MODERATE' | 'HIGH';

interface CrowdDotsProps {
  level: CrowdingLevel;
  className?: string;
}

export function CrowdDots({ level, className = '' }: CrowdDotsProps) {
  // Only show dots for HIGH crowding stations
  if (level !== 'HIGH') {
    return null;
  }
  
  const dotCount = 12;
  
  return (
    <div className={`relative overflow-hidden rounded-md ${className}`}>
      {Array.from({ length: dotCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute size-1.5 rounded-full bg-red-500"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.5 + 0.3
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
            opacity: [0.3, 0.7, 0.5, 0.3]
          }}
          transition={{
            duration: 2.5 + Math.random() * 2,
            repeat: Infinity,
            ease: "linear",
            times: [0, 0.33, 0.66, 1]
          }}
        />
      ))}
    </div>
  );
} 