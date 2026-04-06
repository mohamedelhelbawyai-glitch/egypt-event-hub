import { createServerFn } from "@tanstack/react-start";
import { createMiddleware } from "@tanstack/react-start";
import {
  useSession,
  setCookie,
  deleteCookie,
  getCookie,
} from "@tanstack/react-start/server";
import { z } from "zod";

const SESSION_CONFIG = {
  password:
    process.env.SESSION_SECRET || "tazkara-admin-session-secret-key-32chars!!",
  name: "tazkara-admin-session",
  maxAge: 60 * 60 * 8, // 8 hours
};

interface AdminSession {
  adminId: string;
  email: string;
  name: string;
  role: string;
}

export const requireAdminAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const session = await useSession<AdminSession>(SESSION_CONFIG);
    if (!session.data?.adminId) {
      throw new Error("UNAUTHORIZED");
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
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const bcrypt = await import("bcryptjs");

    const { data: admin, error } = await supabaseAdmin
      .from("admin_users")
      .select("id, name, email, password_hash, role, is_active")
      .eq("email", data.email)
      .single();

    if (error || !admin) {
      throw new Error("Invalid email or password");
    }

    if (!admin.is_active) {
      throw new Error("Account is deactivated");
    }

    const valid = await bcrypt.compare(data.password, admin.password_hash);
    if (!valid) {
      throw new Error("Invalid email or password");
    }

    const session = await useSession<AdminSession>(SESSION_CONFIG);
    await session.update({
      adminId: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });

    // Update last login
    await supabaseAdmin
      .from("admin_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("id", admin.id);

    return {
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(
  async () => {
    const session = await useSession<AdminSession>(SESSION_CONFIG);
    await session.clear();
    return { success: true };
  }
);

export const getAdminSession = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await useSession<AdminSession>(SESSION_CONFIG);
    if (!session.data?.adminId) {
      return { authenticated: false as const, admin: null };
    }
    return {
      authenticated: true as const,
      admin: session.data,
    };
  }
);

export const createInitialAdmin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1).max(255),
      email: z.string().email().max(255),
      password: z.string().min(8).max(255),
    })
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const bcrypt = await import("bcryptjs");

    // Check if any admin exists
    const { count } = await supabaseAdmin
      .from("admin_users")
      .select("id", { count: "exact", head: true });

    if (count && count > 0) {
      throw new Error("Initial admin already exists");
    }

    const password_hash = await bcrypt.hash(data.password, 12);

    const { data: admin, error } = await supabaseAdmin
      .from("admin_users")
      .insert({
        name: data.name,
        email: data.email,
        password_hash,
        role: "SUPER_ADMIN",
      })
      .select("id, name, email, role")
      .single();

    if (error) {
      throw new Error("Failed to create admin: " + error.message);
    }

    return { success: true, admin };
  });
