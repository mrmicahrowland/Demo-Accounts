import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const base = import.meta.env.BASE_URL ?? "/";
const basePath = base === "/" ? "" : base.replace(/\\/+$/, "");
setBaseUrl(basePath || null);

// Access tokens are never persisted. The HttpOnly refresh cookie is browser-managed.
let accessToken: string | null = null;
let refreshInFlight: Promise<string | null> | null = null;
let generation = 0;

export function setAccessToken(token: string | null) {
  generation++;
  accessToken = token;
  if (!token) refreshInFlight = null;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (accessToken) return accessToken;
  if (refreshInFlight) return refreshInFlight;
  const currentGeneration = generation;
  const promise = (async () => {
    try {
      const response = await fetch(basePath + "/api/auth/refresh", {
        method: "POST", credentials: "include", cache: "no-store",
      });
      if (!response.ok) return null;
      const result: unknown = await response.json();
      if (!result || typeof result !== "object" || !("token" in result) ||
          typeof result.token !== "string") return null;
      if (generation === currentGeneration) accessToken = result.token;
      return generation === currentGeneration ? accessToken : null;
    } catch {
      return null;
    }
  })();
  refreshInFlight = promise;
  try { return await promise; }
  finally { if (refreshInFlight === promise) refreshInFlight = null; }
}

export function clearAccessToken() { setAccessToken(null); }
setAuthTokenGetter(refreshAccessToken);
