"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

interface ResolveSuccess {
  userId: string;
  email: string;
  error: null;
}

interface ResolveFailure {
  userId: null;
  email: null;
  error: string;
}

/**
 * Resolves the current authenticated user's actual database ID.
 * After a DB reset, JWT tokens may contain stale user IDs.
 * This helper looks up the user by email (which is stable) to get the real ID.
 */
export async function resolveCurrentUser(): Promise<ResolveSuccess | ResolveFailure> {
  const session = await auth();
  if (!session?.user?.email) {
    return { userId: null, email: null, error: "No autorizado" };
  }

  // Try session ID first (fast path)
  if (session.user.id) {
    const exists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (exists) {
      return { userId: exists.id, email: session.user.email, error: null };
    }
  }

  // Fallback: look up by email (handles stale JWT after DB reset)
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    return { userId: null, email: null, error: "Tu sesión expiró. Por favor cierra sesión y vuelve a ingresar." };
  }

  return { userId: user.id, email: session.user.email, error: null };
}
