import { notFound } from "next/navigation";
import { getCase } from "@/lib/queries/cases";
import { CaseDetailClient } from "@/components/casos/case-detail-client";

interface CaseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CaseDetailPage({
  params,
}: CaseDetailPageProps) {
  const { id } = await params;
  const caseData = await getCase(id);

  if (!caseData) {
    notFound();
  }

  const mappedCaseData = {
    ...caseData,
    activities: caseData.activities?.map((a) => ({
      ...a,
      title: a.title ?? "",
    })),
  };

  return <CaseDetailClient caseData={mappedCaseData} />;
}
