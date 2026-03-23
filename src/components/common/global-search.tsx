"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  UserIcon,
  SparklesIcon,
  BriefcaseIcon,
  SearchIcon,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: "contact" | "lead" | "opportunity";
  href: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runSearch = useCallback(async (value: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (value.length < 2) {
      setLoading(false);
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(value)}`,
        { signal: controller.signal }
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results ?? []);
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 180);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, runSearch]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      setResults([]);
      router.push(href);
    },
    [router]
  );

  const contacts = results.filter((r) => r.type === "contact");
  const leads = results.filter((r) => r.type === "lead");
  const opportunities = results.filter((r) => r.type === "opportunity");

  const iconForType = (type: string) => {
    switch (type) {
      case "contact":
        return <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />;
      case "lead":
        return <SparklesIcon className="mr-2 h-4 w-4 text-muted-foreground" />;
      case "opportunity":
        return (
          <BriefcaseIcon className="mr-2 h-4 w-4 text-muted-foreground" />
        );
      default:
        return <SearchIcon className="mr-2 h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-8 w-full max-w-sm items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:bg-muted"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="flex-1 text-left">Buscar...</span>
        <kbd className="pointer-events-none hidden h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Buscar"
        description="Busca contactos, leads y oportunidades"
      >
        <CommandInput
          placeholder="Buscar contactos, leads, oportunidades..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {!loading && query.length >= 2 && results.length === 0 && (
            <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          )}
          {loading && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Buscando...
            </div>
          )}
          {contacts.length > 0 && (
            <CommandGroup heading="Contactos">
              {contacts.map((r) => (
                <CommandItem
                  key={r.id}
                  onSelect={() => handleSelect(r.href)}
                >
                  {iconForType(r.type)}
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    {r.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {r.subtitle}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {contacts.length > 0 && (leads.length > 0 || opportunities.length > 0) && (
            <CommandSeparator />
          )}
          {leads.length > 0 && (
            <CommandGroup heading="Leads">
              {leads.map((r) => (
                <CommandItem
                  key={r.id}
                  onSelect={() => handleSelect(r.href)}
                >
                  {iconForType(r.type)}
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    {r.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {r.subtitle}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {leads.length > 0 && opportunities.length > 0 && (
            <CommandSeparator />
          )}
          {opportunities.length > 0 && (
            <CommandGroup heading="Oportunidades">
              {opportunities.map((r) => (
                <CommandItem
                  key={r.id}
                  onSelect={() => handleSelect(r.href)}
                >
                  {iconForType(r.type)}
                  <div>
                    <p className="text-sm font-medium">{r.title}</p>
                    {r.subtitle && (
                      <p className="text-xs text-muted-foreground">
                        {r.subtitle}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {query.length < 2 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Escribe al menos 2 caracteres para buscar
            </div>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
