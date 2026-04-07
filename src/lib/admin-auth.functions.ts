import { createServerFn } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";

const SESSION_CONFIG = {
  password:
    process.env.SESSION_SECRET || "tazkara-admin-session-secret-key-32chars!!",
  name: "tazkara-admin-session",
  maxAge: 60 * 60 * 8, // 8 hours
};

interface AdminSession {
  accessToken: string;
  email: string;
  expiresAt: number; // unix ms
}

export const requireAdminAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const session = await useSession<AdminSession>(SESSION_CONFIG);
    if (!session.data?.accessToken) {
      throw redirect({ to: "/admin/login" });
    }
    if (Date.now() > (session.data.expiresAt ?? 0)) {
      await session.clear();
      throw redirect({ to: "/admin/login" });
    }
    return next({
      context: {
        admin: session.data,
      },
    });
  }
);

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email().max(255),
      password: z.string().min(1).max(255),
    })
  )
  .handler(async ({ data }) => {
    const API_BASE = "https://tazkara-backend-production.up.railway.app/api/v1";

    const res = await fetch(`${API_BASE}/auth/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, password: data.password }),
    });

    if (!res.ok) {
      let msg = "Invalid email or password";
      try {
        const err = await res.json();
        if (err.message) msg = err.message;
      } catch {}
      throw new Error(msg);
    }

    const authResponse = (await res.json()) as {
      accessToken: string;
      expiresIn: number;
      tokenType: string;
    };

    // Store token in encrypted server session
    const session = await useSession<AdminSession>(SESSION_CONFIG);
    await session.update({
      accessToken: authResponse.accessToken,
      email: data.email,
      expiresAt: Date.now() + authResponse.expiresIn * 1000,
    });

    // Server-side redirect after setting the session cookie
    throw redirect({ to: "/admin" });
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await useSession<AdminSession>(SESSION_CONFIG);
    await session.clear();
    throw redirect({ to: "/admin/login" });
  }
);

export const getAdminSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useSession<AdminSession>(SESSION_CONFIG);
    if (!session.data?.accessToken) {
      return { authenticated: false as const, admin: null };
    }
    if (Date.now() > (session.data.expiresAt ?? 0)) {
      await session.clear();
      return { authenticated: false as const, admin: null };
    }
    return {
      authenticated: true as const,
      admin: {
        email: session.data.email,
        accessToken: session.data.accessToken,
      },
    };
  }
);
