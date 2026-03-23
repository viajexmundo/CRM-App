"use client";

import { useDroppable } from "@dnd-kit/core";
import { KanbanCard } from "./kanban-card";
import { PIPELINE_STAGE_CONFIG } from "@/lib/constants/pipeline";
import type { PipelineStage } from "@/types";
import { formatCurrency } from "@/lib/utils/format";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { KanbanOpportunity } from "./kanban-board";

interface KanbanColumnProps {
  stage: PipelineStage;
  opportunities: KanbanOpportunity[];
  isAdmin: boolean;
  users: Array<{ id: string; name: string; email: string; phone?: string | null; role: string }>;
  onAssigneeChange: (opportunityId: string, assignedToId: string) => void;
  onAdminWhatsAppNotify: (opportunity: KanbanOpportunity) => void;
}

const columnHeaderColors: Record<string, string> = {
  blue: "border-blue-400 bg-blue-50 dark:bg-blue-950/30",
  indigo: "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30",
  violet: "border-violet-400 bg-violet-50 dark:bg-violet-950/30",
  purple: "border-purple-400 bg-purple-50 dark:bg-purple-950/30",
  fuchsia: "border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/30",
  pink: "border-pink-400 bg-pink-50 dark:bg-pink-950/30",
  amber: "border-amber-400 bg-amber-50 dark:bg-amber-950/30",
  orange: "border-orange-400 bg-orange-50 dark:bg-orange-950/30",
  emerald: "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
  teal: "border-teal-400 bg-teal-50 dark:bg-teal-950/30",
  cyan: "border-cyan-400 bg-cyan-50 dark:bg-cyan-950/30",
  green: "border-green-400 bg-green-50 dark:bg-green-950/30",
  red: "border-red-400 bg-red-50 dark:bg-red-950/30",
};

const dotColors: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink: "bg-pink-500",
  amber: "bg-amber-500",
  orange: "bg-orange-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  green: "bg-green-500",
  red: "bg-red-500",
};

export function KanbanColumn({
  stage,
  opportunities,
  isAdmin,
  users,
  onAssigneeChange,
  onAdminWhatsAppNotify,
}: KanbanColumnProps) {
  const config = PIPELINE_STAGE_CONFIG[stage];
  const { setNodeRef, isOver } = useDroppable({
    id: stage,
  });

  const totalValue = opportunities.reduce(
    (sum, o) => sum + (o.estimatedValue ?? 0),
    0
  );

  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border transition-colors ${
        isOver
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20"
          : "bg-muted/30"
      }`}
    >
      {/* Column Header */}
      <div
        className={`rounded-t-lg border-b-2 px-3 py-2.5 ${
          columnHeaderColors[config.color] ?? "border-gray-400 bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                dotColors[config.color] ?? "bg-gray-500"
              }`}
            />
            <span className="text-sm font-semibold">{config.label}</span>
          </div>
          <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-background px-1.5 text-xs font-medium ring-1 ring-foreground/10">
            {opportunities.length}
          </span>
        </div>
        {totalValue > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {formatCurrency(totalValue)}
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-2">
          {opportunities.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Arrastra aqu&iacute;
              </p>
            </div>
          ) : (
            opportunities.map((opp) => (
              <KanbanCard
                key={opp.id}
                opportunity={opp}
                isAdmin={isAdmin}
                users={users}
                onAssigneeChange={onAssigneeChange}
                onAdminWhatsAppNotify={onAdminWhatsAppNotify}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
