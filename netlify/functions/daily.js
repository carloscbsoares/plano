export const handler = async () => {
  try {
    const today = new Date().toISOString().slice(0, 10)
    let tasks = []
    if (process.env.TASKS_JSON) {
      try { tasks = JSON.parse(process.env.TASKS_JSON) } catch { tasks = [] }
    }
    const pendentes = tasks.filter(t => (t.status || 'pendente') === 'pendente')
    const dueToday = pendentes.filter(t => t.due === today)
    const overdue  = pendentes.filter(t => t.due <  today)

    const notifyURL = process.env.NOTIFY_URL || '/.netlify/functions/notify'
    const notify = async (type, task) => {
      await fetch(notifyURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, task })
      })
    }

    for (const t of dueToday) await notify('due', t)
    for (const t of overdue)  await notify('overdue', t)

    return { statusCode: 200, body: JSON.stringify({ ok: true, dueToday: dueToday.length, overdue: overdue.length }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err) }) }
  }
}
