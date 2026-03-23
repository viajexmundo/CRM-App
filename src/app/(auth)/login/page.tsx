"use client";

import { Suspense, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plane, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isGooglePending, startGoogleTransition] = useTransition();
  const googleAuthEnabled = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Correo o contrasena incorrectos. Intenta de nuevo.");
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    });
  };

  const handleGoogleLogin = () => {
    setError(null);
    startGoogleTransition(async () => {
      await signIn("google", { callbackUrl });
    });
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Logo / Brand */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <Plane className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          CRM Viajes
        </h1>
        <p className="text-sm text-muted-foreground">
          Agencia de Viajes - Sistema de Gestion
        </p>
      </div>

      {/* Login Card */}
      <Card className="w-full shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">Iniciar Sesion</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Correo electronico</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPending}
                autoComplete="email"
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPending}
                autoComplete="current-password"
                className="h-10"
              />
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="mt-2 h-10 w-full"
              size="lg"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>

            {googleAuthEnabled && (
              <>
                <div className="relative mt-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span className="bg-card px-2">o continuar con</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full"
                  onClick={handleGoogleLogin}
                  disabled={isPending || isGooglePending}
                >
                  {isGooglePending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Conectando Google...
                    </>
                  ) : (
                    <>
                      <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-xs font-semibold text-foreground">
                        G
                      </span>
                      Ingresar con Google
                    </>
                  )}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        CRM Agencia de Viajes &copy; {new Date().getFullYear()}
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Cargando...</div>}>
      <LoginContent />
    </Suspense>
  );
}
