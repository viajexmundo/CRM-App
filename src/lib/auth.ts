import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { authConfig } from "@/lib/auth.config";
import type { Role } from "@/types";

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Contraseña", type: "password" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        return null;
      }

      const email = (credentials.email as string).toLowerCase().trim();
      const password = credentials.password as string;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user || !user.isActive) {
        return null;
      }

      const isPasswordValid = await compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role as Role,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.unshift(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.events",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user, account, profile }) {
      if (!account) return false;

      if (account.provider === "credentials") {
        return true;
      }

      if (account.provider !== "google") {
        return false;
      }

      const email = user.email?.toLowerCase().trim();
      if (!email) return false;

      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, name: true, isActive: true },
      });

      if (!dbUser || !dbUser.isActive) {
        return false;
      }

      user.id = dbUser.id;
      user.role = dbUser.role as Role;
      user.name = dbUser.name;

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          googleSub: (profile as { sub?: string } | null)?.sub ?? null,
          googleCalendarEmail: user.email ?? null,
          googleAccessToken: account.access_token ?? null,
          googleRefreshToken: account.refresh_token ?? undefined,
          googleTokenExpiresAt: account.expires_at
            ? new Date(account.expires_at * 1000)
            : null,
          googleConnectedAt: new Date(),
        },
      });

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
