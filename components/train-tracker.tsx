'use client';

import { useEffect, useState } from 'react';
import { Circle } from 'lucide-react';
import { fetchTrainLocationsInfo, type Train } from '@/lib/actions';
// We need to create a new server action for train locations since it's not in actions.ts yet

interface TrainTrackerProps {
  onTrainUpdate?: (trains: Train[]) => void;
}

export function TrainTracker({ onTrainUpdate }: TrainTrackerProps) {
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchTrainData() {
    try {
      const trainData = await fetchTrainLocationsInfo();
      setTrains(trainData);
      onTrainUpdate?.(trainData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch train data');
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTrainData();
    // Update every 15 seconds (BART API updates every ~15-20 seconds)
    const interval = setInterval(fetchTrainData, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Circle className="size-2 animate-pulse" />
        <span>Loading train data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-red-500">
        Error loading train data: {error}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {trains.map((train) => (
        <div
          key={train.trainId}
          className="flex items-center gap-2 rounded-md bg-background/50 p-2 text-xs"
        >
          <div
            className="size-2 rounded-full animate-pulse"
            style={{ backgroundColor: train.hexcolor }}
          />
          <div className="flex-1">
            <div className="font-medium">{train.destination}</div>
            <div className="text-[10px] text-muted-foreground">
              {train.currentStation} → {train.nextStation || 'En Route'}
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium">{train.minutes} min</div>
            <div className="text-[10px] text-muted-foreground">
              Platform {train.platform}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 