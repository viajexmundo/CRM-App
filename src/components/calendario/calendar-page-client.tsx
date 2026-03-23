"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarDaysIcon,
  ExternalLinkIcon,
  SearchIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PIPELINE_STAGE_CONFIG } from "@/lib/constants/pipeline";
import { formatDateTime } from "@/lib/utils/format";
import type { CalendarItem } from "@/lib/queries/calendar";

interface CalendarPageClientProps {
  items: CalendarItem[];
  isAdmin: boolean;
  agents: Array<{ id: string; name: string }>;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function dayKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CalendarPageClient({ items, isAdmin, agents }: CalendarPageClientProps) {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [selectedAgentId, setSelectedAgentId] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("next30");
  const [query, setQuery] = useState("");
  const [agendaLimit, setAgendaLimit] = useState(40);

  const monthStart = startOfMonth(monthCursor);
  const monthEnd = endOfMonth(monthCursor);
  const firstGridDay = new Date(monthStart);
  firstGridDay.setDate(monthStart.getDate() - monthStart.getDay());

  const visibleItems = useMemo(() => {
    return items.filter((item) => (selectedAgentId === "all" ? true : item.assignedToId === selectedAgentId));
  }, [items, selectedAgentId]);

  const monthItems = useMemo(() => {
    return visibleItems.filter((item) => item.startAt >= monthStart && item.startAt <= monthEnd);
  }, [visibleItems, monthStart, monthEnd]);

  const agendaFiltered = useMemo(() => {
    const now = new Date();
    const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30d = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const q = query.trim().toLowerCase();

    return visibleItems
      .filter((item) => {
        if (sourceFilter !== "all" && item.source !== sourceFilter) return false;
        if (stageFilter !== "all" && item.stage !== stageFilter) return false;

        if (timeFilter === "overdue") {
          if (!(item.startAt < now && item.status === "PENDING")) return false;
        } else if (timeFilter === "next7") {
          if (!(item.startAt >= now && item.startAt <= in7d)) return false;
        } else if (timeFilter === "next30") {
          if (!(item.startAt >= now && item.startAt <= in30d)) return false;
        }

        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.contactName.toLowerCase().includes(q) ||
          item.opportunityTitle.toLowerCase().includes(q) ||
          item.assignedToName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }, [visibleItems, sourceFilter, stageFilter, timeFilter, query]);

  const agendaItems = useMemo(() => agendaFiltered.slice(0, agendaLimit), [agendaFiltered, agendaLimit]);

  const groupedAgenda = useMemo(() => {
    const grouped: Record<string, CalendarItem[]> = {};
    for (const item of agendaItems) {
      const key = dayKey(item.startAt);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }
    return Object.entries(grouped);
  }, [agendaItems]);

  const monthLabel = monthCursor.toLocaleDateString("es-GT", {
    month: "long",
    year: "numeric",
  });

  const gridDays = Array.from({ length: 42 }).map((_, idx) => {
    const date = new Date(firstGridDay);
    date.setDate(firstGridDay.getDate() + idx);
    const dayItems = monthItems.filter((item) => isSameDay(item.startAt, date));
    const isCurrentMonth = date.getMonth() === monthCursor.getMonth();
    const isToday = isSameDay(date, new Date());
    return { date, dayItems, isCurrentMonth, isToday };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendario</h1>
          <p className="text-muted-foreground">Vista mensual y agenda escalable para alto volumen de eventos</p>
        </div>
        {isAdmin && (
          <div className="w-full max-w-xs">
            <Select value={selectedAgentId} onValueChange={(value) => setSelectedAgentId(value ?? "all")}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los agentes</SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 capitalize">
                <CalendarDaysIcon className="h-4 w-4 text-blue-500" />
                {monthLabel}
              </CardTitle>
              <div className="flex gap-1">
                <Button variant="outline" size="icon-sm" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}>
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon-sm" onClick={() => setMonthCursor(new Date())}>
                  Hoy
                </Button>
                <Button variant="outline" size="icon-sm" onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}>
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardDescription>{monthItems.length} evento(s) en el mes</CardDescription>
          </CardHeader>
          <CardContent className="px-3 pt-0">
            <div className="grid grid-cols-7 gap-2 pb-2 text-center text-xs font-semibold text-muted-foreground">
              {["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {gridDays.map((day) => (
                <div
                  key={day.date.toISOString()}
                  className={`min-h-28 rounded-lg border p-2 ${day.isCurrentMonth ? "bg-background" : "bg-muted/20"} ${
                    day.isToday ? "ring-1 ring-blue-400/60" : ""
                  }`}
                >
                  <div className={`text-xs font-semibold ${day.isCurrentMonth ? "text-foreground" : "text-muted-foreground"}`}>
                    {day.date.getDate()}
                  </div>
                  <div className="mt-1 space-y-1">
                    {day.dayItems.slice(0, 3).map((item) => (
                      <Link
                        key={`${item.source}-${item.id}`}
                        href={`/oportunidades/${item.opportunityId}`}
                        className="block rounded-md border border-border/60 bg-muted/40 px-1.5 py-1 text-[10px] hover:bg-muted"
                        title={`${item.title} · ${item.contactName}`}
                      >
                        <div className="truncate font-medium">
                          {item.startAt.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: false })} · {item.title}
                        </div>
                        <div className="truncate text-muted-foreground">{item.contactName}</div>
                      </Link>
                    ))}
                    {day.dayItems.length > 3 && (
                      <div className="text-[10px] text-muted-foreground">+{day.dayItems.length - 3} mas</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Agenda inteligente</CardTitle>
            <CardDescription>
              {agendaFiltered.length} evento(s) encontrados · mostrando {agendaItems.length}
            </CardDescription>
            <div className="space-y-2 pt-2">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setAgendaLimit(40);
                  }}
                  placeholder="Buscar cliente, oportunidad o agente..."
                  className="h-8 pl-8"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={timeFilter} onValueChange={(v) => { setTimeFilter(v ?? "next30"); setAgendaLimit(40); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Tiempo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next30">Prox. 30 dias</SelectItem>
                    <SelectItem value="next7">Prox. 7 dias</SelectItem>
                    <SelectItem value="overdue">Solo vencidos</SelectItem>
                    <SelectItem value="all">Todos</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v ?? "all"); setAgendaLimit(40); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo tipo</SelectItem>
                    <SelectItem value="FOLLOW_UP">Seguimientos</SelectItem>
                    <SelectItem value="ACTION">Acciones</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v ?? "all"); setAgendaLimit(40); }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas etapas</SelectItem>
                    {Object.keys(PIPELINE_STAGE_CONFIG).map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {PIPELINE_STAGE_CONFIG[stage as keyof typeof PIPELINE_STAGE_CONFIG].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="max-h-[72vh] space-y-3 overflow-y-auto pr-1">
              {groupedAgenda.length === 0 && (
                <p className="text-sm text-muted-foreground">No hay eventos para estos filtros.</p>
              )}

              {groupedAgenda.map(([dateKey, dayItems], idx) => {
                const dayDate = new Date(`${dateKey}T00:00:00`);
                const dayLabel = dayDate.toLocaleDateString("es-GT", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                });
                return (
                  <details key={dateKey} open={idx < 3} className="rounded-lg border bg-muted/20">
                    <summary className="cursor-pointer list-none px-3 py-2">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold capitalize">{dayLabel}</p>
                        <Badge variant="secondary" className="text-[10px]">{dayItems.length}</Badge>
                      </div>
                    </summary>
                    <div className="space-y-1.5 px-2 pb-2">
                      {dayItems.map((item) => {
                        const stageConfig = PIPELINE_STAGE_CONFIG[item.stage as keyof typeof PIPELINE_STAGE_CONFIG];
                        return (
                          <div key={`${item.source}-${item.id}`} className="rounded-md border bg-background p-2">
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-1 text-xs font-semibold">
                                {item.startAt.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit", hour12: false })} · {item.title}
                              </p>
                              <Badge variant={item.status === "COMPLETED" ? "secondary" : "outline"} className="text-[10px]">
                                {item.status}
                              </Badge>
                            </div>
                            <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground">{item.contactName} · {item.assignedToName}</p>
                            <div className="mt-1 flex items-center gap-1.5">
                              <Badge className="text-[10px]" style={{ backgroundColor: stageConfig?.color ?? "var(--muted)" }}>
                                {stageConfig?.label ?? item.stage}
                              </Badge>
                              <Badge variant="outline" className="text-[10px]">{item.source === "FOLLOW_UP" ? "Seguimiento" : "Accion"}</Badge>
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              <Link href={`/oportunidades/${item.opportunityId}`} className="inline-flex items-center gap-1 text-[11px] text-blue-700 underline">
                                Ver oportunidad
                                <ExternalLinkIcon className="h-3 w-3" />
                              </Link>
                              {item.meetLink && (
                                <a href={item.meetLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-emerald-700 underline">
                                  Meet
                                  <ExternalLinkIcon className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>

            {agendaFiltered.length > agendaItems.length && (
              <Button variant="outline" className="mt-3 w-full" onClick={() => setAgendaLimit((n) => n + 40)}>
                Ver 40 mas
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
