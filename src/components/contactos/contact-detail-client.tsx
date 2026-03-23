"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePageTitle } from "@/components/context/page-title-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { formatDate, formatRelativeDate, formatCurrency } from "@/lib/utils/format";
import { updateContact } from "@/lib/actions/contacts";
import { createLead } from "@/lib/actions/leads";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  SaveIcon,
  PlusIcon,
  PhoneIcon,
  MailIcon,
  MessageSquareIcon,
  CalendarIcon,
  UserIcon,
  BriefcaseIcon,
  ClockIcon,
  EditIcon,
} from "lucide-react";

interface ContactDetailProps {
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    secondaryPhone: string | null;
    type: string;
    company: string | null;
    position: string | null;
    preferredChannel: string | null;
    source: string | null;
    country: string | null;
    timezone: string | null;
    language: string | null;
    notes: string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    opportunities?: Array<{
      id: string;
      title: string;
      stage: string;
      estimatedValue: number | null;
      createdAt: Date | string;
    }>;
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

const activityIcons: Record<string, typeof PhoneIcon> = {
  CALL: PhoneIcon,
  EMAIL: MailIcon,
  WHATSAPP: MessageSquareIcon,
  MEETING: CalendarIcon,
  NOTE: MessageSquareIcon,
  STAGE_CHANGE: BriefcaseIcon,
  TASK: ClockIcon,
};

export function ContactDetailClient({ contact }: ContactDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { setPageTitle } = usePageTitle();
  const [editing, setEditing] = useState(false);

  // Set breadcrumb title
  useEffect(() => {
    setPageTitle(contact.id, `${contact.firstName} ${contact.lastName}`);
  }, [contact.id, contact.firstName, contact.lastName, setPageTitle]);
  const [formData, setFormData] = useState({
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    secondaryPhone: contact.secondaryPhone ?? "",
    type: contact.type,
    company: contact.company ?? "",
    position: contact.position ?? "",
    preferredChannel: contact.preferredChannel ?? "",
    country: contact.country ?? "",
    notes: contact.notes ?? "",
  });

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateContact(contact.id, formData);
        toast.success("Contacto actualizado");
        setEditing(false);
        router.refresh();
      } catch {
        toast.error("Error al actualizar el contacto");
      }
    });
  };

  const handleCreateLead = () => {
    startTransition(async () => {
      try {
        const result = await createLead({ contactId: contact.id });
        if (!result.success) {
          toast.error(result.error ?? "Error al crear el lead");
          return;
        }
        toast.success("Lead creado exitosamente");
        if (result?.data?.id) {
          router.push(`/leads/${result.data.id}`);
        } else {
          router.refresh();
        }
      } catch {
        toast.error("Error al crear el lead");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/contactos")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {contact.firstName} {contact.lastName}
              </h1>
              <StatusBadge type="contactType" value={contact.type} />
            </div>
            <p className="text-sm text-muted-foreground">
              Creado el {formatDate(contact.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleCreateLead} disabled={isPending}>
            <PlusIcon className="mr-1.5 h-4 w-4" />
            Crear Lead
          </Button>
          {!editing ? (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <EditIcon className="mr-1.5 h-4 w-4" />
              Editar
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={isPending}>
              <SaveIcon className="mr-1.5 h-4 w-4" />
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="opportunities">
            Oportunidades
            {contact.opportunities && contact.opportunities.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                {contact.opportunities.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activities">Actividades</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Informaci&oacute;n del contacto</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pt-0">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Nombre</Label>
                  {editing ? (
                    <Input
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, firstName: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{contact.firstName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Apellido</Label>
                  {editing ? (
                    <Input
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, lastName: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{contact.lastName}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Correo electr&oacute;nico</Label>
                  {editing ? (
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, email: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{contact.email || "\u2014"}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Tel&eacute;fono</Label>
                  {editing ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, phone: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{contact.phone || "\u2014"}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Tel&eacute;fono secundario</Label>
                  {editing ? (
                    <Input
                      value={formData.secondaryPhone}
                      onChange={(e) =>
                        setFormData((d) => ({
                          ...d,
                          secondaryPhone: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <p className="text-sm">
                      {contact.secondaryPhone || "\u2014"}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  {editing ? (
                    <Select
                      value={formData.type}
                      onValueChange={(v) =>
                        setFormData((d) => ({ ...d, type: v ?? d.type }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LEISURE">Leisure</SelectItem>
                        <SelectItem value="CORPORATE">Corporativo</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <StatusBadge type="contactType" value={contact.type} />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Empresa</Label>
                  {editing ? (
                    <Input
                      value={formData.company}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, company: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{contact.company || "\u2014"}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Cargo</Label>
                  {editing ? (
                    <Input
                      value={formData.position}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, position: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{contact.position || "\u2014"}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Canal preferido</Label>
                  {editing ? (
                    <Select
                      value={formData.preferredChannel}
                      onValueChange={(v) =>
                        setFormData((d) => ({ ...d, preferredChannel: v ?? d.preferredChannel }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                        <SelectItem value="EMAIL">Correo</SelectItem>
                        <SelectItem value="PHONE">Tel&eacute;fono</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-sm">
                      {contact.preferredChannel || "\u2014"}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Pa&iacute;s</Label>
                  {editing ? (
                    <Input
                      value={formData.country}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, country: e.target.value }))
                      }
                    />
                  ) : (
                    <p className="text-sm">{contact.country || "\u2014"}</p>
                  )}
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-1.5">
                <Label>Notas</Label>
                {editing ? (
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, notes: e.target.value }))
                    }
                    rows={4}
                    placeholder="Notas adicionales sobre el contacto..."
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm">
                    {contact.notes || "Sin notas"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Opportunities Tab */}
        <TabsContent value="opportunities">
          {!contact.opportunities || contact.opportunities.length === 0 ? (
            <EmptyState
              icon={BriefcaseIcon}
              title="Sin oportunidades"
              description="Este contacto no tiene oportunidades asociadas"
            />
          ) : (
            <div className="space-y-3">
              {contact.opportunities.map((opp) => (
                <Card
                  key={opp.id}
                  className="cursor-pointer transition-colors hover:bg-muted/50"
                  onClick={() => router.push(`/oportunidades/${opp.id}`)}
                >
                  <CardContent className="flex items-center justify-between px-4 pt-0">
                    <div>
                      <p className="font-medium">{opp.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Creada el {formatDate(opp.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {opp.estimatedValue != null && (
                        <span className="text-sm font-semibold">
                          {formatCurrency(opp.estimatedValue)}
                        </span>
                      )}
                      <StatusBadge type="pipeline" value={opp.stage} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          {!contact.activities || contact.activities.length === 0 ? (
            <EmptyState
              icon={ClockIcon}
              title="Sin actividades"
              description="No hay actividades registradas para este contacto"
            />
          ) : (
            <div className="relative ml-4 border-l border-border pl-6">
              {contact.activities.map((activity) => {
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
                        <span>{formatRelativeDate(activity.createdAt)}</span>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
