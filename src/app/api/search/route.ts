import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  const viewerId = (session?.user as { id?: string })?.id;
  const viewerRole = (session?.user as { role?: string })?.role;
  const isAdmin = viewerRole === "ADMIN";

  if (!session?.user || (!isAdmin && !viewerId)) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const [contacts, leads, opportunities] = await Promise.all([
      // Search contacts by name, email, phone
      prisma.contact.findMany({
        where: {
          AND: [
            ...(isAdmin
              ? []
              : [
                  {
                    OR: [
                      { leads: { some: { assignedToId: viewerId } } },
                      { opportunities: { some: { assignedToId: viewerId } } },
                    ],
                  },
                ]),
            {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { phone: { contains: q, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
        take: 5,
      }),

      // Search leads by destination, contact name
      prisma.lead.findMany({
        where: {
          ...(isAdmin ? {} : { assignedToId: viewerId }),
          OR: [
            { destination: { contains: q, mode: "insensitive" } },
            { contact: { firstName: { contains: q, mode: "insensitive" } } },
            { contact: { lastName: { contains: q, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          destination: true,
          contact: {
            select: { firstName: true, lastName: true },
          },
        },
        take: 5,
      }),

      // Search opportunities by title, contact name, destination
      prisma.opportunity.findMany({
        where: {
          ...(isAdmin ? {} : { assignedToId: viewerId }),
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { destination: { contains: q, mode: "insensitive" } },
            { contact: { firstName: { contains: q, mode: "insensitive" } } },
            { contact: { lastName: { contains: q, mode: "insensitive" } } },
          ],
        },
        select: {
          id: true,
          title: true,
          stage: true,
          destination: true,
          contact: {
            select: { firstName: true, lastName: true },
          },
        },
        take: 5,
      }),
    ]);

    const results = [
      ...contacts.map((c) => ({
        id: c.id,
        title: `${c.firstName} ${c.lastName ?? ""}`.trim(),
        subtitle: c.email || c.phone || undefined,
        type: "contact" as const,
        href: `/contactos/${c.id}`,
      })),
      ...leads.map((l) => ({
        id: l.id,
        title: `${l.contact.firstName} ${l.contact.lastName ?? ""}`.trim(),
        subtitle: l.destination || "Lead",
        type: "lead" as const,
        href: `/leads/${l.id}`,
      })),
      ...opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        subtitle: `${o.contact.firstName} ${o.contact.lastName ?? ""}`.trim(),
        type: "opportunity" as const,
        href: `/oportunidades/${o.id}`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], error: "Error en búsqueda" }, { status: 500 });
  }
}
