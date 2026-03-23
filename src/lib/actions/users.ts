"use server";

import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/types";

interface ActionResult {
  success: boolean;
  error?: string;
}

const roleSchema = z.enum(["VENDEDOR", "COACH", "ADMIN", "CONTABILIDAD"]);

const createUserSchema = z.object({
  name: z.string().min(2, "Nombre mínimo de 2 caracteres").max(120),
  email: z.string().email("Correo inválido"),
  phone: z.string().max(30).optional().or(z.literal("")),
  password: z.string().min(6, "La contraseña debe tener mínimo 6 caracteres"),
  role: roleSchema,
});

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email || session.user.role !== "ADMIN") {
    return { ok: false as const, error: "No autorizado" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!dbUser || dbUser.role !== "ADMIN") {
    return { ok: false as const, error: "No autorizado" };
  }

  return { ok: true as const, currentUserId: dbUser.id };
}

export async function createUser(formData: unknown): Promise<ActionResult> {
  try {
    const authz = await requireAdmin();
    if (!authz.ok) return { success: false, error: authz.error };

    const parsed = createUserSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Datos inválidos",
      };
    }

    const data = parsed.data;
    const normalizedEmail = data.email.trim().toLowerCase();

    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (exists) {
      return { success: false, error: "Ya existe un usuario con ese correo" };
    }

    const passwordHash = await hash(data.password, 10);

    await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: normalizedEmail,
        phone: data.phone?.trim() || null,
        passwordHash,
        role: data.role,
        isActive: true,
      },
    });

    revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error creating user:", error);
    return { success: false, error: "Error al crear usuario" };
  }
}

export async function updateUserPhone(
  userId: string,
  phone: string
): Promise<ActionResult> {
  try {
    const authz = await requireAdmin();
    if (!authz.ok) return { success: false, error: authz.error };

    await prisma.user.update({
      where: { id: userId },
      data: { phone: phone.trim() || null },
    });

    revalidatePath("/configuracion");
    revalidatePath("/oportunidades");
    return { success: true };
  } catch (error) {
    console.error("Error updating user phone:", error);
    return { success: false, error: "Error al actualizar teléfono" };
  }
}

export async function updateUserRole(
  userId: string,
  role: Role
): Promise<ActionResult> {
  try {
    const authz = await requireAdmin();
    if (!authz.ok) return { success: false, error: authz.error };

    const parsedRole = roleSchema.safeParse(role);
    if (!parsedRole.success) {
      return { success: false, error: "Rol inválido" };
    }

    if (authz.currentUserId === userId && role !== "ADMIN") {
      return {
        success: false,
        error: "No puedes quitarte a ti mismo el rol de administrador",
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error updating user role:", error);
    return { success: false, error: "Error al actualizar rol" };
  }
}

export async function setUserActive(
  userId: string,
  isActive: boolean
): Promise<ActionResult> {
  try {
    const authz = await requireAdmin();
    if (!authz.ok) return { success: false, error: authz.error };

    if (authz.currentUserId === userId && !isActive) {
      return {
        success: false,
        error: "No puedes desactivar tu propio usuario",
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    revalidatePath("/configuracion");
    return { success: true };
  } catch (error) {
    console.error("Error toggling user active status:", error);
    return { success: false, error: "Error al actualizar estado del usuario" };
  }
}
