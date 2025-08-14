# Plano de Ação — Netlify (UI moderna)
- React + Vite, interface moderna (dark, cards)
- Botões: **Disparar alertas agora** (hoje+atrasadas) e **Enviar para todas**
- Netlify Functions: `notify`, `daily` (cron 08:00 Africa/Luanda)
- Deps: @sendgrid/mail, twilio

## Deploy
1) Suba os arquivos deste projeto no seu repositório (sem `dist/` e `node_modules/`).
2) No Netlify, configure:
   - Build: `npm run build`
   - Publish: `dist`
   - Functions: `netlify/functions`
3) Variáveis:
   - `SENDGRID_API_KEY`, `FROM_EMAIL`
   - (opcional) `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`
   - (opcional) `TASKS_JSON`, `NOTIFY_URL=/.netlify/functions/notify`
