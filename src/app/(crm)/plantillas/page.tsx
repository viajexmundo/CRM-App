import { Suspense } from "react";
import { getTemplates } from "@/lib/queries/templates";
import { PlantillasPageClient } from "@/components/plantillas/plantillas-page-client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PlantillasPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plantillas</h1>
        <p className="text-muted-foreground">
          Crea y administra tus plantillas de mensajes de WhatsApp
        </p>
      </div>

      <Suspense fallback={<PlantillasSkeleton />}>
        <PlantillasData />
      </Suspense>
    </div>
  );
}

async function PlantillasData() {
  const templates = await getTemplates();

  return <PlantillasPageClient templates={templates} />;
}

function PlantillasSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
