import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Box,
  Building2,
  FileText,
  Network,
  Plane,
  Radar,
  Radio,
  Route as RouteIcon,
  Search,
  Settings,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { buildings, hospitals, zones } from "@/data/incident";
import { useOps } from "@/lib/ops-store";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { select, setRole, toggleCopilot } = useOps();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border bg-panel px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        aria-label="Open Command Palette (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">Tactical search & commands...</span>
        <span className="inline sm:hidden">Search...</span>
        <kbd className="label-mono ml-auto rounded border border-border/80 bg-panel-elevated px-1 py-0.5 text-[10px]">
          Ctrl K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type an asset ID, operation, or route..." />
        <CommandList className="max-h-96">
          <CommandEmpty>No matching command or asset found.</CommandEmpty>

          <CommandGroup heading="Operations Workspaces">
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/" }))}>
              <Radar className="mr-2 h-4 w-4 text-primary" />
              <span>Command Center 2.0</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/map" }))}>
              <Activity className="mr-2 h-4 w-4 text-primary" />
              <span>Live Damage Map</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/twin" }))}>
              <Box className="mr-2 h-4 w-4 text-primary" />
              <span>3D Digital Twin</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/infrastructure" }))}>
              <Shield className="mr-2 h-4 w-4 text-primary" />
              <span>Critical Infrastructure Command</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/evidence" }))}>
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <span>Evidence Provenance & Conflict Resolution</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/explainability" }))}>
              <Network className="mr-2 h-4 w-4 text-primary" />
              <span>Explainable AI Reasoning Center</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/drones" }))}>
              <Plane className="mr-2 h-4 w-4 text-primary" />
              <span>Drone Sortie Operations & Active Sensing</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/agents" }))}>
              <Bot className="mr-2 h-4 w-4 text-primary" />
              <span>AI Agent Fleet Operations</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/response" }))}>
              <Users className="mr-2 h-4 w-4 text-primary" />
              <span>Tactical Response & Resource Allocation</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/routing" }))}>
              <RouteIcon className="mr-2 h-4 w-4 text-primary" />
              <span>Emergency Routing & Evacuation Corridors</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/scenarios" }))}>
              <TrendingUp className="mr-2 h-4 w-4 text-primary" />
              <span>Scenario Comparison & Replay Engine</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/graph" }))}>
              <Network className="mr-2 h-4 w-4 text-primary" />
              <span>Disaster Knowledge Graph Explorer</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/analytics" }))}>
              <BarChart3 className="mr-2 h-4 w-4 text-primary" />
              <span>Impact Analytics 2.0</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/reports" }))}>
              <FileText className="mr-2 h-4 w-4 text-primary" />
              <span>Auditable Situation Reports</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/alerts" }))}>
              <Radio className="mr-2 h-4 w-4 text-primary" />
              <span>Notifications & Shift Collaboration</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => navigate({ to: "/settings" }))}>
              <Settings className="mr-2 h-4 w-4 text-primary" />
              <span>Operations & RBAC Settings</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Critical Hospitals">
            {hospitals.slice(0, 5).map((h) => (
              <CommandItem
                key={h.id}
                onSelect={() =>
                  runCommand(() => {
                    select(h.buildingId);
                    navigate({ to: "/map" });
                  })
                }
              >
                <AlertTriangle className="mr-2 h-4 w-4 text-critical" />
                <span>{h.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {h.roadAccess} access · {h.risk}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Key Structures">
            {buildings.slice(0, 6).map((b) => (
              <CommandItem
                key={b.id}
                onSelect={() =>
                  runCommand(() => {
                    select(b.id);
                    navigate({ to: "/map" });
                  })
                }
              >
                <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{b.id}</span>
                <span className="ml-2 capitalize text-muted-foreground">{b.type}</span>
                <span className="ml-auto text-xs uppercase text-critical">{b.damage}</span>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Tactical Actions">
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  toggleCopilot();
                })
              }
            >
              <Bot className="mr-2 h-4 w-4 text-ai" />
              <span>Toggle AI Disaster Copilot</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  setRole("commander");
                })
              }
            >
              <Shield className="mr-2 h-4 w-4 text-safe" />
              <span>Switch Role: Incident Commander</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  setRole("responder");
                })
              }
            >
              <Users className="mr-2 h-4 w-4 text-warning" />
              <span>Switch Role: Field Responder</span>
            </CommandItem>
            <CommandItem
              onSelect={() =>
                runCommand(() => {
                  setRole("analyst");
                })
              }
            >
              <Activity className="mr-2 h-4 w-4 text-ai" />
              <span>Switch Role: Geospatial Analyst</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
