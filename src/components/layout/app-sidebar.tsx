"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Plane,
  LayoutDashboard,
  Users,
  UserPlus,
  Kanban,
  CalendarDays,
  Headphones,
  BarChart3,
  GraduationCap,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAccessibleRoutes, ROLE_LABELS } from "@/lib/constants/roles";
import type { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AppSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": LayoutDashboard,
  "/contactos": Users,
  "/leads": UserPlus,
  "/oportunidades": Kanban,
  "/calendario": CalendarDays,
  "/casos": Headphones,
  "/reportes": BarChart3,
  "/coaching": GraduationCap,
  "/plantillas": FileText,
  "/configuracion": Settings,
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const accessibleRoutes = getAccessibleRoutes(user.role);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className={cn(
        "crm-glass flex h-full flex-col border-r border-sidebar-border/80 bg-sidebar/90 text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-3 border-b border-sidebar-border/80 px-4",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-black/20">
          <Plane className="h-4 w-4" />
        </div>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight">
            CRM Viajes
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-1">
          {accessibleRoutes.map((route) => {
            const Icon = ICON_MAP[route.path];
            const fullPath = route.path;
            const isActive =
              pathname === fullPath || pathname.startsWith(`${fullPath}/`);

            const linkContent = (
              <Link
                href={fullPath}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground ring-1 ring-sidebar-primary/50"
                    : "text-sidebar-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                {Icon && (
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0",
                      isActive
                        ? "text-sidebar-primary"
                        : "text-sidebar-muted-foreground"
                    )}
                  />
                )}
                {!collapsed && <span>{route.label}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <li key={route.path}>
                  <Tooltip>
                    <TooltipTrigger render={linkContent} />
                    <TooltipContent side="right">
                      {route.label}
                    </TooltipContent>
                  </Tooltip>
                </li>
              );
            }

            return <li key={route.path}>{linkContent}</li>;
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 pb-2">
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full rounded-xl text-sidebar-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span className="ml-2 text-xs">Colapsar</span>
            </>
          )}
        </Button>
      </div>

      <Separator className="bg-sidebar-border/80" />

      {/* User section */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-3 p-4",
          collapsed && "flex-col gap-2 px-2 py-3"
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent/90 text-xs font-semibold text-sidebar-accent-foreground ring-1 ring-sidebar-border">
          {initials}
        </div>
        {!collapsed && (
          <div className="flex flex-1 flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{user.name}</span>
            <span className="truncate text-xs text-sidebar-muted-foreground">
              {ROLE_LABELS[user.role]}
            </span>
          </div>
        )}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="shrink-0 text-sidebar-muted-foreground hover:bg-sidebar-accent/50 hover:text-destructive"
              />
            }
          >
            <LogOut className="h-4 w-4" />
          </TooltipTrigger>
          <TooltipContent side="right">Cerrar sesion</TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}
