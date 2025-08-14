import React, { useEffect, useMemo, useState } from 'react'

const uid = () => Math.random().toString(36).slice(2)
const todayISO = () => new Date().toISOString().slice(0,10)
const fmtBR = (s) => new Date(`${s}T00:00:00`).toLocaleDateString()
const STORAGE_KEY = 'plano-acao-tasks-v1'
const NOTIFY_ENDPOINT = '/.netlify/functions/notify'

function useTasks(){
  const [tasks, setTasks] = useState(()=>{
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [] }catch{ return [] }
  })
  useEffect(()=>localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)),[tasks])
  return {
    tasks,
    add: (t)=>setTasks(p=>[{...t,id:uid()},...p]),
    upd: (id,patch)=>setTasks(p=>p.map(t=>t.id===id?{...t,...patch}:t)),
    del: (id)=>setTasks(p=>p.filter(t=>t.id!==id)),
    setAll: setTasks
  }
}

function Pill({children, tone=''}){
  const cls = tone==='ok' ? 'pill ok' : tone==='warn' ? 'pill warn' : tone==='bad' ? 'pill bad' : 'pill'
  return <span className={cls}>{children}</span>
}

export default function App(){
  const {tasks, add, upd, del, setAll} = useTasks()
  const [q,setQ]=useState(''); const [status,setStatus]=useState('todos'); const [sort,setSort]=useState('dueAsc')
  const [sending, setSending] = useState(false)

  const list = useMemo(()=>{
    const query=q.trim().toLowerCase()
    let L = tasks.filter(t => [t.title,t.owner,t.email,t.phone,t.notes].filter(Boolean).some(f=>f.toLowerCase().includes(query)))
    if(status!=='todos') L = L.filter(t=>t.status===status)
    switch(sort){
      case 'dueAsc': L.sort((a,b)=>a.due.localeCompare(b.due)); break
      case 'dueDesc': L.sort((a,b)=>b.due.localeCompare(a.due)); break
      case 'title': L.sort((a,b)=>a.title.localeCompare(b.title)); break
    }
    return L
  },[tasks,q,status,sort])

  useEffect(()=>{
    const today = todayISO()
    const dueToday = tasks.filter(t=>t.status==='pendente' && t.due===today)
    const overdue  = tasks.filter(t=>t.status==='pendente' && t.due<today)
    if(dueToday.length || overdue.length){
      triggerNotifications({dueToday, overdue})
    }
  },[])

  async function forceNotify(mode = 'due'){
    setSending(true)
    try{
      const today = todayISO()
      const pendentes = tasks.filter(t => t.status === 'pendente')
      const dueToday  = pendentes.filter(t => t.due === today)
      const overdue   = pendentes.filter(t => t.due <  today)
      const all       = pendentes

      const send = async (type, t) => {
        try{
          await fetch(NOTIFY_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ type, task: t }) })
        }catch(e){ console.error('Falha ao notificar', t.title, e) }
      }

      if(mode === 'all'){
        if(!confirm('Enviar email/SMS para TODAS as tarefas pendentes?')) return;
        for(const t of all){
          const type = t.due < today ? 'overdue' : (t.due === today ? 'due' : 'due')
          await send(type, t)
        }
      }else{
        for(const t of dueToday) await send('due', t)
        for(const t of overdue)  await send('overdue', t)
      }
      alert('Alertas enviados.')
    } finally { setSending(false) }
  }

  return (
    <div className="container">
      <header className="hero">
        <div>
          <h1>Plano de Ação</h1>
          <div className="sub">Cadastre atividades, receba alertas por email/SMS e acompanhe atrasos.</div>
        </div>
        <div className="row">
          <ImportExport tasks={tasks} setAll={setAll} />
          <button className="primary" onClick={()=>forceNotify('due')} disabled={sending} title="Disparar emails/SMS para tarefas de hoje e atrasadas">
            {sending ? 'Enviando…' : 'Disparar alertas agora'}
          </button>
          <button className="ghost" onClick={()=>forceNotify('all')} disabled={sending} title="Enviar para todas as pendentes">
            Enviar para todas
          </button>
        </div>
      </header>

      <form onSubmit={(e)=>{e.preventDefault(); if(!e.target.title.value.trim()) return alert('Informe o título'); add({title:e.target.title.value.trim(), owner:e.target.owner.value.trim(), email:e.target.email.value.trim(), phone:e.target.phone.value.trim(), due:e.target.due.value, notes:e.target.notes.value.trim(), status:'pendente'}); e.target.reset(); e.target.due.value=todayISO();}} className="panel grid grid-4">
        <input name="title" placeholder="Atividade" />
        <input name="owner" placeholder="Responsável" />
        <input type="email" name="email" placeholder="Email (alerta)" />
        <input name="phone" placeholder="SMS (DDI+DDD+Número)" />
        <input type="date" name="due" defaultValue={todayISO()} />
        <textarea name="notes" placeholder="Observações" style={{gridColumn:'1 / span 3'}} />
        <button className="primary" style={{gridColumn:'4 / span 1'}}>Adicionar</button>
      </form>

      <div className="row panel" style={{marginTop:12, justifyContent:'space-between', alignItems:'center'}}>
        <div className="row" style={{flex:1, gap:8}}>
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
      </div>

      <div className="list">
        {list.map(t=>{
          const isToday = t.due===todayISO() && t.status==='pendente'
          const isLate  = t.due<todayISO()  && t.status==='pendente'
          return (
            <div key={t.id} className="card">
              <div className="row" style={{justifyContent:'space-between'}}>
                <div className="row" style={{gap:8}}>
                  <strong>{t.title}</strong>
                  {t.status==='feito' && <Pill tone="ok">Feito</Pill>}
                  {isToday && <Pill tone="warn">Hoje</Pill>}
                  {isLate && <Pill tone="bad">Atrasada</Pill>}
                </div>
                <div className="actions">
                  {t.status!=='feito'
                    ? <button className="ghost" onClick={()=>upd(t.id,{status:'feito'})}>Concluir</button>
                    : <button className="ghost" onClick={()=>upd(t.id,{status:'pendente'})}>Reabrir</button>}
                  <button className="ghost" onClick={()=>del(t.id)}>Excluir</button>
                </div>
              </div>
              <div className="hr"></div>
              <div className="row" style={{flexWrap:'wrap', gap:12}}>
                <span><strong>Responsável:</strong> {t.owner || '—'}</span>
                <span><strong>Data:</strong> {fmtBR(t.due)}</span>
                {t.email && <span>📧 {t.email}</span>}
                {t.phone && <span>📱 {t.phone}</span>}
              </div>
              {t.notes && <div style={{marginTop:8, color:'#cbd5e1'}}>{t.notes}</div>}
            </div>
          )
        })}
        {!list.length && <div className="panel" style={{textAlign:'center'}}>Sem atividades ainda. Adicione a primeira acima. 🚀</div>}
      </div>

      <div className="footer">Alertas via Netlify Functions: <code>/.netlify/functions/notify</code>. Cron diário às 08:00 (Luanda).</div>
    </div>
  )
}

// Import/Export CSV
function ImportExport({tasks,setAll}){
  const exportCSV = ()=>{
    const headers = ["id","title","owner","email","phone","due","notes","status"]
    const rows = tasks.map(t => headers.map(h => JSON.stringify(t[h] ?? "")).join(","))
    const csv = [headers.join(","), ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a"); a.href=url; a.download=`plano_acao_${todayISO()}.csv`; a.click(); URL.revokeObjectURL(url)
  }
  const importCSV = (file)=>{
    const reader = new FileReader()
    reader.onload = (e)=>{
      const text = e.target.result
      const lines = text.split(/\r?\n/).filter(Boolean)
      const [header, ...rows] = lines
      const cols = header.split(",")
      const out = rows.map(r=>{
        const parts = r.match(/(?:^|,)("(?:[^"]|"")*"|[^,]*)/g).map(x=>x.replace(/^,/, ""))
        const obj = {}
        cols.forEach((c,i)=>{
          let v = parts[i] ?? ""; v = v.replace(/^"|"$/g,"").replace(/""/g,'"')
          obj[c] = v
        })
        if(!obj.id) obj.id = uid()
        return obj
      })
      setAll(out)
    }
    reader.readAsText(file)
  }
  return (
    <div className="row">
      <button onClick={exportCSV} className="ghost">Exportar CSV</button>
      <label className="ghost" style={{display:'inline-flex', alignItems:'center', gap:8, padding:'10px 12px', borderRadius:'12px', border:'1px solid rgba(255,255,255,.18)', cursor:'pointer'}}>
        Importar CSV
        <input type="file" accept=".csv" style={{display:'none'}} onChange={(e)=>e.target.files?.[0] && importCSV(e.target.files[0])} />
      </label>
    </div>
  )
}

// Fallback automático ao abrir a página
async function triggerNotifications({dueToday, overdue}){
  const endpoint='/.netlify/functions/notify'
  const notifyBrowser=(title,body)=>{
    if('Notification' in window){
      if(Notification.permission==='granted') new Notification(title,{body})
      else if(Notification.permission!=='denied') Notification.requestPermission()
    }
  }
  for(const t of dueToday){
    try{ await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'due',task:t})}) }catch{}
    notifyBrowser(`Lembrete — ${t.title}`, `Hoje (${fmtBR(t.due)}). Resp.: ${t.owner||'—'}`)
  }
  for(const t of overdue){
    try{ await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'overdue',task:t})}) }catch{}
    notifyBrowser(`Atrasada — ${t.title}`, `Venceu em ${fmtBR(t.due)}. Resp.: ${t.owner||'—'}`)
  }
}
