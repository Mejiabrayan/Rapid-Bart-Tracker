'use client';

import React, { useState, useEffect } from 'react';

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(true);

  useEffect(() => {
    // Create a proxy for console.log to capture performance metrics
    const originalLog = console.log;
    console.log = function(...args) {
      originalLog.apply(console, args);
      
      // Only process if we're recording
      if (isRecording) {
        const logStr = args.join(' ');
        
        // Check if this is a performance log
        if (logStr.includes('⚡ Performance:') || logStr.includes('⚡ Server Action:')) {
          const match = logStr.match(/⚡ (?:Performance|Server Action): (.+) took (\d+(?:\.\d+)?)ms/);
          if (match) {
            const name = match[1];
            const duration = parseFloat(match[2]);
            
            setMetrics(prev => {
              // Keep only the last 50 metrics to avoid memory issues
              const newMetrics = [...prev, { name, duration, timestamp: Date.now() }];
              if (newMetrics.length > 50) {
                return newMetrics.slice(-50);
              }
              return newMetrics;
            });
          }
        }
      }
    };

    // Restore original console.log on cleanup
    return () => {
      console.log = originalLog;
    };
  }, [isRecording]);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-black text-white p-2 rounded-full shadow-lg z-50"
        title="Show Performance Monitor"
      >
        ⚡
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg shadow-lg z-50 max-w-md max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Performance Monitor</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-2 py-1 rounded text-xs ${isRecording ? 'bg-red-500' : 'bg-green-500'}`}
          >
            {isRecording ? 'Pause' : 'Record'}
          </button>
          <button
            onClick={() => setMetrics([])}
            className="px-2 py-1 bg-gray-700 rounded text-xs"
          >
            Clear
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="px-2 py-1 bg-gray-700 rounded text-xs"
          >
            Hide
          </button>
        </div>
      </div>
      
      {metrics.length === 0 ? (
        <p className="text-gray-400 text-sm">No metrics recorded yet</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-1">Operation</th>
              <th className="text-right py-1">Duration</th>
              <th className="text-right py-1">Time</th>
            </tr>
          </thead>
          <tbody>
            {metrics.slice().reverse().map((metric, index) => (
              <tr key={index} className="border-b border-gray-800">
                <td className="py-1">{metric.name}</td>
                <td className="text-right py-1">
                  <span 
                    className={
                      metric.duration > 1000 
                        ? 'text-red-400' 
                        : metric.duration > 500 
                          ? 'text-yellow-400' 
                          : 'text-green-400'
                    }
                  >
                    {metric.duration.toFixed(2)}ms
                  </span>
                </td>
                <td className="text-right text-xs text-gray-400 py-1">
                  {new Date(metric.timestamp).toLocaleTimeString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
} 