'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface DensityVisualizationContextType {
  showDensity: boolean;
  setShowDensity: (show: boolean) => void;
  currentTime: number;
  setCurrentTime: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (isPlaying: boolean) => void;
}

const DensityVisualizationContext = createContext<DensityVisualizationContextType | null>(null);

export function useDensityVisualization() {
  const context = useContext(DensityVisualizationContext);
  if (!context) {
    throw new Error('useDensityVisualization must be used within a DensityVisualizationProvider');
  }
  return context;
}

export function DensityVisualizationProvider({ children }: { children: ReactNode }) {
  const [showDensity, setShowDensity] = useState(false);
  const [currentTime, setCurrentTime] = useState(8); // Default to 8am
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-advance time when playing
  useEffect(() => {
    if (!showDensity || !isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentTime((prevTime) => (prevTime + 1) % 24);
    }, 2000); // Advance every 2 seconds
    
    return () => clearInterval(interval);
  }, [isPlaying, showDensity]);

  return (
    <DensityVisualizationContext.Provider
      value={{
        showDensity,
        setShowDensity,
        currentTime,
        setCurrentTime,
        isPlaying,
        setIsPlaying,
      }}
    >
      {children}
    </DensityVisualizationContext.Provider>
  );
} 