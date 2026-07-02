import { setBaseUrl, setAuthTokenGetter } from "@workspace/api-client-react";

const base = import.meta.env.BASE_URL ?? "/";
const apiBase = base.endsWith("/") ? base.slice(0, -1) : base;
setBaseUrl(`${apiBase}/api`);
setAuthTokenGetter(() => localStorage.getItem("auth_token") ?? undefined);
