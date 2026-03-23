"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createUser, setUserActive, updateUserRole, updateUserPhone } from "@/lib/actions/users";
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
import { Switch } from "@/components/ui/switch";
import type { Role } from "@/types";

interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  isActive: boolean;
  createdAt: Date | string;
}

interface UsersAdminPanelProps {
  users: AdminUserRow[];
  currentUserId: string;
}

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "VENDEDOR" as Role,
};

export function UsersAdminPanel({ users, currentUserId }: UsersAdminPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingPhoneByUser, setEditingPhoneByUser] = useState<Record<string, string>>({});

  const submitCreate = () => {
    startTransition(async () => {
      const result = await createUser(form);
      if (!result.success) {
        toast.error(result.error ?? "No se pudo crear el usuario");
        return;
      }
      toast.success("Usuario creado");
      setForm(INITIAL_FORM);
      router.refresh();
    });
  };

  const onPhoneSave = (userId: string) => {
    const phone = editingPhoneByUser[userId] ?? "";
    startTransition(async () => {
      const result = await updateUserPhone(userId, phone);
      if (!result.success) {
        toast.error(result.error ?? "No se pudo actualizar teléfono");
        return;
      }
      toast.success("Teléfono actualizado");
      router.refresh();
    });
  };

  const onRoleChange = (userId: string, role: string) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, role as Role);
      if (!result.success) {
        toast.error(result.error ?? "No se pudo actualizar el rol");
        return;
      }
      toast.success("Rol actualizado");
      router.refresh();
    });
  };

  const onActiveChange = (userId: string, isActive: boolean) => {
    startTransition(async () => {
      const result = await setUserActive(userId, isActive);
      if (!result.success) {
        toast.error(result.error ?? "No se pudo actualizar el estado");
        return;
      }
      toast.success(isActive ? "Usuario activado" : "Usuario desactivado");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Nombre</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            placeholder="Nombre completo"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Correo</Label>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
            placeholder="usuario@agencia.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Teléfono</Label>
          <Input
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            placeholder="+502 5550 0000"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Contraseña temporal</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Rol</Label>
          <Select
            value={form.role}
            onValueChange={(v) => setForm((s) => ({ ...s, role: (v ?? s.role) as Role }))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VENDEDOR">Vendedor</SelectItem>
              <SelectItem value="COACH">Coach</SelectItem>
              <SelectItem value="ADMIN">Administrador</SelectItem>
              <SelectItem value="CONTABILIDAD">Contabilidad</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={submitCreate}
          disabled={
            isPending ||
            !form.name.trim() ||
            !form.email.trim() ||
            form.password.length < 6
          }
        >
          {isPending ? "Guardando..." : "Crear usuario"}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Nombre</th>
              <th className="px-3 py-2 font-medium">Correo</th>
              <th className="px-3 py-2 font-medium">Teléfono</th>
              <th className="px-3 py-2 font-medium">Rol</th>
              <th className="px-3 py-2 font-medium">Activo</th>
              <th className="px-3 py-2 font-medium">Creado</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-3 py-2">{u.name}</td>
                <td className="px-3 py-2 text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editingPhoneByUser[u.id] ?? u.phone ?? ""}
                      onChange={(e) =>
                        setEditingPhoneByUser((prev) => ({
                          ...prev,
                          [u.id]: e.target.value,
                        }))
                      }
                      placeholder="+502 5550 0000"
                      className="h-8 w-[170px]"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onPhoneSave(u.id)}
                      disabled={isPending}
                    >
                      Guardar
                    </Button>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <Select
                    value={u.role}
                    onValueChange={(v) => onRoleChange(u.id, v ?? u.role)}
                    disabled={isPending}
                  >
                    <SelectTrigger className="w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VENDEDOR">Vendedor</SelectItem>
                      <SelectItem value="COACH">Coach</SelectItem>
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="CONTABILIDAD">Contabilidad</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={u.isActive}
                      onCheckedChange={(checked) => onActiveChange(u.id, Boolean(checked))}
                      disabled={isPending || (u.id === currentUserId && u.isActive)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {u.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("es-GT")}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                  No hay usuarios registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
