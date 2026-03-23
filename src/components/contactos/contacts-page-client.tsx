"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatDate } from "@/lib/utils/format";
import { createContact } from "@/lib/actions/contacts";
import { toast } from "sonner";
import {
  PlusIcon,
  SearchIcon,
  UserIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  type: string;
  source: string | null;
  createdAt: Date | string;
}

interface ContactsPageClientProps {
  contacts: Contact[];
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

export function ContactsPageClient({ contacts }: ContactsPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "+502 ",
    type: "LEISURE",
    source: "OTHER",
  });

  const filtered = useMemo(() => {
    return contacts.filter((c) => {
      const matchesSearch =
        search === "" ||
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        (c.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (c.phone?.includes(search) ?? false);

      const matchesType = typeFilter === "all" || c.type === typeFilter;
      const matchesSource = sourceFilter === "all" || c.source === sourceFilter;

      return matchesSearch && matchesType && matchesSource;
    });
  }, [contacts, search, typeFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleCreate = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("El nombre y apellido son obligatorios");
      return;
    }

    startTransition(async () => {
      try {
        await createContact(formData);
        toast.success("Contacto creado exitosamente");
        setDialogOpen(false);
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "+502 ",
          type: "LEISURE",
          source: "OTHER",
        });
        router.refresh();
      } catch {
        toast.error("Error al crear el contacto");
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Search + Filters + Action */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v ?? "all"); setPage(0); }} items={{ all: "Todos los tipos", LEISURE: "Leisure", CORPORATE: "Corporativo" }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="LEISURE">Leisure</SelectItem>
            <SelectItem value="CORPORATE">Corporativo</SelectItem>
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

        <div className="ml-auto">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button>
                  <PlusIcon className="mr-1.5 h-4 w-4" />
                  Nuevo Contacto
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Nuevo contacto</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Nombre *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, firstName: e.target.value }))
                      }
                      placeholder="Juan"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Apellido *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData((d) => ({ ...d, lastName: e.target.value }))
                      }
                      placeholder="Pérez"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, email: e.target.value }))
                    }
                    placeholder="juan@ejemplo.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Teléfono</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((d) => ({ ...d, phone: e.target.value }))
                    }
                    placeholder="+502 1234 5678"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Tipo</Label>
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
                  </div>
                  <div className="space-y-1.5">
                    <Label>Fuente</Label>
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
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreate} disabled={isPending}>
                  {isPending ? "Creando..." : "Crear contacto"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={UserIcon}
          title="No hay contactos"
          description={
            search || typeFilter !== "all" || sourceFilter !== "all"
              ? "No se encontraron contactos con los filtros aplicados"
              : "Comienza creando tu primer contacto"
          }
          actionLabel={!search ? "Nuevo Contacto" : undefined}
          onAction={!search ? () => setDialogOpen(true) : undefined}
        />
      ) : (
        <>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fuente</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/contactos/${contact.id}`)}
                  >
                    <TableCell className="font-medium">
                      {contact.firstName} {contact.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.email ?? "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.phone ?? "\u2014"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge type="contactType" value={contact.type} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {contact.source
                        ? sourceLabels[contact.source] ?? contact.source
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(contact.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filtered.length} contacto{filtered.length !== 1 ? "s" : ""}
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
