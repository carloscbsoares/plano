import { createClient } from '@supabase/supabase-js'
const supabaseUrl  = process.env.SUPABASE_URL || ''
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY || ''
const supabase     = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false }}) : null
const h = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json; charset=utf-8'
}
export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: h, body: '' }
  if (!supabase) return { statusCode: 500, headers: h, body: JSON.stringify({ ok:false, error:'Missing SUPABASE_URL / key' }) }
  try {
    const table = 'tasks'
    if (event.httpMethod === 'GET') {
      const { data, error } = await supabase.from(table).select('*').order('due', { ascending: true })
      if (error) throw error
      return { statusCode: 200, headers: h, body: JSON.stringify(data) }
    }
    if (event.httpMethod === 'POST') {
      const payload = JSON.parse(event.body || '{}')
      if (!payload.title || !payload.due) {
        return { statusCode: 400, headers: h, body: JSON.stringify({ ok:false, error:'title e due são obrigatórios' }) }
      }
      const { data, error } = await supabase.from(table).insert(payload).select().single()
      if (error) throw error
      return { statusCode: 200, headers: h, body: JSON.stringify(data) }
    }
    if (event.httpMethod === 'PUT') {
      const id = new URLSearchParams(event.rawQuery || event.queryStringParameters).get('id')
      if (!id) return { statusCode: 400, headers: h, body: JSON.stringify({ ok:false, error:'Missing id' }) }
      const payload = JSON.parse(event.body || '{}')
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single()
      if (error) throw error
      return { statusCode: 200, headers: h, body: JSON.stringify(data) }
    }
    if (event.httpMethod === 'DELETE') {
      const id = new URLSearchParams(event.rawQuery || event.queryStringParameters).get('id')
      if (!id) return { statusCode: 400, headers: h, body: JSON.stringify({ ok:false, error:'Missing id' }) }
      const { error } = await supabase.from(table).delete().eq('id', id)
      if (error) throw error
      return { statusCode: 200, headers: h, body: JSON.stringify({ ok:true }) }
    }
    return { statusCode: 405, headers: h, body: JSON.stringify({ ok:false, error:'Method Not Allowed' }) }
  } catch (err) {
    console.error(err)
    const msg = err?.message || String(err)
    return { statusCode: 500, headers: h, body: JSON.stringify({ ok:false, error: msg }) }
  }
}
