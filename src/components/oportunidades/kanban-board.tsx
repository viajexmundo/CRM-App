"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { KanbanCard } from "./kanban-card";
import { PIPELINE_STAGE_ORDER, PIPELINE_STAGE_CONFIG, ALLOWED_TRANSITIONS } from "@/lib/constants/pipeline";
import type { PipelineStage } from "@/types";
import { transitionStage, updateOpportunity } from "@/lib/actions/opportunities";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildWhatsAppUrl } from "@/lib/constants/whatsapp-templates";
import { STAGE_GUIDANCE } from "@/lib/constants/stage-guidance";
import { Card, CardContent } from "@/components/ui/card";

export interface KanbanOpportunity {
  id: string;
  title: string;
  stage: string;
  leadId: string | null;
  createdAt: Date | string;
  estimatedValue: number | null;
  probability: number | null;
  nextStepDate: Date | string | null;
  nextStepAction: string | null;
  stageChangedAt: Date | string | null;
  diagnosisScore: number | null;
  destination: string | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
    phone?: string | null;
    role?: string;
  } | null;
  activities?: Array<{
    id: string;
    type: string;
    title: string | null;
    createdAt: Date | string;
  }>;
  followUps?: Array<{
    id: string;
    label: string;
    scheduledAt: Date | string;
  }>;
  actions?: Array<{
    id: string;
    type: string;
    action: string;
    scheduledAt: Date | string | null;
  }>;
}

interface KanbanBoardProps {
  initialData: Record<string, KanbanOpportunity[]>;
  users: Array<{ id: string; name: string; email: string; phone?: string | null; role: string }>;
  assignmentTemplates: Array<{
    id: string;
    name: string;
    body: string;
    stage: string | null;
    targetRole: string | null;
  }>;
  currentUserRole: string;
}

const SCROLL_KEY = "kanban-scroll-x";
const STAGE_ESCALATION_DAYS: Partial<Record<PipelineStage, number>> = {
  LEAD_NUEVO: 1,
  PERFILADO: 2,
  PROPUESTA_EN_PREPARACION: 3,
  COTIZACION_EN_SEGUIMIENTO: 3,
  APARTADO: 2,
  VENTA_CERRADA: 2,
  VIAJE_EN_CURSO: 7,
  POST_VIAJE: 5,
  DORMIDO: 10,
};

function getDiagnosisTier(score: number | null): string {
  if (score == null) return "none";
  if (score >= 80) return "excellent";
  if (score >= 60) return "good";
  if (score >= 40) return "moderate";
  if (score >= 20) return "low";
  return "very-low";
}

export function KanbanBoard({
  initialData,
  users,
  assignmentTemplates,
  currentUserRole,
}: KanbanBoardProps) {
  const [data, setData] = useState(initialData);
  const [activeCard, setActiveCard] = useState<KanbanOpportunity | null>(null);
  const [assignedFilter, setAssignedFilter] = useState("all");
  const [diagnosisFilter, setDiagnosisFilter] = useState("all");
  const [escalationFilter, setEscalationFilter] = useState("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const isAdmin = currentUserRole === "ADMIN";

  // Restore scroll position on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(SCROLL_KEY);
    if (saved && scrollRef.current) {
      scrollRef.current.scrollLeft = parseInt(saved, 10);
    }
  }, []);

  // Save scroll position on scroll
  const handleScroll = useCallback(() => {
    if (scrollRef.current) {
      sessionStorage.setItem(SCROLL_KEY, String(scrollRef.current.scrollLeft));
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Stages: show all except CERRADO_PERDIDO in the main board
  const mainStages = PIPELINE_STAGE_ORDER.filter(
    (s) => s !== "CERRADO_PERDIDO"
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    // Find the card from all stages
    for (const stage of PIPELINE_STAGE_ORDER) {
      const card = data[stage]?.find((o) => o.id === active.id);
      if (card) {
        setActiveCard(card);
        break;
      }
    }
  }, [data]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      if (!over) return;

      const resolveStageByDropTarget = (dropTargetId: string): string | null => {
        if (PIPELINE_STAGE_ORDER.includes(dropTargetId as PipelineStage)) {
          return dropTargetId;
        }
        for (const stage of PIPELINE_STAGE_ORDER) {
          const found = data[stage]?.some((o) => o.id === dropTargetId);
          if (found) return stage;
        }
        return null;
      };

      // Determine which stage was the target (column or card inside a column)
      const targetStage = resolveStageByDropTarget(String(over.id));
      if (!targetStage) {
        toast.error("No se pudo determinar la etapa destino");
        return;
      }

      // Find the source stage and card
      let sourceStage: string | null = null;
      let card: KanbanOpportunity | null = null;

      for (const stage of PIPELINE_STAGE_ORDER) {
        const found = data[stage]?.find((o) => o.id === active.id);
        if (found) {
          sourceStage = stage;
          card = found;
          break;
        }
      }

      if (!sourceStage || !card || sourceStage === targetStage) return;

      // Validate transition is allowed
      const allowed = ALLOWED_TRANSITIONS[sourceStage as PipelineStage];
      if (!allowed?.includes(targetStage as PipelineStage)) {
        toast.error(
          `No se puede mover de "${PIPELINE_STAGE_CONFIG[sourceStage as PipelineStage].label}" a "${PIPELINE_STAGE_CONFIG[targetStage as PipelineStage].label}"`
        );
        return;
      }

      // Optimistic update
      const previousData = { ...data };
      setData((prev) => {
        const newData = { ...prev };
        newData[sourceStage!] = prev[sourceStage!].filter(
          (o) => o.id !== card!.id
        );
        const updatedCard = { ...card!, stage: targetStage };
        newData[targetStage] = [...(prev[targetStage] ?? []), updatedCard];
        return newData;
      });

      try {
        const result = await transitionStage(card.id, targetStage as PipelineStage);
        if (result.success) {
          toast.success(
            `Oportunidad movida a "${PIPELINE_STAGE_CONFIG[targetStage as PipelineStage].label}"`
          );
        } else {
          // Revert optimistic update on validation/server error
          setData(previousData);
          toast.error(result.error ?? "Error al cambiar la etapa");
        }
      } catch (error: unknown) {
        // Revert optimistic update
        setData(previousData);
        const message =
          error instanceof Error
            ? error.message
            : "Error al cambiar la etapa";
        toast.error(message);
      }
    },
    [data]
  );

  const handleAssigneeChange = async (opportunityId: string, assignedToId: string) => {
    const selectedUser = users.find((u) => u.id === assignedToId);
    const previousData = data;
    setData((prev) => {
      const next: Record<string, KanbanOpportunity[]> = { ...prev };
      for (const stage of PIPELINE_STAGE_ORDER) {
        next[stage] = (prev[stage] ?? []).map((opp) =>
          opp.id === opportunityId
            ? {
                ...opp,
                assignedTo: selectedUser
                  ? {
                      id: assignedToId,
                      name: selectedUser.name,
                      phone: selectedUser.phone ?? null,
                      role: selectedUser.role,
                    }
                  : opp.assignedTo,
              }
            : opp
        );
      }
      return next;
    });

    try {
      const result = await updateOpportunity(opportunityId, { assignedToId });
      if (!result.success) {
        setData(previousData);
        toast.error(result.error ?? "Error al reasignar oportunidad");
        return;
      }
      toast.success("Oportunidad reasignada");
      const updatedOpp = Object.values(previousData)
        .flat()
        .find((opp) => opp.id === opportunityId);
      if (updatedOpp && updatedOpp.stage === "LEAD_NUEVO" && selectedUser?.phone) {
        handleAdminWhatsAppNotify({
          ...updatedOpp,
          assignedTo: {
            id: selectedUser.id,
            name: selectedUser.name,
            phone: selectedUser.phone ?? null,
            role: selectedUser.role,
          },
        });
      }
    } catch {
      setData(previousData);
      toast.error("Error al reasignar oportunidad");
    }
  };

  const filteredData: Record<string, KanbanOpportunity[]> =
    assignedFilter === "all" && diagnosisFilter === "all" && escalationFilter === "all"
      ? data
      : Object.fromEntries(
          PIPELINE_STAGE_ORDER.map((stage) => [
            stage,
            (data[stage] ?? []).filter((opp) => {
              const matchesAssignee =
                assignedFilter === "all" || opp.assignedTo?.id === assignedFilter;
              const matchesDiagnosis =
                diagnosisFilter === "all" || getDiagnosisTier(opp.diagnosisScore) === diagnosisFilter;
              const matchesEscalation =
                escalationFilter === "all" ||
                (escalationFilter === "escalated" && isEscalated(opp)) ||
                (escalationFilter === "ok" && !isEscalated(opp));
              return matchesAssignee && matchesDiagnosis && matchesEscalation;
            }),
          ])
        );

  const lostOpportunities = filteredData["CERRADO_PERDIDO"] ?? [];

  const allVisibleOpportunities = Object.values(filteredData).flat();
  const adminKpisByAgent = users
    .map((agent) => {
      const mine = allVisibleOpportunities.filter((opp) => opp.assignedTo?.id === agent.id);
      if (mine.length === 0) return null;
      const escalated = mine.filter((opp) => isEscalated(opp)).length;
      const overdue = mine.filter((opp) => {
        const overdueFollowUps = opp.followUps?.some((f) => new Date(f.scheduledAt).getTime() < Date.now()) ?? false;
        const overdueActions = opp.actions?.some((a) => a.scheduledAt && new Date(a.scheduledAt).getTime() < Date.now()) ?? false;
        return overdueFollowUps || overdueActions;
      }).length;
      const won = mine.filter((opp) => opp.stage === "CLIENTE_GANADO").length;
      return {
        agentId: agent.id,
        agentName: agent.name,
        total: mine.length,
        escalated,
        overdue,
        winRate: Math.round((won / Math.max(mine.length, 1)) * 100),
      };
    })
    .filter(Boolean) as Array<{
    agentId: string;
    agentName: string;
    total: number;
    escalated: number;
    overdue: number;
    winRate: number;
  }>;

  const fillVars = (template: string, vars: Record<string, string>) => {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
    }
    return result;
  };

  const resolveAssignmentTemplate = (opp: KanbanOpportunity) => {
    const role = opp.assignedTo?.role ?? null;
    return (
      assignmentTemplates.find((t) => t.stage === opp.stage && t.targetRole === role) ??
      assignmentTemplates.find((t) => t.stage === opp.stage && !t.targetRole) ??
      assignmentTemplates.find((t) => !t.stage && t.targetRole === role) ??
      assignmentTemplates.find((t) => !t.stage && !t.targetRole) ??
      null
    );
  };

  const handleAdminWhatsAppNotify = (opp: KanbanOpportunity) => {
    if (!opp.assignedTo?.phone) {
      toast.error("Este agente no tiene teléfono en su perfil");
      return;
    }
    const assignedName = opp.assignedTo.name;
    const contactName = opp.contact
      ? `${opp.contact.firstName} ${opp.contact.lastName}`
      : "Cliente sin nombre";
    const stageLabel = PIPELINE_STAGE_CONFIG[opp.stage as PipelineStage]?.label ?? opp.stage;
    const template = resolveAssignmentTemplate(opp);
    const message = template
      ? fillVars(template.body, {
          agente: assignedName,
          cliente: contactName,
          oportunidad: opp.title,
          etapa: stageLabel,
          diagnostico: `${opp.diagnosisScore ?? "N/D"} pts`,
          asesor: assignedName,
          nombre: assignedName,
          destino: opp.destination ?? "N/D",
        })
      : [
          `Hola ${assignedName}, se te asignó una oportunidad.`,
          `Oportunidad: ${opp.title}`,
          `Cliente: ${contactName}`,
          `Etapa actual: ${stageLabel}`,
          `Diagnóstico: ${opp.diagnosisScore ?? "N/D"} pts`,
          `Playbook recomendado: ${STAGE_GUIDANCE[opp.stage as PipelineStage]?.tips?.[0] ?? "Contactar hoy mismo"}`,
        ].join("\n");
    window.open(buildWhatsAppUrl(opp.assignedTo.phone, message), "_blank");
  };

  return (
    <div className="flex flex-1 flex-col gap-4">
      {isAdmin && adminKpisByAgent.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {adminKpisByAgent.map((kpi) => (
            <Card key={kpi.agentId}>
              <CardContent className="px-4 pt-0">
                <p className="text-sm font-semibold">{kpi.agentName}</p>
                <div className="mt-1 grid grid-cols-2 gap-2 text-xs">
                  <span className="text-muted-foreground">Total: <strong className="text-foreground">{kpi.total}</strong></span>
                  <span className="text-muted-foreground">Win: <strong className="text-foreground">{kpi.winRate}%</strong></span>
                  <span className={kpi.overdue > 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}>
                    Vencidos: <strong>{kpi.overdue}</strong>
                  </span>
                  <span className={kpi.escalated > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}>
                    Escaladas: <strong>{kpi.escalated}</strong>
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {isAdmin && (
          <>
            <span className="text-sm text-muted-foreground">Filtrar por agente:</span>
            <Select value={assignedFilter} onValueChange={(v) => setAssignedFilter(v ?? "all")}>
              <SelectTrigger className="w-[260px]">
                <SelectValue placeholder="Todos los agentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los agentes</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        )}
        <span className="text-sm text-muted-foreground">Diagnóstico:</span>
        <Select value={diagnosisFilter} onValueChange={(v) => setDiagnosisFilter(v ?? "all")}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="excellent">Excelente (80+)</SelectItem>
            <SelectItem value="good">Bueno (60-79)</SelectItem>
            <SelectItem value="moderate">Moderado (40-59)</SelectItem>
            <SelectItem value="low">Bajo (20-39)</SelectItem>
            <SelectItem value="very-low">Muy bajo (0-19)</SelectItem>
            <SelectItem value="none">Sin diagnóstico</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">Escalamiento:</span>
        <Select value={escalationFilter} onValueChange={(v) => setEscalationFilter(v ?? "all")}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="escalated">Escaladas</SelectItem>
            <SelectItem value="ok">Sin escalamiento</SelectItem>
          </SelectContent>
        </Select>

      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div ref={scrollRef} onScroll={handleScroll} className="flex flex-1 gap-3 overflow-x-auto pb-4">
          {mainStages.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage as PipelineStage}
              opportunities={filteredData[stage] ?? []}
              isAdmin={isAdmin}
              users={users}
              onAssigneeChange={handleAssigneeChange}
              onAdminWhatsAppNotify={handleAdminWhatsAppNotify}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="rotate-2 opacity-90">
              <KanbanCard
                opportunity={activeCard}
                isDragOverlay
                isAdmin={isAdmin}
                users={users}
                onAssigneeChange={handleAssigneeChange}
                onAdminWhatsAppNotify={handleAdminWhatsAppNotify}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Lost area */}
      {lostOpportunities.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900/30 dark:bg-red-950/20">
          <h3 className="mb-2 text-sm font-semibold text-red-700 dark:text-red-400">
            Oportunidades perdidas ({lostOpportunities.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {lostOpportunities.map((opp) => (
              <div
                key={opp.id}
                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs dark:border-red-900 dark:bg-red-950/40"
              >
                <span className="font-medium">{opp.title}</span>
                {opp.contact && (
                  <span className="text-muted-foreground">
                    {" "}
                    &middot; {opp.contact.firstName} {opp.contact.lastName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
  const isEscalated = (opp: KanbanOpportunity): boolean => {
    const stage = opp.stage as PipelineStage;
    const maxDays = STAGE_ESCALATION_DAYS[stage] ?? 4;
    const stageChangedAt = opp.stageChangedAt ? new Date(opp.stageChangedAt).getTime() : Date.now();
    const daysInStage = Math.floor((Date.now() - stageChangedAt) / (1000 * 60 * 60 * 24));
    const overdueFollowUps = opp.followUps?.filter((f) => new Date(f.scheduledAt).getTime() < Date.now()).length ?? 0;
    const overdueActions = opp.actions?.filter((a) => a.scheduledAt && new Date(a.scheduledAt).getTime() < Date.now()).length ?? 0;
    const withoutNextStep = !opp.nextStepAction && (opp.followUps?.length ?? 0) === 0 && (opp.actions?.length ?? 0) === 0;
    return daysInStage > maxDays || overdueFollowUps + overdueActions >= 2 || (withoutNextStep && daysInStage >= 2);
  };
