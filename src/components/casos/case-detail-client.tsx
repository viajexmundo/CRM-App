"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { SlaClock } from "./sla-clock";
import {
  formatDate,
  formatDateTime,
  formatRelativeDate,
} from "@/lib/utils/format";
import { resolveCase, closeCase } from "@/lib/actions/cases";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  CheckCircle2Icon,
  XCircleIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  MessageSquareIcon,
  CalendarIcon,
} from "lucide-react";

interface CaseDetailClientProps {
  caseData: {
    id: string;
    subject: string;
    description: string | null;
    type: string;
    priority: string;
    status: string;
    slaHours: number | null;
    slaDeadline: Date | string | null;
    slaBreached: boolean | null;
    resolution: string | null;
    resolvedAt: Date | string | null;
    closedAt: Date | string | null;
    createdAt: Date | string;
    contact?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
    } | null;
    assignedTo?: {
      id: string;
      name: string;
    } | null;
    opportunity?: {
      id: string;
      title: string;
    } | null;
    activities?: Array<{
      id: string;
      type: string;
      title: string;
      description: string | null;
      createdAt: Date | string;
      user?: { name: string } | null;
    }>;
  };
}

const caseTypeLabels: Record<string, string> = {
  GENERAL: "General",
  COMPLAINT: "Reclamo",
  CHANGE_REQUEST: "Solicitud de cambio",
  CANCELLATION: "Cancelación",
  REFUND: "Reembolso",
  EMERGENCY: "Emergencia",
  FEEDBACK: "Feedback",
};

const activityIcons: Record<string, typeof PhoneIcon> = {
  CALL: PhoneIcon,
  EMAIL: MailIcon,
  WHATSAPP: MessageSquareIcon,
  MEETING: CalendarIcon,
  NOTE: MessageSquareIcon,
};

export function CaseDetailClient({ caseData }: CaseDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resolution, setResolution] = useState(caseData.resolution ?? "");

  const handleResolve = () => {
    if (!resolution.trim()) {
      toast.error("Debe escribir una resolución");
      return;
    }
    startTransition(async () => {
      try {
        await resolveCase(caseData.id, resolution);
        toast.success("Caso marcado como resuelto");
        router.refresh();
      } catch {
        toast.error("Error al resolver el caso");
      }
    });
  };

  const handleClose = () => {
    startTransition(async () => {
      try {
        await closeCase(caseData.id);
        toast.success("Caso cerrado");
        router.refresh();
      } catch {
        toast.error("Error al cerrar el caso");
      }
    });
  };

  const isOpen =
    caseData.status !== "RESOLVED" && caseData.status !== "CLOSED";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/casos")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{caseData.subject}</h1>
              <StatusBadge type="case" value={caseData.status} />
              <StatusBadge type="casePriority" value={caseData.priority} />
            </div>
            <p className="text-sm text-muted-foreground">
              {caseTypeLabels[caseData.type] ?? caseData.type}
              {" · "}Creado el {formatDate(caseData.createdAt)}
              {caseData.assignedTo && (
                <span>
                  {" · "}Asignado a {caseData.assignedTo.name}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {caseData.status === "RESOLVED" && (
            <Button onClick={handleClose} disabled={isPending}>
              <XCircleIcon className="mr-1.5 h-4 w-4" />
              Cerrar caso
            </Button>
          )}
        </div>
      </div>

      {/* SLA Clock */}
      {caseData.slaDeadline && isOpen && (
        <SlaClock
          deadline={caseData.slaDeadline}
          breached={caseData.slaBreached ?? false}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Case Info */}
        <Card>
          <CardHeader>
            <CardTitle>Detalles del caso</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 space-y-4">
            {caseData.description && (
              <div>
                <Label className="text-muted-foreground">
                  Descripci&oacute;n
                </Label>
                <p className="mt-1 whitespace-pre-wrap text-sm">
                  {caseData.description}
                </p>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Tipo</Label>
                <p className="mt-1 text-sm">
                  {caseTypeLabels[caseData.type] ?? caseData.type}
                </p>
              </div>
              <div>
                <Label className="text-muted-foreground">SLA</Label>
                <p className="mt-1 text-sm">
                  {caseData.slaHours != null
                    ? `${caseData.slaHours} horas`
                    : "\u2014"}
                </p>
              </div>
            </div>

            {caseData.contact && (
              <>
                <Separator />
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50">
                    <UserIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {caseData.contact.firstName} {caseData.contact.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {caseData.contact.email ?? ""}
                      {caseData.contact.email && caseData.contact.phone
                        ? " · "
                        : ""}
                      {caseData.contact.phone ?? ""}
                    </p>
                  </div>
                </div>
              </>
            )}

            {caseData.opportunity && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">
                    Oportunidad asociada
                  </Label>
                  <Button
                    variant="link"
                    className="mt-1 h-auto p-0 text-sm"
                    onClick={() =>
                      router.push(
                        `/oportunidades/${caseData.opportunity!.id}`
                      )
                    }
                  >
                    {caseData.opportunity.title}
                  </Button>
                </div>
              </>
            )}

            {caseData.resolvedAt && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">
                    Resuelto el
                  </Label>
                  <p className="mt-1 text-sm">
                    {formatDateTime(caseData.resolvedAt)}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Resolution Form / Result */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isOpen ? "Resolver caso" : "Resolución"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 space-y-4">
            {isOpen ? (
              <>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={6}
                  placeholder="Describe la resolución del caso..."
                />
                <Button onClick={handleResolve} disabled={isPending}>
                  <CheckCircle2Icon className="mr-1.5 h-4 w-4" />
                  {isPending ? "Resolviendo..." : "Marcar como resuelto"}
                </Button>
              </>
            ) : (
              <div>
                {caseData.resolution ? (
                  <p className="whitespace-pre-wrap text-sm">
                    {caseData.resolution}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Sin resolución registrada
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de actividades</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          {!caseData.activities || caseData.activities.length === 0 ? (
            <EmptyState
              icon={ClockIcon}
              title="Sin actividades"
              description="No hay actividades registradas para este caso"
            />
          ) : (
            <div className="relative ml-4 border-l border-border pl-6">
              {caseData.activities.map((activity) => {
                const Icon = activityIcons[activity.type] ?? ClockIcon;
                return (
                  <div key={activity.id} className="relative pb-6 last:pb-0">
                    <div className="absolute -left-[calc(1.5rem+1px)] top-0 flex h-7 w-7 items-center justify-center rounded-full border bg-background">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      {activity.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {activity.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {formatRelativeDate(activity.createdAt)}
                        </span>
                        {activity.user && (
                          <>
                            <span>&middot;</span>
                            <span>{activity.user.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
