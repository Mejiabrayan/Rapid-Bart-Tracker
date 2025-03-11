'use server';

import { revalidatePath, unstable_cache } from 'next/cache';
import {
  getBartStations as fetchBartStations,
  getDepartures as fetchDepartures,
  getBartRoutes as fetchBartRoutes,
  getRouteInfo as fetchRouteInfo,
  getSystemAlerts as fetchSystemAlerts,
  getElevatorStatus as fetchElevatorStatus,
  getTrainLocations as fetchTrainLocations,
  getTrainCount as fetchTrainCount,
  getFareInfo as fetchFareInfo,
  planTripByDepartureTime as fetchTripByDepartureTime,
  planTripByArrivalTime as fetchTripByArrivalTime,
  getHolidays as fetchHolidays,
  getStationSchedule as fetchStationSchedule,
  getRouteSchedule as fetchRouteSchedule,
  getApiVersion as fetchApiVersion,
  getStationInfo,
  getStationAccess,
  type BartStation,
  type Departure,
  type Route,
  type SystemAlert,
  type BartRoute,
  type BartEstimation,
  type Train,
  type FareInfo,
  type Trip,
  type Holiday,
  type StationSchedule,
  type RouteSchedule,
  type StationInfo,
  type StationAccess,
} from '@/lib/bart';

const measureServerAction = async <T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<T> => {
  const start = Date.now();
  try {
    const result = await fn();
    const end = Date.now();
    console.log(`⚡ Server Action: ${actionName} took ${end - start}ms`);
    return result;
  } catch (error) {
    const end = Date.now();
    console.error(
      `❌ Server Action: ${actionName} failed after ${end - start}ms`
    );
    throw error;
  }
};

// Cache station data - stations rarely change
export const fetchAllStations = unstable_cache(
  async (): Promise<BartStation[]> => {
    return measureServerAction('fetchAllStations', async () => {
      try {
        const stations = await fetchBartStations();
        return stations;
      } catch (error) {
        console.error('Server action error fetching BART stations:', error);
        return [];
      }
    });
  },
  ['bart-stations'],
  {
    tags: ['stations'],
    revalidate: 86400, // Cache for 24 hours (stations rarely change)
  }
);

// export const fetchIndividualStation = unstable_cache(
//   async (): Promise<>
// )

// Don't cache departures - these need to be real-time
export async function fetchStationDepartures(
  stationAbbr: string
): Promise<Departure[]> {
  return measureServerAction(
    `fetchStationDepartures(${stationAbbr})`,
    async () => {
      try {
        const departures = await fetchDepartures(stationAbbr);
        revalidatePath('/');
        return departures;
      } catch (error) {
        console.error(
          `Server action error fetching departures for ${stationAbbr}:`,
          error
        );
        return [];
      }
    }
  );
}

// Cache routes - these rarely change
export const fetchAllRoutes = unstable_cache(
  async (): Promise<BartRoute[]> => {
    return measureServerAction('fetchAllRoutes', async () => {
      try {
        const routes = await fetchBartRoutes();
        return routes;
      } catch (error) {
        console.error('Server action error fetching BART routes:', error);
        return [];
      }
    });
  },
  ['bart-routes'],
  {
    tags: ['routes'],
    revalidate: 86400, // Cache for 24 hours (routes rarely change)
  }
);

// Cache route details - these rarely change
export const fetchRouteDetails = unstable_cache(
  async (routeNumber: string): Promise<Route | null> => {
    return measureServerAction(
      `fetchRouteDetails(${routeNumber})`,
      async () => {
        try {
          const routeInfo = await fetchRouteInfo(routeNumber);
          return routeInfo;
        } catch (error) {
          console.error(
            `Server action error fetching route info for ${routeNumber}:`,
            error
          );
          return null;
        }
      }
    );
  },
  ['bart-route-details'],
  {
    tags: ['routes'],
    revalidate: 86400, // Cache for 24 hours (route details rarely change)
  }
);

// Cache system alerts with shorter TTL
export const fetchSystemAlertInfo = unstable_cache(
  async (): Promise<SystemAlert[]> => {
    return measureServerAction('fetchSystemAlertInfo', async () => {
      try {
        const alerts = await fetchSystemAlerts();
        return alerts;
      } catch (error) {
        console.error('Server action error fetching system alerts:', error);
        return [];
      }
    });
  },
  ['bart-alerts'],
  {
    tags: ['alerts'],
    revalidate: 300, // Cache for 5 minutes (alerts change occasionally)
  }
);

// Cache elevator status with medium TTL
export const fetchElevatorStatusInfo = unstable_cache(
  async (): Promise<SystemAlert[]> => {
    return measureServerAction('fetchElevatorStatusInfo', async () => {
      try {
        const status = await fetchElevatorStatus();
        return status;
      } catch (error) {
        console.error('Server action error fetching elevator status:', error);
        return [];
      }
    });
  },
  ['bart-elevator-status'],
  {
    tags: ['elevators'],
    revalidate: 1800, // Cache for 30 minutes (elevator status changes occasionally)
  }
);

// Cache train count with short TTL
export const fetchTrainCountInfo = unstable_cache(
  async (): Promise<number> => {
    return measureServerAction('fetchTrainCountInfo', async () => {
      try {
        const count = await fetchTrainCount();
        return count;
      } catch (error) {
        console.error('Server action error fetching train count:', error);
        return 0;
      }
    });
  },
  ['bart-train-count'],
  {
    tags: ['trains'],
    revalidate: 60, // Cache for 1 minute (train count changes frequently)
  }
);

// Don't cache train locations - these need to be real-time
export async function fetchTrainLocationsInfo(): Promise<Train[]> {
  return measureServerAction('fetchTrainLocationsInfo', async () => {
    try {
      const trains = await fetchTrainLocations();
      revalidatePath('/');
      return trains;
    } catch (error) {
      console.error('Server action error fetching train locations:', error);
      return [];
    }
  });
}

// Optimize initial app data loading with selective caching
export async function fetchInitialAppData() {
  return measureServerAction('fetchInitialAppData', async () => {
    try {
      console.time('fetchInitialAppData:stations+routes');
      // Use cached functions for static data
      const [stations, routesList] = await Promise.all([
        fetchAllStations(),
        fetchAllRoutes(),
      ]);
      console.timeEnd('fetchInitialAppData:stations+routes');

      console.time('fetchInitialAppData:routeDetails');
      // Process route details with cached function
      const routesWithInfoPromises = routesList.map(
        async (route: { name: string; number: string; hexcolor: string }) => {
          const info = await fetchRouteDetails(route.number);
          return {
            name: route.name,
            number: route.number,
            color: route.hexcolor,
            stations: info?.stations || [],
          };
        }
      );

      const routesWithInfo = await Promise.all(routesWithInfoPromises);
      const routes = routesWithInfo.filter(
        (route: Route) => route.stations.length > 0
      );
      console.timeEnd('fetchInitialAppData:routeDetails');

      // Revalidate the path for real-time data
      revalidatePath('/');

      return {
        stations,
        routes,
      };
    } catch (error) {
      console.error('Server action error fetching initial app data:', error);
      return {
        stations: [],
        routes: [],
      };
    }
  });
}

// Cache fare information with medium TTL
export const fetchFareInformation = unstable_cache(
  async (origin: string, destination: string): Promise<FareInfo | null> => {
    return measureServerAction(
      `fetchFareInformation(${origin}, ${destination})`,
      async () => {
        try {
          const fareInfo = await fetchFareInfo(origin, destination);
          return fareInfo;
        } catch (error) {
          console.error(
            `Server action error fetching fare info from ${origin} to ${destination}:`,
            error
          );
          return null;
        }
      }
    );
  },
  ['bart-fare-info'],
  {
    tags: ['fares'],
    revalidate: 86400, // Cache for 24 hours (fares rarely change)
  }
);

// Don't cache trip planning - these need to be real-time
export async function fetchTripByDeparture(
  origin: string,
  destination: string,
  time?: string,
  date?: string
): Promise<Trip[]> {
  return measureServerAction(
    `fetchTripByDeparture(${origin}, ${destination}, ${time}, ${date})`,
    async () => {
      try {
        const trips = await fetchTripByDepartureTime(
          origin,
          destination,
          time,
          date
        );
        return trips;
      } catch (error) {
        console.error(
          `Server action error planning trip from ${origin} to ${destination}:`,
          error
        );
        return [];
      }
    }
  );
}

// Don't cache trip planning - these need to be real-time
export async function fetchTripByArrival(
  origin: string,
  destination: string,
  time?: string,
  date?: string
): Promise<Trip[]> {
  return measureServerAction(
    `fetchTripByArrival(${origin}, ${destination}, ${time}, ${date})`,
    async () => {
      try {
        const trips = await fetchTripByArrivalTime(
          origin,
          destination,
          time,
          date
        );
        return trips;
      } catch (error) {
        console.error(
          `Server action error planning trip from ${origin} to ${destination}:`,
          error
        );
        return [];
      }
    }
  );
}

// Cache holiday information with long TTL
export const fetchHolidaySchedules = unstable_cache(
  async (): Promise<Holiday[]> => {
    return measureServerAction('fetchHolidaySchedules', async () => {
      try {
        const holidays = await fetchHolidays();
        return holidays;
      } catch (error) {
        console.error('Server action error fetching holiday schedules:', error);
        return [];
      }
    });
  },
  ['bart-holidays'],
  {
    tags: ['schedules'],
    revalidate: 86400, // Cache for 24 hours (holidays rarely change)
  }
);

// Cache station schedules with medium TTL
export const fetchStationScheduleInfo = unstable_cache(
  async (station: string, date?: string): Promise<StationSchedule | null> => {
    return measureServerAction(
      `fetchStationScheduleInfo(${station}, ${date})`,
      async () => {
        try {
          const schedule = await fetchStationSchedule(station, date);
          return schedule;
        } catch (error) {
          console.error(
            `Server action error fetching schedule for station ${station}:`,
            error
          );
          return null;
        }
      }
    );
  },
  ['bart-station-schedules'],
  {
    tags: ['schedules'],
    revalidate: 3600, // Cache for 1 hour (schedules change occasionally)
  }
);

// Cache route schedules with medium TTL
export const fetchRouteScheduleInfo = unstable_cache(
  async (routeNumber: string, date?: string): Promise<RouteSchedule | null> => {
    return measureServerAction(
      `fetchRouteScheduleInfo(${routeNumber}, ${date})`,
      async () => {
        try {
          const schedule = await fetchRouteSchedule(routeNumber, date);
          return schedule;
        } catch (error) {
          console.error(
            `Server action error fetching schedule for route ${routeNumber}:`,
            error
          );
          return null;
        }
      }
    );
  },
  ['bart-route-schedules'],
  {
    tags: ['schedules'],
    revalidate: 3600, // Cache for 1 hour (schedules change occasionally)
  }
);

// Cache API version with long TTL
export const fetchApiVersionInfo = unstable_cache(
  async (): Promise<string | null> => {
    return measureServerAction('fetchApiVersionInfo', async () => {
      try {
        const version = await fetchApiVersion();
        return version;
      } catch (error) {
        console.error('Server action error fetching API version:', error);
        return null;
      }
    });
  },
  ['bart-api-version'],
  {
    tags: ['api'],
    revalidate: 86400, // Cache for 24 hours (API version rarely changes)
  }
);

// Update the invalidateBartCaches function to include new caches
export async function invalidateBartCaches() {
  return measureServerAction('invalidateBartCaches', async () => {
    try {
      // Invalidate all cache tags
      revalidatePath('/', 'layout');
      return { success: true };
    } catch (error) {
      console.error('Server action error invalidating BART caches:', error);
      return { success: false };
    }
  });
}

// Cache station info with medium TTL
export const fetchStationInfo = unstable_cache(
  async (station: string): Promise<StationInfo | null> => {
    return measureServerAction(`fetchStationInfo(${station})`, async () => {
      try {
        const info = await getStationInfo(station);
        return info;
      } catch (error) {
        console.error(`Server action error fetching station info for ${station}:`, error);
        return null;
      }
    });
  },
  ['bart-station-info'],
  {
    tags: ['stations'],
    revalidate: 3600, // Cache for 1 hour (station info changes occasionally)
  }
);

// Cache station access info with medium TTL
export const fetchStationAccess = unstable_cache(
  async (station: string): Promise<StationAccess | null> => {
    return measureServerAction(`fetchStationAccess(${station})`, async () => {
      try {
        const access = await getStationAccess(station);
        return access;
      } catch (error) {
        console.error(`Server action error fetching station access for ${station}:`, error);
        return null;
      }
    });
  },
  ['bart-station-access'],
  {
    tags: ['stations'],
    revalidate: 3600, // Cache for 1 hour (access info changes occasionally)
  }
);

export type {
  BartStation,
  Departure,
  Route,
  SystemAlert,
  BartRoute,
  BartEstimation,
  Train,
  FareInfo,
  Trip,
  Holiday,
  StationSchedule,
  RouteSchedule,
};
