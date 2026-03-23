import { Suspense } from "react";
import { getCases } from "@/lib/queries/cases";
import { CasesPageClient } from "@/components/casos/cases-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export default async function CasosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Casos</h1>
        <p className="text-muted-foreground">
          Gestiona reclamos, solicitudes y casos de servicio
        </p>
      </div>
      <Suspense fallback={<CasesTableSkeleton />}>
        <CasesData />
      </Suspense>
    </div>
  );
}

async function CasesData() {
  const result = await getCases();
  return <CasesPageClient cases={result?.cases ?? []} />;
}

function CasesTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="rounded-lg border">
        <div className="border-b p-3">
          <div className="flex gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b p-3">
            <div className="flex gap-4">
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
