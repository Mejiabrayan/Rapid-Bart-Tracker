import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BART Real-time Tracker",
  description: "Live BART train tracking and station information",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased dark isolate`}>
        <div className="relative flex min-h-screen">
          <SidebarProvider>
            <AppSidebar  />
            <div className="flex-1">
              <main className="h-[calc(100vh-1rem)]">{children}</main>
            </div>
          </SidebarProvider>
        </div>
      </body>
    </html>
  );
}
