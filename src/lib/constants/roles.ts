import type { Role } from "@/types";

export interface RoutePermission {
  path: string;
  label: string;
  allowedRoles: Role[];
}

/**
 * Route-level RBAC permissions.
 * Each route under /(crm) is mapped to the roles that can access it.
 */
export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: "/dashboard",
    label: "Dashboard",
    allowedRoles: ["VENDEDOR", "COACH", "ADMIN", "CONTABILIDAD"],
  },
  {
    path: "/contactos",
    label: "Contactos",
    allowedRoles: ["VENDEDOR", "COACH", "ADMIN"],
  },
  {
    path: "/leads",
    label: "Leads",
    allowedRoles: ["VENDEDOR", "COACH", "ADMIN"],
  },
  {
    path: "/oportunidades",
    label: "Oportunidades",
    allowedRoles: ["VENDEDOR", "COACH", "ADMIN"],
  },
  {
    path: "/calendario",
    label: "Calendario",
    allowedRoles: ["VENDEDOR", "COACH", "ADMIN"],
  },
  {
    path: "/casos",
    label: "Casos",
    allowedRoles: ["VENDEDOR", "COACH", "ADMIN"],
  },
  {
    path: "/reportes",
    label: "Reportes",
    allowedRoles: ["COACH", "ADMIN", "CONTABILIDAD"],
  },
  {
    path: "/coaching",
    label: "Coaching",
    allowedRoles: ["COACH", "ADMIN"],
  },
  {
    path: "/plantillas",
    label: "Plantillas",
    allowedRoles: ["VENDEDOR", "COACH", "ADMIN"],
  },
  {
    path: "/configuracion",
    label: "Configuración",
    allowedRoles: ["ADMIN"],
  },
];

/**
 * Check if a role has access to a given route path.
 * The path should be relative to the CRM group (e.g., "/dashboard").
 */
export function hasRouteAccess(role: Role, path: string): boolean {
  const route = ROUTE_PERMISSIONS.find((r) =>
    path.startsWith(r.path)
  );
  // If no matching route is found, deny access by default
  if (!route) return false;
  return route.allowedRoles.includes(role);
}

/**
 * Get all routes accessible by a given role.
 */
export function getAccessibleRoutes(role: Role): RoutePermission[] {
  return ROUTE_PERMISSIONS.filter((r) => r.allowedRoles.includes(role));
}

/**
 * Role labels in Spanish for display purposes.
 */
export const ROLE_LABELS: Record<Role, string> = {
  VENDEDOR: "Vendedor",
  COACH: "Coach",
  ADMIN: "Administrador",
  CONTABILIDAD: "Contabilidad",
};
