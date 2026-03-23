import { Suspense } from "react";
import {
  getDashboardStats,
  getPipelineSummary,
} from "@/lib/queries/dashboard";
import { getPipelineValue } from "@/lib/queries/opportunities";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils/format";
import { PIPELINE_STAGE_CONFIG, PIPELINE_STAGE_ORDER } from "@/lib/constants/pipeline";
import {
  UsersIcon,
  SparklesIcon,
  BriefcaseIcon,
  DollarSignIcon,
  TrendingUpIcon,
  TargetIcon,
  BarChart3Icon,
  PieChartIcon,
} from "lucide-react";

export default async function ReportesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reportes</h1>
        <p className="text-muted-foreground">
          M&eacute;tricas clave y rendimiento comercial
        </p>
      </div>

      <Suspense fallback={<KpiSkeleton />}>
        <KpiCards />
      </Suspense>

      <Suspense fallback={<PipelineBreakdownSkeleton />}>
        <PipelineBreakdown />
      </Suspense>
    </div>
  );
}

async function KpiCards() {
  const [stats, pipelineValue] = await Promise.all([
    getDashboardStats(),
    getPipelineValue(),
  ]);

  const conversionRate =
    stats?.totalContacts && stats.totalContacts > 0
      ? ((stats?.totalOpportunities ?? 0) / stats.totalContacts * 100).toFixed(1)
      : "0";

  const kpis = [
    {
      title: "Contactos totales",
      value: (stats?.totalContacts ?? 0).toLocaleString("es-GT"),
      icon: UsersIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Leads activos",
      value: (stats?.totalLeads ?? 0).toLocaleString("es-GT"),
      icon: SparklesIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Oportunidades abiertas",
      value: (stats?.totalOpportunities ?? 0).toLocaleString("es-GT"),
      icon: BriefcaseIcon,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      title: "Valor del pipeline",
      value: formatCurrency(pipelineValue?.totalWeightedValue ?? 0),
      icon: DollarSignIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Tasa de conversión",
      value: `${conversionRate}%`,
      icon: TrendingUpIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Casos abiertos",
      value: (stats?.openCases ?? 0).toLocaleString("es-GT"),
      icon: TargetIcon,
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardContent className="px-4 pt-0">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${kpi.bgColor}`}
              >
                <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">
                  {kpi.title}
                </p>
                <p className="text-xl font-bold tracking-tight">{kpi.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="px-4 pt-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const stageBarColors: Record<string, string> = {
  blue: "bg-blue-500",
  indigo: "bg-indigo-500",
  violet: "bg-violet-500",
  purple: "bg-purple-500",
  fuchsia: "bg-fuchsia-500",
  pink: "bg-pink-500",
  orange: "bg-orange-500",
  emerald: "bg-emerald-500",
  teal: "bg-teal-500",
  green: "bg-green-500",
  red: "bg-red-500",
};

async function PipelineBreakdown() {
  const summary = await getPipelineSummary();

  const allStages = PIPELINE_STAGE_ORDER;
  const totalOpps = allStages.reduce((sum, stage) => {
    const found = summary?.find((s: { stage: string; count: number; totalValue: number }) => s.stage === stage);
    return sum + (found?.count ?? 0);
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3Icon className="h-5 w-5 text-muted-foreground" />
          Desglose del pipeline
        </CardTitle>
        <CardDescription>
          Distribuci&oacute;n de oportunidades por etapa ({totalOpps} total)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-0">
        <div className="space-y-4">
          {allStages.map((stage) => {
            const config = PIPELINE_STAGE_CONFIG[stage];
            const found = summary?.find(
              (s: { stage: string; count: number; totalValue: number }) => s.stage === stage
            );
            const count = found?.count ?? 0;
            const value = found?.totalValue ?? 0;
            const pct = totalOpps > 0 ? (count / totalOpps) * 100 : 0;

            return (
              <div key={stage} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        stageBarColors[config.color] ?? "bg-gray-500"
                      }`}
                    />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {count} oportunidad{count !== 1 ? "es" : ""}
                    </span>
                    <span className="w-24 text-right font-semibold">
                      {formatCurrency(value)}
                    </span>
                    <span className="w-12 text-right text-muted-foreground">
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      stageBarColors[config.color] ?? "bg-gray-500"
                    }`}
                    style={{
                      width: `${Math.max(pct, count > 0 ? 2 : 0)}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PipelineBreakdownSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-64" />
      </CardHeader>
      <CardContent className="px-4 pt-0">
        <div className="space-y-4">
          {Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
