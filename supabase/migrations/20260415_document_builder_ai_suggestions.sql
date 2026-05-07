begin;

create table if not exists docbuilder.document_ai_suggestions (
  id uuid primary key default gen_random_uuid(),
  document_project_id uuid not null references docbuilder.document_projects(id) on delete cascade,
  question_id uuid references docbuilder.document_questions(id) on delete cascade,
  task_key text not null,
  status text not null default 'generated' check (status in ('generated', 'accepted', 'discarded', 'superseded')),
  prompt_version text not null,
  model text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  output_payload jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_document_ai_suggestions_project
  on docbuilder.document_ai_suggestions(document_project_id, created_at desc);

create index if not exists idx_document_ai_suggestions_question
  on docbuilder.document_ai_suggestions(question_id, created_at desc);

drop trigger if exists trg_document_ai_suggestions_updated_at on docbuilder.document_ai_suggestions;
create trigger trg_document_ai_suggestions_updated_at
before update on docbuilder.document_ai_suggestions
for each row
execute function docbuilder.set_updated_at();

alter table docbuilder.document_ai_suggestions enable row level security;

grant select, insert, update, delete on docbuilder.document_ai_suggestions to authenticated;
grant all privileges on docbuilder.document_ai_suggestions to service_role;

drop policy if exists p_document_ai_suggestions_select on docbuilder.document_ai_suggestions;
create policy p_document_ai_suggestions_select on docbuilder.document_ai_suggestions
for select to authenticated
using (docbuilder.has_project_access(document_project_id));

drop policy if exists p_document_ai_suggestions_insert on docbuilder.document_ai_suggestions;
create policy p_document_ai_suggestions_insert on docbuilder.document_ai_suggestions
for insert to authenticated
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_ai_suggestions_update on docbuilder.document_ai_suggestions;
create policy p_document_ai_suggestions_update on docbuilder.document_ai_suggestions
for update to authenticated
using (docbuilder.has_project_edit_access(document_project_id))
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_ai_suggestions_delete on docbuilder.document_ai_suggestions;
create policy p_document_ai_suggestions_delete on docbuilder.document_ai_suggestions
for delete to authenticated
using (docbuilder.has_project_edit_access(document_project_id));

commit;
