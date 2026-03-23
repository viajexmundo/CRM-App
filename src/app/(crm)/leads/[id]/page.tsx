import { notFound } from "next/navigation";
import { getLead } from "@/lib/queries/leads";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { LeadDetailClient } from "@/components/leads/lead-detail-client";

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const session = await auth();
  const lead = await getLead(id, {
    id: (session?.user as { id?: string })?.id,
    role: (session?.user as { role?: string })?.role,
  });

  if (!lead) {
    notFound();
  }

  const mappedLead = {
    ...lead,
    activities: lead.activities?.map((a) => ({
      ...a,
      title: a.title ?? "",
    })),
  };

  return <LeadDetailClient lead={mappedLead} />;
}
