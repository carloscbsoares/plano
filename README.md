# Plano de Ação — Netlify + Supabase (sincronizado)
- UI moderna (React/Vite)
- Botões de disparo manual (hoje+atrasadas / todas)
- **Sincronização na nuvem (Supabase)** via Netlify Functions (`/.netlify/functions/tasks`)
- Alertas por **Email/SMS** via SendGrid/Twilio (`/.netlify/functions/notify`)
- Cron diário às 08:00 (Luanda) em `netlify.toml`

## Supabase — criar a tabela
Crie uma base e rode:
```sql
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  owner text,
  email text,
  phone text,
  due date not null,
  notes text,
  status text default 'pendente',
  created_at timestamptz default now()
);
```
(Ative a extensão `pgcrypto` para `gen_random_uuid()` ou use `uuid_generate_v4()`.)

## Variáveis de ambiente (Netlify)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE` (recomendado para a Function; ou `SUPABASE_ANON_KEY` com RLS aberta para testes)
- `SENDGRID_API_KEY`, `FROM_EMAIL`
- (opcional) `TWILIO_SID`, `TWILIO_TOKEN`, `TWILIO_FROM`
- (opcional) `SITE_URL` (para a função `daily` montar a URL absoluta)

## Deploy
Build: `npm run build` — Publish: `dist` — Functions: `netlify/functions`
