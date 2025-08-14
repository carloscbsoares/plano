import React, { useEffect, useMemo, useState } from 'react'

const todayISO = () => new Date().toISOString().slice(0,10)
const fmtBR = (s) => new Date(`${s}T00:00:00`).toLocaleDateString()
const API = '/.netlify/functions/tasks'
const NOTIFY = '/.netlify/functions/notify'

export default function App(){
  const [tasks,setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [q,setQ]=useState(''); const [status,setStatus]=useState('todos'); const [sort,setSort]=useState('dueAsc')

  async function load(){
    setLoading(true)
    try{
      const r = await fetch(API); const data = await r.json(); setTasks(Array.isArray(data)?data:[])
    }catch{ setTasks([]) } finally{ setLoading(false) }
  }
  useEffect(()=>{ load() }, [])

  async function addTask(form){
    const task = {
      title: form.title.value.trim(),
      owner: form.owner.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      due: form.due.value,
      notes: form.notes.value.trim(),
      status: 'pendente'
    }
    if(!task.title) return alert('Informe o título')
    await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(task) })
    form.reset(); form.due.value = todayISO()
    await load()
  }
  async function updateTask(id, patch){
    await fetch(`${API}?id=${encodeURIComponent(id)}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(patch)})
    await load()
  }
  async function removeTask(id){
    await fetch(`${API}?id=${encodeURIComponent(id)}`, { method:'DELETE' })
    await load()
  }

  const list = useMemo(()=>{
    const query=q.trim().toLowerCase()
    let L = tasks.filter(t => [t.title,t.owner,t.email,t.phone,t.notes].filter(Boolean).some(f=>String(f).toLowerCase().includes(query)))
    if(status!=='todos') L = L.filter(t=>t.status===status)
    switch(sort){
      case 'dueAsc': L.sort((a,b)=>String(a.due).localeCompare(String(b.due))); break
      case 'dueDesc': L.sort((a,b)=>String(b.due).localeCompare(String(a.due))); break
      case 'title': L.sort((a,b)=>String(a.title).localeCompare(String(b.title))); break
    }
    return L
  },[tasks,q,status,sort])

  async function forceNotify(mode='due'){
    setSending(true)
    try{
      const today = todayISO()
      const pend = tasks.filter(t=>t.status==='pendente')
      const dueToday = pend.filter(t=>t.due===today)
      const overdue  = pend.filter(t=>t.due<today)
      const all = pend
      const send = (type,t)=>fetch(NOTIFY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type,task:t})}).catch(()=>{})
      if(mode==='all'){
        if(!confirm('Enviar email/SMS para TODAS as tarefas pendentes?')) return;
        for(const t of all){ const type = t.due<today?'overdue':'due'; await send(type,t) }
      }else{
        for(const t of dueToday) await send('due',t)
        for(const t of overdue)  await send('overdue',t)
      }
      alert('Alertas enviados.')
    } finally { setSending(false) }
  }

  return (
    <div style={{maxWidth:1100, margin:'0 auto', padding:24}}>
      <header style={{display:'flex',gap:12,alignItems:'flex-end',justifyContent:'space-between',marginBottom:18}}>
        <div>
          <h1 style={{margin:0, fontSize:'clamp(24px,3vw,36px)'}}>Plano de Ação</h1>
          <div style={{color:'#94a3b8',fontSize:14,marginTop:6}}>Sincronizado na nuvem (Supabase) + alertas por Email/SMS.</div>
        </div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          <button onClick={()=>forceNotify('due')} disabled={sending} style={{padding:'10px 12px', borderRadius:12, border:'none', background:'linear-gradient(90deg,#22c55e,#38bdf8)', color:'#0b1220', fontWeight:600}}>
            {sending?'Enviando…':'Disparar alertas agora'}
          </button>
          <button onClick={()=>forceNotify('all')} disabled={sending} style={{padding:'10px 12px', borderRadius:12, border:'1px solid rgba(255,255,255,.18)', background:'transparent', color:'#e2e8f0'}}>
            Enviar para todas
          </button>
        </div>
      </header>

      <form onSubmit={(e)=>{e.preventDefault(); addTask(e.target)}} style={{display:'grid', gap:12, gridTemplateColumns:'2fr 1fr 1fr 1fr'}}>
        <input name="title" placeholder="Atividade" />
        <input name="owner" placeholder="Responsável" />
        <input name="email" placeholder="Email (alerta)" type="email" />
        <input name="phone" placeholder="SMS (DDI+DDD+Número)" />
        <input name="due" type="date" defaultValue={todayISO()} />
        <textarea name="notes" placeholder="Observações" style={{gridColumn:'1 / span 3', minHeight:60}} />
        <button style={{gridColumn:'4 / span 1', padding:'10px 12px', borderRadius:12, border:'none', background:'linear-gradient(90deg,#22c55e,#38bdf8)', color:'#0b1220', fontWeight:600}}>Adicionar</button>
      </form>

      <div style={{display:'flex', gap:8, alignItems:'center', marginTop:12}}>
        <input placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} />
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="todos">Todos</option>
          <option value="pendente">Pendentes</option>
          <option value="feito">Feitos</option>
        </select>
        <select value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="dueAsc">Data ↑</option>
          <option value="dueDesc">Data ↓</option>
          <option value="title">Título</option>
        </select>
      </div>

      {loading ? <div style={{marginTop:16, color:'#94a3b8'}}>Carregando…</div> : (
        <div style={{display:'grid', gap:10, marginTop:12}}>
          {list.map(t=>{
            const isToday = t.status==='pendente' && t.due===todayISO()
            const isLate  = t.status==='pendente' && t.due<todayISO()
            return (
              <div key={t.id} style={{background:'#111827', border:'1px solid rgba(255,255,255,.08)', borderRadius:16, padding:14}}>
                <div style={{display:'flex', justifyContent:'space-between', gap:8, alignItems:'center'}}>
                  <div style={{display:'flex', gap:8, alignItems:'center', flexWrap:'wrap'}}>
                    <strong>{t.title}</strong>
                    {t.status==='feito' && <span style={{fontSize:12,padding:'4px 8px',borderRadius:9999,background:'rgba(34,197,94,.15)',color:'#86efac'}}>Feito</span>}
                    {isToday && <span style={{fontSize:12,padding:'4px 8px',borderRadius:9999,background:'rgba(250,204,21,.15)',color:'#fde68a'}}>Hoje</span>}
                    {isLate && <span style={{fontSize:12,padding:'4px 8px',borderRadius:9999,background:'rgba(239,68,68,.15)',color:'#fecaca'}}>Atrasada</span>}
                  </div>
                  <div style={{display:'flex', gap:8}}>
                    {t.status!=='feito'
                      ? <button onClick={()=>updateTask(t.id,{status:'feito'})} style={{padding:'8px 10px', borderRadius:10, border:'1px solid rgba(255,255,255,.18)', background:'transparent', color:'#e2e8f0'}}>Concluir</button>
                      : <button onClick={()=>updateTask(t.id,{status:'pendente'})} style={{padding:'8px 10px', borderRadius:10, border:'1px solid rgba(255,255,255,.18)', background:'transparent', color:'#e2e8f0'}}>Reabrir</button>}
                    <button onClick={()=>removeTask(t.id)} style={{padding:'8px 10px', borderRadius:10, border:'1px solid rgba(255,255,255,.18)', background:'transparent', color:'#e2e8f0'}}>Excluir</button>
                  </div>
                </div>
                <div style={{height:1, background:'rgba(255,255,255,.08)', margin:'10px 0'}} />
                <div style={{display:'flex', gap:12, flexWrap:'wrap', color:'#cbd5e1'}}>
                  <span><strong>Responsável:</strong> {t.owner || '—'}</span>
                  <span><strong>Data:</strong> {fmtBR(t.due)}</span>
                  {t.email && <span>📧 {t.email}</span>}
                  {t.phone && <span>📱 {t.phone}</span>}
                </div>
                {t.notes && <div style={{marginTop:8, color:'#cbd5e1'}}>{t.notes}</div>}
              </div>
            )
          })}
          {!list.length && <div style={{textAlign:'center', color:'#94a3b8'}}>Sem atividades ainda. Adicione a primeira acima. 🚀</div>}
        </div>
      )}
    </div>
  )
}
