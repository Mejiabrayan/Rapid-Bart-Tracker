import type { LatLngExpression } from 'leaflet';

const BART_API_KEY = 'MW9S-E7SL-26DU-VV8V'

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
  destination: string;
  position: LatLngExpression;
  minutes: string;
}

export interface Route {
  name: string;
  number: string;
  color: string;
  stations: string[];
}

export async function getBartStations() {
  try {
    const response = await fetch(
      `https://api.bart.gov/api/stn.aspx?cmd=stns&key=${BART_API_KEY}&json=y`
    );
    if (!response.ok) throw new Error('Failed to fetch stations');
    const data = await response.json();
    return data.root.stations.station;
  } catch (error) {
    console.error('Error fetching BART stations:', error);
    throw error;
  }
}

export async function getDepartures(station: string) {
  try {
    const response = await fetch(
      `https://api.bart.gov/api/etd.aspx?cmd=etd&orig=${station}&key=${BART_API_KEY}&json=y`
    );
    const data = await response.json();
    return data.root.station[0].etd;
  } catch (error) {
    console.error('Error fetching departures:', error);
    return [];
  }
}

export async function getTrainLocations() {
  try {
    const response = await fetch(
      `https://api.bart.gov/api/etd.aspx?cmd=etd&orig=all&key=${BART_API_KEY}&json=y`
    );
    const data = await response.json();
    return data.root.station;
  } catch (error) {
    console.error('Error fetching train locations:', error);
    return [];
  }
}

export async function getBartRoutes() {
  try {
    const response = await fetch(
      `https://api.bart.gov/api/route.aspx?cmd=routes&key=${BART_API_KEY}&json=y`
    );
    if (!response.ok) throw new Error('Failed to fetch routes');
    const data = await response.json();
    return data.root.routes.route;
  } catch (error) {
    console.error('Error fetching BART routes:', error);
    return [];
  }
}

export async function getRouteInfo(routeNumber: string) {
  try {
    const response = await fetch(
      `https://api.bart.gov/api/route.aspx?cmd=routeinfo&route=${routeNumber}&key=${BART_API_KEY}&json=y`
    );
    if (!response.ok) throw new Error('Failed to fetch route info');
    const data = await response.json();
    return {
      ...data.root.routes.route,
      stations: data.root.routes.route.config.station
    };
  } catch (error) {
    console.error('Error fetching route info:', error);
    return null;
  }
}

export async function getSystemAlerts() {
  try {
    const response = await fetch(
      `https://api.bart.gov/api/bsa.aspx?cmd=bsa&key=${BART_API_KEY}&json=y`
    );
    const data = await response.json();
    const alerts = data.root.bsa;
    if (!alerts) return [];
    
    const normalizeAlert = (alert: any) => ({
      description: alert.description['#cdata-section'] || alert.description || '',
      posted: alert.posted || '',
      type: alert.type || ''
    });

    return Array.isArray(alerts) 
      ? alerts.map(normalizeAlert)
      : [normalizeAlert(alerts)];
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
}

export async function getTrainCount() {
  try {
    const response = await fetch(
      `https://api.bart.gov/api/bsa.aspx?cmd=count&key=${BART_API_KEY}&json=y`
    );
    const data = await response.json();
    return data.root.traincount;
  } catch (error) {
    console.error('Error fetching train count:', error);
    return 0;
  }
}

export async function getElevatorStatus() {
  try {
    const response = await fetch(
      `https://api.bart.gov/api/bsa.aspx?cmd=elev&key=${BART_API_KEY}&json=y`
    );
    const data = await response.json();
    const status = data.root.bsa;
    if (!status) return [];

    const normalizeStatus = (item: any) => ({
      description: item.description['#cdata-section'] || item.description || '',
      posted: item.posted || '',
      type: item.type || ''
    });

    return Array.isArray(status)
      ? status.map(normalizeStatus)
      : [normalizeStatus(status)];
  } catch (error) {
    console.error('Error fetching elevator status:', error);
    return [];
  }
} 