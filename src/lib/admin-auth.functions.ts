import { createServerFn } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/react-start";
import {
  getCookie,
  setCookie,
  deleteCookie,
} from "@tanstack/react-start/server";
import { redirect } from "@tanstack/react-router";
import { z } from "zod";

const COOKIE_TOKEN = "tazkara-admin-token";
const COOKIE_EMAIL = "tazkara-admin-email";
const COOKIE_EXPIRES = "tazkara-admin-exp";
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 8, // 8 hours
} as const;

export const requireAdminAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const token = getCookie(COOKIE_TOKEN);
    const email = getCookie(COOKIE_EMAIL);
    const expiresAt = Number(getCookie(COOKIE_EXPIRES) || "0");

    if (!token) {
      throw redirect({ to: "/admin/login" });
    }
    if (Date.now() > expiresAt) {
      deleteCookie(COOKIE_TOKEN);
      deleteCookie(COOKIE_EMAIL);
      deleteCookie(COOKIE_EXPIRES);
      throw redirect({ to: "/admin/login" });
    }
    return next({
      context: {
        admin: { accessToken: token, email: email || "" },
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

    const expiresAt = Date.now() + authResponse.expiresIn * 1000;

    setCookie(COOKIE_TOKEN, authResponse.accessToken, COOKIE_OPTS);
    setCookie(COOKIE_EMAIL, data.email, COOKIE_OPTS);
    setCookie(COOKIE_EXPIRES, String(expiresAt), COOKIE_OPTS);

    return { success: true as const };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(
  async () => {
    deleteCookie(COOKIE_TOKEN);
    deleteCookie(COOKIE_EMAIL);
    deleteCookie(COOKIE_EXPIRES);
    return { success: true as const };
  }
);

export const getAdminSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const token = getCookie(COOKIE_TOKEN);
    const email = getCookie(COOKIE_EMAIL);
    const expiresAt = Number(getCookie(COOKIE_EXPIRES) || "0");

    if (!token) {
      return { authenticated: false as const, admin: null };
    }
    if (Date.now() > expiresAt) {
      deleteCookie(COOKIE_TOKEN);
      deleteCookie(COOKIE_EMAIL);
      deleteCookie(COOKIE_EXPIRES);
      return { authenticated: false as const, admin: null };
    }
    return {
      authenticated: true as const,
      admin: {
        email: email || "",
        accessToken: token,
      },
    };
  }
);

