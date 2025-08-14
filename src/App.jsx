import React, { useEffect, useMemo, useState } from 'react'

const uid = () => Math.random().toString(36).slice(2)
const todayISO = () => new Date().toISOString().slice(0,10)
const fmtBR = (s) => new Date(`${s}T00:00:00`).toLocaleDateString()
const STORAGE_KEY = 'plano-acao-tasks-v1'

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

function Badge({children, className=''}){
  return <span className={`px-2 py-1 text-xs rounded-full bg-gray-100 ${className}`}>{children}</span>
}

export default function App(){
  const {tasks, add, upd, del, setAll} = useTasks()
  const [q,setQ]=useState(''); const [status,setStatus]=useState('todos'); const [sort,setSort]=useState('dueAsc')

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

  return (
    <div style={{fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Arial, sans-serif'}} className="min-h-screen bg-[#f7f8fb] text-slate-800">
      <div className="max-w-5xl mx-auto p-6">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Plano de Ação</h1>
            <p className="text-sm text-slate-500">Cadastre atividades, receba alertas por email/SMS e acompanhe atrasos.</p>
          </div>
          <ImportExport tasks={tasks} setAll={setAll} />
        </header>

        <TaskForm onAdd={add} />

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input className="col-span-2 rounded-xl border p-2" placeholder="Buscar..." value={q} onChange={e=>setQ(e.target.value)} />
          <select className="rounded-xl border p-2" value={status} onChange={e=>setStatus(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="pendente">Pendentes</option>
            <option value="feito">Feitos</option>
          </select>
          <select className="rounded-xl border p-2" value={sort} onChange={e=>setSort(e.target.value)}>
            <option value="dueAsc">Data ↑</option>
            <option value="dueDesc">Data ↓</option>
            <option value="title">Título</option>
          </select>
        </div>

        <TaskList tasks={list} onUpdate={upd} onRemove={del} />
        <Footer />
      </div>
    </div>
  )
}

function TaskForm({onAdd}){
  const [title,setTitle]=useState('')
  const [owner,setOwner]=useState('')
  const [email,setEmail]=useState('')
  const [phone,setPhone]=useState('')
  const [due,setDue]=useState(todayISO())
  const [notes,setNotes]=useState('')
  const submit=(e)=>{
    e.preventDefault()
    if(!title.trim()) return alert('Informe o título')
    onAdd({title:title.trim(), owner:owner.trim(), email:email.trim(), phone:phone.trim(), due, notes:notes.trim(), status:'pendente'})
    setTitle(''); setOwner(''); setEmail(''); setPhone(''); setDue(todayISO()); setNotes('')
  }
  return (
    <form onSubmit={submit} className="rounded-2xl border bg-white shadow-sm p-4 grid gap-3 sm:grid-cols-12">
      <input className="sm:col-span-3 rounded-xl border p-2" placeholder="Atividade" value={title} onChange={e=>setTitle(e.target.value)}/>
      <input className="sm:col-span-2 rounded-xl border p-2" placeholder="Responsável" value={owner} onChange={e=>setOwner(e.target.value)}/>
      <input className="sm:col-span-3 rounded-xl border p-2" type="email" placeholder="Email (alerta)" value={email} onChange={e=>setEmail(e.target.value)}/>
      <input className="sm:col-span-2 rounded-xl border p-2" placeholder="SMS (DDI+DDD+Número)" value={phone} onChange={e=>setPhone(e.target.value)}/>
      <input className="sm:col-span-2 rounded-xl border p-2" type="date" value={due} onChange={e=>setDue(e.target.value)}/>
      <textarea className="sm:col-span-10 rounded-xl border p-2" placeholder="Observações" value={notes} onChange={e=>setNotes(e.target.value)}/>
      <button className="sm:col-span-2 rounded-xl bg-slate-900 text-white py-2 hover:opacity-90">Adicionar</button>
    </form>
  )
}

function TaskList({tasks,onUpdate,onRemove}){
  const today = todayISO()
  return (
    <div className="mt-4 grid gap-3">
      {tasks.map(t=>{
        const isToday = t.due===today && t.status==='pendente'
        const isLate  = t.due<today  && t.status==='pendente'
        return (
          <div key={t.id} className={`rounded-2xl border p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between ${isLate?'border-red-300':isToday?'border-amber-300':'border-slate-200'}`}>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-lg">{t.title}</h3>
                {t.status==='feito' && <Badge className="bg-green-100 text-green-700">Feito</Badge>}
                {isToday && <Badge className="bg-amber-100 text-amber-700">Hoje</Badge>}
                {isLate && <Badge className="bg-red-100 text-red-700">Atrasada</Badge>}
              </div>
              <div className="mt-1 text-sm text-slate-600 flex flex-wrap gap-3">
                <span><strong>Responsável:</strong> {t.owner || '—'}</span>
                <span><strong>Data:</strong> {fmtBR(t.due)}</span>
                {t.email && <span>📧 {t.email}</span>}
                {t.phone && <span>📱 {t.phone}</span>}
              </div>
              {t.notes && <p className="mt-2 text-sm text-slate-700">{t.notes}</p>}
            </div>
            <div className="mt-3 sm:mt-0 flex gap-2">
              {t.status!=='feito' ? (
                <button onClick={()=>onUpdate(t.id,{status:'feito'})} className="rounded-xl border px-3 py-2 hover:bg-slate-50">Concluir</button>
              ) : (
                <button onClick={()=>onUpdate(t.id,{status:'pendente'})} className="rounded-xl border px-3 py-2 hover:bg-slate-50">Reabrir</button>
              )}
              <button onClick={()=>onRemove(t.id)} className="rounded-xl border px-3 py-2 hover:bg-red-50">Excluir</button>
            </div>
          </div>
        )
      })}
      {!tasks.length && <div className="text-center text-slate-500 py-10">Sem atividades ainda. Adicione a primeira acima. 🚀</div>}
    </div>
  )
}

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
    <div className="flex gap-2 items-center">
      <button onClick={exportCSV} className="rounded-xl border px-3 py-2 bg-white shadow-sm hover:bg-slate-50">Exportar CSV</button>
      <label className="rounded-xl border px-3 py-2 bg-white shadow-sm hover:bg-slate-50 cursor-pointer">Importar CSV
        <input type="file" accept=".csv" className="hidden" onChange={(e)=>e.target.files?.[0] && importCSV(e.target.files[0])} />
      </label>
    </div>
  )
}

function Footer(){
  return (
    <footer className="mt-10 py-10 text-center text-xs text-slate-500">
      <p>Alertas via email/SMS usam Netlify Functions: <code>/.netlify/functions/notify</code>.</p>
    </footer>
  )
}

// Frontend-trigger (fallback). Em produção, use a function 'daily' agendada.
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
