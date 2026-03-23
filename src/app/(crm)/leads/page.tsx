import { Suspense } from "react";
import { getLeads } from "@/lib/queries/leads";
import { getActiveUsers } from "@/lib/queries/users";
import { auth } from "@/lib/auth";
import { LeadsPageClient } from "@/components/leads/leads-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export default async function LeadsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <p className="text-muted-foreground">
          Gestiona y califica tus prospectos
        </p>
      </div>
      <Suspense fallback={<LeadsTableSkeleton />}>
        <LeadsData />
      </Suspense>
    </div>
  );
}

async function LeadsData() {
  const session = await auth();
  const currentUserId = (session?.user as { id?: string })?.id;
  const currentUserRole = (session?.user as { role?: string })?.role ?? "VENDEDOR";
  const [result, users] = await Promise.all([
    getLeads({
      viewerId: currentUserId,
      viewerRole: currentUserRole,
    }),
    getActiveUsers(),
  ]);

  return (
    <LeadsPageClient
      leads={result?.leads ?? []}
      users={users}
      currentUserRole={currentUserRole}
    />
  );
}

function LeadsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-8 w-36" />
      </div>
      <div className="rounded-lg border">
        <div className="border-b p-3">
          <div className="flex gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 flex-1" />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="border-b p-3">
            <div className="flex gap-4">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 flex-1" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
