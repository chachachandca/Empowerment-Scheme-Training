import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";
import { supabaseAdmin } from "../lib/supabase";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "nes_salt_2024").digest("hex");
}

const activeSessions = new Map<string, { id: string | number; username: string; role: string; email?: string }>();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  // 1. Check local DB admins first (username + SHA256 hash)
  const hashed = hashPassword(password);
  let localAdmin: typeof adminsTable.$inferSelect | undefined;
  try {
    const rows = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
    localAdmin = rows[0];
  } catch {
    // local admins table may not exist — fall through to Supabase check
  }

  if (localAdmin && localAdmin.passwordHash === hashed) {
    const token = crypto.randomBytes(32).toString("hex");
    activeSessions.set(token, {
      id: localAdmin.id,
      username: localAdmin.username,
      role: localAdmin.role,
    });
    res.cookie("admin_token", token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({
      success: true,
      admin: { id: localAdmin.id, username: localAdmin.username, role: localAdmin.role },
    });
    return;
  }

  // 2. Check Supabase admins table (username field = email, password_hash = plain text)
  const { data: supabaseAdmins, error: supabaseError } = await supabaseAdmin
    .from("admins")
    .select("id, username, password_hash, role")
    .eq("username", username)
    .limit(1);

  if (supabaseError || !supabaseAdmins || supabaseAdmins.length === 0) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const supabaseAdmin_row = supabaseAdmins[0] as {
    id: string;
    username: string;
    password_hash: string;
    role: string;
  };

  if (supabaseAdmin_row.password_hash !== password) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, {
    id: supabaseAdmin_row.id,
    username: supabaseAdmin_row.username,
    role: supabaseAdmin_row.role ?? "admin",
    email: supabaseAdmin_row.username,
  });

  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    admin: {
      id: supabaseAdmin_row.id,
      username: supabaseAdmin_row.username,
      role: supabaseAdmin_row.role ?? "admin",
    },
  });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  const token = req.cookies?.admin_token;
  if (token) activeSessions.delete(token);
  res.clearCookie("admin_token");
  res.json({ success: true });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const token = req.cookies?.admin_token;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const admin = activeSessions.get(token);
  if (!admin) {
    res.status(401).json({ error: "Session expired" });
    return;
  }

  res.json(admin);
});

router.patch("/auth/password", async (req, res): Promise<void> => {
  const token = req.cookies?.admin_token;
  if (!token) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const session = activeSessions.get(token);
  if (!session) {
    res.status(401).json({ error: "Session expired" });
    return;
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required" });
    return;
  }

  if (newPassword.length < 6) {
    res.status(400).json({ error: "New password must be at least 6 characters" });
    return;
  }

  // Fetch the admin from Supabase to verify current password
  const { data: rows, error } = await supabaseAdmin
    .from("admins")
    .select("id, username, password_hash")
    .eq("username", session.username)
    .limit(1);

  if (error || !rows || rows.length === 0) {
    res.status(404).json({ error: "Admin account not found in Supabase" });
    return;
  }

  const adminRow = rows[0] as { id: string; username: string; password_hash: string };

  if (adminRow.password_hash !== currentPassword) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  // Update the password in Supabase
  const { error: updateError } = await supabaseAdmin
    .from("admins")
    .update({ password_hash: newPassword, updated_at: new Date().toISOString() })
    .eq("id", adminRow.id);

  if (updateError) {
    res.status(500).json({ error: "Failed to update password: " + updateError.message });
    return;
  }

  res.json({ success: true, message: "Password updated successfully" });
});

export { activeSessions, hashPassword };
export default router;
