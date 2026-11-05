# Rapid BART Tracker

A real-time transit app for Bay Area riders, with station departures, service alerts, and an interactive map.

**[Open the live demo](https://rapidbart-mejiabrayan-brayan-mejias-projects-c57ae289.vercel.app/)**

![Rapid BART Tracker](public/og.png)

## Features

- Check upcoming departures and station details
- Follow service alerts and line status
- Explore stations and train routes on a map
- Search for stations and routes

## Built with

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Leaflet · BART API

## Run locally

Requires Node.js 18+ and pnpm.

```bash
git clone https://github.com/Mejiabrayan/Rapid-Bart-Tracker.git
cd Rapid-Bart-Tracker
pnpm install
```

Create a `.env.local` file with your BART API key:

```text
NEXT_PUBLIC_BART_API_KEY=your_bart_api_key
```

The map can also use a Stadia Maps key:

```text
NEXT_PUBLIC_STADIA_API_KEY=your_stadia_maps_api_key
```

Then start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).