import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, requireAuth, AuthRequest } from "../lib/auth";

import { rateLimit } from "../lib/rate-limit";

const router = Router();

router.post("/auth/login", rateLimit(8, 900000), async (req, res): Promise<void> => {
  const { email, password } = req.body ?? {};
  if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 1024) { res.status(400).json({ error: "Invalid credentials format" }); return; }
  if (!email || !password) {
    res.status(400).json({ error: "Email and password required" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (!user || !user.isActive) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: { ...safeUser, hourlyRate: safeUser.hourlyRate ? parseFloat(safeUser.hourlyRate) : null } });
});

router.post("/auth/register", rateLimit(5, 3600000), async (req, res): Promise<void> => {
  const { email, password, firstName, lastName, phone } = req.body ?? {};
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || typeof password !== "string" || password.length < 12 || password.length > 128 || typeof firstName !== "string" || typeof lastName !== "string" || firstName.length > 100 || lastName.length > 100 || (phone != null && (typeof phone !== "string" || phone.length > 40))) { res.status(400).json({ error: "Invalid registration fields" }); return; }
  if (!email || !password || !firstName || !lastName) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase()));
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    phone: phone ?? null,
    role: "client",
  }).returning();
  const token = signToken({ id: user.id, email: user.email, role: user.role });
  const { passwordHash: _, ...safeUser } = user;
  res.status(201).json({ token, user: { ...safeUser, hourlyRate: null } });
});

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id));
  if (!user || !user.isActive) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({ ...safeUser, hourlyRate: safeUser.hourlyRate ? parseFloat(safeUser.hourlyRate) : null });
});

router.post("/auth/logout", (_req, res): void => {
  res.json({ success: true });
});

export default router;
