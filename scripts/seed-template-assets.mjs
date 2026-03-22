// One-time script: uploads template asset images to Supabase Storage
// and seeds the template_assets table.
// Run: node scripts/seed-template-assets.mjs

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ── Load .env.local ───────────────────────────────────────────────────────────
const envRaw = readFileSync('.env.local', 'utf8')
const env = Object.fromEntries(
  envRaw
    .split('\n')
    .filter((l) => l.trim() && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET       = 'carousel-slides'
const FOLDER       = 'template-assets'

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ── Template asset definitions ────────────────────────────────────────────────
// Each asset maps to one row in template_assets.
// font  = cover/first slide image
// content = content slide image
const ASSETS = [
  {
    name: 'Technical Annotation',
    sort_order: 1,
    font:    'C:/Users/APC/Downloads/Screenshot 2005.png',
    content: 'C:/Users/APC/Downloads/Screenshot 2005.png',
  },
  {
    name: 'Notebook',
    sort_order: 2,
    font:    'C:/Users/APC/Downloads/Screenshot 2091.png',
    content: 'C:/Users/APC/Downloads/Screenshot 2090.png',
  },
  {
    name: 'Whiteboard Diagram',
    sort_order: 3,
    font:    'C:/Users/APC/Downloads/Screenshot 2092.png',
    content: 'C:/Users/APC/Downloads/Screenshot 2093.png',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
async function uploadFile(localPath, storageKey) {
  const buf = readFileSync(localPath)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storageKey, buf, { contentType: 'image/png', upsert: true })
  if (error) throw new Error(`Upload failed [${storageKey}]: ${error.message}`)
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${storageKey}`
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log('Clearing existing template_assets…')
  const { error: delErr } = await supabase
    .from('template_assets')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // delete all
  if (delErr) throw delErr

  for (const asset of ASSETS) {
    const slug = asset.name.toLowerCase().replace(/\s+/g, '-')
    console.log(`\nUploading: ${asset.name}`)

    const fontUrl    = await uploadFile(asset.font,    `${FOLDER}/${slug}-font.png`)
    const contentUrl = await uploadFile(asset.content, `${FOLDER}/${slug}-content.png`)
    console.log(`  font:    ${fontUrl}`)
    console.log(`  content: ${contentUrl}`)

    const { error } = await supabase.from('template_assets').insert({
      name:                 asset.name,
      template_font_url:    fontUrl,
      template_content_url: contentUrl,
      template_cta_url:     null,
      is_active:            true,
      sort_order:           asset.sort_order,
    })
    if (error) throw error
    console.log(`  ✓ inserted`)
  }

  console.log('\n✅ Done — template_assets seeded.')
}

run().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err)
  process.exit(1)
})
