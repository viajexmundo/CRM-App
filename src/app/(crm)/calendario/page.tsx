import { auth } from "@/lib/auth";
import { getCalendarItems } from "@/lib/queries/calendar";
import { getActiveUsers } from "@/lib/queries/users";
import { CalendarPageClient } from "@/components/calendario/calendar-page-client";

export default async function CalendarioPage() {
  const session = await auth();
  const viewerId = (session?.user as { id?: string })?.id;
  const viewerRole = (session?.user as { role?: string })?.role ?? "VENDEDOR";

  const from = new Date();
  from.setMonth(from.getMonth() - 2);
  from.setDate(1);
  from.setHours(0, 0, 0, 0);

  const to = new Date();
  to.setMonth(to.getMonth() + 4);
  to.setDate(0);
  to.setHours(23, 59, 59, 999);

  const [items, users] = await Promise.all([
    getCalendarItems({
      viewerId,
      viewerRole,
      from,
      to,
    }),
    getActiveUsers(),
  ]);

  return (
    <CalendarPageClient
      items={items}
      isAdmin={viewerRole === "ADMIN"}
      agents={users.map((u) => ({ id: u.id, name: u.name }))}
    />
  );
}
