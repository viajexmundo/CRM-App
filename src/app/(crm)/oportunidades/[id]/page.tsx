import { notFound } from "next/navigation";
import { getOpportunity } from "@/lib/queries/opportunities";
import { auth } from "@/lib/auth";
import { OpportunityDetailClient } from "@/components/oportunidades/opportunity-detail-client";

interface OpportunityDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OpportunityDetailPage({
  params,
}: OpportunityDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const opportunity = await getOpportunity(id, {
    id: (session?.user as { id?: string })?.id,
    role: (session?.user as { role?: string })?.role,
  });

  if (!opportunity) {
    notFound();
  }

  const mappedOpportunity = {
    ...opportunity,
    activities: opportunity.activities?.map((a) => ({
      ...a,
      title: a.title ?? "",
    })),
    stageTransitions: opportunity.stageHistory,
  };

  return (
    <OpportunityDetailClient
      opportunity={mappedOpportunity}
      currentUserRole={(session?.user as { role?: string })?.role}
    />
  );
}
