"use client"

import * as React from "react"
import {
  Train,
  Map,
  Clock,
  AlertCircle,
  Info,
  Route,
  MapPin,
  Circle,
} from "lucide-react"

import { StatusNav } from "@/components/status-nav"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
} from "@/components/ui/sidebar"

// Example BART data structure
const data = {
  status: {
    trainCount: 42,
    alerts: [
      {
        description: "Normal service on all lines",
        posted: new Date().toISOString(),
        type: "info"
      }
    ],
    elevatorStatus: [
      {
        description: "All elevators operational",
        posted: new Date().toISOString(),
        type: "success"
      }
    ]
  },
  quickStats: {
    activeTrains: 42,
    totalStations: 50,
    operatingLines: 5,
    averageDelay: "On time"
  },
  lines: [
    { name: "Yellow Line", status: "Normal", color: "#FFD700" },
    { name: "Blue Line", status: "Normal", color: "#0000FF" },
    { name: "Red Line", status: "Delayed", color: "#FF0000" },
    { name: "Green Line", status: "Normal", color: "#008000" },
    { name: "Orange Line", status: "Normal", color: "#FFA500" }
  ],
  popularStations: [
    { name: "Embarcadero", crowding: "Moderate" },
    { name: "Powell St.", crowding: "High" },
    { name: "Berkeley", crowding: "Low" },
    { name: "Oakland Int'l Airport", crowding: "Moderate" }
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="bg-green-500/10 text-green-500 flex aspect-square size-8 items-center justify-center rounded-lg">
                <Train className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">BART Tracker</span>
                <span className="truncate text-xs text-muted-foreground">Real-time System</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent className="space-y-2">
        {/* Quick Stats */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">System Overview</SidebarGroupLabel>
          <div className="grid grid-cols-2 gap-1 px-2 py-1">
            <div className="flex items-center gap-2 text-xs">
              <Train className="size-3.5 text-green-500" />
              <span className="flex gap-1">
                <span className="text-muted-foreground">Trains:</span>
                <span className="font-medium">{data.quickStats.activeTrains}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <MapPin className="size-3.5 text-blue-500" />
              <span className="flex gap-1">
                <span className="text-muted-foreground">Stations:</span>
                <span className="font-medium">{data.quickStats.totalStations}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Route className="size-3.5 text-yellow-500" />
              <span className="flex gap-1">
                <span className="text-muted-foreground">Lines:</span>
                <span className="font-medium">{data.quickStats.operatingLines}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="size-3.5 text-purple-500" />
              <span className="flex gap-1">
                <span className="text-muted-foreground">Delay:</span>
                <span className="font-medium">{data.quickStats.averageDelay}</span>
              </span>
            </div>
          </div>
        </SidebarGroup>

        {/* Line Status */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">Line Status</SidebarGroupLabel>
          <SidebarMenu>
            {data.lines.map((line) => (
              <SidebarMenuItem key={line.name} className="py-0.5">
                <SidebarMenuButton className="py-1">
                  <div className="flex items-center gap-2 w-full">
                    <div className="size-2 rounded-full" style={{ backgroundColor: line.color }} />
                    <span className="flex-1 text-xs">{line.name}</span>
                    <div className={`flex items-center gap-1 text-xs ${
                      line.status === "Normal" ? "text-green-500" : "text-yellow-500"
                    }`}>
                      <Circle className="size-1.5 fill-current" />
                      <span className="text-[10px] uppercase tracking-wider font-medium">{line.status}</span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Popular Stations */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">Station Crowding</SidebarGroupLabel>
          <SidebarMenu>
            {data.popularStations.map((station) => (
              <SidebarMenuItem key={station.name} className="py-0.5">
                <SidebarMenuButton className="py-1">
                  <div className="flex items-center gap-2 w-full">
                    <MapPin className="size-3" />
                    <span className="flex-1 text-xs">{station.name}</span>
                    <div className={`flex items-center gap-1 text-xs ${
                      station.crowding === "Low" ? "text-green-500" : 
                      station.crowding === "Moderate" ? "text-yellow-500" : "text-red-500"
                    }`}>
                      <Circle className="size-1.5 fill-current" />
                      <span className="text-[10px] uppercase tracking-wider font-medium">{station.crowding}</span>
                    </div>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <StatusNav status={data.status} />
      </SidebarFooter>
    </Sidebar>
  )
}
