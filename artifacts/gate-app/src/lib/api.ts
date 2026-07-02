import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

// Generated hooks already include /api/ in their paths (e.g. /api/portfolio).
// We only need to prepend the Vite base path (e.g. "" when served at root,
// or "/gate-app" when served under a sub-path). Do NOT add /api here.
const base = import.meta.env.BASE_URL ?? "/";
const basePath = base === "/" ? "" : base.replace(/\/+$/, "");
setBaseUrl(basePath || null);
setAuthTokenGetter(() => localStorage.getItem("auth_token") ?? undefined);
