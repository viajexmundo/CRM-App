"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function BackupAdminPanel() {
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    try {
      const res = await fetch("/api/admin/backup/export");
      if (!res.ok) {
        toast.error("No se pudo exportar la base de datos");
        return;
      }

      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `crm-backup-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      toast.success("Respaldo exportado");
    } catch {
      toast.error("No se pudo exportar la base de datos");
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Selecciona un archivo .json");
      return;
    }

    if (
      !confirm(
        "Esto reemplazará TODOS los datos actuales de la base. ¿Deseas continuar?"
      )
    ) {
      return;
    }

    setImporting(true);
    try {
      const text = await selectedFile.text();
      const payload = JSON.parse(text);

      const res = await fetch("/api/admin/backup/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error ?? "No se pudo importar el respaldo");
        return;
      }

      toast.success("Importación completada");
      setSelectedFile(null);
    } catch {
      toast.error("Archivo inválido o error al importar");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleExport}>Exportar base completa (.json)</Button>
      </div>

      <div className="space-y-2 rounded-lg border p-4">
        <Label>Importar respaldo (.json)</Label>
        <Input
          type="file"
          accept="application/json,.json"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            setSelectedFile(file);
          }}
        />
        <p className="text-xs text-muted-foreground">
          La importación reemplaza completamente la base actual.
        </p>
        <Button
          variant="destructive"
          onClick={handleImport}
          disabled={importing || !selectedFile}
        >
          {importing ? "Importando..." : "Importar y reemplazar base"}
        </Button>
      </div>
    </div>
  );
}
