# Phase 4: n8n Workflow Migration - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a clean n8n Cloud workflow that accepts a webhook POST from the Next.js app, uses AI to generate carousel slide content and images, uploads images to ImgBB, and writes results to Supabase. The existing v5 workflow is discarded — this is a full rebuild from scratch based on lessons learned from what broke.

The Next.js app (generate/route.ts) already exists and fires a fire-and-forget POST to n8n with a pre-created carousel_id and all brand/template/style context. n8n writes back to Supabase directly (the app polls Supabase for status updates via Realtime).

</domain>

<decisions>
## Implementation Decisions

### Image generation approach
- Use OpenAI `/v1/images/generations` endpoint ONLY — never `/v1/images/edits`
- Model: `dall-e-3` (most reliable, widely available, no special API access needed)
- Size: 1024x1024, response_format: b64_json
- Visual prompts come from the LLM step — DALL-E receives a detailed text prompt per slide
- Do NOT attempt binary file passing for style reference — this was the root cause of all previous failures

### Style URL optimization (customer sample URL)
- The payload includes `style_url` (brand's custom or catalog default image style reference)
- Use Gemini's multimodal capability: pass `style_url` AS AN IMAGE INPUT to Gemini
- Gemini visually analyzes the style → writes DALL-E prompts that describe slides in that exact visual style
- No binary file handling — Gemini reads the URL directly, DALL-E generates from text prompts
- This is the only reliable way to "use" the sample URL without binary file upload complexity

### LLM model and output
- Primary: Gemini 2.0 Flash (`models/gemini-2.0-flash`) — confirmed working model ID
- Single LLM call generates ALL slide content + post_body in one JSON response
- LLM output format:
  ```json
  {
    "post_body": "LinkedIn post text...",
    "slides": [
      { "index": 1, "heading": "...", "body": "...", "visual_prompt": "Detailed DALL-E prompt" },
      ...
    ]
  }
  ```
- LLM receives: idea_text, brand context (name, color, voice, product, audience, cta), hook_style instruction, design_style description, slide_count, style_url (as multimodal image input)
- Slide count: EXACT — LLM must produce exactly slide_count slides (5, 7, or 10)

### Slide processing
- Sequential via SplitInBatches (one slide at a time)
- NOT parallel branches — simpler, more reliable, handles variable slide count
- Each slide: generate image → upload ImgBB → collect URL
- Code node at end: collect all {index, url} pairs → sort by index → produce ordered array

### Error handling
- Any node failure → fail the ENTIRE carousel
- No partial results — carousel status becomes "failed" cleanly
- Error branch: on-error outputs from every node → single "PATCH failed" HTTP node
- User sees failure state and can retry

### Supabase authentication pattern (critical — was broken in v5)
- Use HTTP Request node ONLY — never the native n8n Supabase node (has 403 bug, GitHub #17020)
- Credential: Header Auth credential with header name = `apikey`, value = service_role JWT
- ALSO add manual header: `Authorization: Bearer <service_role_jwt>` (both required for service_role access)
- Add `Prefer: return=representation` header → gets 200 JSON response, not 204 (n8n breaks on 204)
- Three PATCH nodes needed: Set Processing (status=processing), Set Completed, Set Failed

### Workflow structure
- Single active workflow (no disabled duplicate paths)
- Webhook node with secret validation (`X-Webhook-Secret` header check)
- 202 ACK response sent IMMEDIATELY via Respond to Webhook node (before AI processing)
- Processing happens asynchronously after ACK

</decisions>

<specifics>
## Specific Ideas

- User emphasized using the `style_url` (sample image) to influence the visual output — Gemini multimodal handles this cleanly
- "Lowest failure rate" = dall-e-3 (not gpt-image-1 which requires special access) + Gemini 2.0 Flash (confirmed working model)
- Fail the whole carousel on any error — no partial results to confuse the user
- The app already handles the "failed" state in UI — just need to write it to Supabase

</specifics>

<code_context>
## Existing Code Insights

### What Next.js sends to n8n (generate/route.ts payload — flat structure)
```json
{
  "carousel_id": "uuid",
  "idea_text": "string",
  "slide_count": 7,
  "brand_id": "uuid",
  "brand_name": "string",
  "brand_color": "#hex",
  "voice_guidelines": "string",
  "product_description": "string",
  "audience_description": "string",
  "cta_text": "string",
  "template_id": "uuid",
  "template_name": "string",
  "template_slug": "string",
  "template_front_url": "string",
  "template_content_url": "string",
  "template_cta_url": "string",
  "image_style_id": "uuid",
  "style_name": "string",
  "style_description": "string",
  "style_url": "string",
  "hook_style_name": "string",
  "hook_style_description": "string",
  "hook_style_instruction": "string",
  "design_style": "string",
  "design_style_description": "string",
  "design_style_url": "string",
  "custom_instructions": ""
}
```

### What n8n must write to Supabase carousels table
```json
PATCH /rest/v1/carousels?id=eq.{carousel_id}
{
  "status": "completed",           // or "failed"
  "post_body": "string",           // LinkedIn post text
  "slide_urls": ["url1", "url2"],  // JSONB array — must be JSON.stringify'd in n8n expression
  "updated_at": "ISO timestamp"
}
```

### Supabase table schema (key columns)
- `id` UUID primary key
- `user_id` UUID (RLS owner)
- `status` TEXT — 'pending' → 'processing' → 'completed' | 'failed'
- `post_body` TEXT (null until n8n writes it)
- `slide_urls` JSONB DEFAULT '[]' (empty array until n8n writes it)

### App polling behavior
- Frontend polls `/api/generate/status?id={carousel_id}` every 2s
- Displays "Generating" spinner while status = processing
- Shows preview when status = completed (slide_urls + post_body)
- Shows error state when status = failed

### Supabase project
- URL: `https://ihtowlmrgjhgwgnxgimy.supabase.co`
- REST endpoint: `https://ihtowlmrgjhgwgnxgimy.supabase.co/rest/v1/carousels`

### n8n webhook secret
- Next.js sends `X-Webhook-Secret` header
- env var: `N8N_WEBHOOK_SECRET`

</code_context>

<deferred>
## Deferred Ideas

- Video or animated carousels — out of scope (REQUIREMENTS.md explicitly excludes)
- Email notification when generation completes — v2 requirement (NOTF-V2-01)
- Regenerate from history with modified inputs — v2 requirement (GEN-V2-01)
- Using gpt-image-1 — consider for v2 if dall-e-3 quality insufficient

</deferred>

---

*Phase: 04-n8n-workflow-migration*
*Context gathered: 2026-03-09*
