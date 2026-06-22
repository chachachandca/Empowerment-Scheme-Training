import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, adminsTable } from "@workspace/db";
import { AdminLoginBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "nes_salt_2024").digest("hex");
}

const activeSessions = new Map<string, { id: number; username: string; role: string }>();

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const hashed = hashPassword(password);

  const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.username, username));
  if (!admin || admin.passwordHash !== hashed) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  activeSessions.set(token, { id: admin.id, username: admin.username, role: admin.role });

  res.cookie("admin_token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    admin: { id: admin.id, username: admin.username, role: admin.role },
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

export { activeSessions, hashPassword };
export default router;
