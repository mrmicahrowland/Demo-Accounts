import { refreshAccessToken } from "./api";

const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
export async function clientApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  const request = async (token: string | null) => fetch(base + "/api/client" + path, {
    ...init, credentials: "include",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}), ...init.headers },
  });
  let response = await request(await refreshAccessToken());
  if (response.status === 401) response = await request(await refreshAccessToken(true));
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).error ?? "Request failed");
  return response.json() as Promise<T>;
}
