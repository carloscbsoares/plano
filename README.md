# Plano de Ação — Netlify (corrigido)
- React + Vite
- Netlify Functions (notify, daily)
- Dependências incluídas: @sendgrid/mail, twilio
- Bundler configurado com external_node_modules

## Deploy
1) `npm install`
2) Conecte no Netlify (Import from Git) ou `npx netlify-cli deploy --build`
3) Variáveis de ambiente no painel:
   - SENDGRID_API_KEY, FROM_EMAIL
   - (opcional) TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
   - (opcional) TASKS_JSON, NOTIFY_URL=/.netlify/functions/notify

## Teste local
- `npm run dev` para o front
- `npx netlify-cli dev` para front + functions
