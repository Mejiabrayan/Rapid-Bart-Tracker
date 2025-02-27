'use client';

import { ChevronsUpDown } from 'lucide-react';
import { SystemStatusOverlay } from '@/components/system-status';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

export function StatusNav({
  status,
}: {
  status: {
    trainCount: number;
    alerts: Array<{ description: string; posted: string; type: string }>;
    elevatorStatus: Array<{
      description: string;
      posted: string;
      type: string;
    }>;
  };
}) {
  const { isMobile } = useSidebar();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='flex items-center gap-2'>
                <div className='size-3 bg-green-500 rounded-full animate-pulse' />
                <span className='font-medium'>System Status</span>
              </div>
              <ChevronsUpDown className='ml-auto size-4' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-[300px] rounded-lg z-[9999]'
            side={isMobile ? 'bottom' : 'right'}
            align='start'
            sideOffset={4}
          >
            <SystemStatusOverlay
              status={status}
              className='!static !inset-auto bg-transparent border-0 p-2'
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
