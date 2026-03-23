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
  CardDescription,
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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/common/status-badge";
import { EmptyState } from "@/components/common/empty-state";
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeDate,
} from "@/lib/utils/format";
import {
  PIPELINE_STAGE_CONFIG,
  PIPELINE_STAGE_ORDER,
  ALLOWED_TRANSITIONS,
} from "@/lib/constants/pipeline";
import type { PipelineStage } from "@/types";
import {
  DIAGNOSIS_QUESTIONS,
  calculateDiagnosisScore,
  getDiagnosisLabel,
} from "@/lib/constants/diagnosis";
import {
  STAGE_TEMPLATES,
  FOLLOW_UP_TEMPLATES,
  buildWhatsAppUrl,
  fillTemplate,
} from "@/lib/constants/whatsapp-templates";
import { STAGE_GUIDANCE } from "@/lib/constants/stage-guidance";
import { getTypeLabel, getChannelLabel, getSourceLabel } from "@/lib/constants/labels";
import type { FollowUpStep } from "@/types";
import { updateOpportunity, transitionStage, completeFollowUp, skipFollowUp, createAction, completeAction } from "@/lib/actions/opportunities";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import {
  ArrowLeftIcon,
  SaveIcon,
  ArrowRightIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  MessageSquareIcon,
  ClockIcon,
  DollarSignIcon,
  FileTextIcon,
  BriefcaseIcon,
  MapPinIcon,
  CheckCircle2Icon,
  CalendarClockIcon,
  SkipForwardIcon,
  CircleDotIcon,
  AlertCircleIcon,
  SendIcon,
  MoonIcon,
  ExternalLinkIcon,
  PlusIcon,
  XIcon,
  UndoIcon,
  PlaneIcon,
  UsersIcon,
  AlertTriangleIcon,
  Trash2Icon,
} from "lucide-react";

interface OpportunityDetailProps {
  currentUserRole?: string;
  opportunity: {
    id: string;
    title: string;
    stage: string;
    previousStage: string | null;
    probability: number | null;
    estimatedValue: number | null;
    currency: string | null;
    nextStepType: string | null;
    nextStepAction: string | null;
    nextStepDate: Date | string | null;
    nextStepChannel: string | null;
    segment: string | null;
    travelMotif: string | null;
    destination: string | null;
    departureDate: Date | string | null;
    returnDate: Date | string | null;
    passengers: number | null;
    priorities: string | null;
    restrictions: string | null;
    budgetMin: number | null;
    budgetMax: number | null;
    decisionMaker: string | null;
    decisionCriteria: string | null;
    specialRequests: string | null;
    diagnosisAnswers: string | null;
    diagnosisScore: number | null;
    closeReason: string | null;
    lostReason: string | null;
    stageChangedAt: Date | string | null;
    createdAt: Date | string;
    contact?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      preferredChannel: string | null;
    } | null;
    lead?: {
      id: string;
      destination: string | null;
      travelDates: string | null;
      passengers: number | null;
      budget: number | null;
      budgetCurrency: string | null;
      travelMotif: string | null;
      notes: string | null;
      source: string | null;
      interest: string | null;
    } | null;
    assignedTo?: {
      id: string;
      name: string;
    } | null;
    activities?: Array<{
      id: string;
      type: string;
      title: string;
      description: string | null;
      createdAt: Date | string;
      user?: { name: string } | null;
    }>;
    stageTransitions?: Array<{
      id: string;
      fromStage: string;
      toStage: string;
      reason: string | null;
      createdAt: Date | string;
      changedBy?: { name: string } | null;
    }>;
    followUps?: Array<{
      id: string;
      stepKey: string;
      label: string;
      scheduledAt: Date | string;
      completedAt: Date | string | null;
      completedById: string | null;
      notes: string | null;
      status: string;
      googleEventId?: string | null;
      googleEventUserId?: string | null;
      googleEventHtmlLink?: string | null;
      googleEventStatus?: string | null;
      googleEventUpdatedAt?: Date | string | null;
      googleMeetLink?: string | null;
    }>;
    actions?: Array<{
      id: string;
      type: string;
      action: string;
      channel: string | null;
      scheduledAt: Date | string | null;
      completedAt: Date | string | null;
      notes: string | null;
      status: string;
      createdAt: Date | string;
      googleEventId?: string | null;
      googleEventUserId?: string | null;
      googleEventHtmlLink?: string | null;
      googleEventStatus?: string | null;
      googleEventUpdatedAt?: Date | string | null;
      googleMeetLink?: string | null;
    }>;
  };
}

const activityIcons: Record<string, typeof PhoneIcon> = {
  CALL: PhoneIcon,
  EMAIL: MailIcon,
  WHATSAPP: MessageSquareIcon,
  MEETING: CalendarIcon,
  NOTE: MessageSquareIcon,
  STAGE_CHANGE: ArrowRightIcon,
  TASK: CheckCircle2Icon,
  PROPOSAL_SENT: FileTextIcon,
  PAYMENT_RECEIVED: DollarSignIcon,
};

function toDateTimeLocalInput(value: Date | string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function localDateTimeInputToIso(value: string): string {
  return new Date(value).toISOString();
}

export function OpportunityDetailClient({
  currentUserRole,
  opportunity,
}: OpportunityDetailProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { setPageTitle } = usePageTitle();

  // Set breadcrumb title
  useEffect(() => {
    setPageTitle(opportunity.id, opportunity.title);
  }, [opportunity.id, opportunity.title, setPageTitle]);

  // Next step form state (datetime-local format: YYYY-MM-DDTHH:MM)
  const [nextStep, setNextStep] = useState({
    nextStepType: opportunity.nextStepType ?? "",
    nextStepAction: opportunity.nextStepAction ?? "",
    nextStepDate: opportunity.nextStepDate
      ? toDateTimeLocalInput(opportunity.nextStepDate)
      : "",
    nextStepChannel: opportunity.nextStepChannel ?? "",
  });

  // Diagnosis questionnaire state
  const parsedDiagnosisAnswers: Record<string, string> = (() => {
    try {
      return opportunity.diagnosisAnswers ? JSON.parse(opportunity.diagnosisAnswers) : {};
    } catch { return {}; }
  })();
  const [diagnosisAnswers, setDiagnosisAnswers] = useState<Record<string, string>>(parsedDiagnosisAnswers);
  const diagnosisLiveScore = calculateDiagnosisScore(diagnosisAnswers);
  const diagnosisLabelInfo = getDiagnosisLabel(diagnosisLiveScore);
  const answeredCount = Object.keys(diagnosisAnswers).length;

  const [editingNextStep, setEditingNextStep] = useState(false);
  const [showLostDialog, setShowLostDialog] = useState(false);
  const [lostReason, setLostReason] = useState("");

  const stage = opportunity.stage as PipelineStage;
  const config = PIPELINE_STAGE_CONFIG[stage];
  const allowedTransitions = ALLOWED_TRANSITIONS[stage] ?? [];

  // Compute next sequential stage for "Realizado" button
  const currentIndex = PIPELINE_STAGE_ORDER.indexOf(stage);
  const nextStage: PipelineStage | null =
    currentIndex >= 0 && currentIndex < PIPELINE_STAGE_ORDER.length - 1
      ? PIPELINE_STAGE_ORDER[currentIndex + 1]
      : null;

  // In PERFILADO, auto-open diagnosis editing if questionnaire is empty
  const diagnosisEmpty = answeredCount === 0;
  const isPerfilado = stage === "PERFILADO";
  const [editingDiagnosis, setEditingDiagnosis] = useState(isPerfilado && diagnosisEmpty);

  const handleSaveNextStep = () => {
    startTransition(async () => {
      try {
        await updateOpportunity(opportunity.id, {
          nextStepType: nextStep.nextStepType || null,
          nextStepAction: nextStep.nextStepAction || null,
          nextStepDate: nextStep.nextStepDate
            ? localDateTimeInputToIso(nextStep.nextStepDate)
            : null,
          nextStepChannel: nextStep.nextStepChannel || null,
        });
        toast.success("Siguiente paso actualizado");
        setEditingNextStep(false);
        router.refresh();
      } catch {
        toast.error("Error al actualizar");
      }
    });
  };

  const handleSaveDiagnosis = () => {
    startTransition(async () => {
      try {
        const score = calculateDiagnosisScore(diagnosisAnswers);
        const result = await updateOpportunity(opportunity.id, {
          diagnosisAnswers: JSON.stringify(diagnosisAnswers),
          diagnosisScore: score,
        });
        if (result.success) {
          toast.success("Diagnóstico guardado");
          setEditingDiagnosis(false);
          router.refresh();
        } else {
          toast.error(result.error ?? "Error al guardar diagnóstico");
        }
      } catch {
        toast.error("Error al guardar diagnóstico");
      }
    });
  };

  const handleTransition = (toStage: PipelineStage) => {
    startTransition(async () => {
      try {
        const result = await transitionStage(opportunity.id, toStage);
        if (result.success) {
          // Confetti easter egg for VENTA_CERRADA
          if (toStage === "VENTA_CERRADA") {
            const duration = 3000;
            const end = Date.now() + duration;
            const colors = ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ec4899"];
            const frame = () => {
              confetti({
                particleCount: 4,
                angle: 60,
                spread: 55,
                origin: { x: 0, y: 0.7 },
                colors,
              });
              confetti({
                particleCount: 4,
                angle: 120,
                spread: 55,
                origin: { x: 1, y: 0.7 },
                colors,
              });
              if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();
            toast.success("🎉 ¡Venta cerrada! ¡Felicidades!", { duration: 5000 });
          } else {
            toast.success(
              `Etapa cambiada a "${PIPELINE_STAGE_CONFIG[toStage].label}"`
            );
          }
          router.refresh();
        } else {
          toast.error(result.error ?? "Error al cambiar etapa");
        }
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Error al cambiar etapa";
        toast.error(msg);
      }
    });
  };

  const contactName = opportunity.contact
    ? `${opportunity.contact.firstName} ${opportunity.contact.lastName}`
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/oportunidades")}
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{opportunity.title}</h1>
              <StatusBadge type="pipeline" value={opportunity.stage} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {contactName && <span>{contactName}</span>}
              {opportunity.estimatedValue != null && (
                <>
                  <span>&middot;</span>
                  <span className="font-semibold text-foreground">
                    {formatCurrency(opportunity.estimatedValue)}
                  </span>
                </>
              )}
              {opportunity.assignedTo && (
                <>
                  <span>&middot;</span>
                  <span>Asignado a {opportunity.assignedTo.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* WhatsApp Quick Action */}
        {opportunity.contact?.phone && (
          <WhatsAppButton
            phone={opportunity.contact.phone}
            contactFirstName={opportunity.contact.firstName}
            stage={stage}
            destination={opportunity.destination}
          />
        )}
      </div>

      {/* Stage Transition Buttons */}
      {allowedTransitions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary "Realizado" button to advance to next sequential stage */}
          {nextStage && allowedTransitions.includes(nextStage) && (
            stage === "PROPUESTA_EN_PREPARACION" && nextStage === "COTIZACION_EN_SEGUIMIENTO" ? (
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={() => handleTransition(nextStage)}
                disabled={isPending}
              >
                <SendIcon className="mr-1.5 h-4 w-4" />
                Cotización enviada
              </Button>
            ) : (
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleTransition(nextStage)}
                disabled={isPending}
              >
                <CheckCircle2Icon className="mr-1.5 h-4 w-4" />
                Realizado → {PIPELINE_STAGE_CONFIG[nextStage].label}
              </Button>
            )
          )}

          {/* Secondary transition buttons */}
          {allowedTransitions
            .filter((t) => t !== nextStage)
            .map((target) => {
              const targetConfig = PIPELINE_STAGE_CONFIG[target];
              if (target === "DORMIDO") {
                return (
                  <Button
                    key={target}
                    variant="outline"
                    size="sm"
                    className="border-slate-300 text-slate-600 hover:bg-slate-100"
                    onClick={() => handleTransition(target)}
                    disabled={isPending}
                  >
                    <MoonIcon className="mr-1 h-3.5 w-3.5" />
                    Dormir
                  </Button>
                );
              }
              if (target === "CERRADO_PERDIDO") {
                return (
                  <Button
                    key={target}
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowLostDialog(true)}
                    disabled={isPending}
                  >
                    <XIcon className="mr-1 h-3.5 w-3.5" />
                    Perdido
                  </Button>
                );
              }
              return (
                <Button
                  key={target}
                  variant="outline"
                  size="sm"
                  onClick={() => handleTransition(target)}
                  disabled={isPending}
                >
                  <ArrowRightIcon className="mr-1 h-3.5 w-3.5" />
                  {targetConfig.label}
                </Button>
              );
            })}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue={(stage === "COTIZACION_EN_SEGUIMIENTO" || stage === "APARTADO") && opportunity.followUps && opportunity.followUps.some(f => f.status === "PENDING") ? "seguimiento" : "detail"}>
        <TabsList>
          <TabsTrigger value="detail">Detalle</TabsTrigger>
          {opportunity.followUps && opportunity.followUps.length > 0 &&
           (stage === "COTIZACION_EN_SEGUIMIENTO" || stage === "APARTADO") && (
            <TabsTrigger value="seguimiento">
              Seguimiento
              {opportunity.followUps.filter((f) => f.status === "PENDING").length > 0 && (
                <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {opportunity.followUps.filter((f) => f.status === "PENDING").length}
                </span>
              )}
            </TabsTrigger>
          )}
          <TabsTrigger value="viaje">Info del viaje</TabsTrigger>
        </TabsList>

        {/* Detail Tab */}
        <TabsContent value="detail">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Diagnosis Questionnaire — shown FIRST in PERFILADO with highlighted border */}
            {isPerfilado && (
              <Card className="lg:col-span-2 border-2 border-indigo-400 dark:border-indigo-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Diagnóstico del Lead
                        {answeredCount > 0 && (
                          <span className={`text-sm font-semibold ${diagnosisLabelInfo.color}`}>
                            {diagnosisLiveScore} pts — {diagnosisLabelInfo.label}
                          </span>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Responde las preguntas para evaluar la probabilidad de cierre de este cliente.
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingDiagnosis(!editingDiagnosis)}
                    >
                      {editingDiagnosis ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pt-0 space-y-4">
                  {editingDiagnosis ? (
                    <>
                      {DIAGNOSIS_QUESTIONS.map((q) => (
                        <div key={q.key} className="space-y-2 rounded-lg border p-3">
                          <p className="text-sm font-semibold">{q.question}</p>
                          <p className="text-xs text-muted-foreground">{q.description}</p>
                          <div className="space-y-1.5">
                            {q.options.map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-sm transition-colors ${
                                  diagnosisAnswers[q.key] === opt.value
                                    ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                                    : "border-transparent hover:bg-muted/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={q.key}
                                  value={opt.value}
                                  checked={diagnosisAnswers[q.key] === opt.value}
                                  onChange={() =>
                                    setDiagnosisAnswers((prev) => ({ ...prev, [q.key]: opt.value }))
                                  }
                                  className="accent-indigo-600"
                                />
                                <span className="flex-1">{opt.label}</span>
                                <span className="text-xs text-muted-foreground">{opt.score} pts</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      {/* Live score summary */}
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium">Puntaje total</p>
                          <p className="text-xs text-muted-foreground">
                            {answeredCount} de {DIAGNOSIS_QUESTIONS.length} preguntas respondidas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${diagnosisLabelInfo.color}`}>
                            {diagnosisLiveScore}
                          </p>
                          <p className={`text-xs font-medium ${diagnosisLabelInfo.color}`}>
                            {diagnosisLabelInfo.label}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={handleSaveDiagnosis}
                        disabled={isPending || answeredCount === 0}
                        size="sm"
                      >
                        <SaveIcon className="mr-1.5 h-3.5 w-3.5" />
                        Guardar diagnóstico
                      </Button>
                    </>
                  ) : (
                    <>
                      {answeredCount > 0 ? (
                        <div className="space-y-3">
                          {DIAGNOSIS_QUESTIONS.map((q) => {
                            const selectedValue = parsedDiagnosisAnswers[q.key];
                            const selectedOption = q.options.find((o) => o.value === selectedValue);
                            return (
                              <div key={q.key} className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{q.question}</span>
                                <span className="font-medium">
                                  {selectedOption?.label ?? "—"}
                                </span>
                              </div>
                            );
                          })}
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Puntaje total</span>
                            <span className={`text-lg font-bold ${diagnosisLabelInfo.color}`}>
                              {opportunity.diagnosisScore ?? diagnosisLiveScore} — {diagnosisLabelInfo.label}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">
                          No se ha completado el diagnóstico. Haz clic en &quot;Editar&quot; para comenzar.
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stage Guidance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-indigo-500" />
                  {STAGE_GUIDANCE[stage]?.title ?? "Siguiente paso"}
                </CardTitle>
                <CardDescription>
                  {STAGE_GUIDANCE[stage]?.description ?? ""}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pt-0">
                <ul className="space-y-1.5">
                  {(STAGE_GUIDANCE[stage]?.tips ?? []).map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Acciones Card */}
            <ActionsCard
              opportunityId={opportunity.id}
              actions={opportunity.actions ?? []}
              isAdmin={currentUserRole === "ADMIN"}
              isPending={isPending}
              startTransition={startTransition}
              onRefresh={() => router.refresh()}
            />

            {/* Diagnosis Score (non-PERFILADO stages) */}
            {!isPerfilado && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Diagnóstico</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingDiagnosis(!editingDiagnosis)}
                    >
                      {editingDiagnosis ? "Cancelar" : "Editar"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pt-0 space-y-3">
                  {editingDiagnosis ? (
                    <>
                      {DIAGNOSIS_QUESTIONS.map((q) => (
                        <div key={q.key} className="space-y-2 rounded-lg border p-3">
                          <p className="text-sm font-semibold">{q.question}</p>
                          <div className="space-y-1">
                            {q.options.map((opt) => (
                              <label
                                key={opt.value}
                                className={`flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-1.5 text-sm transition-colors ${
                                  diagnosisAnswers[q.key] === opt.value
                                    ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                                    : "border-transparent hover:bg-muted/50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`diag-${q.key}`}
                                  value={opt.value}
                                  checked={diagnosisAnswers[q.key] === opt.value}
                                  onChange={() =>
                                    setDiagnosisAnswers((prev) => ({ ...prev, [q.key]: opt.value }))
                                  }
                                  className="accent-indigo-600"
                                />
                                <span className="flex-1">{opt.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                        <span className="text-sm font-medium">Puntaje: </span>
                        <span className={`text-lg font-bold ${diagnosisLabelInfo.color}`}>
                          {diagnosisLiveScore} — {diagnosisLabelInfo.label}
                        </span>
                      </div>
                      <Button onClick={handleSaveDiagnosis} disabled={isPending || answeredCount === 0} size="sm">
                        <SaveIcon className="mr-1.5 h-3.5 w-3.5" />
                        Guardar
                      </Button>
                    </>
                  ) : answeredCount > 0 ? (
                    <div className="space-y-2">
                      {DIAGNOSIS_QUESTIONS.map((q) => {
                        const selectedValue = parsedDiagnosisAnswers[q.key];
                        const selectedOption = q.options.find((o) => o.value === selectedValue);
                        return (
                          <div key={q.key} className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{q.question}</span>
                            <span className="font-medium text-right max-w-[50%] truncate">
                              {selectedOption?.label ?? "—"}
                            </span>
                          </div>
                        );
                      })}
                      <Separator />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Puntaje</span>
                        <span className={`text-lg font-bold ${diagnosisLabelInfo.color}`}>
                          {opportunity.diagnosisScore ?? diagnosisLiveScore} — {diagnosisLabelInfo.label}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      Sin diagnóstico
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Stage History */}
            {opportunity.stageTransitions &&
              opportunity.stageTransitions.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Historial de etapas</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pt-0">
                    <div className="relative ml-4 border-l border-border pl-6">
                      {opportunity.stageTransitions.map((transition) => (
                        <div
                          key={transition.id}
                          className="relative pb-4 last:pb-0"
                        >
                          <div className="absolute -left-[calc(1.5rem+1px)] top-0 flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                            <ArrowRightIcon className="h-3 w-3 text-muted-foreground" />
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge
                              type="pipeline"
                              value={transition.fromStage}
                            />
                            <ArrowRightIcon className="h-3 w-3 text-muted-foreground" />
                            <StatusBadge
                              type="pipeline"
                              value={transition.toStage}
                            />
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <span>
                              {formatRelativeDate(transition.createdAt)}
                            </span>
                            {transition.changedBy && (
                              <>
                                <span>&middot;</span>
                                <span>{transition.changedBy.name}</span>
                              </>
                            )}
                            {transition.reason && (
                              <>
                                <span>&middot;</span>
                                <span>{transition.reason}</span>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>
        </TabsContent>

        {/* Seguimiento Tab */}
        {opportunity.followUps && opportunity.followUps.length > 0 &&
         (stage === "COTIZACION_EN_SEGUIMIENTO" || stage === "APARTADO") && (
          <TabsContent value="seguimiento">
            <FollowUpTimeline
              followUps={opportunity.followUps}
              isAdmin={currentUserRole === "ADMIN"}
              isPending={isPending}
              startTransition={startTransition}
              onRefresh={() => router.refresh()}
              contactPhone={opportunity.contact?.phone ?? null}
              contactFirstName={opportunity.contact?.firstName ?? ""}
            />
          </TabsContent>
        )}

        {/* Info del Viaje Tab */}
        <TabsContent value="viaje">
          <TripInfoTab
            opportunity={opportunity}
            isPending={isPending}
            startTransition={startTransition}
            onRefresh={() => router.refresh()}
          />
        </TabsContent>
      </Tabs>

      {/* Lost confirmation dialog */}
      {showLostDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Marcar como perdido</h3>
                <p className="text-sm text-muted-foreground">
                  Esta oportunidad se moverá a &quot;Cerrado Perdido&quot;
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              La oportunidad se archivará y no aparecerá en tu pipeline activo.
              Si fue un error, podrás reactivarla desde la vista de detalle.
            </p>
            <div className="space-y-1.5 mb-4">
              <Label>Motivo (opcional)</Label>
              <Textarea
                value={lostReason}
                onChange={(e) => setLostReason(e.target.value)}
                placeholder="¿Por qué se perdió esta oportunidad? Ej: eligió otra agencia, no le interesó el precio..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLostDialog(false);
                  setLostReason("");
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await transitionStage(
                      opportunity.id,
                      "CERRADO_PERDIDO",
                      lostReason || undefined
                    );
                    if (result.success) {
                      toast.success("Oportunidad marcada como perdida");
                      setShowLostDialog(false);
                      setLostReason("");
                      router.refresh();
                    } else {
                      toast.error(result.error ?? "Error");
                    }
                  });
                }}
              >
                Confirmar: Perdido
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Undo banner for CERRADO_PERDIDO */}
      {stage === "CERRADO_PERDIDO" && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="px-4 pt-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">
                    Esta oportunidad está marcada como perdida
                  </p>
                  {opportunity.lostReason && (
                    <p className="text-xs text-red-600/70 dark:text-red-400/70">
                      Motivo: {opportunity.lostReason}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-100"
                onClick={() => handleTransition("LEAD_NUEVO")}
                disabled={isPending}
              >
                <UndoIcon className="mr-1.5 h-3.5 w-3.5" />
                Reactivar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper component
function InfoRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | null;
  icon?: typeof UserIcon;
}) {
  return (
    <div className="flex items-start gap-2">
      {Icon && <Icon className="mt-0.5 h-3.5 w-3.5 text-muted-foreground" />}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{value || "\u2014"}</p>
      </div>
    </div>
  );
}

// Follow-up Timeline Component
function FollowUpTimeline({
  followUps,
  isAdmin,
  isPending,
  startTransition,
  onRefresh,
  contactPhone,
  contactFirstName,
}: {
  followUps: Array<{
    id: string;
    stepKey: string;
    label: string;
    scheduledAt: Date | string;
    completedAt: Date | string | null;
    completedById: string | null;
      notes: string | null;
      status: string;
      googleEventId?: string | null;
      googleEventUserId?: string | null;
      googleEventHtmlLink?: string | null;
      googleEventStatus?: string | null;
      googleEventUpdatedAt?: Date | string | null;
      googleMeetLink?: string | null;
    }>;
  isAdmin: boolean;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
  onRefresh: () => void;
  contactPhone: string | null;
  contactFirstName: string;
}) {
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [clockNow, setClockNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setClockNow(Date.now());
    }, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const handleComplete = (followUpId: string) => {
    startTransition(async () => {
      const result = await completeFollowUp(followUpId, notes);
      if (result.success) {
        toast.success("Seguimiento completado");
        setCompletingId(null);
        setNotes("");
        onRefresh();
      } else {
        toast.error(result.error ?? "Error al completar");
      }
    });
  };

  const handleSkip = (followUpId: string) => {
    startTransition(async () => {
      const result = await skipFollowUp(followUpId, "Omitido por el vendedor");
      if (result.success) {
        toast.success("Seguimiento omitido");
        onRefresh();
      } else {
        toast.error(result.error ?? "Error al omitir");
      }
    });
  };

  const stepColorMap: Record<string, string> = {
    CONFIRMACION: "border-blue-400 bg-blue-50 dark:bg-blue-950/20",
    CORTO: "border-green-400 bg-green-50 dark:bg-green-950/20",
    VALOR: "border-violet-400 bg-violet-50 dark:bg-violet-950/20",
    URGENCIA: "border-orange-400 bg-orange-50 dark:bg-orange-950/20",
    CIERRE: "border-red-400 bg-red-50 dark:bg-red-950/20",
    FINAL: "border-gray-400 bg-gray-50 dark:bg-gray-950/20",
  };

  const now = new Date(clockNow);

  const formatCountdown = (deltaMs: number) => {
    const sign = deltaMs >= 0 ? "+" : "-";
    const absMinutes = Math.floor(Math.abs(deltaMs) / 60_000);
    const days = Math.floor(absMinutes / (24 * 60));
    const hours = Math.floor((absMinutes % (24 * 60)) / 60);
    const minutes = absMinutes % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    parts.push(`${minutes}m`);

    return `${sign}${parts.join(" ")}`;
  };

  const formatLongDateTime = (value: Date | string) => {
    const date = new Date(value);
    const parts = new Intl.DateTimeFormat("es-GT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).formatToParts(date);

    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    const day = parts.find((p) => p.type === "day")?.value ?? "";
    const month = parts.find((p) => p.type === "month")?.value ?? "";
    const hour = date.toLocaleTimeString("es-GT", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

    return `${cap(weekday)} ${day} de ${cap(month)}, ${hour}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClockIcon className="h-4 w-4 text-amber-500" />
            Cronograma de seguimiento
          </CardTitle>
          <CardDescription>
            Sigue el cronograma de contacto con el cliente para cerrar la venta
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-1">
              {followUps.map((fu, index) => {
                const scheduled = new Date(fu.scheduledAt);
                const isOverdue = fu.status === "PENDING" && scheduled < now;
                const isCompleting = completingId === fu.id;
                const borderColor = stepColorMap[fu.stepKey] ?? "border-gray-400 bg-gray-50";
                const countdownBase = fu.status === "COMPLETED" && fu.completedAt
                  ? new Date(fu.completedAt)
                  : now;
                const countdownDeltaMs = countdownBase.getTime() - scheduled.getTime();
                const countdownClass = countdownDeltaMs < 0
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-600 dark:text-red-400";

                return (
                  <div key={fu.id} className="relative flex items-start gap-3 py-3 pl-1">
                    {/* Status icon */}
                    <div className="relative z-10 shrink-0">
                      {fu.status === "COMPLETED" ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                          <CheckCircle2Icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                      ) : fu.status === "SKIPPED" ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                          <SkipForwardIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      ) : isOverdue ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 animate-pulse">
                          <AlertCircleIcon className="h-4 w-4 text-red-500" />
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                          <CircleDotIcon className="h-4 w-4 text-amber-500" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 rounded-lg border-l-4 p-3 ${borderColor}`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-semibold">
                            #{index + 1} {fu.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            Fecha objetivo: {formatLongDateTime(fu.scheduledAt)}
                          </p>
                          <p className={`mt-1 text-base font-bold ${countdownClass}`}>
                            Completar en: {formatCountdown(countdownDeltaMs)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {fu.status === "COMPLETED" && fu.completedAt
                              ? `Completado: ${formatLongDateTime(fu.completedAt)}`
                              : fu.status === "SKIPPED"
                              ? "Omitido"
                              : isOverdue
                              ? "Pendiente vencido"
                              : "Pendiente en tiempo"}
                          </p>
                          {fu.notes && (
                            <p className="mt-1 text-xs text-muted-foreground italic">
                              {fu.notes}
                            </p>
                          )}
                          {isAdmin && (
                            <div className="mt-2 rounded-md border border-dashed border-sky-300/60 bg-sky-50/40 p-2 text-[11px] text-sky-900 dark:border-sky-800 dark:bg-sky-950/20 dark:text-sky-200">
                              <p className="font-semibold">Diagnóstico Calendar (Admin)</p>
                              <p>
                                Estado: {fu.googleEventStatus ?? "sin sincronizar"}{" "}
                                {fu.googleEventId ? `· ID: ${fu.googleEventId}` : ""}
                              </p>
                              <p>
                                Última sync:{" "}
                                {fu.googleEventUpdatedAt
                                  ? formatDateTime(fu.googleEventUpdatedAt)
                                  : "—"}
                              </p>
                              {fu.googleMeetLink && (
                                <a
                                  href={fu.googleMeetLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-0.5 inline-flex items-center gap-1 text-sky-700 underline dark:text-sky-300"
                                >
                                  Abrir Meet
                                  <ExternalLinkIcon className="h-3 w-3" />
                                </a>
                              )}
                              {fu.googleEventHtmlLink && (
                                <a
                                  href={fu.googleEventHtmlLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="mt-0.5 ml-2 inline-flex items-center gap-1 text-sky-700 underline dark:text-sky-300"
                                >
                                  Abrir evento
                                  <ExternalLinkIcon className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          )}
                        </div>

                        {fu.status === "PENDING" && !isCompleting && (
                          <div className="flex gap-1 shrink-0 ml-2">
                            {contactPhone && FOLLOW_UP_TEMPLATES[fu.stepKey as FollowUpStep] && (
                              <a
                                href={buildWhatsAppUrl(
                                  contactPhone,
                                  fillTemplate(
                                    FOLLOW_UP_TEMPLATES[fu.stepKey as FollowUpStep].message,
                                    { nombre: contactFirstName }
                                  )
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 text-xs text-green-700 border-green-300 hover:bg-green-50"
                                  type="button"
                                >
                                  <MessageSquareIcon className="mr-1 h-3 w-3" />
                                  WhatsApp
                                </Button>
                              </a>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => {
                                setCompletingId(fu.id);
                                setNotes("");
                              }}
                              disabled={isPending}
                            >
                              <CheckCircle2Icon className="mr-1 h-3 w-3" />
                              Completar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-muted-foreground"
                              onClick={() => handleSkip(fu.id)}
                              disabled={isPending}
                            >
                              <SkipForwardIcon className="mr-1 h-3 w-3" />
                              Omitir
                            </Button>
                          </div>
                        )}
                      </div>

                      {isCompleting && (
                        <div className="mt-2 space-y-2">
                          <Textarea
                            placeholder="Notas del seguimiento..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="text-sm"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleComplete(fu.id)}
                              disabled={isPending}
                              className="h-7 text-xs"
                            >
                              <SaveIcon className="mr-1 h-3 w-3" />
                              Guardar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCompletingId(null)}
                              className="h-7 text-xs"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// WhatsApp Button Component with stage-based templates
function WhatsAppButton({
  phone,
  contactFirstName,
  stage,
  destination,
}: {
  phone: string;
  contactFirstName: string;
  stage: PipelineStage;
  destination: string | null;
}) {
  const [showTemplates, setShowTemplates] = useState(false);
  const templates = STAGE_TEMPLATES[stage] ?? [];

  const templateVars = {
    nombre: contactFirstName,
    destino: destination ?? "su destino",
    asesor: "tu asesor",
  };

  // Default: open WhatsApp with first template or empty
  const defaultMessage = templates.length > 0
    ? fillTemplate(templates[0].message, templateVars)
    : "";
  const defaultUrl = buildWhatsAppUrl(phone, defaultMessage);

  return (
    <div className="relative shrink-0">
      <div className="flex gap-1">
        <a href={defaultUrl} target="_blank" rel="noopener noreferrer">
          <Button
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white h-9"
          >
            <MessageSquareIcon className="mr-1.5 h-4 w-4" />
            WhatsApp
          </Button>
        </a>
        {templates.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 px-2 border-green-300 text-green-700 hover:bg-green-50"
            onClick={() => setShowTemplates(!showTemplates)}
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Template dropdown */}
      {showTemplates && templates.length > 0 && (
        <div className="absolute right-0 top-full mt-1 z-50 w-80 rounded-lg border bg-background p-2 shadow-lg">
          <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">
            Plantillas de mensaje
          </p>
          {templates.map((tmpl, idx) => {
            const msg = fillTemplate(tmpl.message, templateVars);
            const url = buildWhatsAppUrl(phone, msg);
            return (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
                onClick={() => setShowTemplates(false)}
              >
                <p className="font-medium text-green-700">{tmpl.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {msg}
                </p>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ==================== Actions Card (multi-action support) ====================

function ActionsCard({
  opportunityId,
  actions,
  isAdmin,
  isPending,
  startTransition,
  onRefresh,
}: {
  opportunityId: string;
  actions: Array<{
    id: string;
    type: string;
    action: string;
    channel: string | null;
    scheduledAt: Date | string | null;
    completedAt: Date | string | null;
    notes: string | null;
    status: string;
    createdAt: Date | string;
    googleEventId?: string | null;
    googleEventUserId?: string | null;
    googleEventHtmlLink?: string | null;
    googleEventStatus?: string | null;
    googleEventUpdatedAt?: Date | string | null;
    googleMeetLink?: string | null;
  }>;
  isAdmin: boolean;
  isPending: boolean;
  startTransition: (fn: () => void) => void;
  onRefresh: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: "",
    action: "",
    channel: "",
    scheduledAt: "",
  });

  const pendingActions = actions.filter((a) => a.status === "PENDING");
  const completedActions = actions.filter((a) => a.status === "COMPLETED");

  const handleCreate = () => {
    if (!form.action.trim() || !form.type) {
      toast.error("Completa el tipo y la descripción de la acción");
      return;
    }
    startTransition(async () => {
      const result = await createAction(opportunityId, {
        type: form.type,
        action: form.action,
        channel: form.channel || undefined,
        scheduledAt: form.scheduledAt ? localDateTimeInputToIso(form.scheduledAt) : null,
      });
      if (result.success) {
        toast.success("Acción creada");
        setForm({ type: "", action: "", channel: "", scheduledAt: "" });
        setShowForm(false);
        onRefresh();
      } else {
        toast.error(result.error ?? "Error al crear");
      }
    });
  };

  const handleComplete = (actionId: string) => {
    startTransition(async () => {
      const result = await completeAction(actionId);
      if (result.success) {
        toast.success("Acción completada");
        onRefresh();
      } else {
        toast.error(result.error ?? "Error al completar");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarClockIcon className="h-4 w-4 text-amber-500" />
            Acciones
            {pendingActions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {pendingActions.length} pendiente{pendingActions.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? (
              <>
                <XIcon className="mr-1 h-3.5 w-3.5" />
                Cancelar
              </>
            ) : (
              <>
                <PlusIcon className="mr-1 h-3.5 w-3.5" />
                Nueva
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pt-0 space-y-3">
        {/* New action form */}
        {showForm && (
          <div className="space-y-2 rounded-lg border border-dashed border-amber-300 bg-amber-50/50 dark:bg-amber-950/10 p-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((d) => ({ ...d, type: v ?? d.type }))}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Tipo..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CALL">Llamada</SelectItem>
                    <SelectItem value="EMAIL">Correo</SelectItem>
                    <SelectItem value="MEETING">Reunión</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="FOLLOW_UP">Seguimiento</SelectItem>
                    <SelectItem value="PROPOSAL">Propuesta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Canal</Label>
                <Select
                  value={form.channel}
                  onValueChange={(v) => setForm((d) => ({ ...d, channel: v ?? d.channel }))}
                >
                  <SelectTrigger className="w-full h-8 text-xs">
                    <SelectValue placeholder="Canal..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Correo</SelectItem>
                    <SelectItem value="PHONE">Teléfono</SelectItem>
                    <SelectItem value="GOOGLE_MEET">Google Meet</SelectItem>
                    <SelectItem value="ZOOM">Zoom</SelectItem>
                    <SelectItem value="IN_PERSON">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descripción</Label>
              <Input
                value={form.action}
                onChange={(e) => setForm((d) => ({ ...d, action: e.target.value }))}
                placeholder="Ej: Enviar propuesta personalizada..."
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fecha y hora (opcional)</Label>
              <Input
                type="datetime-local"
                value={form.scheduledAt}
                onChange={(e) => setForm((d) => ({ ...d, scheduledAt: e.target.value }))}
                className="h-8 text-xs"
              />
            </div>
            <Button onClick={handleCreate} disabled={isPending} size="sm" className="w-full">
              <PlusIcon className="mr-1.5 h-3.5 w-3.5" />
              Agregar acción
            </Button>
          </div>
        )}

        {/* Pending actions */}
        {pendingActions.length > 0 ? (
          <div className="space-y-2">
            {pendingActions.map((a) => {
              const isOverdue = a.scheduledAt && new Date(a.scheduledAt) < new Date();
              return (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    isOverdue
                      ? "border-red-200 bg-red-50/50 dark:bg-red-950/10"
                      : "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.action}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5 border">
                        {getTypeLabel(a.type)}
                      </span>
                      {a.channel && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-background px-1.5 py-0.5 border">
                          {getChannelLabel(a.channel)}
                        </span>
                      )}
                      {a.scheduledAt && (
                        <span className={`inline-flex items-center gap-1 ${isOverdue ? "text-red-500 font-medium" : ""}`}>
                          <CalendarIcon className="h-3 w-3" />
                          {isOverdue && "Vencida: "}
                          {formatDateTime(a.scheduledAt)}
                        </span>
                      )}
                    </div>
                    {isAdmin && (
                      <div className="mt-2 rounded-md border border-dashed border-sky-300/60 bg-sky-50/40 p-2 text-[11px] text-sky-900 dark:border-sky-800 dark:bg-sky-950/20 dark:text-sky-200">
                        <p className="font-semibold">Diagnóstico Calendar (Admin)</p>
                        <p>
                          Estado: {a.googleEventStatus ?? "sin sincronizar"}{" "}
                          {a.googleEventId ? `· ID: ${a.googleEventId}` : ""}
                        </p>
                        <p>
                          Última sync:{" "}
                          {a.googleEventUpdatedAt
                            ? formatDateTime(a.googleEventUpdatedAt)
                            : "—"}
                        </p>
                        {a.googleMeetLink && (
                          <a
                            href={a.googleMeetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-sky-700 underline dark:text-sky-300"
                          >
                            Abrir Meet
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        )}
                        {a.googleEventHtmlLink && (
                          <a
                            href={a.googleEventHtmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 ml-2 inline-flex items-center gap-1 text-sky-700 underline dark:text-sky-300"
                          >
                            Abrir evento
                            <ExternalLinkIcon className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                    onClick={() => handleComplete(a.id)}
                    disabled={isPending}
                  >
                    <CheckCircle2Icon className="mr-1 h-3.5 w-3.5" />
                    Hecho
                  </Button>
                </div>
              );
            })}
          </div>
        ) : !showForm ? (
          <p className="text-sm text-muted-foreground py-2 text-center">
            No hay acciones pendientes. Haz clic en &quot;Nueva&quot; para agregar una.
          </p>
        ) : null}

        {/* Completed actions (collapsed) */}
        {completedActions.length > 0 && (
          <details className="group">
            <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors">
              {completedActions.length} acción{completedActions.length !== 1 ? "es" : ""} completada{completedActions.length !== 1 ? "s" : ""}
            </summary>
            <div className="mt-2 space-y-1.5">
              {completedActions.slice(0, 10).map((a) => (
                <div key={a.id} className="flex items-start gap-2 rounded-md bg-muted/30 px-3 py-2">
                  <CheckCircle2Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium line-through text-muted-foreground">
                      {a.action}
                    </p>
                    <div className="flex gap-2 text-[10px] text-muted-foreground">
                      <span>{getTypeLabel(a.type)}</span>
                      {a.completedAt && <span>&middot; {formatRelativeDate(a.completedAt)}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== Trip Info Tab ====================

function TripInfoTab({
  opportunity,
  isPending,
  startTransition,
  onRefresh,
}: {
  opportunity: OpportunityDetailProps["opportunity"];
  isPending: boolean;
  startTransition: (fn: () => void) => void;
  onRefresh: () => void;
}) {
  const parseMoneyValue = (value: string): number | undefined => {
    const normalized = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
    if (!normalized) return undefined;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    destination: opportunity.destination ?? "",
    departureDate: opportunity.departureDate
      ? new Date(opportunity.departureDate).toISOString().split("T")[0]
      : "",
    returnDate: opportunity.returnDate
      ? new Date(opportunity.returnDate).toISOString().split("T")[0]
      : "",
    passengers: opportunity.passengers?.toString() ?? "",
    travelMotif: opportunity.travelMotif ?? "",
    segment: opportunity.segment ?? "",
    specialRequests: opportunity.specialRequests ?? "",
    estimatedValue: opportunity.estimatedValue?.toString() ?? "",
  });

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateOpportunity(opportunity.id, {
        destination: form.destination || null,
        departureDate: form.departureDate ? new Date(form.departureDate) : null,
        returnDate: form.returnDate ? new Date(form.returnDate) : null,
        passengers: form.passengers ? parseInt(form.passengers) : null,
        budgetMin: null,
        budgetMax: null,
        travelMotif: form.travelMotif || null,
        segment: form.segment || null,
        specialRequests: form.specialRequests || null,
        estimatedValue: parseMoneyValue(form.estimatedValue) ?? 0,
      });
      if (result.success) {
        toast.success("Información actualizada");
        setEditing(false);
        onRefresh();
      } else {
        toast.error(result.error ?? "Error al guardar");
      }
    });
  };

  const leadDates = (() => {
    try {
      return opportunity.lead?.travelDates ? JSON.parse(opportunity.lead.travelDates) : null;
    } catch { return null; }
  })();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Trip Details Card */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PlaneIcon className="h-4 w-4 text-blue-500" />
              Detalles del viaje
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(!editing)}
            >
              {editing ? "Cancelar" : "Editar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          {editing ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Destino</Label>
                  <Input
                    value={form.destination}
                    onChange={(e) => setForm((d) => ({ ...d, destination: e.target.value }))}
                    placeholder="Ej: Cancún, México"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Motivo del viaje</Label>
                  <Select
                    value={form.travelMotif}
                    onValueChange={(v) => setForm((d) => ({ ...d, travelMotif: v ?? d.travelMotif }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VACACIONES">Vacaciones</SelectItem>
                      <SelectItem value="LUNA_DE_MIEL">Luna de miel</SelectItem>
                      <SelectItem value="AVENTURA">Aventura</SelectItem>
                      <SelectItem value="NEGOCIOS">Negocios</SelectItem>
                      <SelectItem value="FAMILIA">Viaje familiar</SelectItem>
                      <SelectItem value="CRUCERO">Crucero</SelectItem>
                      <SelectItem value="PLAYA">Playa</SelectItem>
                      <SelectItem value="CULTURAL">Cultural</SelectItem>
                      <SelectItem value="OTRO">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha de salida</Label>
                  <Input
                    type="date"
                    value={form.departureDate}
                    onChange={(e) => setForm((d) => ({ ...d, departureDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Fecha de regreso</Label>
                  <Input
                    type="date"
                    value={form.returnDate}
                    onChange={(e) => setForm((d) => ({ ...d, returnDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Pasajeros</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.passengers}
                    onChange={(e) => setForm((d) => ({ ...d, passengers: e.target.value }))}
                    placeholder="Cantidad de pasajeros"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Segmento</Label>
                  <Select
                    value={form.segment}
                    onValueChange={(v) => setForm((d) => ({ ...d, segment: v ?? d.segment }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ECONOMICO">Económico</SelectItem>
                      <SelectItem value="MEDIO">Medio</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="LUJO">Lujo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />
              <p className="text-xs font-semibold text-muted-foreground">Presupuesto</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Presupuesto aproximado del cliente</Label>
                  <Input
                    type="number"
                    value={form.estimatedValue}
                    onChange={(e) => setForm((d) => ({ ...d, estimatedValue: e.target.value }))}
                    placeholder="Ej: 12500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Solicitudes especiales</Label>
                <Textarea
                  value={form.specialRequests}
                  onChange={(e) => setForm((d) => ({ ...d, specialRequests: e.target.value }))}
                  placeholder="Requerimientos especiales, alergias, preferencias..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={isPending} size="sm">
                <SaveIcon className="mr-1.5 h-3.5 w-3.5" />
                Guardar cambios
              </Button>
            </div>
          ) : (
            <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <InfoRow
                label="Destino"
                value={opportunity.destination}
                icon={MapPinIcon}
              />
              <InfoRow
                label="Motivo del viaje"
                value={
                  opportunity.travelMotif
                    ? {
                        VACACIONES: "Vacaciones",
                        LUNA_DE_MIEL: "Luna de miel",
                        AVENTURA: "Aventura",
                        NEGOCIOS: "Negocios",
                        FAMILIA: "Viaje familiar",
                        CRUCERO: "Crucero",
                        PLAYA: "Playa",
                        CULTURAL: "Cultural",
                        OTRO: "Otro",
                      }[opportunity.travelMotif] ?? opportunity.travelMotif
                    : null
                }
                icon={PlaneIcon}
              />
              <InfoRow
                label="Fecha de salida"
                value={opportunity.departureDate ? formatDate(opportunity.departureDate) : null}
                icon={CalendarIcon}
              />
              <InfoRow
                label="Fecha de regreso"
                value={opportunity.returnDate ? formatDate(opportunity.returnDate) : null}
                icon={CalendarIcon}
              />
              <InfoRow
                label="Pasajeros"
                value={opportunity.passengers?.toString() ?? null}
                icon={UsersIcon}
              />
              <InfoRow
                label="Segmento"
                value={
                  opportunity.segment
                    ? { ECONOMICO: "Económico", MEDIO: "Medio", PREMIUM: "Premium", LUJO: "Lujo" }[opportunity.segment] ?? opportunity.segment
                    : null
                }
              />
              <InfoRow
                label="Presupuesto aproximado del cliente"
                value={opportunity.estimatedValue ? formatCurrency(opportunity.estimatedValue) : null}
                icon={DollarSignIcon}
              />
              <InfoRow
                label="Solicitudes especiales"
                value={opportunity.specialRequests}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lead Info Card (read-only, from original lead) */}
      {opportunity.lead && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Info del Lead original</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 space-y-2">
            {opportunity.lead.destination && (
              <InfoRow label="Destino (lead)" value={opportunity.lead.destination} icon={MapPinIcon} />
            )}
            {opportunity.lead.passengers && (
              <InfoRow label="Pasajeros (lead)" value={opportunity.lead.passengers.toString()} icon={UsersIcon} />
            )}
            {leadDates && (
              <InfoRow
                label="Fechas tentativas"
                value={`${leadDates.from ? formatDate(leadDates.from) : "—"} — ${leadDates.to ? formatDate(leadDates.to) : "—"}`}
                icon={CalendarIcon}
              />
            )}
            {opportunity.lead.notes && (
              <InfoRow label="Notas del lead" value={opportunity.lead.notes} />
            )}
            {opportunity.lead.source && (
              <InfoRow label="Fuente" value={getSourceLabel(opportunity.lead.source)} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Contact Info */}
      {opportunity.contact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Contacto</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0 space-y-2">
            <InfoRow
              label="Nombre"
              value={`${opportunity.contact.firstName} ${opportunity.contact.lastName}`}
              icon={UserIcon}
            />
            <InfoRow label="Teléfono" value={opportunity.contact.phone} icon={PhoneIcon} />
            <InfoRow label="Email" value={opportunity.contact.email} icon={MailIcon} />
            <InfoRow
              label="Canal preferido"
              value={getChannelLabel(opportunity.contact.preferredChannel)}
              icon={MessageSquareIcon}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
