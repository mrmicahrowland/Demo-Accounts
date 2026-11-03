import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";

const base = process.env.AUTH_TEST_ORIGIN ?? "http://127.0.0.1:4010";
const dbUrl = process.env.DATABASE_URL;
assert.ok(dbUrl, "DATABASE_URL required");
const sql = statement => execFileSync("psql", [dbUrl, "-At", "-v", "ON_ERROR_STOP=1", "-c", statement], { encoding: "utf8" }).trim();
const roles = ["admin", "manager", "supervisor", "crew", "client"];
const actors = {};
async function request(method, path, role, body) {
  const res = await fetch(base + "/api" + path, {
    method,
    headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...(role ? { authorization: `Bearer ${actors[role].token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}
test("five roles: authentication, authorization, and core business workflows", async () => {
  for (const role of roles) {
    const email = `readiness-${role}-${randomUUID()}@example.test`;
    const password = `Role-Test-${randomUUID()}-Secure!42`;
    const registered = await request("POST", "/auth/register", null, { email, password, firstName: role, lastName: "Test" });
    assert.equal(registered.status, 201, `register ${role}`);
    const id = Number(sql(`SELECT id FROM users WHERE email = '${email}'`));
    assert.ok(Number.isSafeInteger(id), `user id for ${role}`);
    sql(`UPDATE users SET role = '${role}' WHERE id = ${id}`);
    const login = await request("POST", "/auth/login", null, { email, password });
    assert.equal(login.status, 200, `login ${role}`);
    actors[role] = { id, token: login.body.token };
    assert.equal((await request("GET", "/auth/me", role)).status, 200);
  }

  for (const role of roles) {
    const users = await request("GET", "/users", role);
    assert.equal(users.status, ["admin","manager","supervisor"].includes(role) ? 200 : 403, `users listing: ${role}`);
    const create = await request("POST", "/jobs", role, { title: `Readiness job ${randomUUID()}` });
    assert.equal(create.status, ["admin","manager"].includes(role) ? 201 : 403, `job creation: ${role}`);
    const invoice = await request("POST", "/invoices", role, { clientId: actors.client.id, amount: 150, lineItems: [] });
    assert.equal(invoice.status, ["admin","manager"].includes(role) ? 201 : 403, `invoice creation: ${role}`);
  }

  const job = await request("POST", "/jobs", "admin", { title: "Role-bound workflow", clientId: actors.client.id, assignedToId: actors.crew.id });
  assert.equal(job.status, 201);
  const jobId = job.body.id;
  assert.equal((await request("GET", `/jobs/${jobId}`, "client")).status, 200);
  assert.equal((await request("GET", `/jobs/${jobId}`, "supervisor")).status, 403);
  assert.equal((await request("PATCH", `/jobs/${jobId}/status`, "crew", { status: "in_progress" })).status, 200);
  assert.equal((await request("PATCH", `/jobs/${jobId}/status`, "client", { status: "completed" })).status, 403);
  assert.equal((await request("PATCH", `/jobs/${jobId}/status`, "crew", { status: "completed" })).status, 200);

  const invoice = await request("POST", "/invoices", "manager", { clientId: actors.client.id, amount: 250, lineItems: [] });
  assert.equal(invoice.status, 201);
  assert.equal((await request("GET", `/invoices/${invoice.body.id}`, "client")).status, 200);
  assert.equal((await request("PATCH", `/invoices/${invoice.body.id}/pay`, "client")).status, 409, "payment marking disabled");
  const otherClientEmail = `other-client-${randomUUID()}@example.test`;
  const otherPassword = `Other-${randomUUID()}-Secure!42`;
  assert.equal((await request("POST", "/auth/register", null, { email: otherClientEmail, password: otherPassword, firstName: "Other", lastName: "Client" })).status, 201);
  const other = await request("POST", "/auth/login", null, { email: otherClientEmail, password: otherPassword });
  actors.other = { token: other.body.token };
  assert.equal((await request("GET", `/invoices/${invoice.body.id}`, "other")).status, 403);
  assert.equal((await request("GET", `/jobs/${jobId}`, "other")).status, 403);
});
