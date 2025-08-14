import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = process.env.SUPABASE_URL || ''
const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY || ''
const supabase     = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false }})

export const handler = async (event) => {
  try {
    if(!supabaseUrl || !supabaseKey) {
      return { statusCode: 500, body: JSON.stringify({ ok:false, error:'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE (or ANON) envs' }) }
    }
    const table = 'tasks'
    if(event.httpMethod === 'GET'){
      const { data, error } = await supabase.from(table).select('*').order('due', { ascending: true })
      if(error) throw error
      return { statusCode: 200, body: JSON.stringify(data) }
    }
    if(event.httpMethod === 'POST'){
      const payload = JSON.parse(event.body || '{}')
      const { data, error } = await supabase.from(table).insert(payload).select().single()
      if(error) throw error
      return { statusCode: 200, body: JSON.stringify(data) }
    }
    if(event.httpMethod === 'PUT'){
      const id = new URLSearchParams(event.rawQuery || event.queryStringParameters).get('id')
      if(!id) return { statusCode: 400, body: 'Missing id' }
      const payload = JSON.parse(event.body || '{}')
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single()
      if(error) throw error
      return { statusCode: 200, body: JSON.stringify(data) }
    }
    if(event.httpMethod === 'DELETE'){
      const id = new URLSearchParams(event.rawQuery || event.queryStringParameters).get('id')
      if(!id) return { statusCode: 400, body: 'Missing id' }
      const { error } = await supabase.from(table).delete().eq('id', id)
      if(error) throw error
      return { statusCode: 200, body: JSON.stringify({ ok: true }) }
    }
    return { statusCode: 405, body: 'Method Not Allowed' }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ ok:false, error:String(err) }) }
  }
}
