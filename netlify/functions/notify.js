import nodemailer from "nodemailer";
import twilio from "twilio";

export async function handler(event, context) {
  try {
    // Configuração do Gmail
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // senha de app
      },
    });

    // Enviar email
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.ALERT_EMAIL,
      subject: "EasyPlano - Alerta de Tarefas",
      text: "Este é um alerta automático do EasyPlano.",
    });

    // Enviar SMS com Twilio
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);
    await client.messages.create({
      from: process.env.TWILIO_PHONE,
      to: process.env.ALERT_PHONE,
      body: "EasyPlano: Você tem tarefas pendentes!",
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Alertas enviados com sucesso!" }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
