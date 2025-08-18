import nodemailer from 'nodemailer';
import twilio from 'twilio';

export async function handler(event, context) {
  const tasks = JSON.parse(process.env.TASKS || '[]');

  for (const t of tasks) {
    // Envio de email
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: t.email,
      subject: `Alerta: ${t.name}`,
      text: `Atividade: ${t.name}\nData: ${t.date}\nResponsável: ${t.responsavel}`
    });

    // Envio de SMS
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    await client.messages.create({
      body: `Alerta: ${t.name} - Responsável: ${t.responsavel} (${t.date})`,
      from: process.env.TWILIO_PHONE,
      to: t.telefone
    });
  }

  return { statusCode: 200, body: 'Notificações enviadas' };
}