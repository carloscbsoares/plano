# Plano de Ação — Netlify
Deploy: Netlify (Functions + Scheduled Functions)
Data: 2025-08-14

## Como usar
1) `npm create vite@latest plano-acao -- --template react` (ou use este zip)
2) Instale deps: `npm i`
3) Rode local: `npm run dev` (ou `npx netlify-cli dev` para testar functions)
4) Configure variáveis no Netlify:
   - SENDGRID_API_KEY, FROM_EMAIL
   - TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
   - (Opcional) TASKS_JSON, NOTIFY_URL
5) Deploy: `npx netlify-cli deploy --build --prod`

Cron diário configurado às 07:00 UTC (08:00 Africa/Luanda) no `netlify.toml`.
