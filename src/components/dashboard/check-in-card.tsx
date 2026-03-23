"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2Icon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { addCustomCheckInItem, removeCheckInItem, toggleCheckInItem } from "@/lib/actions/check-in";

interface CheckInCardProps {
  total: number;
  completed: number;
  items: Array<{
    id: string;
    title: string;
    isCompleted: boolean;
    source: string;
  }>;
}

export function CheckInCard({ total, completed, items }: CheckInCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newTodo, setNewTodo] = useState("");

  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const onToggle = (id: string, done: boolean) => {
    startTransition(async () => {
      const result = await toggleCheckInItem(id, done);
      if (!result.success) {
        toast.error(result.error ?? "No se pudo actualizar");
      } else {
        router.refresh();
      }
    });
  };

  const onAdd = () => {
    const title = newTodo.trim();
    if (!title) return;
    startTransition(async () => {
      const result = await addCustomCheckInItem(title);
      if (result.success) {
        setNewTodo("");
        router.refresh();
      } else {
        toast.error(result.error ?? "No se pudo agregar");
      }
    });
  };

  const onRemove = (id: string) => {
    startTransition(async () => {
      const result = await removeCheckInItem(id);
      if (!result.success) {
        toast.error(result.error ?? "No se pudo eliminar");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
          Check-in del día
        </CardTitle>
        <CardDescription>
          {completed}/{total} completadas ({progress}%)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-0 space-y-3">
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border px-2.5 py-2">
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={(e) => onToggle(item.id, e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 accent-emerald-600"
              />
              <p className={`flex-1 text-sm ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
                {item.title}
              </p>
              {item.source === "CUSTOM" && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => onRemove(item.id)}
                  disabled={isPending}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2Icon className="h-3.5 w-3.5" />
                </Button>
              )}
              <Badge variant={item.source === "CUSTOM" ? "outline" : "secondary"} className="text-[10px]">
                {item.source === "CUSTOM" ? "Personal" : "Base"}
              </Badge>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Input
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Agregar tarea personal de hoy..."
            className="h-8"
            disabled={isPending}
          />
          <Button size="sm" onClick={onAdd} disabled={isPending || !newTodo.trim()}>
            <PlusIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
