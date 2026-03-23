import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { PipelineStage } from "@/types";
import { PIPELINE_STAGE_CONFIG } from "@/lib/constants/pipeline";

// ---- Color maps for various status types ----

const pipelineColorMap: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  violet: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  fuchsia: "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/30 dark:text-fuchsia-300",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  emerald: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  teal: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  slate: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
};

const leadStatusColors: Record<string, string> = {
  NUEVO: "bg-blue-100 text-blue-800",
  CONTACTADO: "bg-yellow-100 text-yellow-800",
  CALIFICADO: "bg-green-100 text-green-800",
  DESCALIFICADO: "bg-red-100 text-red-800",
  CONVERTIDO: "bg-purple-100 text-purple-800",
};

const caseStatusColors: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-800",
  IN_PROGRESS: "bg-yellow-100 text-yellow-800",
  WAITING_CLIENT: "bg-orange-100 text-orange-800",
  WAITING_SUPPLIER: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-100 text-gray-800",
};

const casePriorityColors: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

const contactTypeColors: Record<string, string> = {
  LEISURE: "bg-sky-100 text-sky-700",
  CORPORATE: "bg-slate-100 text-slate-700",
};

// ---- Label maps ----

const leadStatusLabels: Record<string, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  CALIFICADO: "Calificado",
  DESCALIFICADO: "Descalificado",
  CONVERTIDO: "Convertido",
};

const caseStatusLabels: Record<string, string> = {
  OPEN: "Abierto",
  IN_PROGRESS: "En progreso",
  WAITING_CLIENT: "Esperando cliente",
  WAITING_SUPPLIER: "Esperando proveedor",
  RESOLVED: "Resuelto",
  CLOSED: "Cerrado",
};

const casePriorityLabels: Record<string, string> = {
  LOW: "Baja",
  MEDIUM: "Media",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const contactTypeLabels: Record<string, string> = {
  LEISURE: "Leisure",
  CORPORATE: "Corporativo",
};

// ---- Component ----

type StatusBadgeType =
  | "pipeline"
  | "lead"
  | "case"
  | "casePriority"
  | "contactType";

interface StatusBadgeProps {
  type: StatusBadgeType;
  value: string;
  className?: string;
}

export function StatusBadge({ type, value, className }: StatusBadgeProps) {
  let colorClass = "";
  let label = value;

  switch (type) {
    case "pipeline": {
      const config = PIPELINE_STAGE_CONFIG[value as PipelineStage];
      if (config) {
        colorClass = pipelineColorMap[config.color] ?? "";
        label = config.label;
      }
      break;
    }
    case "lead":
      colorClass = leadStatusColors[value] ?? "";
      label = leadStatusLabels[value] ?? value;
      break;
    case "case":
      colorClass = caseStatusColors[value] ?? "";
      label = caseStatusLabels[value] ?? value;
      break;
    case "casePriority":
      colorClass = casePriorityColors[value] ?? "";
      label = casePriorityLabels[value] ?? value;
      break;
    case "contactType":
      colorClass = contactTypeColors[value] ?? "";
      label = contactTypeLabels[value] ?? value;
      break;
  }

  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", colorClass, className)}
    >
      {label}
    </Badge>
  );
}
