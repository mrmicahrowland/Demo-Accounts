import type { Request, Response, NextFunction } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { logger } from "./logger";
import { verifyToken, type AuthRequest } from "./auth";

const relevant = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const resourceNames = new Set(["auth", "users", "jobs", "estimates", "invoices", "settings", "time-entries", "notifications", "portfolio", "blog", "faq"]);

export function auditMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!relevant.has(req.method) || !req.path.startsWith("/api/")) { next(); return; }
  const routePath = req.path.slice(5);
  const segments = routePath.split("/").filter(Boolean);
  const entityType = segments[0] ?? "unknown";
  const entityId = segments[1] && /^\d+$/.test(segments[1]) ? segments[1] : null;
  if (!resourceNames.has(entityType)) { next(); return; }
  const authorization = req.headers.authorization;
  const payload = authorization?.startsWith("Bearer ") ? verifyToken(authorization.slice(7)) : null;
  const actor = (req as AuthRequest).user ?? payload;
  const action = [req.method, ...segments.map(s => /^\d+$/.test(s) ? ":id" : s)].join(" ").slice(0, 160);
  res.once("finish", () => {
    // Deliberately exclude bodies, tokens, cookies, passwords and personal details.
    void db.insert(auditLogsTable).values({
      actorId: actor?.id ?? null,
      actorRole: actor?.role ?? null,
      action,
      entityType,
      entityId,
      method: req.method,
      path: ("/api/" + segments.map(s => /^\d+$/.test(s) ? ":id" : s).join("/")).slice(0, 500),
      statusCode: res.statusCode,
      ipAddress: req.ip ?? null,
      requestId: typeof res.getHeader("x-request-id") === "string" ? String(res.getHeader("x-request-id")) : null,
      metadata: { outcome: res.statusCode < 400 ? "success" : "failure" },
    }).catch(error => { logger.error({ err: error }, "Audit log persistence failed"); });
  });
  next();
}
