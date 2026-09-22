import { Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Box,
  Building2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Filter,
  Menu,
  Network,
  Pin,
  PinOff,
  Plane,
  Radar,
  Radio,
  Route as RouteIcon,
  Search,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { incident, alerts } from "@/data/incident";
import { severityClass, severityLabel } from "@/lib/damage";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useOps } from "@/lib/ops-store";
import { CommandPalette } from "./CommandPalette";
import { CopilotDrawer } from "@/components/copilot/CopilotDrawer";
import type { OperatorRole } from "@/lib/audit-logger";
import { useRealtimeBadges, useRealtimeFeedInit } from "@/lib/realtime/useRealtimeValue";

export interface NavItemConfig {
  to: string;
  label: string;
  icon: typeof Radar;
  badgeKey?: "incidents" | "alerts" | "sorties" | "agents" | "conflicts";
  badgeVariant?: "critical" | "warning" | "ai" | "safe";
}

interface NavGroupConfig {
  heading: string;
  items: NavItemConfig[];
}

const navGroups: NavGroupConfig[] = [
  {
    heading: "Command & Situation",
    items: [
      { to: "/", label: "Command Center", icon: Radar },
      {
        to: "/incidents",
        label: "Incidents",
        icon: ShieldAlert,
        badgeKey: "incidents",
        badgeVariant: "critical",
      },
      {
        to: "/alerts",
        label: "Alerts & Comms",
        icon: Radio,
        badgeKey: "alerts",
        badgeVariant: "critical",
      },
    ],
  },
  {
    heading: "Geospatial & Twin",
    items: [
      { to: "/map", label: "Live Map 2.0", icon: Activity },
      { to: "/twin", label: "3D Digital Twin", icon: Box },
      { to: "/buildings", label: "Building Register", icon: Building2 },
      { to: "/infrastructure", label: "Infrastructure", icon: Shield },
    ],
  },
  {
    heading: "Intelligence & XAI",
    items: [
      {
        to: "/evidence",
        label: "Evidence & Conflicts",
        icon: Sparkles,
        badgeKey: "conflicts",
        badgeVariant: "warning",
      },
      { to: "/explainability", label: "Explainable AI", icon: Network },
      { to: "/agents", label: "AI Agent Fleet", icon: Bot, badgeKey: "agents", badgeVariant: "ai" },
      { to: "/graph", label: "Knowledge Graph", icon: Network },
    ],
  },
  {
    heading: "Simulation & Response",
    items: [
      { to: "/predictions", label: "Predictions & What-If", icon: TrendingUp },
      { to: "/scenarios", label: "Scenario Replay", icon: Activity },
      {
        to: "/drones",
        label: "Drone Missions",
        icon: Plane,
        badgeKey: "sorties",
        badgeVariant: "safe",
      },
      { to: "/response", label: "Response Planner", icon: Users },
      { to: "/routing", label: "Routing & Evac", icon: RouteIcon },
    ],
  },
  {
    heading: "Analytics & Governance",
    items: [
      { to: "/analytics", label: "Impact Analytics", icon: BarChart3 },
      { to: "/reports", label: "Situation Reports", icon: FileText },
      { to: "/settings", label: "Settings & RBAC", icon: Settings },
    ],
  },
];

const roleNames: Record<OperatorRole, string> = {
  commander: "Incident Commander",
  responder: "Field Responder",
  analyst: "Geospatial Analyst",
  admin: "Systems Admin",
};

export function AppShell({ children }: { children: ReactNode }) {
  // Start deterministic synthetic telemetry feed on client
  useRealtimeFeedInit();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pinnedPaths, setPinnedPaths] = useState<string[]>(["/", "/map", "/incidents"]);

  const { role, setRole, syncStatus, setSyncStatus, toggleCopilot } = useOps();
  const badges = useRealtimeBadges();

  // Load persistent collapse & pin preferences on client
  useEffect(() => {
    try {
      const savedCollapse = localStorage.getItem("aegis_sidebar_collapsed");
      if (savedCollapse !== null) {
        setCollapsed(savedCollapse === "true");
      }
      const savedPins = localStorage.getItem("aegis_pinned_workspaces");
      if (savedPins) {
        setPinnedPaths(JSON.parse(savedPins));
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const toggleCollapse = () => {
    const next = !collapsed;
    setCollapsed(next);
    try {
      localStorage.setItem("aegis_sidebar_collapsed", String(next));
    } catch {
      // ignore
    }
  };

  const togglePin = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPinnedPaths((prev) => {
      const updated = prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path];
      try {
        localStorage.setItem("aegis_pinned_workspaces", JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const toggleSyncState = () => {
    if (syncStatus === "live") {
      setSyncStatus("offline");
      toast.warning("Switched to Field Offline Mode (local caching enabled)");
    } else {
      setSyncStatus("syncing");
      setTimeout(() => {
        setSyncStatus("live");
        toast.success("Synchronized local actions with emergency cloud server");
      }, 900);
    }
  };

  // Resolve dynamic badge count based on realtime state
  const getBadgeValue = (key?: NavItemConfig["badgeKey"]) => {
    if (!key) return null;
    switch (key) {
      case "incidents":
        return badges.activeIncidents > 0 ? badges.activeIncidents : null;
      case "alerts":
        return badges.unreadAlerts > 0 ? badges.unreadAlerts : null;
      case "sorties":
        return badges.activeSorties > 0 ? `${badges.activeSorties}` : null;
      case "agents":
        return badges.agentQueueDepth > 0 ? `${badges.agentQueueDepth}` : null;
      case "conflicts":
        return 2;
      default:
        return null;
    }
  };

  // Collect all items for search filtering and pinned resolution
  const allItems = useMemo(() => navGroups.flatMap((g) => g.items), []);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return navGroups;
    const q = searchQuery.toLowerCase();
    return navGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (i) => i.label.toLowerCase().includes(q) || i.to.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [searchQuery]);

  const pinnedItems = useMemo(
    () => allItems.filter((i) => pinnedPaths.includes(i.to)),
    [allItems, pinnedPaths],
  );

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-screen bg-background bg-tactical-grid">
        {/* Top Tactical Command Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-2.5 border-b border-border bg-panel/95 px-3 backdrop-blur sm:px-4">
          <button
            className="rounded-md p-2 hover:bg-accent lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation drawer"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" aria-hidden />
            <span className="font-semibold tracking-tight text-sm sm:text-base">
              AegisVision AI
            </span>
          </Link>

          {/* Active Incident Badge */}
          <Link
            to="/incidents"
            className="hidden items-center gap-2 rounded-md border border-critical/40 bg-critical/10 px-2.5 py-1 md:inline-flex hover:bg-critical/15 transition-colors"
            title="Click to view Incident Intelligence"
          >
            <span className="h-2 w-2 animate-pulse-slow rounded-full bg-critical" aria-hidden />
            <span className="label-mono !text-critical text-[11px] font-semibold">
              Active · {incident.name}
            </span>
          </Link>

          {/* Global Search / Command Palette (Ctrl+K) */}
          <div className="ml-2 hidden sm:block">
            <CommandPalette />
          </div>

          {/* Telemetry Status Right Actions */}
          <div className="ml-auto flex items-center gap-2">
            {/* Realtime Engine Feed / Latency Chip */}
            <div
              className="hidden lg:flex items-center gap-2 rounded-md border border-border/70 bg-panel-elevated/80 px-2.5 py-1 text-[11px] font-mono"
              title={`Simulated Realtime Engine Feed · P99 Latency: ${badges.latencyP99}ms`}
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-safe opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-safe" />
              </span>
              <span className="text-muted-foreground text-[10px]">P99</span>
              <span className="text-foreground font-bold">{badges.latencyP99}ms</span>
              <span className="text-border">|</span>
              <span className="text-muted-foreground text-[10px]">HEALTH</span>
              <span className="text-safe font-bold">{badges.sensorHealth}%</span>
            </div>

            {/* Live / Offline Toggle Indicator */}
            <button
              onClick={toggleSyncState}
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-mono transition-colors",
                syncStatus === "live"
                  ? "border-safe/40 bg-safe/10 text-safe hover:bg-safe/20"
                  : syncStatus === "syncing"
                    ? "border-warning/40 bg-warning/10 text-warning"
                    : "border-critical/40 bg-critical/10 text-critical hover:bg-critical/20",
              )}
              title="Click to toggle Offline Field Mode or Sync"
            >
              {syncStatus === "live" ? (
                <>
                  <Wifi className="h-3 w-3" />
                  <span>LIVE</span>
                </>
              ) : syncStatus === "syncing" ? (
                <>
                  <Activity className="h-3 w-3 animate-spin" />
                  <span>SYNCING...</span>
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  <span>OFFLINE</span>
                </>
              )}
            </button>

            {/* AI Copilot Toggle Button */}
            <button
              onClick={toggleCopilot}
              className="flex items-center gap-1.5 rounded-md border border-ai/40 bg-ai/10 px-2.5 py-1 text-xs text-ai font-medium hover:bg-ai/20 transition-colors"
              aria-label="Toggle AI Disaster Copilot"
            >
              <Bot className="h-4 w-4 text-ai animate-pulse-slow" />
              <span className="hidden md:inline">AI Copilot</span>
            </button>

            {/* Notifications Popover */}
            <Popover>
              <PopoverTrigger
                className="relative rounded-md p-2 hover:bg-accent"
                aria-label={`Notifications, ${alerts.length} unread`}
              >
                <Bell className="h-5 w-5" />
                <span
                  className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-critical"
                  aria-hidden
                />
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[22rem] p-0 shadow-panel">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <p className="label-mono">Agent alerts ({badges.unreadAlerts} active)</p>
                  <Link to="/alerts" className="text-[11px] text-primary hover:underline">
                    View all ({alerts.length}) →
                  </Link>
                </div>
                <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                  {alerts.map((a) => (
                    <li key={a.id} className="px-3 py-2 hover:bg-panel-elevated transition-colors">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded border px-1.5 text-[10px] uppercase font-semibold",
                            severityClass[a.severity],
                          )}
                        >
                          {severityLabel[a.severity]}
                        </span>
                        <span className="label-mono">
                          {a.agent} · {a.time} ago
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-medium">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground">{a.detail}</p>
                    </li>
                  ))}
                </ul>
              </PopoverContent>
            </Popover>

            {/* Role-Based Access Control Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-2 rounded-md border border-border bg-panel-elevated px-2 py-1 text-xs hover:bg-accent focus:outline-none"
                aria-label="Operator Role Profile"
              >
                <div
                  className="grid h-6 w-6 place-items-center rounded bg-primary/20 text-primary font-bold text-[10px]"
                  title={roleNames[role]}
                >
                  {role.slice(0, 2).toUpperCase()}
                </div>
                <span className="hidden xl:inline text-muted-foreground font-medium">
                  {roleNames[role]}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-panel">
                <DropdownMenuLabel className="text-xs">Operator Role & RBAC</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(["commander", "responder", "analyst", "admin"] as OperatorRole[]).map((r) => (
                  <DropdownMenuItem
                    key={r}
                    onClick={() => {
                      setRole(r);
                      toast.info(`Active role switched to: ${roleNames[r]}`);
                    }}
                    className={cn(
                      "flex items-center justify-between text-xs cursor-pointer",
                      role === r && "bg-accent font-semibold",
                    )}
                  >
                    <span>{roleNames[r]}</span>
                    {role === r && (
                      <span className="label-mono text-[10px] text-primary">Active</span>
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="text-xs text-muted-foreground cursor-pointer">
                    Manage Permissions & Audit Log
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Workspace Layout with Collapsible Command Sidebar */}
        <div className="flex">
          <nav
            className={cn(
              "fixed inset-y-14 left-0 z-30 shrink-0 border-r border-border bg-panel p-2.5 transition-all duration-200 ease-out lg:static lg:inset-auto lg:translate-x-0 overflow-y-auto max-h-[calc(100vh-3.5rem)] flex flex-col",
              mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
              collapsed ? "lg:w-[4.25rem]" : "lg:w-68",
            )}
            aria-label="Tactical Command Navigation Rail"
          >
            {/* Sidebar Header & Collapse Toggle */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/60 px-1">
              {!collapsed && (
                <span className="label-mono text-[10px] text-muted-foreground font-bold tracking-wider">
                  WORKSPACE NAV
                </span>
              )}
              <button
                onClick={toggleCollapse}
                className={cn(
                  "hidden lg:inline-flex items-center justify-center h-7 w-7 rounded-md border border-border bg-panel-elevated text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                  collapsed && "mx-auto",
                )}
                title={collapsed ? "Expand navigation rail (Ctrl+[)" : "Collapse navigation rail"}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Quick Workspace Filter (Only shown when expanded) */}
            {!collapsed && (
              <div className="relative mb-3 px-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter workspaces..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-md border border-border bg-panel-elevated pl-8 pr-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            )}

            {/* Navigation Lists */}
            <div className="space-y-3.5 flex-1">
              {/* Pinned Quick Links (if expanded and pins exist) */}
              {!collapsed && pinnedItems.length > 0 && !searchQuery && (
                <div>
                  <div className="flex items-center justify-between px-2 mb-1">
                    <span className="label-mono text-[9px] text-primary/80 flex items-center gap-1">
                      <Pin className="h-2.5 w-2.5" /> PINNED COMMAND
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {pinnedItems.map((item) => {
                      const badgeVal = getBadgeValue(item.badgeKey);
                      return (
                        <li key={`pin-${item.to}`}>
                          <Link
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className="group flex items-center justify-between rounded-md px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground border-l-2 border-transparent"
                            activeProps={{
                              className:
                                "bg-panel-elevated !text-foreground font-semibold !border-primary",
                            }}
                            activeOptions={{ exact: item.to === "/" }}
                          >
                            <span className="flex items-center gap-2 truncate">
                              <item.icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                              <span className="truncate">{item.label}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              {badgeVal !== null && (
                                <span className="rounded bg-critical/20 px-1 py-0.2 text-[10px] font-mono text-critical font-bold">
                                  {badgeVal}
                                </span>
                              )}
                              <button
                                onClick={(e) => togglePin(item.to, e)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity p-0.5"
                                title="Unpin workspace"
                              >
                                <PinOff className="h-3 w-3" />
                              </button>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="my-2 border-b border-border/40" />
                </div>
              )}

              {/* Domain Navigation Groups */}
              {filteredGroups.map((group) => (
                <div key={group.heading}>
                  {!collapsed && (
                    <p className="label-mono px-2 text-[10px] text-muted-foreground/80 mb-1">
                      {group.heading}
                    </p>
                  )}
                  <ul className="space-y-0.5">
                    {group.items.map((item) => {
                      const badgeVal = getBadgeValue(item.badgeKey);
                      const isPinned = pinnedPaths.includes(item.to);

                      if (collapsed) {
                        // Collapsed Tooltip Icon Representation
                        return (
                          <li key={item.to} className="flex justify-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Link
                                  to={item.to}
                                  onClick={() => setMobileOpen(false)}
                                  className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring"
                                  activeProps={{
                                    className:
                                      "bg-panel-elevated !text-primary ring-1 ring-primary/40 font-bold",
                                  }}
                                  activeOptions={{ exact: item.to === "/" }}
                                  aria-label={item.label}
                                >
                                  <item.icon className="h-4 w-4" aria-hidden />
                                  {badgeVal !== null && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-critical text-[9px] font-mono font-bold text-white shadow-sm">
                                      {badgeVal}
                                    </span>
                                  )}
                                </Link>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="flex items-center gap-2">
                                <span>{item.label}</span>
                                {badgeVal !== null && (
                                  <span className="rounded bg-critical/20 px-1 py-0.5 text-[10px] font-mono text-critical font-bold">
                                    {badgeVal}
                                  </span>
                                )}
                              </TooltipContent>
                            </Tooltip>
                          </li>
                        );
                      }

                      // Expanded Navigation Representation
                      return (
                        <li key={item.to}>
                          <Link
                            to={item.to}
                            onClick={() => setMobileOpen(false)}
                            className="group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring border-l-2 border-transparent"
                            activeProps={{
                              className:
                                "bg-panel-elevated !text-foreground font-semibold !border-primary shadow-sm",
                            }}
                            activeOptions={{ exact: item.to === "/" }}
                          >
                            <span className="flex items-center gap-2.5 truncate">
                              <item.icon
                                className="h-4 w-4 text-primary/80 group-hover:text-primary transition-colors"
                                aria-hidden
                              />
                              <span className="truncate">{item.label}</span>
                            </span>

                            <span className="flex items-center gap-1.5 shrink-0">
                              {badgeVal !== null && (
                                <span
                                  className={cn(
                                    "rounded px-1.5 py-0.5 text-[10px] font-mono font-bold tabular",
                                    item.badgeVariant === "critical" &&
                                      "bg-critical/20 text-critical border border-critical/30",
                                    item.badgeVariant === "warning" &&
                                      "bg-warning/20 text-warning border border-warning/30",
                                    item.badgeVariant === "safe" &&
                                      "bg-safe/20 text-safe border border-safe/30",
                                    item.badgeVariant === "ai" &&
                                      "bg-ai/20 text-ai border border-ai/30",
                                    !item.badgeVariant && "bg-accent text-foreground",
                                  )}
                                >
                                  {badgeVal}
                                </span>
                              )}
                              <button
                                onClick={(e) => togglePin(item.to, e)}
                                className={cn(
                                  "text-muted-foreground/40 hover:text-primary transition-opacity p-0.5",
                                  isPinned
                                    ? "opacity-80 text-primary"
                                    : "opacity-0 group-hover:opacity-100",
                                )}
                                title={isPinned ? "Unpin workspace" : "Pin workspace"}
                              >
                                <Pin className="h-3 w-3" />
                              </button>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>

            {/* Quick Live Status Card in Expanded Sidebar */}
            {!collapsed ? (
              <div className="mt-4 rounded-md border border-border p-2.5 bg-panel-elevated/40 text-xs">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-[10px]">Realtime Feed</span>
                  <span className="label-mono text-[10px] text-safe flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-safe animate-pulse-slow" />
                    LIVE
                  </span>
                </div>
                <p className="mt-1 font-semibold">{incident.name}</p>
                <p className="text-[11px] text-muted-foreground">{incident.location}</p>
                <div className="mt-2 grid grid-cols-2 gap-1 text-[10px] font-mono text-muted-foreground border-t border-border/50 pt-1.5">
                  <span>WIND: {incident.windKmh} km/h</span>
                  <span>RAIN: {incident.rainfallMm} mm</span>
                </div>
              </div>
            ) : (
              <div className="mt-auto pt-2 flex justify-center border-t border-border/40">
                <span
                  className="h-2 w-2 rounded-full bg-safe animate-pulse-slow"
                  title="Realtime Engine Connected"
                />
              </div>
            )}
          </nav>

          {/* Primary Page Canvas */}
          <main className="min-w-0 flex-1 p-3 sm:p-4">{children}</main>
        </div>

        {/* AI Copilot Drawer */}
        <CopilotDrawer />
      </div>
    </TooltipProvider>
  );
}
