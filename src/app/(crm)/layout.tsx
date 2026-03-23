import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <AppSidebar
        user={{
          id: user.id,
          name: user.name ?? "",
          email: user.email ?? "",
          role: user.role,
        }}
      />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <TopBar
          user={{
            name: user.name ?? "",
            email: user.email ?? "",
            role: user.role,
          }}
        />
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6">
          <div className="mx-auto max-w-[1800px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
