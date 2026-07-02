---
name: Orval Generated Hook Names
description: Always verify exact hook names from Orval codegen — they differ from intuitive names.
---

Orval generates hook names from OpenAPI operation IDs. These don't always match intuitive patterns.

**Always grep the generated file before using a hook:**
```bash
grep "^export function use\|^export const use" lib/api-client-react/src/generated/api.ts
```

**Known non-obvious names in this project:**
- Convert estimate to invoice: `useConvertEstimateToInvoice` (not `useConvertEstimate`)
- Mark invoice paid: `useMarkInvoicePaid` (not `usePayInvoice` or `useMarkPaid`)
- Approve estimate: `useApproveEstimate`
- Mark all notifications read: `useMarkAllNotificationsRead`

**Why:** Orval derives names from the OpenAPI `operationId` field in `lib/api-spec/openapi.yaml`. Changing the operationId changes the hook name.

**How to apply:** Before writing any mutation hook call, verify the exact name in the generated file. Never guess.
