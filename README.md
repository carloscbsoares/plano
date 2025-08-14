# Plano de Ação — Fix (Supabase + feedback de erro)
- UI moderna (React/Vite)
- Netlify Functions: tasks (CORS, erros detalhados), notify, daily
- Deps: @supabase/supabase-js, @sendgrid/mail, twilio

## Variáveis no Netlify
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE (ou SUPABASE_ANON_KEY com RLS aberto)
- SENDGRID_API_KEY, FROM_EMAIL
- (opcional) TWILIO_SID, TWILIO_TOKEN, TWILIO_FROM
- (opcional) SITE_URL

## Testes rápidos
GET:  /.netlify/functions/tasks
POST: /.netlify/functions/tasks  (title + due obrigatórios)
