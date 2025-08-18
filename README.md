
# EasyPlano + Supabase (Starter)

Um template **simples e funcional** para o EasyPlano usando **HTML + JS** no Netlify e **Supabase** como backend (Auth, DB e Realtime).

## 🧰 O que vem pronto
- Login por **Magic Link** (e-mail) com Supabase Auth.
- Tarefas com **CRUD** (criar, listar, marcar como concluída, apagar).
- **Atribuição por e-mail** do responsável (uma ou várias pessoas).
- **Realtime**: lista atualiza quando alguém criar/alterar tarefas.
- **RLS**: cada usuário vê as tarefas que criou e/ou em que é responsável (por e-mail).

## ⚙️ Passo a passo (rápido)

1. **Criar projeto no Supabase**
   - Acesse https://supabase.com/ → New project.
   - Pegue **Project URL** e **anon key** em: *Project Settings → API*.

2. **Banco de dados (SQL)**
   - No Supabase, vá em **SQL Editor** → cole o conteúdo de `sql/schema.sql` → **Run**.

3. **Configurar Auth (SMTP opcional)**
   - Em *Authentication → Providers → Email*, deixe **habilitado**.
   - Para enviar o Magic Link, você pode usar SMTP próprio (opcional). Sem SMTP, use **"Sign in with OTP"** (link na interface do Supabase) para teste.
   - **Dica:** se quiser e-mail transacional depois, use Resend, Mailgun, etc. via Edge Functions.

4. **Configurar o front-end**
   - Abra `public/config.js` e substitua os placeholders:
     ```js
     const SUPABASE_URL = "https://SEU-PROJECT.supabase.co";
     const SUPABASE_ANON_KEY = "ey...";
     ```

5. **Rodar localmente (opcional)**
   - Use um servidor estático simples, por ex. `npx serve public`.

6. **Publicar no Netlify**
   - **New site from Git** ou **Deploy manual** (arraste a pasta `public/`).
   - Não precisa build; **Publish directory** = `public`.

## 🔐 Políticas de segurança (RLS)
- Já incluídas no `schema.sql`. Usuário vê tarefas criadas por ele **ou** em que o e-mail dele foi adicionado como responsável.

## 🔔 Alertas (opcional)
- Este starter tem só **alerta em-app** (realtime). Para **e-mail/SMS** por responsável, sugiro usar uma **Edge Function** no Supabase que dispare via Resend/Mailgun/Twilio quando `tasks` mudar.
- Exemplo de gatilho SQL e função estão comentados no final do `schema.sql`.

---

> Última atualização: 2025-08-18
