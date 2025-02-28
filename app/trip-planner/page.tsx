import { fetchAllStations } from '@/lib/actions';
import TripPlanner from '@/components/trip-planner';

export const metadata = {
  title: 'BART Trip Planner',
  description: 'Plan your BART trip with real-time schedules and fare information',
};

export default async function TripPlannerPage() {
  // Fetch all stations for the trip planner
  const stations = await fetchAllStations();
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">BART Trip Planner</h1>
      <TripPlanner stations={stations} />
      
      <div className="mt-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">About the Trip Planner</h2>
        <p className="mb-4">
          This trip planner uses real-time data from the BART API to help you plan your journey
          across the Bay Area. Select your origin and destination stations to see available trips,
          including transfer information and fare details.
        </p>
        <h3 className="text-xl font-semibold mb-2">Features:</h3>
        <ul className="list-disc pl-6 mb-6">
          <li>Real-time trip planning based on current BART schedules</li>
          <li>Accurate fare information between any two stations</li>
          <li>Detailed transfer information for multi-leg journeys</li>
          <li>Color-coded line information matching official BART colors</li>
        </ul>
        <p className="text-sm text-gray-600">
          Note: This trip planner uses the official BART API. While we strive for accuracy,
          schedules and fares are subject to change. Always check the official BART website
          or app for the most up-to-date information.
        </p>
      </div>
    </div>
  );
} 