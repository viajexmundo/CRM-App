"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  updateFollowUpConfig,
  resetFollowUpDefaults,
} from "@/lib/actions/follow-up-config";
import { toast } from "sonner";
import {
  SaveIcon,
  RotateCcwIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface FollowUpConfigData {
  id: string;
  stepKey: string;
  label: string;
  description: string | null;
  dayOffset: number;
  hourOffset: number;
  sortOrder: number;
  isActive: boolean;
}

interface FollowUpConfigPanelProps {
  configs: FollowUpConfigData[];
}

const stepIcons: Record<string, string> = {
  CONFIRMACION: "0",
  CORTO: "1",
  VALOR: "3",
  URGENCIA: "5",
  CIERRE: "7",
  FINAL: "14",
};

const stepColors: Record<string, string> = {
  CONFIRMACION: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  CORTO: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  VALOR: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  URGENCIA: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  CIERRE: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  FINAL: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300",
};

export function FollowUpConfigPanel({ configs }: FollowUpConfigPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{
    dayOffset: number;
    hourOffset: number;
    label: string;
    isActive: boolean;
  }>({ dayOffset: 0, hourOffset: 0, label: "", isActive: true });

  const startEditing = (config: FollowUpConfigData) => {
    setEditingStep(config.stepKey);
    setEditValues({
      dayOffset: config.dayOffset,
      hourOffset: config.hourOffset,
      label: config.label,
      isActive: config.isActive,
    });
  };

  const handleSave = (stepKey: string) => {
    startTransition(async () => {
      const result = await updateFollowUpConfig(stepKey, {
        dayOffset: editValues.dayOffset,
        hourOffset: editValues.hourOffset,
        label: editValues.label,
        isActive: editValues.isActive,
      });

      if (result.success) {
        toast.success("Configuración actualizada");
        setEditingStep(null);
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al actualizar");
      }
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetFollowUpDefaults();
      if (result.success) {
        toast.success("Valores restablecidos a los predeterminados");
        router.refresh();
      } else {
        toast.error(result.error ?? "Error al restablecer");
      }
    });
  };

  const formatTiming = (dayOffset: number, hourOffset: number) => {
    if (dayOffset === 0 && hourOffset > 0) {
      return `${hourOffset} hora${hourOffset > 1 ? "s" : ""} después`;
    }
    if (dayOffset === 1) return "Día 1";
    return `Día ${dayOffset}`;
  };

  return (
    <div className="space-y-4">
      {/* Timeline visualization */}
      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
        <div className="space-y-0">
          {configs.map((config, index) => {
            const isEditing = editingStep === config.stepKey;
            const colorClass = stepColors[config.stepKey] ?? "bg-gray-100 text-gray-700";

            return (
              <div
                key={config.stepKey}
                className={`relative flex items-start gap-4 py-4 pl-2 ${
                  !config.isActive ? "opacity-50" : ""
                }`}
              >
                {/* Timeline dot */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    config.isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30 bg-muted text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Nombre del paso</Label>
                        <Input
                          value={editValues.label}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, label: e.target.value }))
                          }
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Días después</Label>
                          <Input
                            type="number"
                            min={0}
                            value={editValues.dayOffset}
                            onChange={(e) =>
                              setEditValues((v) => ({
                                ...v,
                                dayOffset: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Horas adicionales</Label>
                          <Input
                            type="number"
                            min={0}
                            max={23}
                            value={editValues.hourOffset}
                            onChange={(e) =>
                              setEditValues((v) => ({
                                ...v,
                                hourOffset: parseInt(e.target.value) || 0,
                              }))
                            }
                            className="h-8 text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editValues.isActive}
                          onCheckedChange={(checked) =>
                            setEditValues((v) => ({
                              ...v,
                              isActive: checked as boolean,
                            }))
                          }
                        />
                        <Label className="text-xs">Activo</Label>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(config.stepKey)}
                          disabled={isPending}
                          className="h-7 text-xs"
                        >
                          <SaveIcon className="mr-1 h-3 w-3" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingStep(null)}
                          className="h-7 text-xs"
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="group flex cursor-pointer items-start justify-between rounded-lg px-2 py-1 transition-colors hover:bg-muted/50"
                      onClick={() => startEditing(config)}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {config.label}
                          </span>
                          <Badge
                            variant="outline"
                            className={`border-transparent text-[10px] px-1.5 py-0 ${colorClass}`}
                          >
                            {formatTiming(config.dayOffset, config.hourOffset)}
                          </Badge>
                          {!config.isActive && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                              Inactivo
                            </Badge>
                          )}
                        </div>
                        {config.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {config.description}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        Editar
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset button */}
      <div className="flex justify-end border-t pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={isPending}
        >
          <RotateCcwIcon className="mr-1.5 h-3.5 w-3.5" />
          Restablecer valores predeterminados
        </Button>
      </div>
    </div>
  );
}
