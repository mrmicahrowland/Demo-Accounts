import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";

const origin = process.env.AUTH_TEST_ORIGIN ?? "http://127.0.0.1:4010";
const email = `auth-e2e-${randomUUID()}@example.test`;
const password = `AuthTest-${randomUUID()}-Strong!42`;
const post = async (path, body, cookie) => fetch(origin + path, {
  method: "POST",
  headers: { ...(body ? { "content-type": "application/json" } : {}), ...(cookie ? { cookie } : {}) },
  body: body ? JSON.stringify(body) : undefined,
  redirect: "manual",
});
const cookieOf = response => {
  const header = response.headers.get("set-cookie");
  assert.ok(header?.includes("refresh_token="), "refresh cookie must be set");
  assert.match(header, /httponly/i);
  assert.match(header, /samesite=strict/i);
  return header.split(";")[0];
};
const me = (token) => fetch(origin + "/api/auth/me", { headers: { authorization: `Bearer ${token}` } });

test("live HTTP auth: register, login, refresh rotation, replay rejection, logout revocation", async () => {
  const registration = await post("/api/auth/register", { email, password, firstName: "E2E", lastName: "Tester" });
  assert.equal(registration.status, 201, "registration must succeed");
  const initialCookie = cookieOf(registration);
  const registered = await registration.json();
  assert.equal((await me(registered.token)).status, 200);

  const wrong = await post("/api/auth/login", { email, password: "incorrect-password" });
  assert.equal(wrong.status, 401);

  const login = await post("/api/auth/login", { email, password });
  assert.equal(login.status, 200);
  const loginCookie = cookieOf(login);
  const loginBody = await login.json();
  assert.equal((await me(loginBody.token)).status, 200);

  const refresh = await post("/api/auth/refresh", undefined, loginCookie);
  assert.equal(refresh.status, 200);
  assert.match(refresh.headers.get("cache-control") ?? "", /no-store/);
  const rotatedCookie = cookieOf(refresh);
  assert.notEqual(rotatedCookie, loginCookie, "refresh token must rotate");
  const refreshed = await refresh.json();
  assert.equal((await me(refreshed.token)).status, 200);

  const replay = await post("/api/auth/refresh", undefined, loginCookie);
  assert.equal(replay.status, 401, "replayed refresh cookie must be rejected");

  const logout = await post("/api/auth/logout", undefined, rotatedCookie);
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie") ?? "", /refresh_token=.*max-age=0|refresh_token=.*expires=/i);
  assert.equal((await me(refreshed.token)).status, 401, "revoked session access token must fail");
  assert.equal((await post("/api/auth/refresh", undefined, rotatedCookie)).status, 401);

  // Separate registration session should remain valid after logging out of login session.
  assert.equal((await post("/api/auth/refresh", undefined, initialCookie)).status, 200);
});
