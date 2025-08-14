import sendgrid from '@sendgrid/mail'
import twilio from 'twilio'

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }
  try {
    const { type, task } = JSON.parse(event.body || '{}')
    if (!task) throw new Error('missing task')

    const subject = type === 'overdue' ? `ATENÇÃO: tarefa atrasada — ${task.title}` : `Lembrete: ${task.title} hoje`
    const text = `Tarefa: ${task.title}\nResponsável: ${task.owner || '-'}\nData: ${task.due}\nNotas: ${task.notes || '-'}`

    // Email via SendGrid
    if (task.email && process.env.FROM_EMAIL) {
      await sendgrid.send({ to: task.email, from: process.env.FROM_EMAIL, subject, text })
    }

    // SMS via Twilio
    if (task.phone && process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_FROM) {
      const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
      await client.messages.create({ to: task.phone, from: process.env.TWILIO_FROM, body: text })
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) }
  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ ok: false, error: String(err) }) }
  }
}
