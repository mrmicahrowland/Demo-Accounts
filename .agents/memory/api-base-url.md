---
name: API Client Base URL
description: How to correctly set the base URL in api.ts — generated hooks already include /api/ so do NOT add it again.
---

## The Rule

In `artifacts/gate-app/src/lib/api.ts`, use:

```ts
const base = import.meta.env.BASE_URL ?? "/";
const basePath = base === "/" ? "" : base.replace(/\/+$/, "");
setBaseUrl(basePath || null);
```

**Why:** Orval-generated hooks already embed the full API path including `/api/` prefix (e.g. the hook for portfolio resolves to `/api/portfolio`). If you set `setBaseUrl("/api")`, every request becomes `/api/api/portfolio` — a 404. The base URL should only contain the Vite sub-path prefix (empty string when served at root `/`), never the `/api` segment.

**How to apply:** Any time you touch `lib/api.ts` or wonder why all API calls return 404 — check this file first. The correct base is the Vite BASE_URL minus its trailing slash, with no `/api` appended.
