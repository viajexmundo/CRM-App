"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import { createLead, convertLeadToOpportunity, updateLead } from "@/lib/actions/leads";
import { PIPELINE_STAGE_CONFIG, PIPELINE_STAGE_ORDER } from "@/lib/constants/pipeline";
import { toast } from "sonner";
import {
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

interface Lead {
  id: string;
  status: string;
  source: string | null;
  interest: string | null;
  budget: number | null;
  destination: string | null;
  createdAt: Date | string;
  hasOpportunity?: boolean;
  currentOpportunityId?: string | null;
  currentOpportunityStage?: string | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LeadsPageClientProps {
  leads: Lead[];
  users: UserOption[];
  currentUserRole: string;
}

const PAGE_SIZE = 15;

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

const INITIAL_FORM = {
  firstName: "",
  phone: "+502 ",
  passportOrDpi: "",
  passengers: "",
  destination: "",
  source: "OTHER",
  travelDateFrom: "",
  travelDateTo: "",
  notes: "",
  assignedToId: "",
};

export function LeadsPageClient({ leads, users, currentUserRole }: LeadsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isStatusPending, startStatusTransition] = useTransition();
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] = useState<string>("all");
  const [opportunityFilter, setOpportunityFilter] = useState<string>("all");
  const [opportunityStageFilter, setOpportunityStageFilter] = useState<string>("all");
  const [createdFilter, setCreatedFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);

  // Form state
  const [formData, setFormData] = useState(INITIAL_FORM);

  const isAdmin = currentUserRole === "ADMIN";

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const contactName = l.contact
        ? `${l.contact.firstName} ${l.contact.lastName}`
        : "";
      const matchesSearch =
        search === "" ||
        contactName.toLowerCase().includes(search.toLowerCase()) ||
        (l.destination?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (l.interest?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const matchesStatus = statusFilter === "all" || l.status === statusFilter;
      const matchesSource = sourceFilter === "all" || l.source === sourceFilter;
      const matchesAssigned = assignedFilter === "all" || l.assignedTo?.id === assignedFilter;
      const matchesOpportunity =
        opportunityFilter === "all" ||
        (opportunityFilter === "with" && Boolean(l.hasOpportunity)) ||
        (opportunityFilter === "without" && !l.hasOpportunity);
      const matchesOpportunityStage =
        opportunityStageFilter === "all" || l.currentOpportunityStage === opportunityStageFilter;
      const createdAt = new Date(l.createdAt).getTime();
      const now = Date.now();
      const inLast7 = now - createdAt <= 7 * 24 * 60 * 60 * 1000;
      const inLast30 = now - createdAt <= 30 * 24 * 60 * 60 * 1000;
      const matchesCreated =
        createdFilter === "all" ||
        (createdFilter === "7d" && inLast7) ||
        (createdFilter === "30d" && inLast30);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesSource &&
        matchesAssigned &&
        matchesOpportunity &&
        matchesOpportunityStage &&
        matchesCreated
      );
    });
  }, [
    leads,
    search,
    statusFilter,
    sourceFilter,
    assignedFilter,
    opportunityFilter,
    opportunityStageFilter,
    createdFilter,
  ]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleCreate = async () => {
    if (!formData.firstName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim() === "+502") {
      toast.error("El teléfono es obligatorio");
      return;
    }
    startTransition(async () => {
      try {
        const parsedPassengers = formData.passengers ? parseInt(formData.passengers, 10) : null;
        const result = await createLead({
          firstName: formData.firstName.trim(),
          phone: formData.phone.trim(),
          passportOrDpi: formData.passportOrDpi || "",
          passengers: parsedPassengers && !isNaN(parsedPassengers) ? parsedPassengers : null,
          destination: formData.destination || "",
          source: formData.source,
          travelDateFrom: formData.travelDateFrom || "",
          travelDateTo: formData.travelDateTo || "",
          notes: formData.notes || "",
          assignedToId: formData.assignedToId || null,
        });
        if (!result.success) {
          toast.error(result.error ?? "Error al crear el lead");
          return;
        }
        toast.success("Lead creado exitosamente");
        setDialogOpen(false);
        setFormData(INITIAL_FORM);
        router.refresh();
      } catch {
        toast.error("Error al crear el lead");
      }
    });
  };

  const handleConvert = (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      try {
        const result = await convertLeadToOpportunity(leadId);
        if (!result.success) {
          toast.error(result.error ?? "Error al convertir el lead");
          return;
        }
        toast.success("Lead convertido a oportunidad");
        if (result?.data?.opportunityId) {
          router.push(`/oportunidades/${result.data.opportunityId}`);
        } else {
          router.refresh();
        }
      } catch {
        toast.error("Error al convertir el lead");
      }
    });
  };

  const handleStatusChange = (leadId: string, status: string) => {
    setStatusUpdatingId(leadId);
    startStatusTransition(async () => {
      try {
        const result = await updateLead(leadId, { status });
        if (!result.success) {
          toast.error(result.error ?? "Error al actualizar el estado");
          return;
        }
        toast.success("Estado de lead actualizado");
        router.refresh();
      } catch {
        toast.error("Error al actualizar el estado");
      } finally {
        setStatusUpdatingId(null);
      }
    });
  };

  const handleAssigneeChange = (leadId: string, assignedToId: string) => {
    startTransition(async () => {
      try {
        const result = await updateLead(leadId, { assignedToId });
        if (!result.success) {
          toast.error(result.error ?? "Error al reasignar lead");
          return;
        }
        toast.success("Lead reasignado");
        router.refresh();
      } catch {
        toast.error("Error al reasignar lead");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por contacto, destino..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(0); }} items={{ all: "Todos", NUEVO: "Nuevo", CONTACTADO: "Contactado", CALIFICADO: "Calificado", DESCALIFICADO: "Descalificado", CONVERTIDO: "Convertido" }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="NUEVO">Nuevo</SelectItem>
            <SelectItem value="CONTACTADO">Contactado</SelectItem>
            <SelectItem value="CALIFICADO">Calificado</SelectItem>
            <SelectItem value="DESCALIFICADO">Descalificado</SelectItem>
            <SelectItem value="CONVERTIDO">Convertido</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v ?? "all"); setPage(0); }} items={{ all: "Todas las fuentes", ...sourceLabels }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Fuente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fuentes</SelectItem>
            {Object.entries(sourceLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={opportunityFilter}
          onValueChange={(v) => {
            setOpportunityFilter(v ?? "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[190px]">
            <SelectValue placeholder="Relación con oportunidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Con y sin oportunidad</SelectItem>
            <SelectItem value="with">Con oportunidad</SelectItem>
            <SelectItem value="without">Sin oportunidad</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={opportunityStageFilter}
          onValueChange={(v) => {
            setOpportunityStageFilter(v ?? "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[210px]">
            <SelectValue placeholder="Etapa de oportunidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {PIPELINE_STAGE_ORDER.map((stage) => (
              <SelectItem key={stage} value={stage}>
                {PIPELINE_STAGE_CONFIG[stage].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={createdFilter}
          onValueChange={(v) => {
            setCreatedFilter(v ?? "all");
            setPage(0);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Fecha" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier fecha</SelectItem>
            <SelectItem value="7d">Últimos 7 días</SelectItem>
            <SelectItem value="30d">Últimos 30 días</SelectItem>
          </SelectContent>
        </Select>

        {isAdmin && (
          <Select
            value={assignedFilter}
            onValueChange={(v) => {
              setAssignedFilter(v ?? "all");
              setPage(0);
            }}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Asignado a" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los agentes</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <PlusIcon className="mr-1.5 h-4 w-4" />
                  Nuevo Lead
                </Button>
              }
            />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nuevo lead</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                {/* Nombre */}
                <div className="space-y-1.5">
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, firstName: e.target.value }))
                    }
                    placeholder="Nombre completo del prospecto"
                  />
                </div>

                {/* Teléfono + Pasaporte/DPI */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Teléfono *</Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, phone: e.target.value }))
                      }
                      placeholder="+502 1234 5678"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pasaporte / DPI</Label>
                    <Input
                      value={formData.passportOrDpi}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, passportOrDpi: e.target.value }))
                      }
                      placeholder="Documento de identidad"
                    />
                  </div>
                </div>

                {/* Destino + Pasajeros */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>País / Destino</Label>
                    <Input
                      value={formData.destination}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, destination: e.target.value }))
                      }
                      placeholder="Ej: Cancún, Europa, Japón..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Pasajeros</Label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.passengers}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, passengers: e.target.value }))
                      }
                      placeholder="Cantidad"
                    />
                  </div>
                </div>

                {/* Medio de captación */}
                <div className="space-y-1.5">
                  <Label>Medio de captación</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) =>
                      setFormData((d) => ({ ...d, source: v ?? d.source }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(sourceLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Fechas tentativas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Fecha tentativa desde</Label>
                    <Input
                      type="date"
                      value={formData.travelDateFrom}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, travelDateFrom: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fecha tentativa hasta</Label>
                    <Input
                      type="date"
                      value={formData.travelDateTo}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, travelDateTo: e.target.value }))
                      }
                    />
                  </div>
                </div>

                {/* Notas */}
                <div className="space-y-1.5">
                  <Label>Notas internas</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, notes: e.target.value }))
                    }
                    rows={3}
                    placeholder="Notas adicionales sobre el prospecto..."
                  />
                </div>

                {/* Asignar a (solo ADMIN) */}
                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label>Asignar a</Label>
                    <Select
                      value={formData.assignedToId}
                      onValueChange={(v) =>
                        setFormData((d) => ({ ...d, assignedToId: v ?? "" }))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Asignar automáticamente" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={isPending}>
                  {isPending ? "Creando..." : "Crear lead"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={SparklesIcon}
          title="No hay leads"
          description={
            search || statusFilter !== "all" || sourceFilter !== "all"
              ? "No se encontraron leads con los filtros aplicados"
              : "Comienza creando o importando leads"
          }
          actionLabel={!search ? "Nuevo Lead" : undefined}
          onAction={!search ? () => setDialogOpen(true) : undefined}
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Destino</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/leads/${lead.id}`)}
                  >
                    <TableCell className="font-medium">
                      {lead.contact
                        ? `${lead.contact.firstName} ${lead.contact.lastName}`
                        : "\u2014"}
                    </TableCell>
                    <TableCell>
                      {lead.currentOpportunityStage ? (
                        <StatusBadge type="pipeline" value={lead.currentOpportunityStage} />
                      ) : lead.status === "CONVERTIDO" ? (
                        <StatusBadge type="lead" value={lead.status} />
                      ) : (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <Select
                            value={lead.status}
                            onValueChange={(v) => handleStatusChange(lead.id, v ?? lead.status)}
                            disabled={isStatusPending && statusUpdatingId === lead.id}
                          >
                            <SelectTrigger className="w-[165px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NUEVO">Nuevo</SelectItem>
                              <SelectItem value="CONTACTADO">Contactado</SelectItem>
                              <SelectItem value="CALIFICADO">Calificado</SelectItem>
                              <SelectItem value="DESCALIFICADO">Descalificado</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.destination ?? "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {lead.source ? sourceLabels[lead.source] ?? lead.source : "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {isAdmin ? (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <Select
                            value={lead.assignedTo?.id ?? ""}
                            onValueChange={(v) =>
                              handleAssigneeChange(lead.id, v ?? lead.assignedTo?.id ?? "")
                            }
                            disabled={isPending}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Sin asignar" />
                            </SelectTrigger>
                            <SelectContent>
                              {users.map((u) => (
                                <SelectItem key={u.id} value={u.id}>
                                  {u.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        lead.assignedTo?.name ?? "\u2014"
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.status !== "CONVERTIDO" &&
                        lead.status !== "DESCALIFICADO" && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => handleConvert(lead.id, e)}
                            disabled={isPending}
                            title="Convertir a oportunidad"
                          >
                            <ArrowRightIcon className="h-4 w-4" />
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
