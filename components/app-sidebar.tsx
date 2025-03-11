'use client';

import * as React from 'react';
import { Train, MapPin, Info, AlertCircle, ZapIcon } from 'lucide-react';
import { useState } from 'react';

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
  SidebarGroupContent,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';

interface StationCrowding {
  name: string;
  abbr: string;
  crowding: 'LOW' | 'MODERATE' | 'HIGH';
}

const DEFAULT_STATION_CROWDING: StationCrowding[] = [
  { name: 'Embarcadero', abbr: 'EMBR', crowding: 'MODERATE' },
  { name: 'Powell St.', abbr: 'POWL', crowding: 'HIGH' },
  { name: 'Berkeley', abbr: 'BERK', crowding: 'LOW' },
  { name: "Oakland Int'l Airport", abbr: 'OAKL', crowding: 'MODERATE' },
];

// Our main app sidebar component
export function AppSidebar(props: React.ComponentPropsWithoutRef<typeof Sidebar>) {
  // State for the stations data
  const [stations] = useState<StationCrowding[]>(DEFAULT_STATION_CROWDING);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);

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
                <span className='truncate font-medium font-fanwood'>
                  BART Tracker
                </span>
                <span className='truncate text-xs text-muted-foreground'>
                  Real-time System
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className='text-xs font-medium text-muted-foreground'>
            Line Status
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Line search will be implemented */}
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className='text-xs font-medium text-muted-foreground'>
            System Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SystemOverview />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupLabel className='text-xs font-medium text-muted-foreground'>
            Station Crowding
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {stations.map((station) => (
                <SidebarMenuItem key={station.abbr}>
                  <SidebarMenuButton
                    isActive={selectedStation === station.abbr}
                    onClick={() => setSelectedStation(station.abbr)}
                    tooltip={`${station.name} Station Details`}
                  >
                    <div className='bg-muted/20 flex items-center justify-center rounded-lg aspect-square size-8 relative'>
                      <MapPin className='size-4 text-muted-foreground' />
                    </div>
                    <div className='grid flex-1 text-xs'>
                      <span className='truncate'>{station.name}</span>
                      <div className='flex items-center gap-1'>
                        <span
                          className={`size-1.5 rounded-full ${
                            station.crowding === 'LOW'
                              ? 'bg-green-500'
                              : station.crowding === 'MODERATE'
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                        />
                        <span className='text-[10px] text-muted-foreground uppercase tracking-wider'>
                          {station.crowding === 'LOW'
                            ? 'Low Crowding'
                            : station.crowding === 'MODERATE'
                            ? 'Moderate'
                            : 'High Crowding'}
                        </span>
                      </div>
                    </div>
                  </SidebarMenuButton>
                  <SidebarMenuAction showOnHover>
                    <Info className='size-4' />
                  </SidebarMenuAction>
                  <SidebarMenuBadge>
                    {station.crowding === 'HIGH' && <AlertCircle className='size-3 text-red-500' />}
                  </SidebarMenuBadge>
                  {selectedStation === station.abbr && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          View Station Details
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          View Departures
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <ZapIcon className='size-4' />
              <span className='text-xs text-muted-foreground'>
                Powered by BART API
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
