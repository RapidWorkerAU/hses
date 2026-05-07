begin;

create extension if not exists pgcrypto;
create schema if not exists docbuilder;

grant usage on schema docbuilder to anon, authenticated, service_role;

create or replace function docbuilder.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function docbuilder.set_document_project_owner()
returns trigger
language plpgsql
security definer
set search_path = docbuilder, public
as $$
begin
  new.owner_user_id := auth.uid();
  return new;
end;
$$;

create table if not exists docbuilder.document_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  category text not null default 'general',
  default_language_code text not null default 'en',
  status text not null default 'draft' check (status in ('draft', 'active', 'archived', 'retired')),
  active_version_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists docbuilder.document_type_versions (
  id uuid primary key default gen_random_uuid(),
  document_type_id uuid not null references docbuilder.document_types(id) on delete cascade,
  version_no int not null check (version_no > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  notes text,
  requirements_mode text not null default 'objective' check (requirements_mode in ('objective', 'jurisdictional', 'hybrid')),
  published_at timestamptz,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type_id, version_no)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'document_types_active_version_fk'
      and conrelid = 'docbuilder.document_types'::regclass
  ) then
    alter table docbuilder.document_types
      add constraint document_types_active_version_fk
      foreign key (active_version_id) references docbuilder.document_type_versions(id) on delete set null;
  end if;
end
$$;

create table if not exists docbuilder.document_style_profiles (
  id uuid primary key default gen_random_uuid(),
  document_type_id uuid references docbuilder.document_types(id) on delete cascade,
  key text not null,
  title text not null,
  description text,
  theme_config jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type_id, key)
);

create table if not exists docbuilder.document_sections (
  id uuid primary key default gen_random_uuid(),
  document_type_version_id uuid not null references docbuilder.document_type_versions(id) on delete cascade,
  key text not null,
  title text not null,
  order_index int not null default 100,
  instructions text,
  objective text,
  default_content text,
  minimum_requirements text,
  generation_mode text not null default 'rewrite' check (generation_mode in ('rewrite', 'augment', 'manual')),
  is_required boolean not null default true,
  allow_user_edit boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type_version_id, key)
);

create table if not exists docbuilder.document_section_rules (
  id uuid primary key default gen_random_uuid(),
  section_id uuid not null references docbuilder.document_sections(id) on delete cascade,
  rule_type text not null,
  rule_config jsonb not null default '{}'::jsonb,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists docbuilder.document_placeholders (
  id uuid primary key default gen_random_uuid(),
  document_type_version_id uuid not null references docbuilder.document_type_versions(id) on delete cascade,
  key text not null,
  label text not null,
  description text,
  placeholder_type text not null default 'text' check (placeholder_type in ('text', 'long_text', 'date', 'number', 'boolean', 'list', 'country', 'jurisdiction', 'standard', 'person', 'role')),
  default_value jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type_version_id, key)
);

create table if not exists docbuilder.document_question_groups (
  id uuid primary key default gen_random_uuid(),
  document_type_version_id uuid not null references docbuilder.document_type_versions(id) on delete cascade,
  key text not null,
  title text not null,
  description text,
  order_index int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_type_version_id, key)
);

create table if not exists docbuilder.document_questions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references docbuilder.document_question_groups(id) on delete cascade,
  key text not null,
  label text not null,
  help_text text,
  question_type text not null check (question_type in ('short_text', 'long_text', 'single_select', 'multi_select', 'boolean', 'date', 'number', 'country', 'jurisdiction', 'standard', 'person', 'role')),
  placeholder text,
  is_required boolean not null default false,
  order_index int not null default 100,
  options jsonb,
  validation jsonb not null default '{}'::jsonb,
  visibility_rule jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, key)
);

create table if not exists docbuilder.document_question_section_map (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references docbuilder.document_questions(id) on delete cascade,
  section_id uuid not null references docbuilder.document_sections(id) on delete cascade,
  influence_type text not null default 'primary' check (influence_type in ('primary', 'secondary', 'conditional', 'contextual')),
  weight numeric(5,2) not null default 1.00,
  created_at timestamptz not null default now(),
  unique (question_id, section_id)
);

create table if not exists docbuilder.document_reference_sources (
  id uuid primary key default gen_random_uuid(),
  document_type_version_id uuid not null references docbuilder.document_type_versions(id) on delete cascade,
  source_type text not null check (source_type in ('tone_guide', 'structure_guide', 'minimum_requirements', 'sample', 'supporting_reference')),
  title text not null,
  description text,
  storage_bucket text not null,
  storage_path text not null unique,
  mime_type text,
  file_size bigint,
  uploaded_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists docbuilder.document_reference_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references docbuilder.document_reference_sources(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding_ref text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (source_id, chunk_index)
);

create table if not exists docbuilder.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  country_code text not null,
  country_name text not null,
  region_name text not null default '',
  framework_name text not null default '',
  language_code text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (country_code, region_name, framework_name)
);

create table if not exists docbuilder.requirement_sets (
  id uuid primary key default gen_random_uuid(),
  jurisdiction_id uuid references docbuilder.jurisdictions(id) on delete set null,
  title text not null,
  source_type text not null check (source_type in ('legislation', 'regulation', 'code_of_practice', 'standard', 'internal_framework', 'client_requirement', 'other')),
  standard_code text,
  version_label text,
  source_uri text,
  is_active boolean not null default true,
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists docbuilder.requirements_library (
  id uuid primary key default gen_random_uuid(),
  requirement_set_id uuid not null references docbuilder.requirement_sets(id) on delete cascade,
  requirement_code text,
  topic text not null,
  objective_text text not null,
  guidance_text text,
  tags text[] not null default '{}'::text[],
  effective_from date,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists docbuilder.document_type_requirement_map (
  id uuid primary key default gen_random_uuid(),
  document_type_id uuid not null references docbuilder.document_types(id) on delete cascade,
  requirement_id uuid not null references docbuilder.requirements_library(id) on delete cascade,
  section_key text not null default '',
  relevance_weight numeric(5,2) not null default 1.00,
  created_at timestamptz not null default now(),
  unique (document_type_id, requirement_id, section_key)
);

create table if not exists docbuilder.document_type_jurisdiction_map (
  id uuid primary key default gen_random_uuid(),
  document_type_id uuid not null references docbuilder.document_types(id) on delete cascade,
  jurisdiction_id uuid not null references docbuilder.jurisdictions(id) on delete cascade,
  support_level text not null default 'planned' check (support_level in ('planned', 'supported', 'validated')),
  created_at timestamptz not null default now(),
  unique (document_type_id, jurisdiction_id)
);

create table if not exists docbuilder.document_projects (
  id uuid primary key default gen_random_uuid(),
  document_type_id uuid not null references docbuilder.document_types(id) on delete restrict,
  document_type_version_id uuid not null references docbuilder.document_type_versions(id) on delete restrict,
  style_profile_id uuid references docbuilder.document_style_profiles(id) on delete set null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid,
  project_id uuid,
  title text not null,
  status text not null default 'draft' check (status in ('draft', 'questionnaire', 'generating', 'editing', 'review', 'ready', 'exported', 'archived')),
  country_code text,
  jurisdiction_id uuid references docbuilder.jurisdictions(id) on delete set null,
  language_code text not null default 'en',
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists docbuilder.document_collaborators (
  id uuid primary key default gen_random_uuid(),
  document_project_id uuid not null references docbuilder.document_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('viewer', 'editor', 'admin')),
  created_at timestamptz not null default now(),
  unique (document_project_id, user_id)
);

create table if not exists docbuilder.document_answers (
  id uuid primary key default gen_random_uuid(),
  document_project_id uuid not null references docbuilder.document_projects(id) on delete cascade,
  question_id uuid not null references docbuilder.document_questions(id) on delete cascade,
  answer jsonb not null default '{}'::jsonb,
  answered_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_project_id, question_id)
);

create table if not exists docbuilder.document_project_sections (
  id uuid primary key default gen_random_uuid(),
  document_project_id uuid not null references docbuilder.document_projects(id) on delete cascade,
  section_id uuid not null references docbuilder.document_sections(id) on delete restrict,
  generated_content text,
  edited_content text,
  final_content text,
  status text not null default 'pending' check (status in ('pending', 'generated', 'edited', 'approved')),
  last_generated_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_project_id, section_id)
);

create table if not exists docbuilder.document_generation_runs (
  id uuid primary key default gen_random_uuid(),
  document_project_id uuid not null references docbuilder.document_projects(id) on delete cascade,
  run_type text not null check (run_type in ('full', 'section', 'review', 'export')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'cancelled')),
  model text,
  prompt_version text,
  requested_by_user_id uuid references auth.users(id) on delete set null,
  started_at timestamptz,
  completed_at timestamptz,
  error_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists docbuilder.document_generation_run_sections (
  id uuid primary key default gen_random_uuid(),
  generation_run_id uuid not null references docbuilder.document_generation_runs(id) on delete cascade,
  project_section_id uuid not null references docbuilder.document_project_sections(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'skipped')),
  prompt_snapshot text,
  response_snapshot text,
  tokens_in int,
  tokens_out int,
  error_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (generation_run_id, project_section_id)
);

create table if not exists docbuilder.document_project_versions (
  id uuid primary key default gen_random_uuid(),
  document_project_id uuid not null references docbuilder.document_projects(id) on delete cascade,
  label text not null,
  snapshot jsonb not null,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists docbuilder.document_exports (
  id uuid primary key default gen_random_uuid(),
  document_project_id uuid not null references docbuilder.document_projects(id) on delete cascade,
  export_type text not null default 'pdf' check (export_type in ('pdf', 'docx', 'html')),
  version_label text,
  storage_bucket text not null,
  storage_path text not null unique,
  mime_type text,
  file_size bigint,
  created_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_document_type_versions_type on docbuilder.document_type_versions(document_type_id, version_no desc);
create index if not exists idx_document_sections_version on docbuilder.document_sections(document_type_version_id, order_index);
create index if not exists idx_document_question_groups_version on docbuilder.document_question_groups(document_type_version_id, order_index);
create index if not exists idx_document_questions_group on docbuilder.document_questions(group_id, order_index);
create index if not exists idx_document_reference_sources_version on docbuilder.document_reference_sources(document_type_version_id, source_type);
create index if not exists idx_requirement_sets_jurisdiction on docbuilder.requirement_sets(jurisdiction_id, is_active);
create index if not exists idx_requirements_library_set on docbuilder.requirements_library(requirement_set_id, topic);
create index if not exists idx_document_projects_owner on docbuilder.document_projects(owner_user_id, updated_at desc);
create index if not exists idx_document_projects_type on docbuilder.document_projects(document_type_id, status, updated_at desc);
create index if not exists idx_document_answers_project on docbuilder.document_answers(document_project_id);
create index if not exists idx_document_project_sections_project on docbuilder.document_project_sections(document_project_id);
create index if not exists idx_document_generation_runs_project on docbuilder.document_generation_runs(document_project_id, created_at desc);
create index if not exists idx_document_exports_project on docbuilder.document_exports(document_project_id, created_at desc);

drop trigger if exists trg_document_types_updated_at on docbuilder.document_types;
create trigger trg_document_types_updated_at before update on docbuilder.document_types for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_type_versions_updated_at on docbuilder.document_type_versions;
create trigger trg_document_type_versions_updated_at before update on docbuilder.document_type_versions for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_style_profiles_updated_at on docbuilder.document_style_profiles;
create trigger trg_document_style_profiles_updated_at before update on docbuilder.document_style_profiles for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_sections_updated_at on docbuilder.document_sections;
create trigger trg_document_sections_updated_at before update on docbuilder.document_sections for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_section_rules_updated_at on docbuilder.document_section_rules;
create trigger trg_document_section_rules_updated_at before update on docbuilder.document_section_rules for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_placeholders_updated_at on docbuilder.document_placeholders;
create trigger trg_document_placeholders_updated_at before update on docbuilder.document_placeholders for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_question_groups_updated_at on docbuilder.document_question_groups;
create trigger trg_document_question_groups_updated_at before update on docbuilder.document_question_groups for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_questions_updated_at on docbuilder.document_questions;
create trigger trg_document_questions_updated_at before update on docbuilder.document_questions for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_reference_sources_updated_at on docbuilder.document_reference_sources;
create trigger trg_document_reference_sources_updated_at before update on docbuilder.document_reference_sources for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_jurisdictions_updated_at on docbuilder.jurisdictions;
create trigger trg_jurisdictions_updated_at before update on docbuilder.jurisdictions for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_requirement_sets_updated_at on docbuilder.requirement_sets;
create trigger trg_requirement_sets_updated_at before update on docbuilder.requirement_sets for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_requirements_library_updated_at on docbuilder.requirements_library;
create trigger trg_requirements_library_updated_at before update on docbuilder.requirements_library for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_projects_updated_at on docbuilder.document_projects;
create trigger trg_document_projects_updated_at before update on docbuilder.document_projects for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_projects_owner on docbuilder.document_projects;
create trigger trg_document_projects_owner before insert on docbuilder.document_projects for each row execute function docbuilder.set_document_project_owner();
drop trigger if exists trg_document_answers_updated_at on docbuilder.document_answers;
create trigger trg_document_answers_updated_at before update on docbuilder.document_answers for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_project_sections_updated_at on docbuilder.document_project_sections;
create trigger trg_document_project_sections_updated_at before update on docbuilder.document_project_sections for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_generation_runs_updated_at on docbuilder.document_generation_runs;
create trigger trg_document_generation_runs_updated_at before update on docbuilder.document_generation_runs for each row execute function docbuilder.set_updated_at();
drop trigger if exists trg_document_generation_run_sections_updated_at on docbuilder.document_generation_run_sections;
create trigger trg_document_generation_run_sections_updated_at before update on docbuilder.document_generation_run_sections for each row execute function docbuilder.set_updated_at();

create or replace function docbuilder.is_project_owner(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = docbuilder, public
as $$
  select exists (
    select 1
    from docbuilder.document_projects dp
    where dp.id = p_project_id
      and dp.owner_user_id = auth.uid()
  );
$$;

create or replace function docbuilder.has_project_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = docbuilder, public
as $$
  select exists (
    select 1
    from docbuilder.document_projects dp
    where dp.id = p_project_id
      and (
        dp.owner_user_id = auth.uid()
        or exists (
          select 1
          from docbuilder.document_collaborators dc
          where dc.document_project_id = dp.id
            and dc.user_id = auth.uid()
        )
      )
  );
$$;

create or replace function docbuilder.has_project_edit_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = docbuilder, public
as $$
  select exists (
    select 1
    from docbuilder.document_projects dp
    where dp.id = p_project_id
      and (
        dp.owner_user_id = auth.uid()
        or exists (
          select 1
          from docbuilder.document_collaborators dc
          where dc.document_project_id = dp.id
            and dc.user_id = auth.uid()
            and dc.role in ('editor', 'admin')
        )
      )
  );
$$;

create or replace function docbuilder.has_project_admin_access(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = docbuilder, public
as $$
  select exists (
    select 1
    from docbuilder.document_projects dp
    where dp.id = p_project_id
      and (
        dp.owner_user_id = auth.uid()
        or exists (
          select 1
          from docbuilder.document_collaborators dc
          where dc.document_project_id = dp.id
            and dc.user_id = auth.uid()
            and dc.role = 'admin'
        )
      )
  );
$$;

alter table docbuilder.document_types enable row level security;
alter table docbuilder.document_type_versions enable row level security;
alter table docbuilder.document_style_profiles enable row level security;
alter table docbuilder.document_sections enable row level security;
alter table docbuilder.document_section_rules enable row level security;
alter table docbuilder.document_placeholders enable row level security;
alter table docbuilder.document_question_groups enable row level security;
alter table docbuilder.document_questions enable row level security;
alter table docbuilder.document_question_section_map enable row level security;
alter table docbuilder.document_reference_sources enable row level security;
alter table docbuilder.document_reference_chunks enable row level security;
alter table docbuilder.jurisdictions enable row level security;
alter table docbuilder.requirement_sets enable row level security;
alter table docbuilder.requirements_library enable row level security;
alter table docbuilder.document_type_requirement_map enable row level security;
alter table docbuilder.document_type_jurisdiction_map enable row level security;
alter table docbuilder.document_projects enable row level security;
alter table docbuilder.document_collaborators enable row level security;
alter table docbuilder.document_answers enable row level security;
alter table docbuilder.document_project_sections enable row level security;
alter table docbuilder.document_generation_runs enable row level security;
alter table docbuilder.document_generation_run_sections enable row level security;
alter table docbuilder.document_project_versions enable row level security;
alter table docbuilder.document_exports enable row level security;

grant select on docbuilder.document_types to authenticated;
grant select on docbuilder.document_type_versions to authenticated;
grant select on docbuilder.document_style_profiles to authenticated;
grant select on docbuilder.document_sections to authenticated;
grant select on docbuilder.document_section_rules to authenticated;
grant select on docbuilder.document_placeholders to authenticated;
grant select on docbuilder.document_question_groups to authenticated;
grant select on docbuilder.document_questions to authenticated;
grant select on docbuilder.document_question_section_map to authenticated;
grant select on docbuilder.document_reference_sources to authenticated;
grant select on docbuilder.document_reference_chunks to authenticated;
grant select on docbuilder.jurisdictions to authenticated;
grant select on docbuilder.requirement_sets to authenticated;
grant select on docbuilder.requirements_library to authenticated;
grant select on docbuilder.document_type_requirement_map to authenticated;
grant select on docbuilder.document_type_jurisdiction_map to authenticated;
grant select, insert, update, delete on docbuilder.document_projects to authenticated;
grant select, insert, update, delete on docbuilder.document_collaborators to authenticated;
grant select, insert, update, delete on docbuilder.document_answers to authenticated;
grant select, insert, update, delete on docbuilder.document_project_sections to authenticated;
grant select, insert, update, delete on docbuilder.document_generation_runs to authenticated;
grant select, insert, update, delete on docbuilder.document_generation_run_sections to authenticated;
grant select, insert, update, delete on docbuilder.document_project_versions to authenticated;
grant select, insert, update, delete on docbuilder.document_exports to authenticated;
grant all privileges on all tables in schema docbuilder to service_role;

drop policy if exists p_document_types_read on docbuilder.document_types;
create policy p_document_types_read on docbuilder.document_types
for select to authenticated
using (
  status in ('active', 'archived')
  and exists (
    select 1
    from docbuilder.document_type_versions dv
    where dv.document_type_id = document_types.id
      and dv.status = 'published'
  )
);

drop policy if exists p_document_type_versions_read on docbuilder.document_type_versions;
create policy p_document_type_versions_read on docbuilder.document_type_versions
for select to authenticated
using (status = 'published');

drop policy if exists p_document_style_profiles_read on docbuilder.document_style_profiles;
create policy p_document_style_profiles_read on docbuilder.document_style_profiles
for select to authenticated
using (
  is_active = true
  and (
    document_type_id is null
    or exists (
      select 1
      from docbuilder.document_types dt
      where dt.id = document_type_id
        and dt.status in ('active', 'archived')
    )
  )
);

drop policy if exists p_document_sections_read on docbuilder.document_sections;
create policy p_document_sections_read on docbuilder.document_sections
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_type_versions dv
    where dv.id = document_type_version_id
      and dv.status = 'published'
  )
);

drop policy if exists p_document_section_rules_read on docbuilder.document_section_rules;
create policy p_document_section_rules_read on docbuilder.document_section_rules
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_sections ds
    join docbuilder.document_type_versions dv on dv.id = ds.document_type_version_id
    where ds.id = section_id
      and dv.status = 'published'
  )
);

drop policy if exists p_document_placeholders_read on docbuilder.document_placeholders;
create policy p_document_placeholders_read on docbuilder.document_placeholders
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_type_versions dv
    where dv.id = document_type_version_id
      and dv.status = 'published'
  )
);

drop policy if exists p_document_question_groups_read on docbuilder.document_question_groups;
create policy p_document_question_groups_read on docbuilder.document_question_groups
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_type_versions dv
    where dv.id = document_type_version_id
      and dv.status = 'published'
  )
);

drop policy if exists p_document_questions_read on docbuilder.document_questions;
create policy p_document_questions_read on docbuilder.document_questions
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_question_groups dqg
    join docbuilder.document_type_versions dv on dv.id = dqg.document_type_version_id
    where dqg.id = group_id
      and dv.status = 'published'
  )
);

drop policy if exists p_document_question_section_map_read on docbuilder.document_question_section_map;
create policy p_document_question_section_map_read on docbuilder.document_question_section_map
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_sections ds
    join docbuilder.document_type_versions dv on dv.id = ds.document_type_version_id
    where ds.id = section_id
      and dv.status = 'published'
  )
);

drop policy if exists p_document_reference_sources_read on docbuilder.document_reference_sources;
create policy p_document_reference_sources_read on docbuilder.document_reference_sources
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_type_versions dv
    where dv.id = document_type_version_id
      and dv.status = 'published'
  )
);

drop policy if exists p_document_reference_chunks_read on docbuilder.document_reference_chunks;
create policy p_document_reference_chunks_read on docbuilder.document_reference_chunks
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_reference_sources drs
    join docbuilder.document_type_versions dv on dv.id = drs.document_type_version_id
    where drs.id = source_id
      and dv.status = 'published'
  )
);

drop policy if exists p_jurisdictions_read on docbuilder.jurisdictions;
create policy p_jurisdictions_read on docbuilder.jurisdictions
for select to authenticated
using (is_active = true);

drop policy if exists p_requirement_sets_read on docbuilder.requirement_sets;
create policy p_requirement_sets_read on docbuilder.requirement_sets
for select to authenticated
using (is_active = true);

drop policy if exists p_requirements_library_read on docbuilder.requirements_library;
create policy p_requirements_library_read on docbuilder.requirements_library
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.requirement_sets rs
    where rs.id = requirement_set_id
      and rs.is_active = true
  )
);

drop policy if exists p_document_type_requirement_map_read on docbuilder.document_type_requirement_map;
create policy p_document_type_requirement_map_read on docbuilder.document_type_requirement_map
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_types dt
    where dt.id = document_type_id
      and dt.status in ('active', 'archived')
  )
);

drop policy if exists p_document_type_jurisdiction_map_read on docbuilder.document_type_jurisdiction_map;
create policy p_document_type_jurisdiction_map_read on docbuilder.document_type_jurisdiction_map
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_types dt
    where dt.id = document_type_id
      and dt.status in ('active', 'archived')
  )
);

drop policy if exists p_document_projects_select on docbuilder.document_projects;
create policy p_document_projects_select on docbuilder.document_projects
for select to authenticated
using (
  owner_user_id = auth.uid()
  or exists (
    select 1
    from docbuilder.document_collaborators dc
    where dc.document_project_id = id
      and dc.user_id = auth.uid()
  )
);

drop policy if exists p_document_projects_insert on docbuilder.document_projects;
create policy p_document_projects_insert on docbuilder.document_projects
for insert to authenticated
with check (true);

drop policy if exists p_document_projects_update on docbuilder.document_projects;
create policy p_document_projects_update on docbuilder.document_projects
for update to authenticated
using (docbuilder.has_project_admin_access(id))
with check (docbuilder.has_project_admin_access(id));

drop policy if exists p_document_projects_delete on docbuilder.document_projects;
create policy p_document_projects_delete on docbuilder.document_projects
for delete to authenticated
using (docbuilder.is_project_owner(id));

drop policy if exists p_document_collaborators_select on docbuilder.document_collaborators;
create policy p_document_collaborators_select on docbuilder.document_collaborators
for select to authenticated
using (
  user_id = auth.uid()
  or docbuilder.has_project_admin_access(document_project_id)
);

drop policy if exists p_document_collaborators_insert on docbuilder.document_collaborators;
create policy p_document_collaborators_insert on docbuilder.document_collaborators
for insert to authenticated
with check (
  docbuilder.has_project_admin_access(document_project_id)
);

drop policy if exists p_document_collaborators_update on docbuilder.document_collaborators;
create policy p_document_collaborators_update on docbuilder.document_collaborators
for update to authenticated
using (
  docbuilder.has_project_admin_access(document_project_id)
)
with check (true);

drop policy if exists p_document_collaborators_delete on docbuilder.document_collaborators;
create policy p_document_collaborators_delete on docbuilder.document_collaborators
for delete to authenticated
using (
  docbuilder.has_project_admin_access(document_project_id)
);

drop policy if exists p_document_answers_select on docbuilder.document_answers;
create policy p_document_answers_select on docbuilder.document_answers
for select to authenticated
using (docbuilder.has_project_access(document_project_id));

drop policy if exists p_document_answers_insert on docbuilder.document_answers;
create policy p_document_answers_insert on docbuilder.document_answers
for insert to authenticated
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_answers_update on docbuilder.document_answers;
create policy p_document_answers_update on docbuilder.document_answers
for update to authenticated
using (docbuilder.has_project_edit_access(document_project_id))
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_answers_delete on docbuilder.document_answers;
create policy p_document_answers_delete on docbuilder.document_answers
for delete to authenticated
using (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_project_sections_select on docbuilder.document_project_sections;
create policy p_document_project_sections_select on docbuilder.document_project_sections
for select to authenticated
using (docbuilder.has_project_access(document_project_id));

drop policy if exists p_document_project_sections_insert on docbuilder.document_project_sections;
create policy p_document_project_sections_insert on docbuilder.document_project_sections
for insert to authenticated
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_project_sections_update on docbuilder.document_project_sections;
create policy p_document_project_sections_update on docbuilder.document_project_sections
for update to authenticated
using (docbuilder.has_project_edit_access(document_project_id))
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_project_sections_delete on docbuilder.document_project_sections;
create policy p_document_project_sections_delete on docbuilder.document_project_sections
for delete to authenticated
using (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_generation_runs_select on docbuilder.document_generation_runs;
create policy p_document_generation_runs_select on docbuilder.document_generation_runs
for select to authenticated
using (docbuilder.has_project_access(document_project_id));

drop policy if exists p_document_generation_runs_insert on docbuilder.document_generation_runs;
create policy p_document_generation_runs_insert on docbuilder.document_generation_runs
for insert to authenticated
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_generation_runs_update on docbuilder.document_generation_runs;
create policy p_document_generation_runs_update on docbuilder.document_generation_runs
for update to authenticated
using (docbuilder.has_project_edit_access(document_project_id))
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_generation_runs_delete on docbuilder.document_generation_runs;
create policy p_document_generation_runs_delete on docbuilder.document_generation_runs
for delete to authenticated
using (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_generation_run_sections_select on docbuilder.document_generation_run_sections;
create policy p_document_generation_run_sections_select on docbuilder.document_generation_run_sections
for select to authenticated
using (
  exists (
    select 1
    from docbuilder.document_generation_runs dgr
    where dgr.id = generation_run_id
      and docbuilder.has_project_access(dgr.document_project_id)
  )
);

drop policy if exists p_document_generation_run_sections_insert on docbuilder.document_generation_run_sections;
create policy p_document_generation_run_sections_insert on docbuilder.document_generation_run_sections
for insert to authenticated
with check (
  exists (
    select 1
    from docbuilder.document_generation_runs dgr
    where dgr.id = generation_run_id
      and docbuilder.has_project_edit_access(dgr.document_project_id)
  )
);

drop policy if exists p_document_generation_run_sections_update on docbuilder.document_generation_run_sections;
create policy p_document_generation_run_sections_update on docbuilder.document_generation_run_sections
for update to authenticated
using (
  exists (
    select 1
    from docbuilder.document_generation_runs dgr
    where dgr.id = generation_run_id
      and docbuilder.has_project_edit_access(dgr.document_project_id)
  )
)
with check (
  exists (
    select 1
    from docbuilder.document_generation_runs dgr
    where dgr.id = generation_run_id
      and docbuilder.has_project_edit_access(dgr.document_project_id)
  )
);

drop policy if exists p_document_generation_run_sections_delete on docbuilder.document_generation_run_sections;
create policy p_document_generation_run_sections_delete on docbuilder.document_generation_run_sections
for delete to authenticated
using (
  exists (
    select 1
    from docbuilder.document_generation_runs dgr
    where dgr.id = generation_run_id
      and docbuilder.has_project_edit_access(dgr.document_project_id)
  )
);

drop policy if exists p_document_project_versions_select on docbuilder.document_project_versions;
create policy p_document_project_versions_select on docbuilder.document_project_versions
for select to authenticated
using (docbuilder.has_project_access(document_project_id));

drop policy if exists p_document_project_versions_insert on docbuilder.document_project_versions;
create policy p_document_project_versions_insert on docbuilder.document_project_versions
for insert to authenticated
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_project_versions_update on docbuilder.document_project_versions;
create policy p_document_project_versions_update on docbuilder.document_project_versions
for update to authenticated
using (false)
with check (false);

drop policy if exists p_document_project_versions_delete on docbuilder.document_project_versions;
create policy p_document_project_versions_delete on docbuilder.document_project_versions
for delete to authenticated
using (docbuilder.is_project_owner(document_project_id));

drop policy if exists p_document_exports_select on docbuilder.document_exports;
create policy p_document_exports_select on docbuilder.document_exports
for select to authenticated
using (docbuilder.has_project_access(document_project_id));

drop policy if exists p_document_exports_insert on docbuilder.document_exports;
create policy p_document_exports_insert on docbuilder.document_exports
for insert to authenticated
with check (docbuilder.has_project_edit_access(document_project_id));

drop policy if exists p_document_exports_update on docbuilder.document_exports;
create policy p_document_exports_update on docbuilder.document_exports
for update to authenticated
using (false)
with check (false);

drop policy if exists p_document_exports_delete on docbuilder.document_exports;
create policy p_document_exports_delete on docbuilder.document_exports
for delete to authenticated
using (docbuilder.is_project_owner(document_project_id));

commit;
