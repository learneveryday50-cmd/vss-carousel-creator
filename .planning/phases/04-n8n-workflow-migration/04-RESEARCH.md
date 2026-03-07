# Phase 4: n8n Workflow Migration - Research

**Researched:** 2026-03-07
**Domain:** n8n Cloud workflow editing, Supabase REST API integration, n8n MCP tooling
**Confidence:** MEDIUM (n8n Cloud MCP tools verified via community docs; Supabase HTTP patterns verified via PostgREST official docs and GitHub issue)

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| N8N-01 | Existing n8n Cloud workflow is migrated from Airtable output nodes to Supabase output nodes using the n8n MCP | Research establishes: (1) n8n-mcp tool capabilities and limitations for Cloud, (2) Supabase HTTP Request node pattern with service role key, (3) workflow duplication via JSON export/import as safe backup strategy, (4) exact headers and endpoint format for Supabase writes |
</phase_requirements>

---

## Summary

Phase 4 is an n8n Cloud workflow surgery task, not a Next.js coding task. The goal is to replace Airtable output nodes in an existing cloud workflow with Supabase HTTP Request nodes, verify end-to-end operation, and do so safely (duplicate first, edit second). No code is deployed to the Next.js app in this phase — this phase is entirely an n8n configuration exercise.

The core technical challenge is knowing how to write to Supabase from n8n correctly. The native n8n Supabase node has a documented authentication bug (GitHub issue #17020) where it sends conflicting `apikey` and `Authorization` headers simultaneously, causing 403 errors with a service role key. The reliable, verified pattern is to use n8n's generic **HTTP Request node** configured with only the `apikey` header and the Supabase REST API endpoint — this sidesteps the bug entirely. For upsert semantics (updating an existing carousel record vs. creating new), the PostgREST protocol requires a `POST` with `Prefer: resolution=merge-duplicates` header to the table REST endpoint.

The n8n MCP tool used in the success criteria is `czlonkowski/n8n-mcp`. For workflow management (create, update, duplicate) it requires an n8n API key configured in the MCP server. The built-in n8n Cloud instance MCP exposes only search/execute — it cannot modify workflows. The practical approach for this phase is: (1) export the original workflow JSON as a backup, (2) use the n8n-mcp with an n8n API key OR edit directly in the n8n Cloud UI to replace Airtable nodes with HTTP Request nodes, (3) run a smoke test via manual webhook trigger.

**Primary recommendation:** Use the HTTP Request node (not the native Supabase node) to write to Supabase, with `apikey: <service_role_key>` and `Content-Type: application/json` headers only. Back up the workflow by exporting its JSON before any edits.

---

## Standard Stack

### Core

| Component | Version/Tool | Purpose | Why Standard |
|-----------|-------------|---------|--------------|
| n8n Cloud | Existing instance | Workflow runtime | Already in use; the existing workflow lives here |
| n8n HTTP Request node | Built-in | Write to Supabase REST API | Bypasses the Supabase node auth bug (issue #17020) |
| Supabase REST API (PostgREST) | `/rest/v1/` | Insert/upsert rows into `carousels` table | Already configured; RLS bypassed by service role key |
| n8n Credential (Generic / Header Auth) | Built-in | Store service role key securely | Key stored once in n8n, never exposed to client |

### Supporting

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| n8n-mcp (`czlonkowski/n8n-mcp`) | AI-assisted workflow editing via Claude | If MCP is configured with n8n API key; otherwise edit in n8n UI directly |
| n8n Workflow History / JSON Export | Backup before editing | Always — duplicate before any edits per phase success criteria |
| PostgREST `Prefer` header | Upsert semantics | When writing a result to a carousel that was created as `pending` in Phase 5 (pre-creates the row) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTTP Request node | Native n8n Supabase node | Supabase node has documented 403 bug with service_role key; HTTP Request node is the verified workaround |
| HTTP Request node | Postgres node (direct DB connection) | Postgres node requires Transaction Pooler credentials and SSL setup; HTTP Request is simpler and uses existing Supabase setup |
| n8n-mcp workflow edit | Direct n8n Cloud UI edit | If n8n MCP is not configured with an API key, direct UI edit is equivalent and simpler; both are valid |

---

## Architecture Patterns

### Supabase carousels Table Structure (from schema migration)

```sql
CREATE TABLE public.carousels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES public.brands(id),
  template_id UUID NOT NULL REFERENCES public.templates(id),
  image_style_id UUID NOT NULL REFERENCES public.image_styles(id),
  idea_text TEXT NOT NULL,
  post_body TEXT,                        -- n8n writes this
  status TEXT NOT NULL DEFAULT 'pending', -- n8n updates to 'completed' or 'failed'
  slide_urls JSONB DEFAULT '[]',          -- n8n writes ImageBB URLs array here
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS note:** The `carousels` table has `Users manage own carousels` RLS policy. Writing from n8n with the service_role key bypasses RLS entirely — n8n can update any row without user context.

### Pattern 1: HTTP Request Node to Supabase (Insert)

**What:** POST a new carousel record to Supabase via the REST API using the service role key in the `apikey` header only (not Authorization).

**When to use:** When n8n creates a fresh carousel record (if Phase 5 does not pre-create the row).

```
Method: POST
URL: https://<PROJECT_REF>.supabase.co/rest/v1/carousels
Headers:
  apikey: <service_role_key>
  Content-Type: application/json
  Prefer: return=representation
Body (JSON):
{
  "user_id": "{{ $json.user_id }}",
  "brand_id": "{{ $json.brand_id }}",
  "template_id": "{{ $json.template_id }}",
  "image_style_id": "{{ $json.image_style_id }}",
  "idea_text": "{{ $json.idea_text }}",
  "post_body": "{{ $json.post_body }}",
  "status": "completed",
  "slide_urls": {{ $json.slide_urls }}
}
```

### Pattern 2: HTTP Request Node to Supabase (Upsert / Update Existing)

**What:** PATCH or upsert an existing carousel row using its `id`. This is the likely real pattern — Phase 5 will pre-create a `pending` row with a carousel_id, pass it to n8n, and n8n writes back to that specific row.

**When to use:** When n8n receives a `carousel_id` in the webhook payload and needs to update the `pending` row to `completed` with slide URLs and post body.

```
Method: PATCH
URL: https://<PROJECT_REF>.supabase.co/rest/v1/carousels?id=eq.{{ $json.carousel_id }}
Headers:
  apikey: <service_role_key>
  Content-Type: application/json
  Prefer: return=representation
Body (JSON):
{
  "post_body": "{{ $json.post_body }}",
  "status": "completed",
  "slide_urls": {{ $json.slide_urls }},
  "updated_at": "{{ new Date().toISOString() }}"
}
```

**Alternative upsert via POST** (PostgREST standard, requires `id` in body):

```
Method: POST
URL: https://<PROJECT_REF>.supabase.co/rest/v1/carousels
Headers:
  apikey: <service_role_key>
  Content-Type: application/json
  Prefer: resolution=merge-duplicates,return=representation
Body (JSON): { "id": "...", "status": "completed", ... }
```

Source: PostgREST official docs — https://postgrest.org/en/stable/references/api/tables_views.html#upsert

### Pattern 3: Workflow Backup via JSON Export

**What:** Export the original n8n workflow as JSON before making any edits. This is the manual backup approach that satisfies the success criterion "A duplicate of the original workflow exists as a backup before any edits are made."

**Steps:**
1. Open the workflow in n8n Cloud UI
2. Click the three dots (Options) menu at the top-right
3. Select Export → JSON
4. Save the downloaded `.json` file to the project repo under `.planning/phases/04-n8n-workflow-migration/backup/`
5. Commit the file to git

**Alternative:** Use the n8n REST API to GET the workflow JSON:
```
GET https://<n8n-instance>/api/v1/workflows/<workflow_id>
Authorization: Bearer <n8n_api_key>
```
Then create a new workflow via POST with that JSON as the body.

### Pattern 4: n8n Credential Storage for Service Role Key

**What:** Store the Supabase service role key as an n8n credential so it is never hardcoded in workflow nodes or visible in execution logs.

**Steps:**
1. In n8n Cloud, go to Credentials → New Credential
2. Select "Header Auth" credential type
3. Set Name: `Supabase Service Role`
4. Set Header Name: `apikey`
5. Set Header Value: `<service_role_key>` (from Supabase → Settings → API → service_role)
6. In the HTTP Request node, use Authentication → "Predefined Credential Type" → Header Auth → select this credential

**Why this matters:** The service role key bypasses all RLS. If it appears in n8n execution logs, it is visible to anyone with n8n Cloud admin access. Using a credential masks the value in logs.

### Anti-Patterns to Avoid

- **Using the native n8n Supabase node with service_role key:** Causes 403 due to dual Authorization+apikey header bug (GitHub issue #17020, unresolved as of 2026). Use HTTP Request node instead.
- **Putting service_role key directly in HTTP Request header value field:** Exposes key in workflow JSON exports and execution logs. Use n8n Credential storage instead.
- **Using `Authorization: Bearer <service_role_key>` header:** Supabase's Kong gateway rejects this when used with a service role key for REST API writes. Only `apikey` header is needed.
- **Editing the original workflow without a backup:** Phase success criteria explicitly requires a backup before edits. Export JSON first.
- **Relying on n8n Cloud built-in MCP for workflow modification:** The built-in instance MCP only supports search_workflows, get_workflow_details, execute_workflow — it cannot create or modify workflows. Use the n8n-mcp with an n8n API key, or edit in the UI directly.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Supabase auth from n8n | Custom auth logic in code node | Header Auth credential + apikey header | n8n credential manager handles masking in logs |
| Upsert logic | IF node + separate insert/update branches | PATCH with `?id=eq.X` filter OR POST with `Prefer: resolution=merge-duplicates` | One HTTP node handles both cases; PostgREST handles conflict resolution |
| Workflow backup | Build a backup automation workflow | JSON export via UI (3 clicks) or GET /api/v1/workflows/:id | Far simpler for a one-time backup |
| n8n → Supabase connectivity | Direct Postgres connection credentials | REST API via HTTP Request node | REST API uses Supabase project URL already known; no connection pooler setup needed |

**Key insight:** This entire phase happens in n8n Cloud's UI (or via n8n-mcp). The complexity is knowing WHICH approach to use for Supabase writes, not building any custom infrastructure.

---

## Common Pitfalls

### Pitfall 1: Native Supabase Node 403 Error
**What goes wrong:** You drop in the built-in n8n Supabase node, configure the service role key as a credential, and get `403 Permission Denied` even though the key is correct.
**Why it happens:** The Supabase node sends both `apikey` and `Authorization` headers simultaneously. Kong (Supabase's gateway) prioritizes Authorization, sees a service_role key used as a user JWT, and rejects it.
**How to avoid:** Use the generic HTTP Request node instead. Set only `apikey` header. Do not set Authorization header.
**Warning signs:** 403 response despite confirmed correct key; works in curl but fails in n8n Supabase node.

Source: https://github.com/n8n-io/n8n/issues/17020

### Pitfall 2: Service Role Key Exposed in Execution Logs
**What goes wrong:** Service role key is hardcoded in an HTTP Request node header value field and appears in plain text in n8n execution log entries.
**Why it happens:** n8n does not automatically mask values in header fields unless they are stored as credentials.
**How to avoid:** Always store the key as a "Header Auth" credential and reference it from the node's Authentication field.
**Warning signs:** Viewing an execution in n8n Cloud shows the service_role key value in the "Headers" section of a node's input/output.

### Pitfall 3: n8n Cloud MCP Cannot Edit Workflows
**What goes wrong:** You configure the Claude Code MCP to point at your n8n Cloud instance's MCP endpoint and attempt to create/modify workflow nodes — the tools are absent.
**Why it happens:** n8n Cloud's built-in MCP exposes only three read/execute tools. Workflow editing requires the external `czlonkowski/n8n-mcp` server configured with an n8n REST API key.
**How to avoid:** Clarify upfront whether n8n-mcp is configured with an API key. If not, edit workflows in the n8n Cloud UI directly — it is equally valid for this phase.
**Warning signs:** MCP tool list shows only search_workflows / get_workflow_details / execute_workflow with no create/update capabilities.

Source: https://community.n8n.io/t/clarifying-how-far-claude-code-mcp-can-create-manage-workflows-on-n8n-cloud/258289

### Pitfall 4: carousel_id / user_id Not Passed in Webhook Payload
**What goes wrong:** n8n workflow completes generation but cannot write to the correct Supabase row because the webhook payload did not include a `carousel_id` (or `user_id` for insert).
**Why it happens:** Phase 4 tests in isolation. The test payload must include all fields n8n needs to write a complete record.
**How to avoid:** Design the smoke test payload to include all required fields: `carousel_id`, `user_id`, `post_body`, `slide_urls` (as JSON array).
**Warning signs:** Supabase write succeeds but creates an orphaned row (no user_id), or PATCH fails because carousel_id does not match any existing row.

### Pitfall 5: RLS Blocks Write Despite Service Role Key
**What goes wrong:** n8n writes appear to fail or return empty results despite using service role key.
**Why it happens:** If the HTTP Request node uses the `anon` key instead of `service_role`, RLS applies and `carousels` INSERT policy requires an authenticated user JWT — which n8n does not provide.
**How to avoid:** Confirm which key is in the n8n credential. Supabase → Settings → API shows two keys: `anon` (public) and `service_role`. Only the service_role bypasses RLS.
**Warning signs:** 403 or empty response from Supabase REST API; double-check key starts with `eyJ...` and is longer (~200+ chars, as all Supabase JWTs are).

---

## Code Examples

### Example 1: Smoke Test Payload (for manual webhook trigger)

Use this payload when testing the migrated workflow end-to-end:

```json
{
  "carousel_id": "00000000-0000-0000-0000-000000000001",
  "user_id": "<your-test-user-uuid-from-supabase-auth>",
  "brand_id": "<your-test-brand-uuid>",
  "template_id": "<any-seeded-template-uuid>",
  "image_style_id": "<any-seeded-image-style-uuid>",
  "idea_text": "Test carousel idea for migration smoke test",
  "brand_name": "Test Brand",
  "primary_color": "#FF6B00",
  "voice_guidelines": "Professional and clear",
  "product_description": "LinkedIn carousel generator",
  "audience_description": "B2B marketers",
  "cta_text": "Book a demo"
}
```

Note: For PATCH pattern (update existing row), you must first INSERT a `pending` row into Supabase with the `carousel_id` UUID above before triggering the webhook.

### Example 2: HTTP Request Node Configuration (Supabase PATCH)

```
Node: HTTP Request
Method: PATCH
URL: https://{{ $env.SUPABASE_URL }}/rest/v1/carousels?id=eq.{{ $json.carousel_id }}

Authentication: Predefined Credential Type → Header Auth → "Supabase Service Role"

Additional Headers:
  Content-Type: application/json
  Prefer: return=representation

Body (JSON / Raw):
{
  "post_body": "{{ $json.post_body }}",
  "status": "completed",
  "slide_urls": {{ JSON.stringify($json.slide_urls) }},
  "updated_at": "{{ new Date().toISOString() }}"
}
```

### Example 3: Supabase Service Role Credential in n8n

```
Credential type: Header Auth
Name: Supabase Service Role Key
Name (header field): apikey
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (your service_role JWT)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| n8n Supabase node for service_role writes | HTTP Request node with `apikey` header only | Bug present since ~2024 (GitHub #17020, unresolved) | Must use HTTP Request node for service_role writes |
| n8n built-in MCP (search/execute only) | czlonkowski/n8n-mcp with n8n API key for workflow modification | n8n Cloud MCP launched 2024, limited scope | External MCP server required for workflow editing via AI |
| Airtable as generation output store | Supabase REST API (this phase) | This migration | Eliminates external Airtable dependency; all data in Supabase |

**Deprecated/outdated:**
- n8n native Supabase node for service_role writes: do not use; has 403 bug with service_role key

---

## Open Questions

1. **Is n8n-mcp configured with an n8n API key in this project's Claude Code environment?**
   - What we know: The phase success criteria mentions "via n8n MCP" for duplicating the workflow. The built-in Cloud MCP cannot do this.
   - What's unclear: Whether `czlonkowski/n8n-mcp` is already installed and configured with an n8n API key in the developer's Claude Code setup.
   - Recommendation: The plan should cover both paths — (A) if n8n-mcp with API key is available, use it to duplicate and modify; (B) if not, use n8n Cloud UI to export JSON backup and edit nodes manually. The phase is not blocked either way.

2. **Does the existing n8n workflow receive a `carousel_id` to update an existing row, or does it create the row itself?**
   - What we know: Phase 4 is an isolation test; Phase 5 will pre-create the `pending` row and pass `carousel_id` to n8n.
   - What's unclear: Whether the Phase 4 smoke test should test the INSERT path (n8n creates the row) or the PATCH path (n8n updates an existing row).
   - Recommendation: For Phase 4, test the PATCH path since that is what Phase 5 will use. Manually insert a test `pending` row in Supabase first, then trigger the webhook with its `id`.

3. **What is the existing n8n workflow's webhook URL format (test vs. production)?**
   - What we know: n8n Cloud provides two webhook URLs per workflow: "Test" (only active while workflow is open in editor) and "Production" (always active when workflow is activated).
   - What's unclear: Which URL is currently used, and whether it needs to change after migration.
   - Recommendation: Note in the plan that smoke testing uses the "Test" webhook URL (workflow open in editor), but the production workflow must be activated for Phase 5 integration.

---

## Sources

### Primary (HIGH confidence)
- PostgREST official docs - https://postgrest.org/en/stable/references/api/tables_views.html#upsert — upsert semantics, `Prefer` header values, PATCH vs POST patterns
- GitHub issue n8n-io/n8n #17020 - https://github.com/n8n-io/n8n/issues/17020 — Supabase node 403 bug, root cause (dual headers), HTTP Request node workaround

### Secondary (MEDIUM confidence)
- n8n community: Claude Code + MCP Cloud capabilities - https://community.n8n.io/t/clarifying-how-far-claude-code-mcp-can-create-manage-workflows-on-n8n-cloud/258289 — confirmed built-in MCP cannot modify workflows
- czlonkowski/n8n-mcp GitHub - https://github.com/czlonkowski/n8n-mcp — tools available, env var requirements, n8n API key requirement
- n8n docs: Workflow history/export - https://docs.n8n.io/workflows/history/ — JSON export process, Cloud plan history limits
- n8n docs: Supabase credentials - https://docs.n8n.io/integrations/builtin/credentials/supabase/ — service_role key credential setup

### Tertiary (LOW confidence)
- Various n8n community threads on upsert — confirm native Supabase node lacks upsert; Postgres node as alternative; HTTP Request node as preferred workaround
- n8n workflow template #2395 (Supabase insertion/upsertion) — existence confirmed, content inaccessible

---

## Metadata

**Confidence breakdown:**
- Standard stack (HTTP Request node, service_role credential): HIGH — verified via GitHub issue + PostgREST docs
- Architecture (PATCH pattern, headers): HIGH — derived directly from PostgREST official docs
- n8n MCP capabilities/limitations: MEDIUM — verified via n8n community post and czlonkowski/n8n-mcp README
- Pitfalls (403 bug, log exposure): HIGH — documented in official GitHub issue
- Backup approach (JSON export): HIGH — documented in n8n official docs

**Research date:** 2026-03-07
**Valid until:** 2026-04-07 (n8n Supabase node bug may be fixed in a future release; check GitHub issue before relying on HTTP Request workaround)
