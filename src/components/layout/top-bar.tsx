"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { usePageTitle } from "@/components/context/page-title-context";
import { GlobalSearch } from "@/components/common/global-search";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ROLE_LABELS } from "@/lib/constants/roles";
import type { Role } from "@/types";

interface TopBarProps {
  user: {
    name: string;
    email: string;
    role: Role;
  };
}

const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  contactos: "Contactos",
  leads: "Leads",
  oportunidades: "Oportunidades",
  casos: "Casos",
  reportes: "Reportes",
  coaching: "Coaching",
  configuracion: "Configuración",
  plantillas: "Plantillas",
};

// Detect CUID-like strings (20+ lowercase alphanumeric)
function isCuid(segment: string): boolean {
  return /^[a-z0-9]{20,}$/.test(segment);
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname();
  const { titles } = usePageTitle();

  // Build breadcrumb from pathname: /leads/123 -> ["leads", "123"]
  const segments = pathname
    .split("/")
    .filter(Boolean);

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="crm-glass flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm">
        <span className="font-medium text-muted-foreground">CRM</span>
        {segments.map((segment, index) => {
          const label = BREADCRUMB_LABELS[segment] || (isCuid(segment) ? (titles[segment] || "...") : segment);
          const isLast = index === segments.length - 1;

          return (
            <span key={segment + index} className="flex items-center gap-1.5">
              <span className="text-muted-foreground">/</span>
              <span
                className={
                  isLast ? "font-semibold text-foreground" : "text-muted-foreground"
                }
              >
                {label}
              </span>
            </span>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="hidden sm:block w-64">
          <GlobalSearch />
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-accent focus:outline-none">
                <Avatar size="sm">
                  <AvatarFallback className="text-[10px] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline-block">
                  {user.name}
                </span>
              </button>
            }
          />
          <DropdownMenuContent align="end" side="bottom" sideOffset={8}>
            <DropdownMenuGroup>
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.email}
                  </span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {ROLE_LABELS[user.role]}
                  </span>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              variant="destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
