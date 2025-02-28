'use client';

import * as React from 'react';
import { Train, MapPin, Circle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { SystemOverview } from '@/components/system-overview';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { fetchAllRoutes } from '@/lib/actions';
import { motion } from 'motion/react';

// Define types for our line status and station crowding
interface LineStatus {
  name: string;
  color: string;
  hexcolor: string;
  status: 'NORMAL' | 'DELAYED';
}

interface StationCrowding {
  name: string;
  abbr: string;
  crowding: 'LOW' | 'MODERATE' | 'HIGH';
}

// Popular stations with manually assigned crowding levels
// In a real app, this would come from an API
const popularStations: StationCrowding[] = [
  { name: 'Embarcadero', abbr: 'EMBR', crowding: 'MODERATE' },
  { name: 'Powell St.', abbr: 'POWL', crowding: 'HIGH' },
  { name: 'Berkeley', abbr: 'BERK', crowding: 'LOW' },
  { name: 'Oakland Int\'l Airport', abbr: 'OAKL', crowding: 'MODERATE' },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [lines, setLines] = useState<LineStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLineStatus() {
      try {
        setLoading(true);
        // Fetch routes from our API
        const routes = await fetchAllRoutes();
        
        // Transform routes into line status format that matches the screenshot
        const lineStatus: LineStatus[] = [];
        
        // Create service between entries
        routes.forEach(route => {
          // Add "Service between X & Y" entry
          if (route.stations && route.stations.length >= 2) {
            const firstStation = route.stations[0];
            const lastStation = route.stations[route.stations.length - 1];
            
            lineStatus.push({
              name: `Service between ${firstStation} & ${lastStation}`,
              color: route.color,
              hexcolor: route.hexcolor,
              status: 'NORMAL'
            });
            
            // Add "X to Y" entry
            lineStatus.push({
              name: `${lastStation} to ${firstStation}`,
              color: route.color,
              hexcolor: route.hexcolor,
              status: 'NORMAL'
            });
          }
        });
        
        setLines(lineStatus);
      } catch (error) {
        console.error('Error fetching line status:', error);
        // Fallback data if API fails
        setLines([
          { name: 'Dublin/Pleasanton & Daly City', color: 'blue', hexcolor: '#0099cc', status: 'NORMAL' },
          { name: 'Daly City to Dublin/Pleasanton', color: 'blue', hexcolor: '#0099cc', status: 'NORMAL' },
          { name: 'Berryessa/North San Jose & Daly City', color: 'green', hexcolor: '#339933', status: 'NORMAL' },
          { name: 'Daly City to Berryessa/North San Jose', color: 'green', hexcolor: '#339933', status: 'NORMAL' },
          { name: 'Berryessa/North San Jose & Richmond', color: 'orange', hexcolor: '#ff9933', status: 'NORMAL' },
          { name: 'Richmond to Berryessa/North San Jose', color: 'orange', hexcolor: '#ff9933', status: 'NORMAL' },
          { name: 'Richmond & Millbrae+SFO', color: 'red', hexcolor: '#ff0000', status: 'NORMAL' },
          { name: 'Millbrae/Daly City to Richmond', color: 'red', hexcolor: '#ff0000', status: 'NORMAL' },
          { name: 'Antioch & SFO/Millbrae', color: 'yellow', hexcolor: '#ffff33', status: 'NORMAL' },
          { name: 'Millbrae/SFIA to Antioch', color: 'yellow', hexcolor: '#ffff33', status: 'NORMAL' },
          { name: 'Oakland Airport & Coliseum', color: 'orange', hexcolor: '#ff9933', status: 'NORMAL' },
          { name: 'Coliseum to Oakland Airport', color: 'orange', hexcolor: '#ff9933', status: 'NORMAL' },
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchLineStatus();
    // Refresh every 60 seconds
    const interval = setInterval(fetchLineStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Sidebar variant='inset' {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg'>
              <div className='bg-green-500/10 text-green-500 flex aspect-square size-8 items-center justify-center rounded-lg'>
                <Train className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-medium font-fanwood'>BART Tracker</span>
                <span className='truncate text-xs text-muted-foreground'>
                  Real-time System
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className='space-y-4'>
        {/* System Overview */}
        <SidebarGroup>
          <SystemOverview />
        </SidebarGroup>

        {/* Line Status */}
        <SidebarGroup>
          <SidebarGroupLabel className='text-xs font-medium text-muted-foreground'>
            Line Status
          </SidebarGroupLabel>
          <div className="bg-background/50 rounded-md p-2 ring-1 ring-white/10">
            <SidebarMenu>
              {loading ? (
                // Loading state
                Array(5).fill(0).map((_, index) => (
                  <motion.div 
                    key={`skeleton-${index}`}
                    className="h-6 bg-background/80 rounded-md my-1 animate-pulse"
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                ))
              ) : (
                lines.map((line, index) => (
                  <SidebarMenuItem key={`${line.name}-${index}`} className='py-0.5'>
                    <SidebarMenuButton className='py-1'>
                      <div className='flex items-center gap-2 w-full'>
                        <div
                          className='size-3 rounded-full'
                          style={{ backgroundColor: line.hexcolor || '#888' }}
                        />
                        <span className='flex-1 text-xs'>{line.name}</span>
                        <div
                          className={`flex items-center gap-1 text-xs ${
                            line.status === 'NORMAL'
                              ? 'text-green-500'
                              : 'text-yellow-500'
                          }`}
                        >
                          <Circle className='size-1.5 fill-current' />
                          <span className='text-[10px] uppercase tracking-wider font-medium'>
                            {line.status === 'NORMAL' ? 'NORMAL' : 'DELAYED'}
                          </span>
                        </div>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </div>
        </SidebarGroup>

        {/* Station Crowding */}
        <SidebarGroup>
          <SidebarGroupLabel className='text-xs font-medium text-muted-foreground'>
            Station Crowding
          </SidebarGroupLabel>
          <div className="bg-background/50 rounded-md p-2 ring-1 ring-white/10">
            <SidebarMenu>
              {popularStations.map((station) => (
                <SidebarMenuItem key={station.name} className='py-0.5'>
                  <SidebarMenuButton className='py-1'>
                    <div className='flex items-center gap-2 w-full'>
                      <MapPin className='size-3' />
                      <span className='flex-1 text-xs'>{station.name}</span>
                      <div
                        className={`flex items-center gap-1 text-xs ${
                          station.crowding === 'LOW'
                            ? 'text-green-500'
                            : station.crowding === 'MODERATE'
                            ? 'text-yellow-500'
                            : 'text-red-500'
                        }`}
                      >
                        <Circle className='size-1.5 fill-current' />
                        <span className='text-[10px] uppercase tracking-wider font-medium'>
                          {station.crowding}
                        </span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </div>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <span className='text-xs text-muted-foreground'>Powered by BART</span>
      </SidebarFooter>
    </Sidebar>
  );
}
