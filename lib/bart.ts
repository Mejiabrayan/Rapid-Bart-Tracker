import { z } from 'zod';

const apiKey = process.env.NEXT_PUBLIC_BART_API_KEY;
const BART_API_BASE_URL = 'https://api.bart.gov/api';

// API endpoints
const ENDPOINTS = {
  STATIONS: `${BART_API_BASE_URL}/stn.aspx`,
  ETD: `${BART_API_BASE_URL}/etd.aspx`,
  ROUTES: `${BART_API_BASE_URL}/route.aspx`,
  ADVISORIES: `${BART_API_BASE_URL}/bsa.aspx`,
  SCHEDULE: `${BART_API_BASE_URL}/sched.aspx`,
  VERSION: `${BART_API_BASE_URL}/version.aspx`,
};

// Helper function to build URLs with common parameters
const buildUrl = (endpoint: string, params: Record<string, string>) => {
  const searchParams = new URLSearchParams({
    key: apiKey || '',
    json: 'y',
    ...params,
  });
  return `${endpoint}?${searchParams.toString()}`;
};

export interface SystemAlert {
  description: string;
  posted: string;
  type: string;
}

export interface SystemStatus {
  trainCount: number;
  alerts: SystemAlert[];
  elevatorStatus: SystemAlert[];
}

export interface Estimate {
  minutes: string;
  platform: string;
  direction: string;
  length: string;
  color: string;
  hexcolor: string;
  bikeflag: string;
  delay: string;
}

export interface Departure {
  destination: string;
  abbreviation: string;
  limited: string;
  estimate: Estimate[];
}

export interface Train {
  trainId: string;
  destination: string;
  currentStation: string;
  nextStation: string;
  direction: string;
  line: string;
  routeNumber: string;
  minutes: string;
  platform: string;
  length: number;
  color: string;
  hexcolor: string;
  lastUpdated: string;
  delayed: boolean;
  position?: [number, number];
}

export interface Route {
  name: string;
  number: string;
  color: string;
  stations: string[];
}

export interface BartRoute {
  name: string;
  number: string;
  color: string;
  hexcolor: string;
  stations: string[];
}

export interface BartStation {
  name: string;
  abbr: string;
  gtfs_latitude: string;
  gtfs_longitude: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zipcode: string;
  etd?: BartEstimation[];
}

export interface BartEstimation {
  destination: string;
  abbreviation: string;
  color: string;
  hexcolor: string;
  estimate: BartTrainEstimate[];
}

export interface BartTrainEstimate {
  minutes: string;
  direction: string;
  platform: string;
  delay: string;
  length: string;
}

export interface BartAlert {
  description: string | { '#cdata-section': string };
  posted: string;
  type: string;
}

// Zod schemas for API responses
const BartTrainEstimateSchema = z.object({
  minutes: z.string(),
  direction: z.string(),
  platform: z.string(),
  delay: z.string(),
  length: z.string(),
  bikeflag: z.string().optional(),
  color: z.string().optional(),
  hexcolor: z.string().optional(),
});

const BartEstimationSchema = z.object({
  destination: z.string(),
  abbreviation: z.string(),
  limited: z.string().optional(),
  color: z.string(),
  hexcolor: z.string(),
  estimate: z.array(BartTrainEstimateSchema),
}).transform(data => ({
  ...data,
  color: data.color || '',
  hexcolor: data.hexcolor || '',
}));

const BartStationSchema = z.object({
  name: z.string(),
  abbr: z.string(),
  gtfs_latitude: z.string(),
  gtfs_longitude: z.string(),
  address: z.string(),
  city: z.string(),
  county: z.string(),
  state: z.string(),
  zipcode: z.string(),
  etd: z.array(BartEstimationSchema).optional(),
});

const BartStationsResponseSchema = z.object({
  root: z.object({
    stations: z.object({
      station: z.array(BartStationSchema),
    }),
  }),
});

const BartDeparturesResponseSchema = z.object({
  root: z.object({
    station: z.array(
      z.object({
        name: z.string(),
        abbr: z.string(),
        etd: z.array(BartEstimationSchema).optional(),
        gtfs_latitude: z.string().optional(),
        gtfs_longitude: z.string().optional(),
      })
    ),
  }),
});

const BartRouteSchema = z.object({
  name: z.string(),
  number: z.string(),
  color: z.string().optional(),
  hexcolor: z.string().optional(),
  stations: z.array(z.string()).optional(),
}).transform(data => ({
  ...data,
  color: data.color || '',
  hexcolor: data.hexcolor || '',
  stations: data.stations || [],
}));

const BartRoutesResponseSchema = z.object({
  root: z.object({
    routes: z.object({
      route: z.array(BartRouteSchema),
    }),
  }),
});

const BartRouteInfoResponseSchema = z.object({
  root: z.object({
    routes: z.object({
      route: z.object({
        name: z.string(),
        number: z.string(),
        color: z.string().optional(),
        hexcolor: z.string().optional(),
        config: z.object({
          station: z.array(z.string()),
        }),
      }).transform(data => ({
        ...data,
        color: data.color || '',
        hexcolor: data.hexcolor || '',
      })),
    }),
  }),
});

const BartAlertSchema = z.union([
  z.object({
    description: z.string(),
    posted: z.string(),
    type: z.string(),
  }),
  z.object({
    description: z.object({
      '#cdata-section': z.string(),
    }),
    posted: z.string(),
    type: z.string(),
  }),
]);

// Make the schema more flexible to handle different response formats
const BartAlertsResponseSchema = z.object({
  root: z.object({
    bsa: z.union([
      z.array(BartAlertSchema),
      BartAlertSchema,
      // Handle empty array or object with no alerts
      z.array(z.any()),
      z.object({}),
    ]).optional(),
  }),
});

const BartTrainCountResponseSchema = z.object({
  root: z.object({
    traincount: z.union([
      z.string().transform(val => Number(val)),
      z.number()
    ]),
  }),
});

// Helper function to safely parse API responses
async function safeParseResponse<T>(
  response: Response, 
  schema: z.ZodType<T>, 
  errorMessage: string
): Promise<T> {
  if (!response.ok) {
    throw new Error(`${errorMessage}: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  try {
    // Log the raw data for debugging
    console.log(`Raw API response for ${errorMessage}:`, JSON.stringify(data).substring(0, 500) + '...');
    
    // Use safeParse instead of parse to get more detailed error information
    const result = schema.safeParse(data);
    
    if (!result.success) {
      // Log the detailed validation errors
      console.error('Zod validation errors:', result.error.format());
      throw new Error(`${errorMessage}: ${result.error.message}`);
    }
    
    return result.data;
  } catch (error) {
    console.error('API response validation error:', error);
    
    // Fallback handling for departures specifically
    if (errorMessage.includes('departures') && data?.root?.station) {
      console.log('Attempting fallback parsing for departures...');
      try {
        // Try a more lenient approach for departures
        const station = data.root.station;
        if (Array.isArray(station) && station.length > 0) {
          return {
            root: {
              station: station.map(s => ({
                name: s.name || '',
                abbr: s.abbr || '',
                etd: Array.isArray(s.etd) ? s.etd.map((e: RawEtd) => ({
                  destination: e.destination || '',
                  abbreviation: e.abbreviation || '',
                  color: e.color || '',
                  hexcolor: e.hexcolor || '',
                  estimate: Array.isArray(e.estimate) ? e.estimate.map((est: RawEtdEstimate) => ({
                    minutes: String(est.minutes || ''),
                    direction: String(est.direction || ''),
                    platform: String(est.platform || ''),
                    delay: String(est.delay || ''),
                    length: String(est.length || '')
                  })) : []
                })) : []
              }))
            }
          } as T;
        }
      } catch (fallbackError) {
        console.error('Fallback parsing also failed:', fallbackError);
      }
    }
    
    throw new Error(`${errorMessage}: Invalid response format - ${(error as Error).message}`);
  }
}

export async function getBartStations(): Promise<BartStation[]> {
  try {
    const url = buildUrl(ENDPOINTS.STATIONS, { cmd: 'stns' });
    const response = await fetch(url);
    const data = await safeParseResponse(
      response, 
      BartStationsResponseSchema,
      'Failed to fetch stations'
    );
    return data.root.stations.station;
  } catch (error) {
    console.error('Error fetching BART stations:', error);
    throw error;
  }
}

export async function getDepartures(station: string): Promise<Departure[]> {
  try {
    console.log(`Fetching departures for station ${station}...`);
    
    const url = buildUrl(ENDPOINTS.ETD, { cmd: 'etd', orig: station });
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch departures: ${response.status} ${response.statusText}`);
    }
    
    const rawData = await response.json();
    console.log(`Raw departures data for ${station}:`, JSON.stringify(rawData).substring(0, 200) + '...');
    
    try {
      // Try parsing with the strict schema first
      const result = BartDeparturesResponseSchema.safeParse(rawData);
      
      if (!result.success) {
        console.error(`Departures validation errors for ${station}:`, result.error.format());
        
        // Implement custom fallback parsing
        if (rawData?.root?.station) {
          console.log(`Attempting custom fallback parsing for station ${station}...`);
          
          const stations = Array.isArray(rawData.root.station) ? 
            rawData.root.station : [rawData.root.station];
          
          if (stations.length === 0) {
            console.log(`No station data found for ${station}`);
            return [];
          }
          
          const stationData = stations[0];
          
          // Get all ETD (estimated departure) data
          const departures: Departure[] = [];
          
          if (stationData.etd) {
            const etdList = Array.isArray(stationData.etd) ? 
              stationData.etd : [stationData.etd];
            
            // Process each destination's departures
            etdList.forEach((etd: RawEtd) => {
              if (!etd) return;
              
              // Map color names to hexcodes for common BART lines when missing
              const getLineColor = (): { color: string, hexcolor: string } => {
                if (etd.color && etd.hexcolor) {
                  return { color: etd.color, hexcolor: etd.hexcolor };
                }
                
                // Fallback colors based on common BART lines
                const colorMap: Record<string, { color: string, hexcolor: string }> = {
                  'ANTC': { color: 'YELLOW', hexcolor: '#ffff33' },
                  'SFIA': { color: 'YELLOW', hexcolor: '#ffff33' },
                  'MLBR': { color: 'RED', hexcolor: '#ff0000' },
                  'RICH': { color: 'RED', hexcolor: '#ff0000' },
                  'DALY': { color: 'GREEN', hexcolor: '#339933' },
                  'DUBL': { color: 'BLUE', hexcolor: '#0099cc' },
                  'WARM': { color: 'GREEN', hexcolor: '#339933' },
                  'BERY': { color: 'GREEN', hexcolor: '#339933' },
                  'OAKL': { color: 'ORANGE', hexcolor: '#ff9933' },
                  'COLS': { color: 'ORANGE', hexcolor: '#ff9933' }
                };
                
                // Try to match by destination abbreviation
                const abbr = etd.abbreviation || '';
                if (abbr && colorMap[abbr]) {
                  return colorMap[abbr];
                }
                
                // Default fallback
                return { color: 'GREY', hexcolor: '#999999' };
              };
              
              const { color, hexcolor } = getLineColor();
              
              const estimates = Array.isArray(etd.estimate) ? 
                etd.estimate : (etd.estimate ? [etd.estimate] : []);
              
              departures.push({
                destination: etd.destination || 'Unknown',
                abbreviation: etd.abbreviation || '',
                limited: '',
                estimate: estimates.map((est: RawEtdEstimate) => ({
                  minutes: String(est.minutes || ''),
                  platform: String(est.platform || ''),
                  direction: String(est.direction || ''),
                  length: String(est.length || ''),
                  color: color,
                  hexcolor: hexcolor,
                  bikeflag: '0',
                  delay: String(est.delay || '0'),
                })),
              });
            });
          }
          
          return departures;
        }
        
        throw new Error(`Failed to parse departures for station ${station}: ${result.error.message}`);
      }
      
      // If validation succeeded, use the standard transformation
      const data = result.data;
      const departures = data.root.station[0].etd || [];
      
      return departures.map(etd => ({
        destination: etd.destination,
        abbreviation: etd.abbreviation,
        limited: etd.limited || '',
        estimate: etd.estimate.map(est => ({
          minutes: est.minutes,
          platform: est.platform,
          direction: est.direction,
          length: est.length,
          color: est.color || '',
          hexcolor: est.hexcolor || '',
          bikeflag: est.bikeflag || '',
          delay: est.delay,
        })),
      }));
    } catch (parseError) {
      console.error(`Error parsing departures for ${station}:`, parseError);
      return [];
    }
  } catch (error) {
    console.error(`Error fetching departures for ${station}:`, error);
    return [];
  }
}

export async function getTrainLocations(): Promise<Train[]> {
  try {
    const url = buildUrl(ENDPOINTS.ETD, { cmd: 'etd', orig: 'all' });
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      BartDeparturesResponseSchema,
      'Failed to fetch train locations'
    );
    
    // First, get all routes to determine next stations
    const routesUrl = buildUrl(ENDPOINTS.ROUTES, { cmd: 'routes' });
    const routesResponse = await fetch(routesUrl);
    const routesData = await safeParseResponse(
      routesResponse,
      BartRoutesResponseSchema,
      'Failed to fetch routes'
    );
    const routes = routesData.root.routes.route;
    
    // Get route details for each route
    const routeDetails = await Promise.all(
      routes.map(
        async (route) => {
          const routeInfoUrl = buildUrl(ENDPOINTS.ROUTES, {
            cmd: 'routeinfo',
            route: route.number,
          });
          const routeInfoResponse = await fetch(routeInfoUrl);
          const routeInfoData = await safeParseResponse(
            routeInfoResponse,
            BartRouteInfoResponseSchema,
            `Failed to fetch route info for route ${route.number}`
          );
          return {
            name: route.name,
            number: route.number,
            color: route.color,
            hexcolor: route.hexcolor,
            stations: routeInfoData.root.routes.route.config.station,
          };
        }
      )
    );

    // Create a mapping of color names to route names
    const colorToRouteName: Record<string, string> = {
      YELLOW: 'Antioch to SFO/Millbrae',
      RED: 'Richmond to Millbrae',
      GREEN: 'Berryessa to Daly City',
      BLUE: 'Dublin/Pleasanton to Daly City',
      ORANGE: 'Berryessa to Richmond',
      WHITE: 'Millbrae to Richmond',
    };

    const processedTrains: Train[] = [];

    // Process the BART API response into our Train interface
    const stations = data.root.station;
    stations.forEach((station) => {
      if (station.etd) {
        station.etd.forEach(
          (estimate, estimateIndex) => {
            estimate.estimate?.forEach(
              (train, trainIndex) => {
                // Only include trains that are arriving soon (within 20 minutes)
                if (
                  train.minutes !== 'Leaving' &&
                  parseInt(train.minutes) > 20
                ) {
                  return;
                }

                // Create a more unique trainId by including more parameters
                const trainId = `${station.abbr}-${estimate.destination}-${train.direction}-${train.platform}-${train.minutes}-${estimateIndex}-${trainIndex}`;

                // Find the route this train belongs to
                const routeColor = estimate.hexcolor || '';
                const colorName = estimate.color || '';

                // Try to match by hexcolor first
                let matchingRoute = routeDetails.find(
                  (r) => (r.hexcolor || '').toUpperCase() === routeColor.toUpperCase()
                );

                // If no match by hexcolor, try to match by color name
                if (
                  !matchingRoute &&
                  colorToRouteName[colorName.toUpperCase()]
                ) {
                  const routeName = colorToRouteName[colorName.toUpperCase()];
                  matchingRoute = routeDetails.find(
                    (r) => r.name === routeName
                  );
                }

                // Determine next station based on route and direction
                let nextStation = estimate.abbreviation; // Default to destination abbreviation

                if (matchingRoute) {
                  const stationIndex = matchingRoute.stations.findIndex(
                    (s) => s === station.abbr
                  );
                  if (stationIndex !== -1) {
                    // Determine next station based on direction
                    if (
                      train.direction === 'North' &&
                      stationIndex < matchingRoute.stations.length - 1
                    ) {
                      nextStation = matchingRoute.stations[stationIndex + 1];
                    } else if (
                      train.direction === 'South' &&
                      stationIndex > 0
                    ) {
                      nextStation = matchingRoute.stations[stationIndex - 1];
                    }
                  }
                }

                // Use the route name from the matching route if available
                const lineName = matchingRoute
                  ? matchingRoute.name
                  : colorToRouteName[colorName.toUpperCase()] || colorName;

                // Use the route number from the matching route if available
                const routeNumber = matchingRoute ? matchingRoute.number : '';

                processedTrains.push({
                  trainId,
                  destination: estimate.destination,
                  currentStation: station.name,
                  nextStation: nextStation, // Using calculated next station
                  direction: train.direction,
                  line: lineName,
                  routeNumber: routeNumber,
                  minutes: train.minutes,
                  platform: train.platform,
                  length: parseInt(train.length) || 0,
                  color: estimate.color || '',
                  hexcolor: estimate.hexcolor || '#000000',
                  lastUpdated: new Date().toISOString(),
                  delayed: train.delay !== '0',
                  position: station.gtfs_latitude && station.gtfs_longitude ? [
                    parseFloat(station.gtfs_latitude),
                    parseFloat(station.gtfs_longitude),
                  ] : undefined,
                });
              }
            );
          }
        );
      }
    });

    return processedTrains;
  } catch (error) {
    console.error('Error fetching train locations:', error);
    return [];
  }
}

export async function getBartRoutes(): Promise<BartRoute[]> {
  try {
    const url = buildUrl(ENDPOINTS.ROUTES, { cmd: 'routes' });
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      BartRoutesResponseSchema,
      'Failed to fetch routes'
    );
    
    // Explicitly transform and type assert to match our BartRoute interface
    return data.root.routes.route.map(route => ({
      name: route.name,
      number: route.number,
      color: route.color || '',
      hexcolor: route.hexcolor || '',
      stations: route.stations || [],
    })) as BartRoute[];
  } catch (error) {
    console.error('Error fetching BART routes:', error);
    return [];
  }
}

export async function getRouteInfo(routeNumber: string): Promise<Route | null> {
  try {
    const url = buildUrl(ENDPOINTS.ROUTES, {
      cmd: 'routeinfo',
      route: routeNumber,
    });
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      BartRouteInfoResponseSchema,
      `Failed to fetch route info for route ${routeNumber}`
    );
    
    // Transform the response to match our Route interface with explicit type safety
    const routeInfo: Route = {
      name: data.root.routes.route.name,
      number: data.root.routes.route.number,
      color: data.root.routes.route.color || '',
      stations: data.root.routes.route.config.station,
    };
    
    return routeInfo;
  } catch (error) {
    console.error('Error fetching route info:', error);
    return null;
  }
}

// Create a proper interface for raw alerts
interface RawAlertItem {
  description?: string | { '#cdata-section': string } | null;
  posted?: string;
  type?: string;
  [key: string]: unknown;
}

export async function getSystemAlerts(): Promise<SystemAlert[]> {
  try {
    // Log to debug the raw alert data
    console.log('Fetching system alerts...');
    
    const url = buildUrl(ENDPOINTS.ADVISORIES, { cmd: 'bsa' });
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch alerts: ${response.status} ${response.statusText}`);
    }
    
    const rawData = await response.json();
    console.log('Raw system alerts data:', JSON.stringify(rawData).substring(0, 200) + '...');
    
    try {
      const result = BartAlertsResponseSchema.safeParse(rawData);
      
      if (!result.success) {
        console.error('System alerts validation errors:', result.error.format());
        
        // Attempt fallback parsing
        if (rawData?.root?.bsa) {
          const alerts = rawData.root.bsa;
          if (!alerts) return [];
          
          // Handle both array and single object cases with proper typing
          const alertsArray: RawAlertItem[] = Array.isArray(alerts) ? alerts : [alerts as RawAlertItem];
          
          return alertsArray.map((alert: RawAlertItem) => {
            // Skip invalid alert objects
            if (!alert || typeof alert !== 'object') {
              return {
                description: '',
                posted: new Date().toISOString(),
                type: 'UNKNOWN'
              };
            }
            
            // Handle different description formats
            let description = '';
            if (typeof alert.description === 'object' && 
                alert.description && 
                '#cdata-section' in alert.description) {
              description = alert.description['#cdata-section'];
            } else if (typeof alert.description === 'string') {
              description = alert.description;
            }
                  
            // Handle missing fields with defaults
            return {
              description: description,
              posted: typeof alert.posted === 'string' ? alert.posted : new Date().toISOString(),
              type: typeof alert.type === 'string' ? alert.type : 'DELAY',
            };
          }).filter(alert => alert.description); // Filter out alerts with empty descriptions
        }
        
        return [];
      }
      
      const data = result.data;
      
      const alerts = data.root.bsa;
      if (!alerts) return [];
      
      // Handle both array and single object cases with proper typing
      const alertsArray: z.infer<typeof BartAlertSchema>[] = 
        Array.isArray(alerts) ? alerts : [alerts as z.infer<typeof BartAlertSchema>];
      
      return alertsArray.map((alert: z.infer<typeof BartAlertSchema>) => {
        // Skip invalid alert objects
        if (!alert || typeof alert !== 'object') {
          return {
            description: '',
            posted: new Date().toISOString(),
            type: 'UNKNOWN'
          };
        }
        
        // Handle different description formats
        let description = '';
        if (typeof alert.description === 'object' && 
            alert.description && 
            '#cdata-section' in alert.description) {
          description = alert.description['#cdata-section'];
        } else if (typeof alert.description === 'string') {
          description = alert.description;
        }
              
        // Handle missing fields with defaults
        return {
          description: description,
          posted: typeof alert.posted === 'string' ? alert.posted : new Date().toISOString(),
          type: typeof alert.type === 'string' ? alert.type : 'DELAY',
        };
      }).filter(alert => alert.description); // Filter out alerts with empty descriptions
    } catch (error) {
      console.error('Error parsing system alerts:', error);
      return []; // Return empty array instead of throwing
    }
  } catch (error) {
    console.error('Error fetching system alerts:', error);
    return []; // Return empty array instead of throwing
  }
}

export async function getTrainCount(): Promise<number> {
  try {
    const url = buildUrl(ENDPOINTS.ADVISORIES, { cmd: 'count' });
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      BartTrainCountResponseSchema,
      'Failed to fetch train count'
    );
    // Ensure we always return a number
    return Number(data.root.traincount);
  } catch (error) {
    console.error('Error fetching train count:', error);
    return 0;
  }
}

export async function getElevatorStatus(): Promise<SystemAlert[]> {
  try {
    console.log('Fetching elevator status...');
    
    const url = buildUrl(ENDPOINTS.ADVISORIES, { cmd: 'elev' });
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch elevator status: ${response.status} ${response.statusText}`);
    }
    
    const rawData = await response.json();
    console.log('Raw elevator status data:', JSON.stringify(rawData).substring(0, 200) + '...');
    
    // Try to parse with schema
    const result = BartAlertsResponseSchema.safeParse(rawData);
    
    if (!result.success) {
      console.error('Elevator status validation errors:', result.error.format());
      
      // Fallback parsing for elevator status
      if (rawData?.root?.bsa) {
        console.log('Attempting fallback parsing for elevator status...');
        
        // Define a type for the raw elevator status item
        interface RawElevatorStatusItem {
          description: string | { '#cdata-section': string };
          posted?: string;
          type?: string;
          [key: string]: unknown;
        }
        
        // Handle both array and single object cases
        const bsaData = Array.isArray(rawData.root.bsa) ? rawData.root.bsa : [rawData.root.bsa];
        
        return bsaData.map((item: RawElevatorStatusItem) => ({
          description: typeof item.description === 'object' && '#cdata-section' in item.description
            ? item.description['#cdata-section'] 
            : (item.description as string || ''),
          posted: item.posted || '',
          type: item.type || '',
        }));
      }
      
      throw new Error(`Failed to parse elevator status: ${result.error.message}`);
    }
    
    const status = result.data.root.bsa;
    if (!status) return [];

    // Define a safe type for the normalizeStatus function
    type BartAlertType = z.infer<typeof BartAlertSchema>;
    
    // Helper function to check if an item is a valid BartAlertType
    function isValidBartAlert(item: unknown): item is BartAlertType {
      return (
        item !== null &&
        typeof item === 'object' &&
        (
          (
            'description' in (item as BartAlertType) &&
            'posted' in (item as BartAlertType) &&
            'type' in (item as BartAlertType)
          ) ||
          (
            'description' in (item as BartAlertType) &&
            typeof (item as BartAlertType).description === 'object' &&
            '#cdata-section' in ((item as BartAlertType).description as { '#cdata-section': string })
          )
        )
      );
    }

    const normalizeStatus = (item: BartAlertType): SystemAlert => ({
      description:
        typeof item.description === 'object' &&
        '#cdata-section' in item.description
          ? item.description['#cdata-section']
          : (item.description as string) || '',
      posted: item.posted || '',
      type: item.type || '',
    });

    if (Array.isArray(status)) {
      // Filter out invalid items before mapping
      return status.filter(isValidBartAlert).map(normalizeStatus);
    } else if (isValidBartAlert(status)) {
      return [normalizeStatus(status)];
    } else {
      return [];
    }
  } catch (error) {
    console.error('Error fetching elevator status:', error);
    return [];
  }
}

// New interfaces for schedule and fare information
export interface FareInfo {
  origin: string;
  destination: string;
  fare: string;
  discount: string;
  clipper: string;
  schedule: string;
}

export interface TripLeg {
  order: string;
  transferCode: string;
  origin: string;
  destination: string;
  origTimeMin: string;
  destTimeMin: string;
  line: string;
  lineColor: string;
  bikeFlag: string;
  trainHeadStation: string;
  trainIdx: string;
}

export interface Trip {
  origin: string;
  destination: string;
  fare: string;
  origTimeMin: string;
  origTimeDate: string;
  destTimeMin: string;
  destTimeDate: string;
  tripTime: string;
  legs: TripLeg[];
}

export interface StationSchedule {
  date: string;
  station: string;
  schedule: {
    time: string;
    trainHeadStation: string;
    trainIdx: string;
    trainDirection: string;
    line: string;
    lineColor: string;
    bikeFlag: string;
  }[];
}

export interface RouteSchedule {
  routeName: string;
  routeNumber: string;
  schedules: {
    date: string;
    stops: {
      station: string;
      time: string;
    }[];
  }[];
}

export interface Holiday {
  name: string;
  date: string;
  schedule: string;
}

// New Zod schemas for fare and schedule information
const FareInfoSchema = z.object({
  fare: z.object({
    '@origin': z.string(),
    '@destination': z.string(),
    '@amount': z.string(),
    '@discount': z.string().optional(),
    '@clipper': z.string().optional(),
    '@schedule': z.string().optional(),
  }),
});

const FareResponseSchema = z.object({
  root: z.object({
    fares: z.object({
      fare: FareInfoSchema,
    }),
  }),
});

const TripLegSchema = z.object({
  '@order': z.string(),
  '@transfercode': z.string().optional(),
  '@origin': z.string(),
  '@destination': z.string(),
  '@origTimeMin': z.string(),
  '@destTimeMin': z.string(),
  '@line': z.string(),
  '@lineColor': z.string().optional(),
  '@bikeFlag': z.string().optional(),
  '@trainHeadStation': z.string(),
  '@trainIdx': z.string(),
});

const TripSchema = z.object({
  '@origin': z.string(),
  '@destination': z.string(),
  '@fare': z.string(),
  '@origTimeMin': z.string(),
  '@origTimeDate': z.string(),
  '@destTimeMin': z.string(),
  '@destTimeDate': z.string(),
  '@tripTime': z.string(),
  leg: z.union([z.array(TripLegSchema), TripLegSchema]),
});

const TripsResponseSchema = z.object({
  root: z.object({
    schedule: z.object({
      request: z.object({
        trip: z.union([z.array(TripSchema), TripSchema]),
      }),
    }),
  }),
});

const HolidaySchema = z.object({
  name: z.string(),
  date: z.string(),
  schedule: z.string(),
});

const HolidaysResponseSchema = z.object({
  root: z.object({
    holidays: z.object({
      holiday: z.union([z.array(HolidaySchema), HolidaySchema]),
    }),
  }),
});

// Define types for the trip data to avoid using 'any'
type BartTripData = z.infer<typeof TripSchema>;
type BartTripLegData = z.infer<typeof TripLegSchema>;

// Define schema for station schedule
const StationScheduleItemSchema = z.object({
  '@origTime': z.string(),
  '@destTime': z.string().optional(),
  '@line': z.string(),
  '@trainHeadStation': z.string(),
  '@trainIdx': z.string(),
  '@bikeflag': z.string().optional(),
  '@color': z.string().optional(),
  '@hexcolor': z.string().optional(),
});

const StationScheduleSchema = z.object({
  '@name': z.string(),
  '@abbr': z.string(),
  '@date': z.string(),
  item: z.union([z.array(StationScheduleItemSchema), StationScheduleItemSchema]).optional(),
});

const StationScheduleResponseSchema = z.object({
  root: z.object({
    station: StationScheduleSchema,
  }),
});

// Define schema for route schedule
const RouteStopSchema = z.object({
  '@station': z.string(),
  '@load': z.string().optional(),
  '@origTime': z.string(),
});

const RouteScheduleItemSchema = z.object({
  '@trainId': z.string(),
  '@trainIdx': z.string(),
  '@line': z.string(),
  '@bikeflag': z.string().optional(),
  '@color': z.string().optional(),
  '@hexcolor': z.string().optional(),
  '@direction': z.string(),
  stop: z.array(RouteStopSchema),
});

const RouteScheduleSchema = z.object({
  '@name': z.string(),
  '@abbr': z.string(),
  '@routeID': z.string(),
  '@number': z.string(),
  '@color': z.string().optional(),
  '@date': z.string(),
  train: z.union([z.array(RouteScheduleItemSchema), RouteScheduleItemSchema]),
});

const RouteScheduleResponseSchema = z.object({
  root: z.object({
    route: RouteScheduleSchema,
  }),
});

// Define types for the schedule data to avoid using 'any'
type BartStationScheduleItemData = z.infer<typeof StationScheduleItemSchema>;
type BartRouteScheduleItemData = z.infer<typeof RouteScheduleItemSchema>;
type BartRouteStopData = z.infer<typeof RouteStopSchema>;
type BartHolidayData = z.infer<typeof HolidaySchema>;

// New API functions for fare and schedule information

/**
 * Get fare information between two stations
 * @param origin Origin station abbreviation
 * @param destination Destination station abbreviation
 * @returns Fare information or null if error
 */
export async function getFareInfo(origin: string, destination: string): Promise<FareInfo | null> {
  try {
    const url = buildUrl(ENDPOINTS.SCHEDULE, {
      cmd: 'fare',
      orig: origin,
      dest: destination,
    });
    
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      FareResponseSchema,
      `Failed to fetch fare info from ${origin} to ${destination}`
    );
    
    const fareData = data.root.fares.fare.fare;
    return {
      origin: fareData['@origin'],
      destination: fareData['@destination'],
      fare: fareData['@amount'],
      discount: fareData['@discount'] || '',
      clipper: fareData['@clipper'] || '',
      schedule: fareData['@schedule'] || '',
    };
  } catch (error) {
    console.error('Error fetching fare information:', error);
    return null;
  }
}

/**
 * Plan a trip based on departure time
 * @param origin Origin station abbreviation
 * @param destination Destination station abbreviation
 * @param time Departure time in "HH:MM+AM/PM" format (optional, defaults to current time)
 * @param date Departure date in "MM/DD/YYYY" format (optional, defaults to current date)
 * @returns Trip information or empty array if error
 */
export async function planTripByDepartureTime(
  origin: string,
  destination: string,
  time?: string,
  date?: string
): Promise<Trip[]> {
  try {
    const params: Record<string, string> = {
      cmd: 'depart',
      orig: origin,
      dest: destination,
    };
    
    if (time) params.time = time;
    if (date) params.date = date;
    
    const url = buildUrl(ENDPOINTS.SCHEDULE, params);
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      TripsResponseSchema,
      `Failed to plan trip from ${origin} to ${destination}`
    );
    
    const trips = data.root.schedule.request.trip;
    
    // Normalize the response to handle both single trip and array of trips
    const normalizeTrips = (tripData: BartTripData | BartTripData[]): Trip[] => {
      if (Array.isArray(tripData)) {
        return tripData.map(normalizeTrip);
      } else {
        return [normalizeTrip(tripData)];
      }
    };
    
    const normalizeTrip = (trip: BartTripData): Trip => {
      // Normalize legs to always be an array
      const legs = trip.leg ? 
        (Array.isArray(trip.leg) ? trip.leg : [trip.leg]) : 
        [];
      
      return {
        origin: trip['@origin'],
        destination: trip['@destination'],
        fare: trip['@fare'],
        origTimeMin: trip['@origTimeMin'],
        origTimeDate: trip['@origTimeDate'],
        destTimeMin: trip['@destTimeMin'],
        destTimeDate: trip['@destTimeDate'],
        tripTime: trip['@tripTime'],
        legs: legs.map((leg: BartTripLegData) => ({
          order: leg['@order'],
          transferCode: leg['@transfercode'] || '',
          origin: leg['@origin'],
          destination: leg['@destination'],
          origTimeMin: leg['@origTimeMin'],
          destTimeMin: leg['@destTimeMin'],
          line: leg['@line'],
          lineColor: leg['@lineColor'] || '',
          bikeFlag: leg['@bikeFlag'] || '',
          trainHeadStation: leg['@trainHeadStation'],
          trainIdx: leg['@trainIdx'],
        })),
      };
    };
    
    return normalizeTrips(trips);
  } catch (error) {
    console.error('Error planning trip:', error);
    return [];
  }
}

/**
 * Plan a trip based on arrival time
 * @param origin Origin station abbreviation
 * @param destination Destination station abbreviation
 * @param time Arrival time in "HH:MM+AM/PM" format (optional, defaults to current time)
 * @param date Arrival date in "MM/DD/YYYY" format (optional, defaults to current date)
 * @returns Trip information or empty array if error
 */
export async function planTripByArrivalTime(
  origin: string,
  destination: string,
  time?: string,
  date?: string
): Promise<Trip[]> {
  try {
    const params: Record<string, string> = {
      cmd: 'arrive',
      orig: origin,
      dest: destination,
    };
    
    if (time) params.time = time;
    if (date) params.date = date;
    
    const url = buildUrl(ENDPOINTS.SCHEDULE, params);
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      TripsResponseSchema,
      `Failed to plan trip from ${origin} to ${destination}`
    );
    
    const trips = data.root.schedule.request.trip;
    
    // Normalize the response to handle both single trip and array of trips
    const normalizeTrips = (tripData: BartTripData | BartTripData[]): Trip[] => {
      if (Array.isArray(tripData)) {
        return tripData.map(normalizeTrip);
      } else {
        return [normalizeTrip(tripData)];
      }
    };
    
    const normalizeTrip = (trip: BartTripData): Trip => {
      // Normalize legs to always be an array
      const legs = trip.leg ? 
        (Array.isArray(trip.leg) ? trip.leg : [trip.leg]) : 
        [];
      
      return {
        origin: trip['@origin'],
        destination: trip['@destination'],
        fare: trip['@fare'],
        origTimeMin: trip['@origTimeMin'],
        origTimeDate: trip['@origTimeDate'],
        destTimeMin: trip['@destTimeMin'],
        destTimeDate: trip['@destTimeDate'],
        tripTime: trip['@tripTime'],
        legs: legs.map((leg: BartTripLegData) => ({
          order: leg['@order'],
          transferCode: leg['@transfercode'] || '',
          origin: leg['@origin'],
          destination: leg['@destination'],
          origTimeMin: leg['@origTimeMin'],
          destTimeMin: leg['@destTimeMin'],
          line: leg['@line'],
          lineColor: leg['@lineColor'] || '',
          bikeFlag: leg['@bikeFlag'] || '',
          trainHeadStation: leg['@trainHeadStation'],
          trainIdx: leg['@trainIdx'],
        })),
      };
    };
    
    return normalizeTrips(trips);
  } catch (error) {
    console.error('Error planning trip:', error);
    return [];
  }
}

/**
 * Get BART holiday schedule information
 * @returns Holiday information or empty array if error
 */
export async function getHolidays(): Promise<Holiday[]> {
  try {
    const url = buildUrl(ENDPOINTS.SCHEDULE, { cmd: 'holiday' });
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      HolidaysResponseSchema,
      'Failed to fetch holiday information'
    );
    
    const holidays = data.root.holidays.holiday;
    
    // Normalize the response to handle both single holiday and array of holidays
    if (Array.isArray(holidays)) {
      return holidays.map((holiday: BartHolidayData) => ({
        name: holiday.name,
        date: holiday.date,
        schedule: holiday.schedule,
      }));
    } else {
      return [{
        name: holidays.name,
        date: holidays.date,
        schedule: holidays.schedule,
      }];
    }
  } catch (error) {
    console.error('Error fetching holiday information:', error);
    return [];
  }
}

/**
 * Get station schedule information
 * @param station Station abbreviation
 * @param date Date in "MM/DD/YYYY" format (optional, defaults to current date)
 * @returns Station schedule information or null if error
 */
export async function getStationSchedule(
  station: string,
  date?: string
): Promise<StationSchedule | null> {
  try {
    const params: Record<string, string> = {
      cmd: 'stnsched',
      orig: station,
    };
    
    if (date) params.date = date;
    
    const url = buildUrl(ENDPOINTS.SCHEDULE, params);
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      StationScheduleResponseSchema,
      `Failed to fetch schedule for station ${station}`
    );
    
    const stationData = data.root.station;
    
    // Normalize the schedule items to always be an array
    const scheduleItems = stationData.item 
      ? (Array.isArray(stationData.item) ? stationData.item : [stationData.item])
      : [];
    
    return {
      date: stationData['@date'],
      station: stationData['@name'],
      schedule: scheduleItems.map((item: BartStationScheduleItemData) => ({
        time: item['@origTime'],
        trainHeadStation: item['@trainHeadStation'],
        trainIdx: item['@trainIdx'],
        trainDirection: item['@line'],
        line: item['@line'],
        lineColor: item['@color'] || '',
        bikeFlag: item['@bikeflag'] || '',
      })),
    };
  } catch (error) {
    console.error('Error fetching station schedule:', error);
    return null;
  }
}

/**
 * Get route schedule information
 * @param routeNumber Route number
 * @param date Date in "MM/DD/YYYY" format (optional, defaults to current date)
 * @returns Route schedule information or null if error
 */
export async function getRouteSchedule(
  routeNumber: string,
  date?: string
): Promise<RouteSchedule | null> {
  try {
    const params: Record<string, string> = {
      cmd: 'routesched',
      route: routeNumber,
    };
    
    if (date) params.date = date;
    
    const url = buildUrl(ENDPOINTS.SCHEDULE, params);
    const response = await fetch(url);
    const data = await safeParseResponse(
      response,
      RouteScheduleResponseSchema,
      `Failed to fetch schedule for route ${routeNumber}`
    );
    
    const routeData = data.root.route;
    
    // Normalize the train items to always be an array
    const trainItems = routeData.train 
      ? (Array.isArray(routeData.train) ? routeData.train : [routeData.train])
      : [];
    
    return {
      routeName: routeData['@name'],
      routeNumber: routeData['@number'],
      schedules: [{
        date: routeData['@date'],
        stops: trainItems.flatMap((train: BartRouteScheduleItemData) => 
          train.stop.map((stop: BartRouteStopData) => ({
            station: stop['@station'],
            time: stop['@origTime'],
          }))
        ),
      }],
    };
  } catch (error) {
    console.error('Error fetching route schedule:', error);
    return null;
  }
}

/**
 * Get API version information
 * @returns API version string or null if error
 */
export async function getApiVersion(): Promise<string | null> {
  try {
    const url = buildUrl(ENDPOINTS.VERSION, { cmd: 'ver' });
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch API version: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.root?.version || null;
  } catch (error) {
    console.error('Error fetching API version:', error);
    return null;
  }
}

// Define types for the fallback parsing
interface RawEtdEstimate {
  minutes?: string | number;
  direction?: string;
  platform?: string;
  delay?: string | number;
  length?: string | number;
  [key: string]: unknown;
}

interface RawEtd {
  destination?: string;
  abbreviation?: string;
  color?: string;
  hexcolor?: string;
  estimate?: RawEtdEstimate[];
  [key: string]: unknown;
}

export interface StationInfo extends BartStation {
  intro: string;
  cross_street: string;
  food: string;
  shopping: string;
  attraction: string;
  link: string;
}

export interface StationAccess {
  station: string;
  intro: string;
  parking: {
    type: string;
    description: string;
  };
  bike: {
    allowed: string;
    rack: string;
    locker: string;
  };
  lockers: string;
  transit_info: string;
}

export async function getStationInfo(station: string): Promise<StationInfo | null> {
  try {
    const url = buildUrl(ENDPOINTS.STATIONS, { cmd: 'stninfo', orig: station });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch station info: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.root?.stations?.station?.[0] || null;
  } catch (error) {
    console.error('Error fetching station info:', error);
    return null;
  }
}

export async function getStationAccess(station: string): Promise<StationAccess | null> {
  try {
    const url = buildUrl(ENDPOINTS.STATIONS, { cmd: 'stnaccess', orig: station });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch station access: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.root?.stations?.station?.[0] || null;
  } catch (error) {
    console.error('Error fetching station access:', error);
    return null;
  }
}
