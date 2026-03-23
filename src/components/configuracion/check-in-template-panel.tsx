"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon, SaveIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  createCheckInTemplate,
  deleteCheckInTemplate,
  toggleCheckInTemplate,
  updateCheckInTemplate,
} from "@/lib/actions/check-in";

interface CheckInTemplatePanelProps {
  templates: Array<{
    id: string;
    title: string;
    isActive: boolean;
  }>;
}

export function CheckInTemplatePanel({ templates }: CheckInTemplatePanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newTitle, setNewTitle] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(templates.map((template) => [template.id, template.title]))
  );

  const onCreate = () => {
    const title = newTitle.trim();
    if (!title) return;
    startTransition(async () => {
      const result = await createCheckInTemplate(title);
      if (result.success) {
        setNewTitle("");
        router.refresh();
      } else {
        toast.error(result.error ?? "No se pudo crear");
      }
    });
  };

  const onSave = (id: string) => {
    const title = drafts[id]?.trim() ?? "";
    if (!title) return;
    startTransition(async () => {
      const result = await updateCheckInTemplate(id, title);
      if (!result.success) {
        toast.error(result.error ?? "No se pudo actualizar");
      } else {
        router.refresh();
      }
    });
  };

  const onToggle = (id: string, active: boolean) => {
    startTransition(async () => {
      const result = await toggleCheckInTemplate(id, active);
      if (!result.success) {
        toast.error(result.error ?? "No se pudo actualizar");
      } else {
        router.refresh();
      }
    });
  };

  const onDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteCheckInTemplate(id);
      if (!result.success) {
        toast.error(result.error ?? "No se pudo eliminar");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nueva tarea base para iniciar el día..."
          disabled={isPending}
        />
        <Button onClick={onCreate} disabled={isPending || !newTitle.trim()}>
          <PlusIcon className="mr-1 h-4 w-4" />
          Agregar
        </Button>
      </div>

      <div className="space-y-2">
        {templates.map((template) => (
          <div key={template.id} className="flex items-center gap-2 rounded-lg border p-2.5">
            <Input
              value={drafts[template.id] ?? ""}
              onChange={(e) =>
                setDrafts((prev) => ({
                  ...prev,
                  [template.id]: e.target.value,
                }))
              }
              disabled={isPending}
            />
            <div className="flex items-center gap-2">
              <Switch
                checked={template.isActive}
                onCheckedChange={(checked) => onToggle(template.id, Boolean(checked))}
                disabled={isPending}
              />
              <span className="text-xs text-muted-foreground min-w-[42px]">
                {template.isActive ? "Activa" : "Off"}
              </span>
            </div>
            <Button size="icon-sm" variant="outline" onClick={() => onSave(template.id)} disabled={isPending}>
              <SaveIcon className="h-4 w-4" />
            </Button>
            <Button
              size="icon-sm"
              variant="outline"
              className="text-destructive"
              onClick={() => onDelete(template.id)}
              disabled={isPending}
            >
              <Trash2Icon className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
