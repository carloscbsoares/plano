import sendgrid from '@sendgrid/mail';
import twilio from 'twilio';

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler(event) {
  // Lógica para enviar emails e SMS
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Alertas disparados com sucesso' })
  };
}
