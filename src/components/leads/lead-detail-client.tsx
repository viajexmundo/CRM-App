"use client";

import { useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/components/context/page-title-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/common/status-badge";
import { formatDate, formatCurrency } from "@/lib/utils/format";
import { convertLeadToOpportunity, updateLead } from "@/lib/actions/leads";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  UserIcon,
  MapPinIcon,
  DollarSignIcon,
  CalendarIcon,
  UsersIcon,
} from "lucide-react";

interface LeadDetailClientProps {
  lead: {
    id: string;
    status: string;
    score: number | null;
    source: string | null;
    interest: string | null;
    budget: number | null;
    destination: string | null;
    travelMotif: string | null;
    passengers: number | null;
    travelDates: string | null;
    notes: string | null;
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
  };
}

const sourceLabels: Record<string, string> = {
  REFERRAL: "Referido",
  WEBSITE: "Sitio web",
  SOCIAL_MEDIA: "Redes sociales",
  PHONE: "Teléfono",
  EMAIL: "Correo",
  EVENT: "Evento",
  WALK_IN: "Walk-in",
  PARTNER: "Socio",
  OTHER: "Otro",
};

export function LeadDetailClient({ lead }: LeadDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();
  const { setPageTitle } = usePageTitle();

  // Set breadcrumb title
  useEffect(() => {
    const name = lead.contact
      ? `${lead.contact.firstName} ${lead.contact.lastName}`
      : "Lead";
    setPageTitle(lead.id, name);
  }, [lead.id, lead.contact, setPageTitle]);

  const handleConvert = () => {
    startTransition(async () => {
      try {
        const result = await convertLeadToOpportunity(lead.id);
        if (!result.success) {
          toast.error(result.error ?? "Error al convertir el lead");
          return;
        }
        toast.success("Lead convertido a oportunidad exitosamente");
        if (result?.data?.opportunityId) {
          router.push(`/oportunidades/${result.data.opportunityId}`);
        }
      } catch {
        toast.error("Error al convertir el lead");
      }
    });
  };

  const handleStatusChange = (status: string) => {
    startStatusTransition(async () => {
      try {
        const result = await updateLead(lead.id, { status });
        if (!result.success) {
          toast.error(result.error ?? "Error al actualizar el estado");
          return;
        }
        toast.success("Estado del lead actualizado");
        router.refresh();
      } catch {
        toast.error("Error al actualizar el estado");
      }
    });
  };

  const contactName = lead.contact
    ? `${lead.contact.firstName} ${lead.contact.lastName}`
    : "Sin contacto";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/leads")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Lead: {contactName}</h1>
              <StatusBadge type="lead" value={lead.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Creado el {formatDate(lead.createdAt)}
              {lead.assignedTo && (
                <span> &middot; Asignado a {lead.assignedTo.name}</span>
              )}
            </p>
          </div>
        </div>
        {lead.status !== "CONVERTIDO" && lead.status !== "DESCALIFICADO" && (
          <Button onClick={handleConvert} disabled={isPending}>
            <ArrowRightIcon className="mr-1.5 h-4 w-4" />
            {isPending ? "Convirtiendo..." : "Convertir a oportunidad"}
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Informaci&oacute;n del lead</CardTitle>
              {lead.status !== "CONVERTIDO" ? (
                <Select
                  value={lead.status}
                  onValueChange={(v) => handleStatusChange(v ?? lead.status)}
                  disabled={isStatusPending}
                >
                  <SelectTrigger className="w-[190px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NUEVO">Nuevo</SelectItem>
                    <SelectItem value="CONTACTADO">Contactado</SelectItem>
                    <SelectItem value="CALIFICADO">Calificado</SelectItem>
                    <SelectItem value="DESCALIFICADO">Descalificado</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Estado bloqueado al estar convertido
                </p>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pt-0 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Score</Label>
                {lead.score != null ? (
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2.5 w-20 rounded-full bg-muted">
                      <div
                        className={`h-2.5 rounded-full ${
                          lead.score >= 70
                            ? "bg-green-500"
                            : lead.score >= 40
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(lead.score, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{lead.score}</span>
                  </div>
                ) : (
                  <p className="mt-1 text-sm">\u2014</p>
                )}
              </div>
              <div>
                <Label className="text-muted-foreground">Fuente</Label>
                <p className="mt-1 text-sm">
                  {lead.source
                    ? sourceLabels[lead.source] ?? lead.source
                    : "\u2014"}
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPinIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-muted-foreground">Destino</Label>
                  <p className="text-sm">{lead.destination || "\u2014"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <DollarSignIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-muted-foreground">Presupuesto</Label>
                  <p className="text-sm">
                    {lead.budget != null
                      ? formatCurrency(lead.budget)
                      : "\u2014"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <UsersIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-muted-foreground">Pasajeros</Label>
                  <p className="text-sm">{lead.passengers ?? "\u2014"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CalendarIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <Label className="text-muted-foreground">
                    Fechas de viaje
                  </Label>
                  <p className="text-sm">{lead.travelDates || "\u2014"}</p>
                </div>
              </div>
            </div>

            {lead.interest && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">
                    Inter&eacute;s
                  </Label>
                  <p className="mt-1 text-sm">{lead.interest}</p>
                </div>
              </>
            )}

            {lead.notes && (
              <>
                <Separator />
                <div>
                  <Label className="text-muted-foreground">Notas</Label>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {lead.notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contacto asociado</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            {lead.contact ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
                    <UserIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {lead.contact.firstName} {lead.contact.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lead.contact.email ?? "Sin correo"}
                    </p>
                  </div>
                </div>
                {lead.contact.phone && (
                  <p className="text-sm text-muted-foreground">
                    Tel: {lead.contact.phone}
                  </p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/contactos/${lead.contact!.id}`)
                  }
                >
                  Ver perfil del contacto
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin contacto asociado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
