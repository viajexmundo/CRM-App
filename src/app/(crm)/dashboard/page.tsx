import { Suspense } from "react";
import Link from "next/link";
import {
  getDashboardStats,
  getRecentActivities,
  getPendingActions,
  getUpcomingActions,
} from "@/lib/queries/dashboard";
import { auth } from "@/lib/auth";
import { getCalendarItems } from "@/lib/queries/calendar";
import { getTodayCheckIn } from "@/lib/queries/check-in";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate } from "@/lib/utils/format";
import { getTypeLabel, getChannelLabel } from "@/lib/constants/labels";
import { CheckInCard } from "@/components/dashboard/check-in-card";
import {
  UsersIcon,
  SparklesIcon,
  BriefcaseIcon,
  AlertTriangleIcon,
  TrophyIcon,
  ClockIcon,
  PhoneIcon,
  MailIcon,
  MessageSquareIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  SearchIcon,
  FileTextIcon,
  CalendarClockIcon,
  MoonIcon,
  ChevronRightIcon,
} from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const viewer = {
    id: (session?.user as { id?: string })?.id,
    role: (session?.user as { role?: string })?.role,
  };

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const [todayCalendar, checkIn] = await Promise.all([
    getCalendarItems({
      viewerId: viewer.id,
      viewerRole: viewer.role,
      from: start,
      to: end,
    }),
    viewer.id ? getTodayCheckIn(viewer.id) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
        <p className="text-muted-foreground">
          Panorama del día: agenda, prioridades y ejecución
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <TodayCalendarPanel items={todayCalendar} />
        {checkIn && (
          <CheckInCard
            total={checkIn.total}
            completed={checkIn.completed}
            items={checkIn.items.map((item) => ({
              id: item.id,
              title: item.title,
              isCompleted: item.isCompleted,
              source: item.source,
            }))}
          />
        )}
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<PendingActionsSkeleton />}>
        <PendingActionsPanel viewer={viewer} />
      </Suspense>

      <Suspense fallback={<UpcomingActionsSkeleton />}>
        <UpcomingActionsPanel viewer={viewer} />
      </Suspense>

      <Suspense fallback={<RecentActivitiesSkeleton />}>
        <RecentActivitiesList viewer={viewer} />
      </Suspense>
    </div>
  );
}

// ---- Stats Cards ----

async function StatsCards() {
  const stats = await getDashboardStats();

  const cards = [
    {
      title: "Contactos",
      value: stats?.totalContacts ?? 0,
      icon: UsersIcon,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Leads",
      value: stats?.totalLeads ?? 0,
      icon: SparklesIcon,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Oportunidades activas",
      value: stats?.totalOpportunities ?? 0,
      icon: BriefcaseIcon,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      title: "Ventas ganadas",
      value: stats?.wonOpportunities ?? 0,
      icon: TrophyIcon,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Casos abiertos",
      value: stats?.openCases ?? 0,
      icon: AlertTriangleIcon,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="px-4 pt-0">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${card.bgColor}`}
              >
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{card.title}</p>
                <p className="text-xl font-bold tracking-tight">
                  {Number(card.value).toLocaleString("es-GT")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="px-4 pt-0">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ---- Pending Actions ----

const categoryConfig: Record<
  string,
  { label: string; icon: typeof PhoneIcon; color: string; bgColor: string; borderColor: string }
> = {
  CONTACTAR: {
    label: "Contactar leads nuevos",
    icon: PhoneIcon,
    color: "text-blue-600",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-l-blue-500",
  },
  PERFILAR: {
    label: "Completar diagnóstico",
    icon: SearchIcon,
    color: "text-indigo-600",
    bgColor: "bg-indigo-50 dark:bg-indigo-950/30",
    borderColor: "border-l-indigo-500",
  },
  PROPUESTA: {
    label: "Preparar propuestas",
    icon: FileTextIcon,
    color: "text-violet-600",
    bgColor: "bg-violet-50 dark:bg-violet-950/30",
    borderColor: "border-l-violet-500",
  },
  SEGUIMIENTO: {
    label: "Seguimientos pendientes",
    icon: CalendarClockIcon,
    color: "text-amber-600",
    bgColor: "bg-amber-50 dark:bg-amber-950/30",
    borderColor: "border-l-amber-500",
  },
  DORMIDO_REVISAR: {
    label: "Dormidos por revisar",
    icon: MoonIcon,
    color: "text-slate-500",
    bgColor: "bg-slate-50 dark:bg-slate-950/30",
    borderColor: "border-l-slate-400",
  },
};

const urgencyBadge: Record<string, { label: string; variant: "destructive" | "secondary" | "outline" }> = {
  HIGH: { label: "Urgente", variant: "destructive" },
  MEDIUM: { label: "Pendiente", variant: "secondary" },
  LOW: { label: "Nuevo", variant: "outline" },
};

async function PendingActionsPanel({ viewer }: { viewer: { id?: string; role?: string } }) {
  const actions = await getPendingActions(viewer);

  if (actions.length === 0) {
    return (
      <Card>
        <CardContent className="px-4 pt-0">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2Icon className="h-12 w-12 text-green-500 mb-3" />
            <p className="text-lg font-semibold text-green-700 dark:text-green-400">
              Todo al día
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              No hay acciones pendientes por realizar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group actions by category
  const grouped: Record<string, typeof actions> = {};
  for (const action of actions) {
    if (!grouped[action.category]) {
      grouped[action.category] = [];
    }
    grouped[action.category].push(action);
  }

  // Order categories
  const categoryOrder = ["SEGUIMIENTO", "CONTACTAR", "PERFILAR", "PROPUESTA", "DORMIDO_REVISAR"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Acciones pendientes</h2>
        <Badge variant="secondary" className="text-xs">
          {actions.length} pendiente{actions.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {categoryOrder
          .filter((cat) => grouped[cat] && grouped[cat].length > 0)
          .map((cat) => {
            const config = categoryConfig[cat];
            const items = grouped[cat];
            const Icon = config.icon;

            return (
              <Card key={cat}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div className={`flex h-7 w-7 items-center justify-center rounded-md ${config.bgColor}`}>
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    {config.label}
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {items.length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pt-0">
                  <div className="space-y-1">
                    {items.slice(0, 5).map((action) => {
                      const badge = urgencyBadge[action.urgency];
                      return (
                        <Link
                          key={action.id}
                          href={`/oportunidades/${action.opportunityId}`}
                          className={`flex items-start gap-3 rounded-lg border-l-4 ${config.borderColor} p-2.5 transition-colors hover:bg-muted/50`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium leading-tight">
                              {action.title}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {action.urgency === "HIGH" && (
                              <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0">
                                {badge.label}
                              </Badge>
                            )}
                            <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </Link>
                      );
                    })}
                    {items.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        +{items.length - 5} más
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

function PendingActionsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-7 w-7 rounded-md" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pt-0">
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="rounded-lg border-l-4 border-muted p-2.5">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="mt-1 h-3 w-1/2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---- Upcoming Actions (scheduled nextStepDate) ----

// Type and channel labels are now imported from @/lib/constants/labels

async function UpcomingActionsPanel({ viewer }: { viewer: { id?: string; role?: string } }) {
  const actions = await getUpcomingActions(10, viewer);

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClockIcon className="h-4 w-4 text-amber-500" />
          Próximas acciones programadas
        </CardTitle>
        <CardDescription>
          Acciones que tienes agendadas para tus oportunidades
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-0">
        <div className="space-y-1">
          {actions.map((action) => (
            <Link
              key={action.id}
              href={`/oportunidades/${action.opportunityId}`}
              className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-muted/50 ${
                action.isOverdue ? "border-l-4 border-l-red-400" : "border-l-4 border-l-amber-300"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-tight">
                  {action.action}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {action.contactName} &middot; {action.opportunityTitle}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className={`text-xs font-medium ${action.isOverdue ? "text-red-500" : "text-muted-foreground"}`}>
                  {action.isOverdue ? "Vencida" : ""}{" "}
                  {new Date(action.scheduledAt).toLocaleDateString("es-GT", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div className="flex gap-1.5 text-xs text-muted-foreground">
                  {action.type && (
                    <span>{getTypeLabel(action.type)}</span>
                  )}
                  {action.channel && (
                    <span>&middot; {getChannelLabel(action.channel)}</span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingActionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-64" />
      </CardHeader>
      <CardContent className="px-4 pt-0">
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 border-l-4 border-muted">
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---- Recent Activities ----

const activityIcons: Record<string, typeof PhoneIcon> = {
  CALL: PhoneIcon,
  EMAIL: MailIcon,
  WHATSAPP: MessageSquareIcon,
  MEETING: CalendarClockIcon,
  STAGE_CHANGE: ArrowRightIcon,
  NOTE: MessageSquareIcon,
  TASK: CheckCircle2Icon,
  SYSTEM: BriefcaseIcon,
};

async function RecentActivitiesList({ viewer }: { viewer: { id?: string; role?: string } }) {
  const activities = await getRecentActivities(20, viewer);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad reciente</CardTitle>
        <CardDescription>
          Últimas acciones en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-0">
        {!activities || activities.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay actividad reciente
          </p>
        ) : (
          <div className="space-y-1">
            {activities.slice(0, 10).map((activity: { id: string; type: string; title: string | null; description: string | null; createdAt: string | Date; user?: { name: string } | null }) => {
              const Icon = activityIcons[activity.type] ?? ClockIcon;

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{activity.title ?? ""}</p>
                    {activity.description && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeDate(activity.createdAt)}
                    </span>
                    {activity.user && (
                      <span className="text-xs text-muted-foreground">
                        {activity.user.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TodayCalendarPanel({
  items,
}: {
  items: Array<{
    id: string;
    source: "FOLLOW_UP" | "ACTION";
    title: string;
    startAt: Date;
    status: string;
    opportunityId: string;
    contactName: string;
    stage: string;
    meetLink?: string | null;
  }>;
}) {
  const sorted = [...items].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClockIcon className="h-4 w-4 text-blue-500" />
          Agenda de hoy
        </CardTitle>
        <CardDescription>
          {new Date().toLocaleDateString("es-GT", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
          {" · "}
          {sorted.length} evento(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-0">
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes eventos para hoy.</p>
        ) : (
          <div className="space-y-2">
            {sorted.map((item) => (
              <Link
                key={`${item.source}-${item.id}`}
                href={`/oportunidades/${item.opportunityId}`}
                className="flex items-start gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/50"
              >
                <div className="min-w-[52px] text-right">
                  <p className="text-sm font-semibold">
                    {item.startAt.toLocaleTimeString("es-GT", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: false,
                    })}
                  </p>
                  <Badge variant="outline" className="mt-1 text-[10px]">
                    {item.source === "FOLLOW_UP" ? "Seguimiento" : "Acción"}
                  </Badge>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.contactName}</p>
                </div>
                <div className="shrink-0">
                  {item.meetLink && <span className="text-xs text-emerald-700">Meet</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecentActivitiesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-3 w-48" />
      </CardHeader>
      <CardContent className="px-4 pt-0">
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-2">
              <Skeleton className="h-7 w-7 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
