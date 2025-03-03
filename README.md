# BART Real-time Tracker

<div align="center">
  <img src="public/og.png" alt="BART Real-time Tracker" width="600" />
</div>

## Overview

BART Real-time Tracker provides live train tracking, real-time departures, station information, and system status for the San Francisco Bay Area Rapid Transit system. Stay updated with the latest information about your BART commute.

## Features

- **Interactive Map**: Visualize station locations and train positions using Leaflet maps
- **Real-time Station Data**: View detailed information for all BART stations
- **Live Departure Times**: Get up-to-the-minute departure schedules for any station
- **System Alerts**: Receive immediate notifications about system issues or delays
- **Line Status Monitoring**: Check the operational status of all BART lines
- **Route Information**: Access detailed route information including station stops
- **Smart Caching**: Optimized data loading with strategic caching for performance
- **Search-as-you-type**: Find stations and routes with instant search results

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) with App Router
- **Maps**: [Leaflet](https://leafletjs.com/) via [React Leaflet](https://react-leaflet.js.org/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) primitives with [shadcn/ui](https://ui.shadcn.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with CSS variables
- **State Management**: React Hooks with URL-based state via [nuqs](https://github.com/47ng/nuqs)
- **API Integration**: BART API with server-side caching
- **Animations**: Motion library for smooth transitions
- **Forms & Validation**: Zod for type validation
- **Performance**: Server Actions with unstable_cache for optimized data fetching

## Getting Started

### Prerequisites

- Node.js 18.x or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/bart-tracker.git
   cd bart-tracker
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Run the development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## API Integration

This project uses the official BART API to fetch real-time data about stations, routes, departures, and system alerts. The API implementation includes:

- **Station data**: Comprehensive information about all BART stations
- **Route details**: Complete route maps with station stops
- **System alerts**: Real-time notifications about delays and service disruptions
- **Smart caching**: Optimized API calls with appropriate cache durations
  - Station & route data: 24-hour cache (rarely changes)
  - Alerts & departures: 5-minute cache (frequently updates)

The API integration is implemented in `lib/bart.ts` with server actions defined in `lib/actions.ts`.

## Deployment

The application is optimized for deployment on Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fbart-tracker)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Data provided by [BART API](https://www.bart.gov/schedules/developers/api)
- Map tiles from [OpenStreetMap](https://www.openstreetmap.org/)
- Icons from [Lucide](https://lucide.dev/)
- UI components inspired by [shadcn/ui](https://ui.shadcn.com/)
