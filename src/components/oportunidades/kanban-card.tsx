"use client";

import { useDraggable } from "@dnd-kit/core";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, formatRelativeDate } from "@/lib/utils/format";
import {
  UserIcon,
  CalendarIcon,
  AlertCircleIcon,
  MapPinIcon,
  UserRoundCogIcon,
  MessageCircleIcon,
  ActivityIcon,
  ClipboardListIcon,
  Clock3Icon,
} from "lucide-react";
import type { KanbanOpportunity } from "./kanban-board";
import { getDiagnosisLabel } from "@/lib/constants/diagnosis";
import type { PipelineStage } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface KanbanCardProps {
  opportunity: KanbanOpportunity;
  isDragOverlay?: boolean;
  isAdmin: boolean;
  users: Array<{ id: string; name: string; email: string; phone?: string | null; role: string }>;
  onAssigneeChange: (opportunityId: string, assignedToId: string) => void;
  onAdminWhatsAppNotify: (opportunity: KanbanOpportunity) => void;
}

export function KanbanCard({
  opportunity,
  isDragOverlay = false,
  isAdmin,
  users,
  onAssigneeChange,
  onAdminWhatsAppNotify,
}: KanbanCardProps) {
  const router = useRouter();
  const [now] = useState(() => Date.now());
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: opportunity.id,
  });

  const probability = opportunity.probability ?? 0;
  const probabilityColor =
    probability >= 70
      ? "bg-green-500"
      : probability >= 30
      ? "bg-yellow-500"
      : "bg-red-500";

  // Calculate days in stage
  const stageChangedAt = opportunity.stageChangedAt
    ? new Date(opportunity.stageChangedAt)
    : null;
  const daysInStage = stageChangedAt
    ? Math.floor(
        (now - stageChangedAt.getTime()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Check if next step is overdue
  const nextStepDate = opportunity.nextStepDate
    ? new Date(opportunity.nextStepDate)
    : null;
  const isOverdue = nextStepDate ? nextStepDate.getTime() < now : false;
  const diagnosis = getDiagnosisLabel(opportunity.diagnosisScore ?? 0);
  const stage = opportunity.stage as PipelineStage;
  const pendingFollowUps = opportunity.followUps?.length ?? 0;
  const overdueFollowUps =
    opportunity.followUps?.filter((f) => new Date(f.scheduledAt).getTime() < now).length ?? 0;
  const pendingActions = opportunity.actions?.length ?? 0;
  const overdueActions =
    opportunity.actions?.filter((a) => a.scheduledAt && new Date(a.scheduledAt).getTime() < now).length ?? 0;
  const latestActivity = opportunity.activities?.[0];
  const withoutNextStep = !opportunity.nextStepAction && pendingActions === 0 && pendingFollowUps === 0;
  const showAdminWhatsAppButton = isAdmin && opportunity.stage === "LEAD_NUEVO";
  const escalationLimitByStage: Partial<Record<PipelineStage, number>> = {
    LEAD_NUEVO: 1,
    PERFILADO: 2,
    PROPUESTA_EN_PREPARACION: 3,
    COTIZACION_EN_SEGUIMIENTO: 3,
    APARTADO: 2,
    VENTA_CERRADA: 2,
  };
  const maxDays = escalationLimitByStage[stage] ?? 4;
  const isEscalated = (daysInStage ?? 0) > maxDays || overdueFollowUps + overdueActions >= 2 || (withoutNextStep && (daysInStage ?? 0) >= 2);

  const handleClick = () => {
    // Don't navigate when dragging
    if (isDragging) return;
    router.push(`/oportunidades/${opportunity.id}`);
  };

  return (
    <div
      ref={!isDragOverlay ? setNodeRef : undefined}
      {...(!isDragOverlay ? { ...attributes, ...listeners } : {})}
      onClick={handleClick}
      className={`group cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md ${
        isDragging ? "opacity-50" : ""
      } ${isDragOverlay ? "shadow-lg ring-2 ring-primary/20" : ""} ${
        isOverdue ? "border-red-300 dark:border-red-800" : ""
      }`}
    >
      {/* Title + Probability */}
      <div className="flex items-start justify-between gap-2">
        <h4 className="line-clamp-2 text-sm font-medium leading-tight">
          {opportunity.title}
        </h4>
        <span
          className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${probabilityColor}`}
          title={`${probability}% probabilidad`}
        />
      </div>

      {/* Contact */}
      {opportunity.contact && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserIcon className="h-3 w-3" />
          <span className="truncate">
            {opportunity.contact.firstName} {opportunity.contact.lastName}
          </span>
        </div>
      )}

      {!isAdmin && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <UserRoundCogIcon className="h-3 w-3" />
          <span className="truncate">Asesor: {opportunity.assignedTo?.name ?? "Sin asignar"}</span>
        </div>
      )}

      {isAdmin && !isDragOverlay && (
        <div
          className="mt-1.5"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Asignado a
          </p>
          <Select
            value={opportunity.assignedTo?.id ?? ""}
            onValueChange={(v) => onAssigneeChange(opportunity.id, v ?? opportunity.assignedTo?.id ?? "")}
          >
            <SelectTrigger className="h-7 w-full text-[11px]">
              <SelectValue placeholder="Reasignar..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showAdminWhatsAppButton && (
            <Button
              size="xs"
              variant="outline"
              className="mt-1.5 w-full"
              onClick={() => onAdminWhatsAppNotify(opportunity)}
            >
              <MessageCircleIcon className="mr-1 h-3 w-3" />
              Avisar por WhatsApp
            </Button>
          )}
        </div>
      )}

      {opportunity.diagnosisScore != null && (
        <div className="mt-1.5 text-[11px]">
          <span className="text-muted-foreground">Diagnóstico: </span>
          <span className={`font-semibold ${diagnosis.color}`}>
            {opportunity.diagnosisScore} pts ({diagnosis.label})
          </span>
        </div>
      )}

      {isAdmin && (
        <div className="mt-2 space-y-1 rounded-md border border-border/70 bg-muted/35 p-2">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ClipboardListIcon className="h-3 w-3" />
              Seguimientos
            </span>
            <span className={overdueFollowUps > 0 ? "font-semibold text-red-600 dark:text-red-400" : ""}>
              {pendingFollowUps} pend. / {overdueFollowUps} venc.
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock3Icon className="h-3 w-3" />
              Acciones
            </span>
            <span className={overdueActions > 0 ? "font-semibold text-red-600 dark:text-red-400" : ""}>
              {pendingActions} pend. / {overdueActions} venc.
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ActivityIcon className="h-3 w-3" />
              Última actividad
            </span>
            <span className="font-medium text-foreground">
              {latestActivity ? formatRelativeDate(latestActivity.createdAt) : "Sin actividad"}
            </span>
          </div>
          {withoutNextStep && (
            <p className="rounded bg-amber-100 px-2 py-1 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
              Sin siguiente paso definido
            </p>
          )}
          {isEscalated && (
            <p className="rounded bg-red-100 px-2 py-1 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-300">
              Escalar a coach/admin
            </p>
          )}
        </div>
      )}

      {/* Value */}
      {opportunity.estimatedValue != null && opportunity.estimatedValue > 0 && (
        <p className="mt-1.5 text-sm font-semibold text-foreground">
          {formatCurrency(opportunity.estimatedValue)}
        </p>
      )}

      {isAdmin && opportunity.nextStepAction && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          En gestión: <span className="font-medium text-foreground">{opportunity.nextStepAction}</span>
        </p>
      )}

      {/* Bottom row: days in stage + next step */}
      <div className="mt-2 flex items-center justify-between gap-2">
        {daysInStage != null && (
          <span className="text-[11px] text-muted-foreground">
            {daysInStage}d en etapa
          </span>
        )}

        {nextStepDate && (
          <div
            className={`flex items-center gap-1 text-[11px] ${
              isOverdue
                ? "font-medium text-red-600 dark:text-red-400"
                : "text-muted-foreground"
            }`}
          >
            {isOverdue ? (
              <AlertCircleIcon className="h-3 w-3" />
            ) : (
              <CalendarIcon className="h-3 w-3" />
            )}
            <span>
              {nextStepDate.toLocaleDateString("es-GT", {
                day: "2-digit",
                month: "short",
              })}
            </span>
          </div>
        )}
      </div>

      {/* Destination */}
      {opportunity.destination && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
          <MapPinIcon className="h-3 w-3" />
          <span className="truncate">{opportunity.destination}</span>
        </div>
      )}
    </div>
  );
}
