import { Suspense } from "react";
import { getOpportunitiesByStage } from "@/lib/queries/opportunities";
import { getActiveUsers } from "@/lib/queries/users";
import { getAssignmentTemplates } from "@/lib/queries/templates";
import { auth } from "@/lib/auth";
import { KanbanBoard } from "@/components/oportunidades/kanban-board";
import { Skeleton } from "@/components/ui/skeleton";
import { PIPELINE_STAGE_ORDER } from "@/lib/constants/pipeline";

export default async function OportunidadesPage() {
  return (
    <div className="flex h-full flex-col space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Oportunidades</h1>
        <p className="text-muted-foreground">
          Pipeline de ventas - arrastra las oportunidades entre etapas
        </p>
      </div>
      <Suspense fallback={<KanbanSkeleton />}>
        <KanbanData />
      </Suspense>
    </div>
  );
}

async function KanbanData() {
  const session = await auth();
  const currentUserId = (session?.user as { id?: string })?.id;
  const currentUserRole = (session?.user as { role?: string })?.role ?? "VENDEDOR";
  const [data, users, assignmentTemplates] = await Promise.all([
    getOpportunitiesByStage({
      id: currentUserId,
      role: currentUserRole,
    }),
    getActiveUsers(),
    getAssignmentTemplates(),
  ]);

  // Build a map of stage -> opportunities array
  const grouped: Record<string, Array<{
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
  }>> = {};

  for (const stage of PIPELINE_STAGE_ORDER) {
    grouped[stage] = [];
  }

  if (data) {
    for (const stageKey of PIPELINE_STAGE_ORDER) {
      const stageData = data[stageKey];
      if (stageData?.opportunities) {
        for (const opp of stageData.opportunities) {
          if (grouped[opp.stage as string]) {
            grouped[opp.stage as string].push(opp);
          }
        }
      }
    }
  }

  return (
    <KanbanBoard
      initialData={grouped}
      users={users}
      assignmentTemplates={assignmentTemplates}
      currentUserRole={currentUserRole}
    />
  );
}

function KanbanSkeleton() {
  const visibleStages = PIPELINE_STAGE_ORDER.filter(
    (s) => s !== "CERRADO_PERDIDO"
  );

  return (
    <div className="flex flex-1 gap-3 overflow-x-auto pb-4">
      {visibleStages.map((stage) => (
        <div
          key={stage}
          className="flex w-72 shrink-0 flex-col rounded-lg border bg-muted/30 p-2"
        >
          <div className="mb-3 px-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-16" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
