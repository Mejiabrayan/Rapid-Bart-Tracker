'use client';

import { useState } from 'react';
import { fetchTripByDeparture, fetchFareInformation } from '@/lib/actions';
import { BartStation, Trip } from '@/lib/bart';
import { Loader2 } from 'lucide-react';

export default function TripPlanner({ stations }: { stations: BartStation[] }) {
  const [origin, setOrigin] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [trips, setTrips] = useState<Trip[]>([]);
  const [fare, setFare] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlanTrip = async () => {
    if (!origin || !destination) {
      setError('Please select both origin and destination stations');
      return;
    }

    if (origin === destination) {
      setError('Origin and destination cannot be the same');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Fetch trip information
      const tripResults = await fetchTripByDeparture(origin, destination);
      setTrips(tripResults);
      
      // Fetch fare information
      const fareInfo = await fetchFareInformation(origin, destination);
      setFare(fareInfo?.fare || 'Unavailable');
    } catch (err) {
      setError('Failed to plan trip. Please try again.');
      console.error('Error planning trip:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format time for display (e.g., "10:30 AM")
  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A';
    return timeString;
  };

  // Get station name from abbreviation
  const getStationName = (abbr: string) => {
    const station = stations.find(s => s.abbr === abbr);
    return station ? station.name : abbr;
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold">BART Trip Planner</h2>
        <p className="text-gray-500">Plan your BART trip with real-time schedules and fare information</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label htmlFor="origin" className="block text-sm font-medium text-gray-700">Origin Station</label>
            <select 
              id="origin"
              value={origin} 
              onChange={(e) => setOrigin(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select origin station</option>
              {stations.map((station) => (
                <option key={`origin-${station.abbr}`} value={station.abbr}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination Station</label>
            <select 
              id="destination"
              value={destination} 
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">Select destination station</option>
              {stations.map((station) => (
                <option key={`dest-${station.abbr}`} value={station.abbr}>
                  {station.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <button 
          onClick={handlePlanTrip} 
          disabled={loading || !origin || !destination}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="inline-block mr-2 h-4 w-4 animate-spin" />
              Planning Trip...
            </>
          ) : (
            'Plan Trip'
          )}
        </button>
        
        {fare && trips.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="font-semibold">Fare: ${fare}</p>
          </div>
        )}
        
        {trips.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Trip Options</h3>
            {trips.map((trip, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <div className="bg-slate-100 py-2 px-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{formatTime(trip.origTimeMin)}</span>
                      <span className="mx-2">→</span>
                      <span className="font-semibold">{formatTime(trip.destTimeMin)}</span>
                    </div>
                    <div className="text-sm">
                      Trip time: {trip.tripTime} min
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  {trip.legs.map((leg, legIndex) => (
                    <div key={legIndex} className="mb-3 pb-3 border-b last:border-b-0">
                      <div className="flex items-center mb-1">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: leg.lineColor || '#666' }}
                        />
                        <span className="font-medium">{leg.line} Line</span>
                      </div>
                      <div className="ml-5 text-sm">
                        <div className="flex justify-between">
                          <span>{getStationName(leg.origin)}</span>
                          <span>{formatTime(leg.origTimeMin)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>{getStationName(leg.destination)}</span>
                          <span>{formatTime(leg.destTimeMin)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-6 py-3 bg-gray-50 text-xs text-gray-500">
        Data provided by BART API. Schedules and fares are subject to change.
      </div>
    </div>
  );
} 