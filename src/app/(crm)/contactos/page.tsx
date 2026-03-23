import { Suspense } from "react";
import { getContacts } from "@/lib/queries/contacts";
import { ContactsPageClient } from "@/components/contactos/contacts-page-client";
import { Skeleton } from "@/components/ui/skeleton";

export default async function ContactosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contactos</h1>
        <p className="text-muted-foreground">
          Gestiona tu base de contactos y clientes
        </p>
      </div>
      <Suspense fallback={<ContactsTableSkeleton />}>
        <ContactsData />
      </Suspense>
    </div>
  );
}

async function ContactsData() {
  const result = await getContacts();
  return <ContactsPageClient contacts={result?.contacts ?? []} />;
}

function ContactsTableSkeleton() {
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
