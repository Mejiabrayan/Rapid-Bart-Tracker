'use client';

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SystemAlert {
  description: string;
  posted: string;
  type: string;
}

interface SystemStatus {
  trainCount: number;
  alerts: SystemAlert[];
  elevatorStatus: SystemAlert[];
}

interface SystemStatusOverlayProps {
  status: SystemStatus;
  className?: string;
}

export function SystemStatusOverlay({
  status,
  className = '',
}: SystemStatusOverlayProps) {
  const getStatusColor = (type: string) => {
    switch (type) {
      case 'info':
        return '#3b82f6'; // blue-500
      case 'warning':
        return '#eab308'; // yellow-500
      case 'error':
        return '#ef4444'; // red-500
      case 'success':
      default:
        return '#22c55e'; // green-500
    }
  };

  return (
    <div className={className}>
      <DropdownMenuLabel className='px-2 py-1.5'>
        <div className='flex items-center gap-2'>
          <div className='size-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e,0_0_20px_#22c55e]' />
          <span className='font-medium'>
            Active Trains: {status.trainCount || '0'}
          </span>
        </div>
      </DropdownMenuLabel>

      {status.alerts?.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
            System Alerts
          </DropdownMenuLabel>
          {status.alerts.map((alert, i) => {
            const color = getStatusColor(alert.type);
            return (
              <DropdownMenuItem key={i} className='gap-2'>
                <div
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`
                  }}
                  className='size-2 mt-0.5 shrink-0 rounded-full animate-pulse'
                />
                <span className='text-sm'>
                  {alert.description || 'No details available'}
                </span>
              </DropdownMenuItem>
            );
          })}
        </>
      )}

      {status.elevatorStatus?.length > 0 && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>
            Elevator Status
          </DropdownMenuLabel>
          {status.elevatorStatus.map((status, i) => {
            const color = getStatusColor(status.type);
            return (
              <DropdownMenuItem key={i} className='gap-2'>
                <div
                  style={{
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`
                  }}
                  className='size-2 mt-0.5 shrink-0 rounded-full animate-pulse'
                />
                <span className='text-sm'>
                  {status.description || 'No details available'}
                </span>
              </DropdownMenuItem>
            );
          })}
        </>
      )}
    </div>
  );
}
