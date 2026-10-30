import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { verifyToken, signToken } from "../lib/auth";
import jwt from "jsonwebtoken";
import { validateFields } from "../lib/validate";
import { auditMiddleware } from "../lib/audit";

const secret = process.env.SESSION_SECRET!;
const sessionId = "f17d6f72-38e2-45d8-a0c2-3fddc6e50755";
test("authentication: reject legacy tokens without a session ID", () => {
  const legacy = jwt.sign({ id: 1, role: "admin", email: "a@example.com" }, secret);
  assert.equal(verifyToken(legacy), null);
});
test("authentication: reject malformed and expired tokens", () => {
  assert.equal(verifyToken("invalid"), null);
  assert.equal(verifyToken(jwt.sign({ id: 1, sid: sessionId }, secret, { expiresIn: -1 })), null);
  assert.equal(verifyToken(jwt.sign({ id: 1, sid: "bad" }, secret)), null);
});
test("authentication: issue session-bound short-lived tokens", () => {
  const token = signToken({ id: 1, email: "a@example.com", role: "client" }, sessionId);
  assert.equal(verifyToken(token)?.sid, sessionId);
  assert.ok((jwt.decode(token) as jwt.JwtPayload).exp! - Math.floor(Date.now()/1000) <= 900);
});
test("authorization: reject unapproved role and payment field mutations", () => {
  const middleware = validateFields({ title: "text" });
  const run = (body: unknown) => {
    let code = 200; let nextCalled = false;
    const res = { status(n: number) { code=n; return this; }, json() { return this; } };
    middleware({ body } as any, res as any, () => { nextCalled=true; });
    return { code, nextCalled };
  };
  assert.deepEqual(run({ title: "Allowed" }), { code: 200, nextCalled: true });
  assert.equal(run({ title: "Allowed", role: "admin" }).code, 400);
  assert.equal(run({ title: "Allowed", amountPaid: 100 }).code, 400);
  assert.equal(run({ title: 42 }).code, 400);
});
test("audit: middleware does not log read-only requests", () => {
  let nextCalled = false;
  auditMiddleware({ method: "GET", path: "/api/users" } as any, {} as any, () => { nextCalled = true; });
  assert.equal(nextCalled, true);
});
test("migration: session and audit tables have required safety columns", () => {
  const root = resolve(process.cwd(), "../../");
  const session = readFileSync(resolve(root, "lib/db/migrations/0001_auth_sessions.sql"), "utf8");
  const audit = readFileSync(resolve(root, "lib/db/migrations/0002_audit_logs.sql"), "utf8");
  for (const col of ["refresh_hash", "expires_at", "revoked_at", "user_id"]) assert.match(session, new RegExp(col));
  for (const col of ["actor_id", "action", "status_code", "created_at"]) assert.match(audit, new RegExp(col));
});
