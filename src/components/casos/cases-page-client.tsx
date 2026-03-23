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
import { SlaClock } from "./sla-clock";
import { formatDate } from "@/lib/utils/format";
import { createCase } from "@/lib/actions/cases";
import { toast } from "sonner";
import {
  PlusIcon,
  SearchIcon,
  AlertTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

interface CaseItem {
  id: string;
  subject: string;
  type: string;
  priority: string;
  status: string;
  slaDeadline: Date | string | null;
  slaBreached: boolean | null;
  createdAt: Date | string;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface CasesPageClientProps {
  cases: CaseItem[];
}

const PAGE_SIZE = 15;

const caseTypeLabels: Record<string, string> = {
  GENERAL: "General",
  COMPLAINT: "Reclamo",
  CHANGE_REQUEST: "Cambio",
  CANCELLATION: "Cancelación",
  REFUND: "Reembolso",
  EMERGENCY: "Emergencia",
  FEEDBACK: "Feedback",
};

export function CasesPageClient({ cases }: CasesPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);

  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    type: "GENERAL",
    priority: "MEDIUM",
    contactId: "",
    opportunityId: "",
  });

  const filtered = useMemo(() => {
    return cases.filter((c) => {
      const matchesSearch =
        search === "" ||
        c.subject.toLowerCase().includes(search.toLowerCase()) ||
        (c.contact
          ? `${c.contact.firstName} ${c.contact.lastName}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : false);

      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || c.priority === priorityFilter;
      const matchesType = typeFilter === "all" || c.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });
  }, [cases, search, statusFilter, priorityFilter, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleCreate = async () => {
    if (!formData.subject) {
      toast.error("El asunto es obligatorio");
      return;
    }
    startTransition(async () => {
      try {
        await createCase({
          subject: formData.subject,
          description: formData.description || undefined,
          type: formData.type,
          priority: formData.priority,
          contactId: formData.contactId || undefined,
          opportunityId: formData.opportunityId || undefined,
        });
        toast.success("Caso creado exitosamente");
        setDialogOpen(false);
        setFormData({
          subject: "",
          description: "",
          type: "GENERAL",
          priority: "MEDIUM",
          contactId: "",
          opportunityId: "",
        });
        router.refresh();
      } catch {
        toast.error("Error al crear el caso");
      }
    });
  };

  function SlaIndicator({ deadline, breached }: { deadline: Date | string | null; breached: boolean | null }) {
    if (!deadline) return <span className="text-muted-foreground">\u2014</span>;

    if (breached) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Incumplido
        </span>
      );
    }

    const now = new Date();
    const deadlineDate = new Date(deadline);
    const total = deadlineDate.getTime() - new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000).getTime();
    const remaining = deadlineDate.getTime() - now.getTime();
    const ratio = remaining / total;

    let color: string;
    let label: string;
    if (remaining <= 0) {
      color = "bg-red-100 text-red-700";
      label = "Vencido";
    } else if (ratio < 0.25) {
      color = "bg-red-100 text-red-700";
      label = "Crítico";
    } else if (ratio < 0.50) {
      color = "bg-yellow-100 text-yellow-700";
      label = "Atención";
    } else {
      color = "bg-green-100 text-green-700";
      label = "En tiempo";
    }

    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${color.includes("red") ? "bg-red-500" : color.includes("yellow") ? "bg-yellow-500" : "bg-green-500"}`} />
        {label}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por asunto o contacto..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(0); }} items={{ all: "Todos", OPEN: "Abierto", IN_PROGRESS: "En progreso", WAITING_CLIENT: "Esperando cliente", WAITING_SUPPLIER: "Esperando proveedor", RESOLVED: "Resuelto", CLOSED: "Cerrado" }}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="OPEN">Abierto</SelectItem>
            <SelectItem value="IN_PROGRESS">En progreso</SelectItem>
            <SelectItem value="WAITING_CLIENT">Esperando cliente</SelectItem>
            <SelectItem value="WAITING_SUPPLIER">Esperando proveedor</SelectItem>
            <SelectItem value="RESOLVED">Resuelto</SelectItem>
            <SelectItem value="CLOSED">Cerrado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v ?? "all"); setPage(0); }} items={{ all: "Todas", LOW: "Baja", MEDIUM: "Media", HIGH: "Alta", URGENT: "Urgente" }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="LOW">Baja</SelectItem>
            <SelectItem value="MEDIUM">Media</SelectItem>
            <SelectItem value="HIGH">Alta</SelectItem>
            <SelectItem value="URGENT">Urgente</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "all"); setPage(0); }} items={{ all: "Todos", ...caseTypeLabels }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(caseTypeLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={
              <Button>
                <PlusIcon className="mr-1.5 h-4 w-4" />
                Nuevo Caso
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo caso</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-1.5">
                  <Label>Asunto *</Label>
                  <Input
                    value={formData.subject}
                    onChange={(e) => setFormData((d) => ({ ...d, subject: e.target.value }))}
                    placeholder="Descripción breve del caso"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Descripci&oacute;n</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
                    rows={3}
                    placeholder="Detalle del caso..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
                    <Select value={formData.type} onValueChange={(v) => setFormData((d) => ({ ...d, type: v ?? d.type }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(caseTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Prioridad</Label>
                    <Select value={formData.priority} onValueChange={(v) => setFormData((d) => ({ ...d, priority: v ?? d.priority }))}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Baja</SelectItem>
                        <SelectItem value="MEDIUM">Media</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                        <SelectItem value="URGENT">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>ID del contacto</Label>
                  <Input
                    value={formData.contactId}
                    onChange={(e) => setFormData((d) => ({ ...d, contactId: e.target.value }))}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={isPending}>
                  {isPending ? "Creando..." : "Crear caso"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertTriangleIcon}
          title="No hay casos"
          description={
            search || statusFilter !== "all"
              ? "No se encontraron casos con los filtros aplicados"
              : "No hay casos abiertos actualmente"
          }
          actionLabel={!search ? "Nuevo Caso" : undefined}
          onAction={!search ? () => setDialogOpen(true) : undefined}
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asunto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Prioridad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((caseItem) => (
                  <TableRow
                    key={caseItem.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/casos/${caseItem.id}`)}
                  >
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {caseItem.subject}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {caseTypeLabels[caseItem.type] ?? caseItem.type}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="casePriority" value={caseItem.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="case" value={caseItem.status} />
                    </TableCell>
                    <TableCell>
                      <SlaIndicator deadline={caseItem.slaDeadline} breached={caseItem.slaBreached} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {caseItem.assignedTo?.name ?? "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(caseItem.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} caso{filtered.length !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
              <Button variant="outline" size="icon-sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
