import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { UsersIcon } from "lucide-react";

export default function CoachingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Coaching</h1>
        <p className="text-muted-foreground">
          Sesiones de coaching y seguimiento del equipo
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-muted-foreground" />
            Sesiones de coaching
          </CardTitle>
          <CardDescription>
            Pr&oacute;ximamente podr&aacute;s gestionar sesiones de coaching,
            revisar m&eacute;tricas de desempe&ntilde;o y dar seguimiento al
            desarrollo del equipo comercial.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 pt-0">
          <p className="py-8 text-center text-sm text-muted-foreground">
            Esta funcionalidad estar&aacute; disponible pr&oacute;ximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
