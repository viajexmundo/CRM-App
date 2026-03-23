import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { SettingsIcon, CalendarClockIcon, UsersIcon } from "lucide-react";
import { getFollowUpConfigs } from "@/lib/queries/opportunities";
import { FollowUpConfigPanel } from "@/components/configuracion/follow-up-config-panel";
import { UsersAdminPanel } from "@/components/configuracion/users-admin-panel";
import { BackupAdminPanel } from "@/components/configuracion/backup-admin-panel";
import { CheckInTemplatePanel } from "@/components/configuracion/check-in-template-panel";
import { getAllUsersForAdmin } from "@/lib/queries/users";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCheckInTemplates } from "@/lib/queries/check-in";

export default async function ConfiguracionPage() {
  const session = await auth();
  const [followUpConfigs, users, currentUser, checkInTemplates] = await Promise.all([
    getFollowUpConfigs(),
    getAllUsersForAdmin(),
    session?.user?.email
      ? prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : Promise.resolve(null),
    getCheckInTemplates(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes generales del sistema
        </p>
      </div>

      {/* Follow-up Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClockIcon className="h-5 w-5 text-muted-foreground" />
            Intervalos de seguimiento
          </CardTitle>
          <CardDescription>
            Configura los tiempos de seguimiento automático para la etapa
            &quot;Cotización en seguimiento&quot;. Cuando una oportunidad entra
            en esta etapa, se crean tareas de seguimiento con estos intervalos.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <FollowUpConfigPanel configs={followUpConfigs} />
        </CardContent>
      </Card>

      {/* Users management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClockIcon className="h-5 w-5 text-muted-foreground" />
            Check-in diario (base)
          </CardTitle>
          <CardDescription>
            Define la lista base que cada agente ve al iniciar su día. Cada agente puede agregar tareas personales adicionales en su Dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <CheckInTemplatePanel
            templates={checkInTemplates.map((template) => ({
              id: template.id,
              title: template.title,
              isActive: template.isActive,
            }))}
          />
        </CardContent>
      </Card>

      {/* Users management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-muted-foreground" />
            Gestión de usuarios
          </CardTitle>
          <CardDescription>
            Crea usuarios, cambia roles (permisos) y activa o desactiva cuentas.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <UsersAdminPanel
            users={users}
            currentUserId={currentUser?.id ?? ""}
          />
        </CardContent>
      </Card>

      {/* Other settings placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-muted-foreground" />
            Respaldo y restauración
          </CardTitle>
          <CardDescription>
            Exporta o importa toda la base de datos del CRM. Solo administradores.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <BackupAdminPanel />
        </CardContent>
      </Card>
    </div>
  );
}
