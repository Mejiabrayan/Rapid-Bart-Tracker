import type { Metadata, Viewport } from 'next';
import { Inter, Fanwood_Text } from 'next/font/google';
import './globals.css';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { DensityVisualizationProvider } from '@/lib/context/density-context';
import { type ReactNode } from 'react';

const inter = Inter({ subsets: ['latin'] });
export const fanwood = Fanwood_Text({ subsets: ['latin'], weight: '400' });

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: 'BART Real-time Tracker',
  description:
    'Live BART train tracking, real-time departures, station information, and system status for the San Francisco Bay Area Rapid Transit.',
  keywords:
    'BART, Bay Area Rapid Transit, train tracker, real-time departures, SF transit, BART stations, train schedule, public transportation, San Francisco transit, Bay Area transit',
  authors: [{ name: 'BART Tracker' }],
  creator: 'BART Tracker',
  publisher: 'BART Tracker',
  robots: 'index, follow',
  applicationName: 'BART Tracker',
  metadataBase: new URL('https://bart-tracker.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    title: 'BART Real-time Tracker',
    description:
      'Live BART train tracking, real-time departures, station information, and system status for the San Francisco Bay Area Rapid Transit.',
    siteName: 'BART Tracker',
    locale: 'en_US',
    url: 'https://bart-tracker.vercel.app',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'BART Real-time Tracker dashboard showing train status and schedules',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BART Real-time Tracker',
    description:
      'Live BART train tracking, real-time departures, station information, and system status for the San Francisco Bay Area Rapid Transit.',
    creator: '@bart_tracker',
    images: ['/og.png'],
  },
  category: 'Transportation',
  icons: {
    icon: '/favicon.ico',
    apple: [{ url: '/apple-icon.png' }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='en' className='h-full'>
      <body className={`${inter.className} h-full antialiased dark isolate`}>
        <div className='relative flex min-h-screen'>
          <DensityVisualizationProvider>
            <SidebarProvider>
              <AppSidebar />
              <div className='flex flex-1 flex-col gap-4 md:p-4 md:pt-2.5 md:pb-2.5'>
                <main className='h-[calc(100vh-1rem)]'>{children}</main>
              </div>
            </SidebarProvider>
          </DensityVisualizationProvider>
        </div>
      </body>
    </html>
  );
}
