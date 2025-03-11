'use client';

import * as React from 'react';
import { Suspense, useTransition } from 'react';
import { Search, Circle } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { motion } from 'motion/react';
import { useDebouncedCallback } from 'use-debounce';
import { fetchAllRoutes } from '@/lib/actions';

// Define types for line status
export interface LineStatus {
  name: string;
  color: string;
  hexcolor: string;
  status: 'NORMAL' | 'DELAYED';
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

// Create a separate component for the search results that can suspend
function LineSearchResults({ searchQuery }: { searchQuery: string }) {
  const [lines, setLines] = useState<LineStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  // Load data if needed
  useEffect(() => {
    const loadData = async () => {
      if (!searchQuery || dataLoaded) return;
      
      setLoading(true);
      // Use fallback data immediately
      setLines(FALLBACK_LINES);
      setDataLoaded(true);
      
      try {
        // Try to fetch real data
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
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [searchQuery, dataLoaded]);
  
  // Filter the lines based on the search query
  const filteredLines = useMemo(() => {
    if (!searchQuery) return [];
    
    const query = searchQuery.toLowerCase();
    return lines.filter((line) => 
      line.name.toLowerCase().includes(query)
    );
  }, [lines, searchQuery]);
  
  if (loading && !filteredLines.length) {
    return (
      <>
        {Array(5)
          .fill(0)
          .map((_, index) => (
            <motion.div
              key={`skeleton-${index}`}
              className='h-6 bg-background/80 rounded-md my-1 animate-pulse'
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          ))}
      </>
    );
  }

  if (filteredLines.length > 0) {
    return (
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
    );
  }

  if (searchQuery) {
    return (
      <div className="py-2 px-1 text-xs text-muted-foreground">
        No lines found matching &quot;{searchQuery}&quot;
      </div>
    );
  }

  return null;
}

// Fallback component to show while suspense is loading
function SearchResultsFallback() {
  return (
    <>
      {Array(3)
        .fill(0)
        .map((_, index) => (
          <motion.div
            key={`fallback-${index}`}
            className='h-6 bg-background/60 rounded-md my-1 animate-pulse'
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
        ))}
    </>
  );
}

export function LineSearch() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [, startTransition] = useTransition();
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const urlQuery = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(urlQuery);
  
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
    
    // Use transition for URL updates to avoid blocking the UI
    startTransition(() => {
      updateUrlQuery(value);
    });
  };
  
  // Sync with URL query param
  useEffect(() => {
    if (urlQuery !== searchQuery) {
      setSearchQuery(urlQuery);
    }
  }, [urlQuery, searchQuery]);
  
  // Handle search focus
  const handleSearchFocus = () => {
    setSearchFocused(true);
  };
  
  // Handle search blur
  const handleSearchBlur = () => {
    if (!searchQuery) {
      setSearchFocused(false);
    }
  };

  return (
    <div className='relative mb-3'>
      {/* Search input styled to match the design */}
      <div className="relative">
        <Input
          type='text'
          placeholder='Search lines...'
          className='w-full h-11 pl-10 text-sm bg-background/20 border-none rounded-lg focus-visible:ring-1 focus-visible:ring-primary/30 shadow-[inset_0_1px_2px_rgba(0,0,0,0.2)] ring-1 ring-white/10'
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={handleSearchFocus}
          onBlur={handleSearchBlur}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />
        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-70' />
      </div>

      <SidebarMenu className="mt-3">
        {!searchQuery && searchFocused ? (
          <div className="py-2 px-1 text-xs text-muted-foreground">
            Type to search for routes...
          </div>
        ) : (
          <Suspense fallback={<SearchResultsFallback />}>
            <LineSearchResults searchQuery={searchQuery} />
          </Suspense>
        )}
      </SidebarMenu>
    </div>
  );
} 