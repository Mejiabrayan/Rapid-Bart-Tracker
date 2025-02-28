'use client';

import { motion, LayoutGroup } from 'motion/react';
import { Separator } from '@/components/ui/separator';
import { useEffect, useState } from 'react';
import { 
  fetchSystemAlertInfo, 
  fetchElevatorStatusInfo,
  fetchTrainCountInfo,
  type SystemAlert 
} from '@/lib/actions';

interface SystemStatus {
  trainCount: number;
  alerts: SystemAlert[];
  elevatorStatus: SystemAlert[];
}

const calculatePercentage = (value: number, max: number) =>
  Math.min((value / max) * 100, 100);

const motionConfig = {
  initial: { opacity: 0, filter: 'blur(8px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  transition: {
    duration: 0.3,
    layout: { duration: 0.3 },
    filter: { type: 'spring', stiffness: 100 },
  },
};

export function SystemOverview() {
  const [status, setStatus] = useState<SystemStatus>({
    trainCount: 0,
    alerts: [],
    elevatorStatus: [],
  });

  useEffect(() => {
    async function fetchSystemStatus() {
      try {
        const [trainCount, alerts, elevatorStatus] = await Promise.all([
          fetchTrainCountInfo(),
          fetchSystemAlertInfo(),
          fetchElevatorStatusInfo(),
        ]);

        setStatus({
          trainCount: typeof trainCount === 'number' ? trainCount : 0,
          alerts,
          elevatorStatus,
        });
      } catch (error) {
        console.error('Error fetching system status:', error);
      }
    }

    fetchSystemStatus();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <LayoutGroup>
      <motion.div
        layout
        className='space-y-2 px-3 py-2 bg-background/50 rounded-md inset-shadow-2xs inset-shadow-white/5 ring-1 ring-white/10'
      >
        {/* Active Trains */}
        <motion.div layout className='space-y-2' {...motionConfig}>
          <motion.div layout className='flex items-center gap-2'>
            <motion.div layout className='size-1.5 rounded-full bg-green-500' />
            <motion.span layout className='text-sm text-muted-foreground'>
              Active Trains: {status.trainCount}
            </motion.span>
          </motion.div>
          <motion.div
            layout
            className='h-0.5 bg-foreground/20 rounded-full overflow-hidden'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              layout
              className='h-full bg-gradient-to-r from-green-500 via-green-600 to-green-700 rounded-full origin-left'
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: calculatePercentage(status.trainCount, 50) / 100,
              }}
              transition={{
                duration: 0.8,
                ease: [0.34, 1.56, 0.64, 1], // Custom spring-like curve
                delay: 0.2,
              }}
            />
          </motion.div>
        </motion.div>

        <Separator className='bg-white/10 my-4' />

        {/* System Alerts */}
        <motion.div layout className='space-y-1' {...motionConfig}>
          <motion.div layout className='flex items-center gap-2 mb-2'>
            <motion.div layout className='size-1.5 rounded-full bg-blue-500' />
            <motion.span layout className='text-sm text-muted-foreground'>
              System Alerts
            </motion.span>
          </motion.div>
          <motion.div layout className='space-y-1'>
            {status.alerts.length > 0 ? (
              status.alerts.map((alert, index) => (
                <motion.div
                  layout
                  key={`alert-${index}`}
                  className='text-xs pl-4'
                  {...motionConfig}
                  transition={{
                    ...motionConfig.transition,
                    delay: 0.1 + index * 0.1,
                  }}
                >
                  {alert.description}
                </motion.div>
              ))
            ) : (
              <motion.div
                layout
                className='text-xs pl-4 text-muted-foreground/70 italic'
                {...motionConfig}
              >
                No system alerts at this time
              </motion.div>
            )}
          </motion.div>
        </motion.div>

        <Separator className='bg-white/10 my-4' />

        {/* Elevator Status */}
        <motion.div layout className='space-y-1' {...motionConfig}>
          <motion.div layout className='flex items-center gap-2 mb-2'>
            <motion.div layout className='size-1.5 rounded-full bg-green-500' />
            <motion.span layout className='text-sm text-muted-foreground'>
              Elevator Status
            </motion.span>
          </motion.div>
          <motion.div layout className='space-y-1'>
            {status.elevatorStatus.length > 0 ? (
              status.elevatorStatus.map((status, index) => (
                <motion.div
                  layout
                  key={`elevator-${index}`}
                  className='text-xs pl-4'
                  {...motionConfig}
                  transition={{
                    ...motionConfig.transition,
                    delay: 0.2 + index * 0.1,
                  }}
                >
                  {status.description}
                </motion.div>
              ))
            ) : (
              <motion.div
                layout
                className='text-xs pl-4 text-muted-foreground/70 italic'
                {...motionConfig}
              >
                All elevators operating normally
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </LayoutGroup>
  );
}
