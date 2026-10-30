import { createHash, randomBytes, randomUUID } from "node:crypto";
import { db, authSessionsTable, usersTable } from "@workspace/db";
import { and, eq, gt, isNull } from "drizzle-orm";
import type { Response, Request } from "express";

const DAYS = 7;
const COOKIE = "refresh_token";
const hash = (token: string) => createHash("sha256").update(token).digest("hex");
const expiry = () => new Date(Date.now() + DAYS * 86400000);
const cookieOptions = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api/auth",
  maxAge: DAYS * 86400000,
};

export async function createSession(userId: number, res: Response) {
  const id = randomUUID();
  const secret = randomBytes(32).toString("base64url");
  await db.insert(authSessionsTable).values({ id, userId, refreshHash: hash(secret), expiresAt: expiry() });
  res.cookie(COOKIE, id + "." + secret, cookieOptions);
  return id;
}

export async function rotateSession(req: Request, res: Response) {
  const value = req.cookies?.[COOKIE];
  if (typeof value !== "string") return null;
  const [id, secret, extra] = value.split(".");
  if (!id || !secret || extra || secret.length < 40) return null;
  const newSecret = randomBytes(32).toString("base64url");
  const now = new Date();
  const [session] = await db.update(authSessionsTable)
    .set({ refreshHash: hash(newSecret), expiresAt: expiry() })
    .where(and(eq(authSessionsTable.id, id), eq(authSessionsTable.refreshHash, hash(secret)), isNull(authSessionsTable.revokedAt), gt(authSessionsTable.expiresAt, now)))
    .returning();
  if (!session) {
    // A reused/invalid refresh credential must never mint a new access token.
    return null;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
  if (!user || !user.isActive) {
    await db.update(authSessionsTable).set({ revokedAt: now }).where(eq(authSessionsTable.id, id));
    return null;
  }
  res.cookie(COOKIE, id + "." + newSecret, cookieOptions);
  return { sessionId: id, user };
}

export async function revokeSession(req: Request, res: Response) {
  const cookie = req.cookies?.[COOKIE];
  if (typeof cookie === "string") {
    const [id, secret, extra] = cookie.split(".");
    if (id && secret && !extra && secret.length >= 40) {
      // Revocation requires the current refresh secret, not merely a session ID.
      await db.update(authSessionsTable).set({ revokedAt: new Date() })
        .where(and(eq(authSessionsTable.id, id), eq(authSessionsTable.refreshHash, hash(secret)),
          isNull(authSessionsTable.revokedAt), gt(authSessionsTable.expiresAt, new Date())));
    }
  }
  res.clearCookie(COOKIE, { path: cookieOptions.path, sameSite: cookieOptions.sameSite, secure: cookieOptions.secure, httpOnly: true });
}
