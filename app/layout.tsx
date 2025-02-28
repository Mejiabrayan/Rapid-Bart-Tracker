import type { Metadata } from 'next';
import { Inter, Fanwood_Text } from 'next/font/google';
import './globals.css';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider} from '@/components/ui/sidebar';
import ClientPerformanceWrapper from '@/components/ClientPerformanceWrapper';

const inter = Inter({ subsets: ['latin'] });
export const fanwood = Fanwood_Text({ subsets: ['latin'], weight: '400' });

export const metadata: Metadata = {
  title: 'BART Real-time Tracker',
  description: 'Live BART train tracking and station information',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className='h-full'>
      <body className={`${inter.className} h-full antialiased dark isolate`}>
        <div className='relative flex min-h-screen'>
          <SidebarProvider>
            <AppSidebar />
            <div className="flex flex-1 flex-col gap-4 md:p-4 md:pt-2.5 md:pb-2.5">
              <main className='h-[calc(100vh-1rem)]'>{children}</main>
            </div>
          </SidebarProvider>
          {/* Performance Monitor */}
          <ClientPerformanceWrapper />
        </div>
      </body>
    </html>
  );
}
