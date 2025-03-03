'use client';

import * as React from 'react';
import { Train, MapPin, Circle, Search } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

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
import { Input } from '@/components/ui/input';
import { useDebouncedCallback } from 'use-debounce';

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

// Fallback data that's always available for search
const FALLBACK_LINES: LineStatus[] = [
  {
    name: 'Dublin/Pleasanton & Daly City',
    color: 'blue',
    hexcolor: '#0099cc',
    status: 'NORMAL',
  },
  {
    name: 'Daly City to Dublin/Pleasanton',
    color: 'blue',
    hexcolor: '#0099cc',
    status: 'NORMAL',
  },
  {
    name: 'Berryessa/North San Jose & Daly City',
    color: 'green',
    hexcolor: '#339933',
    status: 'NORMAL',
  },
  {
    name: 'Daly City to Berryessa/North San Jose',
    color: 'green',
    hexcolor: '#339933',
    status: 'NORMAL',
  },
  {
    name: 'Berryessa/North San Jose & Richmond',
    color: 'orange',
    hexcolor: '#ff9933',
    status: 'NORMAL',
  },
  {
    name: 'Richmond to Berryessa/North San Jose',
    color: 'orange',
    hexcolor: '#ff9933',
    status: 'NORMAL',
  },
  {
    name: 'Richmond & Millbrae+SFO',
    color: 'red',
    hexcolor: '#ff0000',
    status: 'NORMAL',
  },
  {
    name: 'Millbrae/Daly City to Richmond',
    color: 'red',
    hexcolor: '#ff0000',
    status: 'NORMAL',
  },
  {
    name: 'Antioch & SFO/Millbrae',
    color: 'yellow',
    hexcolor: '#ffff33',
    status: 'NORMAL',
  },
  {
    name: 'Millbrae/SFIA to Antioch',
    color: 'yellow',
    hexcolor: '#ffff33',
    status: 'NORMAL',
  },
  {
    name: 'Oakland Airport & Coliseum',
    color: 'orange',
    hexcolor: '#ff9933',
    status: 'NORMAL',
  },
  {
    name: 'Coliseum to Oakland Airport',
    color: 'orange',
    hexcolor: '#ff9933',
    status: 'NORMAL',
  },
];

// Popular stations with manually assigned crowding levels
// In a real app, this would come from an API
const popularStations: StationCrowding[] = [
  { name: 'Embarcadero', abbr: 'EMBR', crowding: 'MODERATE' },
  { name: 'Powell St.', abbr: 'POWL', crowding: 'HIGH' },
  { name: 'Berkeley', abbr: 'BERK', crowding: 'LOW' },
  { name: "Oakland Int'l Airport", abbr: 'OAKL', crowding: 'MODERATE' },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [lines, setLines] = useState<LineStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Use Next.js router hooks for URL state management
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get search query from URL and maintain a local state for immediate UI updates
  const urlQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  
  // Debounced function to update URL - shorter delay for better responsiveness
  const updateUrlQuery = useDebouncedCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, 150);
  
  // Handle search input changes - update UI immediately and debounce URL updates
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value); // Update UI immediately
    updateUrlQuery(value); // Update URL with debounce
    
    // Load data if this is the first search
    if (value && !dataLoaded) {
      loadAllData();
    }
  };

  // Sync with URL if it changes externally
  useEffect(() => {
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
      
      // If URL has a search query but we haven't loaded data yet, load it
      if (urlQuery && !dataLoaded) {
        loadAllData();
      }
    }
  }, [urlQuery]);
  
  // Simple function to load all data at once
  const loadAllData = async () => {
    // Don't load if already loading or already loaded
    if (loading || dataLoaded) return;
    
    setLoading(true);
    try {
      // Use fallback data immediately to show results faster
      setLines(FALLBACK_LINES);
      setDataLoaded(true);
      
      // Try to load real data in background
      try {
        const allRoutes = await fetchAllRoutes();
        
        // Process routes to create line status entries
        const lineStatus: LineStatus[] = [];
        
        allRoutes.forEach(route => {
          if (route.stations && route.stations.length >= 2) {
            const firstStation = route.stations[0];
            const lastStation = route.stations[route.stations.length - 1];
            
            lineStatus.push(
              {
                name: `Service between ${firstStation} & ${lastStation}`,
                color: route.color,
                hexcolor: route.hexcolor || '#999999',
                status: 'NORMAL',
              },
              {
                name: `${lastStation} to ${firstStation}`,
                color: route.color,
                hexcolor: route.hexcolor || '#999999',
                status: 'NORMAL',
              }
            );
          }
        });
        
        // Only update if we got results
        if (lineStatus.length > 0) {
          setLines(lineStatus);
        }
      } catch (error) {
        console.error('Error fetching routes:', error);
        // Fallback data is already set, so no need to do anything here
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Memoize the filtered lines to avoid recalculating on every render
  const filteredLines = useMemo(() => {
    if (!searchQuery) return [];
    
    const query = searchQuery.toLowerCase();
    return lines.filter((line) => 
      line.name.toLowerCase().includes(query)
    );
  }, [lines, searchQuery]);
  
  // Handle search focus
  const handleSearchFocus = () => {
    setSearchFocused(true);
    if (searchQuery && !dataLoaded) {
      loadAllData();
    }
  };
  
  // Handle search blur
  const handleSearchBlur = () => {
    if (!searchQuery) {
      setSearchFocused(false);
    }
  };

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
      {/* Line Status */}
      <SidebarGroup>
        <SidebarGroupLabel className='text-xs font-medium text-muted-foreground'>
          Line Status
        </SidebarGroupLabel>
        <div className='relative mb-3'>
          {/* Search input styled to match the screenshot */}
          <div className="relative">
            <Input
              type='text'
              placeholder='Search lines...'
              className='w-full h-11 pl-10 text-sm bg-background/20 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] ring-1 ring-white/10'
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              // Add these for better responsiveness
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-70' />
          </div>

          <SidebarMenu className="mt-3">
            {loading && !filteredLines.length ? (
              // Loading state - only show if no filtered results yet
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <motion.div
                    key={`skeleton-${index}`}
                    className='h-6 bg-background/80 rounded-md my-1 animate-pulse'
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                ))
            ) : filteredLines.length > 0 ? (
              <>
                {filteredLines.map((line, index) => (
                  <SidebarMenuItem
                    key={`${line.name}-${index}`}
                    className='py-0.5'
                  >
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
                ))}
              </>
            ) : searchQuery ? (
              <div className="py-2 px-1 text-xs text-muted-foreground">
                No lines found matching &quot;{searchQuery}&quot;
              </div>
            ) : searchFocused ? (
              <div className="py-2 px-1 text-xs text-muted-foreground">
                Type to search for routes...
              </div>
            ) : null}
          </SidebarMenu>
        </div>
      </SidebarGroup>

      <SidebarContent className='space-y-4'>
        {/* System Overview */}
        <SidebarGroup>
          <SystemOverview />
        </SidebarGroup>

        {/* Station Crowding */}
        <SidebarGroup>
          <SidebarGroupLabel className='text-xs font-medium text-muted-foreground'>
            Station Crowding
          </SidebarGroupLabel>
          <div className='bg-background/50 rounded-md p-2 ring-1 ring-white/10'>
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
