// Airtable API client — matches the "Generate Linkedin Carousels" n8n workflow

const BASE_ID = 'appI5nS17LKNdDYGe'

export const AIRTABLE_TABLES = {
  brands:       'tblSCEQFDEhDCYNv5',
  ideas:        'tblUGmJPBXfs81pSj',
  draftPosts:   'tblIgtemiB5mTwqzW',
  templates:    'tblWYBupbcSaGFhUJ',
  designStyles: 'tbl7sY5329RH6CMAF',
} as const

// The ideas table URL passed to the n8n webhook as query param
export const IDEAS_TABLE_URL =
  'https://airtable.com/appI5nS17LKNdDYGe/tblUGmJPBXfs81pSj/viwucSI3YDRj4OrMi?blocks=hide'

function apiKey() {
  const key = process.env.AIRTABLE_API_KEY
  if (!key) throw new Error('AIRTABLE_API_KEY env var is not set')
  return key
}

async function airtableFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Airtable ${res.status}: ${text}`)
  }
  return res.json()
}

export type AirtableRecord = {
  id: string
  fields: Record<string, unknown>
  createdTime: string
}

export async function listRecords(tableId: string): Promise<AirtableRecord[]> {
  const data = await airtableFetch(`/${tableId}`)
  return data.records ?? []
}

export async function getRecord(tableId: string, recordId: string): Promise<AirtableRecord> {
  return airtableFetch(`/${tableId}/${recordId}`)
}

export async function createRecord(
  tableId: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  return airtableFetch(`/${tableId}`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  })
}

export async function deleteRecord(tableId: string, recordId: string): Promise<void> {
  await airtableFetch(`/${tableId}/${recordId}`, { method: 'DELETE' })
}

export async function updateRecord(
  tableId: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  return airtableFetch(`/${tableId}/${recordId}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields }),
  })
}

export async function searchRecords(
  tableId: string,
  formula: string,
): Promise<AirtableRecord[]> {
  const data = await airtableFetch(`/${tableId}?filterByFormula=${encodeURIComponent(formula)}`)
  return data.records ?? []
}

// ── Brand sync helpers ───────────────────────────────────────────────────────

type BrandSyncInput = {
  supabaseId: string
  name: string
  primaryColor: string
  voiceGuidelines?: string | null
  productDescription?: string | null
  audienceDescription?: string | null
  ctaText?: string | null
}

function brandToAirtableFields(input: BrandSyncInput): Record<string, unknown> {
  const productAndAudience = [input.productDescription, input.audienceDescription]
    .filter(Boolean)
    .join('\n\n')

  return {
    'Brand Name': input.name,
    'Brand Color': input.primaryColor,
    'Voice Guidelines': input.voiceGuidelines ?? '',
    'Product & Audience': productAndAudience,
    'CTA Text': input.ctaText ?? '',
    'Supabase ID': input.supabaseId,
  }
}

export async function syncBrandToAirtable(input: BrandSyncInput): Promise<void> {
  try {
    // Check if already exists by Supabase ID
    const existing = await searchRecords(
      AIRTABLE_TABLES.brands,
      `{Supabase ID} = "${input.supabaseId}"`
    )
    if (existing.length > 0) {
      await updateRecord(AIRTABLE_TABLES.brands, existing[0].id, brandToAirtableFields(input))
    } else {
      await createRecord(AIRTABLE_TABLES.brands, brandToAirtableFields(input))
    }
  } catch (err) {
    console.error('[airtable] syncBrandToAirtable failed:', err)
  }
}

// ── Typed app models ────────────────────────────────────────────────────────

export type AirtableBrand = {
  id: string
  name: string
  primaryColor: string
  secondaryColor: string | null
  voiceGuidelines: string | null
  productDescription: string | null
  audienceDescription: string | null
  ctaText: string | null
}

export type AirtableTemplate = {
  id: string
  name: string
  frontPageUrl: string | null
  contentPageUrl: string | null
  ctaPageUrl: string | null
}

export type AirtableDesignStyle = {
  id: string
  name: string
  description: string | null
  exampleUrl: string | null
}

type Attachment = { url: string }

export function parseBrand(record: AirtableRecord): AirtableBrand {
  const f = record.fields
  return {
    id: record.id,
    name: String(f['Brand Name'] ?? ''),
    primaryColor: String(f['Brand Color'] ?? '#000000'),
    secondaryColor: (f['Secondary Color'] as string) ?? null,
    voiceGuidelines: (f['Voice Guidelines'] as string) ?? null,
    productDescription: (f['Product & Audience'] as string) ?? null,
    audienceDescription: null,
    ctaText: (f['CTA Text'] as string) ?? null,
  }
}

export function parseTemplate(record: AirtableRecord): AirtableTemplate {
  const f = record.fields
  const front   = (f['Front Page']   as Attachment[] | undefined)?.[0]?.url ?? null
  const content = (f['Content Page'] as Attachment[] | undefined)?.[0]?.url ?? null
  const cta     = (f['CTA Page']     as Attachment[] | undefined)?.[0]?.url ?? null
  return {
    id: record.id,
    name: String(f['Name'] ?? f['Template Name'] ?? record.id),
    frontPageUrl: front,
    contentPageUrl: content,
    ctaPageUrl: cta,
  }
}

export function parseDesignStyle(record: AirtableRecord): AirtableDesignStyle {
  const f = record.fields
  const example = (f['Examples'] as Attachment[] | undefined)?.[0]?.url ?? null
  return {
    id: record.id,
    name: String(
      f['Style Name (from Design Style)'] ??
      f['Style Name'] ??
      f['Name'] ??
      ''
    ),
    description: (
      (f['Design Style (from Design Style)'] as string) ??
      (f['Design Style'] as string) ??
      (f['Description'] as string) ??
      null
    ),
    exampleUrl: example,
  }
}
