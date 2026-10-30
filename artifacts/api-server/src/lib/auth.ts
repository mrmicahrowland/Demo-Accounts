import jwt from "jsonwebtoken";
import { db, authSessionsTable, usersTable } from "@workspace/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("SESSION_SECRET must be configured with at least 32 characters");
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { id: number; email: string; role: string }, sessionId: string): string {
  return jwt.sign({ ...payload, sid: sessionId }, JWT_SECRET, { expiresIn: "15m" });
}

export function verifyToken(token: string): { id: number; email: string; role: string; sid: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload || typeof payload !== "object" || !Number.isSafeInteger(payload.id) || typeof payload.sid !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.sid)) return null;
    return payload as { id: number; email: string; role: string; sid: string };
  } catch {
    return null;
  }
}

export interface AuthRequest extends Request {
  user?: { id: number; email: string; role: string; sid?: string };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  {
    const [session] = await db.select().from(authSessionsTable).where(and(eq(authSessionsTable.id, payload.sid), eq(authSessionsTable.userId, payload.id), isNull(authSessionsTable.revokedAt), gt(authSessionsTable.expiresAt, new Date())));
    if (!session) { res.status(401).json({ error: "Session revoked" }); return; }
  }
  const [current] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
  if (!current || !current.isActive) { res.status(401).json({ error: "Account inactive" }); return; }
  req.user = { id: current.id, email: current.email, role: current.role, sid: payload.sid };
  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    void requireAuth(req, res, () => {
      if (!req.user || !roles.includes(req.user.role)) {
        res.status(403).json({ error: "Forbidden" });
        return;
      }
      next();
    });
  };
}
