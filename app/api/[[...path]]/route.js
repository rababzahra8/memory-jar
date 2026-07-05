import { NextResponse } from 'next/server'
import { getSupabase, supabaseConfigured } from '@/lib/supabaseClient'

function json(data, status = 200) {
  return NextResponse.json(data, { status })
}

function pathSegments(params) {
  const p = params?.path
  if (!p) return []
  return Array.isArray(p) ? p : [p]
}

export async function GET(request, { params }) {
  const p = await params
  const segs = pathSegments(p)

  // GET /api/health
  if (segs[0] === 'health' || segs.length === 0) {
    return json({ ok: true, supabase: supabaseConfigured() })
  }

  // GET /api/memories
  if (segs[0] === 'memories') {
    if (!supabaseConfigured()) {
      return json({ memories: [], supabase: false })
    }
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) return json({ error: error.message }, 500)
    return json({ memories: data ?? [], supabase: true })
  }

  return json({ error: 'Not found' }, 404)
}

export async function POST(request, { params }) {
  const p = await params
  const segs = pathSegments(p)

  if (segs[0] === 'memories') {
    if (!supabaseConfigured()) {
      return json({ error: 'Supabase not configured' }, 503)
    }
    let body
    try { body = await request.json() } catch { return json({ error: 'Invalid JSON' }, 400) }

    const text = (body?.text || '').toString().trim()
    const type = (body?.type || 'secret').toString().trim()
    const author = body?.author ? String(body.author).trim().slice(0, 80) : null

    if (!text) return json({ error: 'text is required' }, 400)
    if (text.length > 2000) return json({ error: 'text too long' }, 400)

    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('memories')
      .insert([{ text, type, author }])
      .select()
      .single()

    if (error) return json({ error: error.message }, 500)
    return json({ memory: data }, 201)
  }

  return json({ error: 'Not found' }, 404)
}

export async function DELETE(request, { params }) {
  const p = await params
  const segs = pathSegments(p)

  if (segs[0] === 'memories' && segs[1]) {
    if (!supabaseConfigured()) return json({ error: 'Supabase not configured' }, 503)
    const supabase = getSupabase()
    const { error } = await supabase.from('memories').delete().eq('id', segs[1])
    if (error) return json({ error: error.message }, 500)
    return json({ ok: true })
  }

  return json({ error: 'Not found' }, 404)
}
