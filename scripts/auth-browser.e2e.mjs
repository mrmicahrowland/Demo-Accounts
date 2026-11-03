import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { chromium } from "/tmp/auth-browser/node_modules/playwright/index.mjs";

const origin = "http://127.0.0.1:4174";
const email = `browser-${randomUUID()}@example.test`;
const password = `Browser-E2E-${randomUUID()}-Strong!42`;
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext({ baseURL: origin });
  const page = await context.newPage();
  const terms = await (await context.request.get("/api/public/terms")).json();
  const registered = await context.request.post("/api/auth/register", {
    data: { email, password, firstName: "Browser", lastName: "Tester", acceptTerms: true, termsVersionId: terms.id },
  });
  assert.equal(registered.status(), 201, "test user registration");
  // The browser must authenticate through the UI, not the API request context.
  await context.clearCookies();
  await page.goto("/login");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Sign In", exact: true }).click();
  await page.waitForURL(url => !url.pathname.endsWith("/login"), { timeout: 20000 });
  const cookies = await context.cookies();
  const refresh = cookies.find(cookie => cookie.name === "refresh_token");
  assert.ok(refresh, "refresh cookie exists after browser login");
  assert.equal(refresh.httpOnly, true);
  assert.equal(refresh.sameSite, "Strict");
  assert.equal(refresh.path, "/api/auth");
  const storage = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
  assert.ok(!Object.keys(storage.local).some(key => /auth_token|access_token|refresh_token/i.test(key)));
  assert.ok(!Object.keys(storage.session).some(key => /auth_token|access_token|refresh_token/i.test(key)));
  await page.reload();
  await page.waitForURL(url => !url.pathname.endsWith("/login"), { timeout: 20000 });
  await page.getByText("Browser Tester", { exact: true }).click();
  await page.getByText("Sign Out", { exact: true }).first().click();
  await page.waitForURL("**/login", { timeout: 20000 });
  assert.ok(!(await context.cookies()).some(cookie => cookie.name === "refresh_token"));
  await page.goto("/");
  await page.waitForURL("**/login", { timeout: 20000 });
  console.log("Browser UI login, reload, HttpOnly cookie, storage and logout checks passed");
  await context.close();
} finally {
  await browser.close();
}
