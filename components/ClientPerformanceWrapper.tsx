'use client';

import dynamic from 'next/dynamic';

// Dynamically import the PerformanceMonitor with no SSR
const PerformanceMonitor = dynamic(
  () => import('@/components/PerformanceMonitor'),
  { ssr: false }
);

export default function ClientPerformanceWrapper() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return <PerformanceMonitor />;
} 