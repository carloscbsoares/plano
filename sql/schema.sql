
-- === Tabelas base ===
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_date date,
  status text not null default 'open' check (status in ('open','done')),
  created_by uuid not null default auth.uid(),
  created_at timestamp with time zone not null default now()
);

create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  assignee_email text not null check (position('@' in assignee_email) > 1),
  created_at timestamp with time zone not null default now(),
  primary key (task_id, assignee_email)
);

-- Índices úteis
create index if not exists idx_tasks_created_by on public.tasks(created_by);
create index if not exists idx_task_assignees_email on public.task_assignees(assignee_email);

-- === Segurança (RLS) ===
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;

-- Usuário enxerga tarefas: que criou OU em que seu e-mail está como responsável
create policy "tasks_select_visible_to_user"
on public.tasks for select
using (
  created_by = auth.uid()
  or exists (
    select 1 from public.task_assignees ta
    where ta.task_id = tasks.id
      and lower(ta.assignee_email) = lower(auth.email())
  )
);

-- Apenas dono cria / edita / apaga suas tarefas
create policy "tasks_insert_by_owner"
on public.tasks for insert
to authenticated
with check ( created_by = auth.uid() );

create policy "tasks_update_by_owner"
on public.tasks for update
to authenticated
using ( created_by = auth.uid() )
with check ( created_by = auth.uid() );

create policy "tasks_delete_by_owner"
on public.tasks for delete
to authenticated
using ( created_by = auth.uid() );

-- Assignees: visível para dono da tarefa ou para o próprio e-mail responsável
create policy "assignees_select_visible"
on public.task_assignees for select
using (
  exists (select 1 from public.tasks t where t.id = task_assignees.task_id and t.created_by = auth.uid())
  or lower(task_assignees.assignee_email) = lower(auth.email())
);

-- Inserir/alterar assignees: apenas dono da tarefa
create policy "assignees_modify_by_owner"
on public.task_assignees for all
to authenticated
using (
  exists (select 1 from public.tasks t where t.id = task_assignees.task_id and t.created_by = auth.uid())
)
with check (
  exists (select 1 from public.tasks t where t.id = task_assignees.task_id and t.created_by = auth.uid())
);

-- === Funções auxiliares seguras ===

-- Lista tarefas visíveis para o usuário logado (com responsáveis agregados)
create or replace function public.tasks_for_user()
returns table (
  id uuid,
  title text,
  description text,
  due_date date,
  status text,
  created_by uuid,
  created_at timestamptz,
  assignees text[]
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.title, t.description, t.due_date, t.status, t.created_by, t.created_at,
         coalesce(array_agg(ta.assignee_email order by ta.assignee_email) filter (where ta.assignee_email is not null), '{{}}') as assignees
  from public.tasks t
  left join public.task_assignees ta on ta.task_id = t.id
  where t.created_by = auth.uid()
     or exists (
        select 1 from public.task_assignees x
        where x.task_id = t.id and lower(x.assignee_email) = lower(auth.email())
     )
  group by t.id;
$$;

-- Alterna status da tarefa do usuário (open <-> done)
create or replace function public.toggle_task_status(task_id_input uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.tasks
     set status = case when status = 'open' then 'done' else 'open' end
   where id = task_id_input
     and created_by = auth.uid();
end;
$$;

-- === (Opcional) Notificações por e-mail via trigger/Edge Function ===
-- Exemplo de trigger que registra mudança para um canal (consumido por Edge Function):
-- create table if not exists public.task_events (
--   id bigserial primary key,
--   task_id uuid not null,
--   action text not null, -- created/updated/deleted
--   payload jsonb not null,
--   created_at timestamptz not null default now()
-- );
-- create or replace function public.enqueue_task_event()
-- returns trigger as $$
-- begin
--   insert into public.task_events(task_id, action, payload)
--   values (coalesce(new.id, old.id), TG_OP::text, to_jsonb(coalesce(new, old)));
--   return coalesce(new, old);
-- end;
-- $$ language plpgsql security definer;
-- create trigger trg_task_events_ins
--   after insert on public.tasks for each row execute function public.enqueue_task_event();
-- create trigger trg_task_events_upd
--   after update on public.tasks for each row execute function public.enqueue_task_event();
-- create trigger trg_task_events_del
--   after delete on public.tasks for each row execute function public.enqueue_task_event();
