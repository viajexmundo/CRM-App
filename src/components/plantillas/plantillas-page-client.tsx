"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { createTemplate, updateTemplate, deleteTemplate } from "@/lib/actions/templates";
import { PIPELINE_STAGES, ROLES } from "@/types";
import { toast } from "sonner";
import {
  PlusIcon,
  PencilIcon,
  Trash2Icon,
  SaveIcon,
  XIcon,
  MessageSquareIcon,
  CopyIcon,
} from "lucide-react";

interface Template {
  id: string;
  name: string;
  channel: string;
  category: string;
  purpose: string;
  stage: string | null;
  targetRole: string | null;
  subject: string | null;
  body: string;
  variables: string;
  isActive: boolean;
  createdAt: Date | string;
}

interface PlantillasPageClientProps {
  templates: Template[];
}

const CATEGORIES: Record<string, string> = {
  GENERAL: "General",
  BIENVENIDA: "Bienvenida",
  SEGUIMIENTO: "Seguimiento",
  COTIZACION: "Cotización",
  CONFIRMACION: "Confirmación",
  POST_VENTA: "Post-venta",
  URGENCIA: "Urgencia",
  CIERRE: "Cierre",
};

const PURPOSES: Record<string, string> = {
  GENERAL: "General",
  ASSIGNMENT_NOTIFICATION: "Notificación de asignación",
};

export function PlantillasPageClient({ templates }: PlantillasPageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newForm, setNewForm] = useState({
    name: "",
    category: "GENERAL",
    purpose: "GENERAL",
    stage: "ALL",
    targetRole: "ALL",
    body: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    purpose: "GENERAL",
    stage: "ALL",
    targetRole: "ALL",
    body: "",
  });

  const handleCreate = () => {
    startTransition(async () => {
      const result = await createTemplate({
        ...newForm,
        stage: newForm.stage === "ALL" ? null : newForm.stage,
        targetRole: newForm.targetRole === "ALL" ? null : newForm.targetRole,
      });
      if (result.success) {
        toast.success("Plantilla creada");
        setNewForm({
          name: "",
          category: "GENERAL",
          purpose: "GENERAL",
          stage: "ALL",
          targetRole: "ALL",
          body: "",
        });
        setShowNew(false);
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al crear");
      }
    });
  };

  const handleUpdate = (id: string) => {
    startTransition(async () => {
      const result = await updateTemplate(id, {
        ...editForm,
        stage: editForm.stage === "ALL" ? null : editForm.stage,
        targetRole: editForm.targetRole === "ALL" ? null : editForm.targetRole,
      });
      if (result.success) {
        toast.success("Plantilla actualizada");
        setEditingId(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al actualizar");
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`¿Eliminar la plantilla "${name}"?`)) return;
    startTransition(async () => {
      const result = await deleteTemplate(id);
      if (result.success) {
        toast.success("Plantilla eliminada");
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al eliminar");
      }
    });
  };

  const handleCopy = (body: string) => {
    navigator.clipboard.writeText(body);
    toast.success("Mensaje copiado al portapapeles");
  };

  const startEdit = (t: Template) => {
    setEditingId(t.id);
    setEditForm({
      name: t.name,
      category: t.category,
      purpose: t.purpose || "GENERAL",
      stage: t.stage || "ALL",
      targetRole: t.targetRole || "ALL",
      body: t.body,
    });
  };

  // Group templates by category
  const grouped: Record<string, Template[]> = {};
  for (const t of templates) {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  }

  return (
    <div className="space-y-6">
      {/* New Template Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowNew(!showNew)}>
          {showNew ? (
            <>
              <XIcon className="mr-1.5 h-4 w-4" />
              Cancelar
            </>
          ) : (
            <>
              <PlusIcon className="mr-1.5 h-4 w-4" />
              Nueva plantilla
            </>
          )}
        </Button>
      </div>

      {/* New Template Form */}
      {showNew && (
        <Card className="border-2 border-dashed border-primary/30">
          <CardHeader>
            <CardTitle>Nueva plantilla</CardTitle>
            <CardDescription>
              Usa variables como {"{nombre}"}, {"{destino}"}, {"{asesor}"} que se reemplazarán automáticamente
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 pt-0 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Nombre de la plantilla</Label>
                <Input
                  value={newForm.name}
                  onChange={(e) => setNewForm((d) => ({ ...d, name: e.target.value }))}
                  placeholder="Ej: Bienvenida inicial"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoría</Label>
                <Select
                  value={newForm.category}
                  onValueChange={(v) => setNewForm((d) => ({ ...d, category: v ?? d.category }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORIES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Tipo de plantilla</Label>
                <Select
                  value={newForm.purpose}
                  onValueChange={(v) => setNewForm((d) => ({ ...d, purpose: v ?? d.purpose }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PURPOSES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Etapa (opcional)</Label>
                <Select
                  value={newForm.stage}
                  onValueChange={(v) => setNewForm((d) => ({ ...d, stage: v ?? d.stage }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todas las etapas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todas las etapas</SelectItem>
                    {PIPELINE_STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Rol destino (opcional)</Label>
                <Select
                  value={newForm.targetRole}
                  onValueChange={(v) => setNewForm((d) => ({ ...d, targetRole: v ?? d.targetRole }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos los roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los roles</SelectItem>
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Mensaje</Label>
              <Textarea
                value={newForm.body}
                onChange={(e) => setNewForm((d) => ({ ...d, body: e.target.value }))}
                placeholder="Hola {nombre}, gracias por tu interés en viajar a {destino}..."
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                Variables disponibles: {"{nombre}"}, {"{destino}"}, {"{asesor}"}, {"{fecha}"}, {"{precio}"}, {"{agente}"}, {"{cliente}"}, {"{oportunidad}"}, {"{etapa}"}, {"{diagnostico}"}
              </p>
            </div>
            <Button onClick={handleCreate} disabled={isPending}>
              <SaveIcon className="mr-1.5 h-4 w-4" />
              Guardar plantilla
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Templates grid */}
      {templates.length === 0 && !showNew ? (
        <Card>
          <CardContent className="px-4 pt-0">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquareIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                No hay plantillas creadas
              </p>
              <p className="text-sm text-muted-foreground/80 mt-1 mb-4">
                Crea tu primera plantilla de WhatsApp para agilizar tu comunicación
              </p>
              <Button onClick={() => setShowNew(true)}>
                <PlusIcon className="mr-1.5 h-4 w-4" />
                Crear plantilla
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {CATEGORIES[category] ?? category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t) => {
                const isEditing = editingId === t.id;
                const vars: string[] = (() => {
                  try {
                    return JSON.parse(t.variables);
                  } catch {
                    return [];
                  }
                })();

                return (
                  <Card key={t.id} className={isEditing ? "border-primary" : ""}>
                    <CardHeader className="pb-2">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm((d) => ({ ...d, name: e.target.value }))
                            }
                            className="h-8 text-sm font-semibold"
                          />
                          <Select
                            value={editForm.category}
                            onValueChange={(v) =>
                              setEditForm((d) => ({ ...d, category: v ?? d.category }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(CATEGORIES).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={editForm.purpose}
                            onValueChange={(v) =>
                              setEditForm((d) => ({ ...d, purpose: v ?? d.purpose }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(PURPOSES).map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={editForm.stage}
                            onValueChange={(v) =>
                              setEditForm((d) => ({ ...d, stage: v ?? d.stage }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">Todas las etapas</SelectItem>
                              {PIPELINE_STAGES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {s}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={editForm.targetRole}
                            onValueChange={(v) =>
                              setEditForm((d) => ({ ...d, targetRole: v ?? d.targetRole }))
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">Todos los roles</SelectItem>
                              {ROLES.map((r) => (
                                <SelectItem key={r} value={r}>
                                  {r}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-sm">{t.name}</CardTitle>
                            <div className="flex items-center gap-1.5 mt-1">
                              <Badge variant="secondary" className="text-[10px]">
                                {CATEGORIES[t.category] ?? t.category}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">
                                {PURPOSES[t.purpose || "GENERAL"] ?? t.purpose}
                              </Badge>
                              {t.stage && (
                                <Badge variant="outline" className="text-[10px]">
                                  {t.stage}
                                </Badge>
                              )}
                              {t.targetRole && (
                                <Badge variant="outline" className="text-[10px]">
                                  {t.targetRole}
                                </Badge>
                              )}
                              {vars.length > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  {vars.length} variable{vars.length !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleCopy(t.body)}
                              title="Copiar mensaje"
                            >
                              <CopyIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => startEdit(t)}
                            >
                              <PencilIcon className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => handleDelete(t.id, t.name)}
                            >
                              <Trash2Icon className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent className="px-4 pt-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editForm.body}
                            onChange={(e) =>
                              setEditForm((d) => ({ ...d, body: e.target.value }))
                            }
                            rows={5}
                            className="text-xs"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleUpdate(t.id)}
                              disabled={isPending}
                            >
                              <SaveIcon className="mr-1 h-3.5 w-3.5" />
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingId(null)}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">
                          {t.body}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
