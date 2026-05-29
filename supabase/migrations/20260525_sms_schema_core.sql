begin;

create extension if not exists pgcrypto;
create schema if not exists sms;

grant usage on schema sms to anon, authenticated, service_role;

create or replace function sms.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists sms.maps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'complete')),
  canvas_generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sms.question_sessions (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references sms.maps(id) on delete cascade,
  current_qs_group text check (
    current_qs_group in (
      'QS1',
      'QS2',
      'QS3',
      'QS4',
      'QS5',
      'QS6',
      'QS7',
      'preferences',
      'gap_analysis',
      'complete'
    )
  ),
  current_question_index integer not null default 0 check (current_question_index >= 0),
  ai_conversation_history jsonb not null default '[]'::jsonb check (jsonb_typeof(ai_conversation_history) = 'array'),
  gap_analysis_complete boolean not null default false,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sms.responses (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references sms.maps(id) on delete cascade,
  session_id uuid not null references sms.question_sessions(id) on delete cascade,
  qs_group text not null,
  question_key text not null,
  question_label text not null,
  response_value text not null,
  response_type text not null check (response_type in ('fixed', 'ai_extracted')),
  confidence text not null default 'confirmed' check (confidence in ('confirmed', 'inferred', 'assumed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sms.pref_flags (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references sms.maps(id) on delete cascade,
  jurisdiction text,
  operational_context text check (operational_context in ('ongoing_operations', 'project_based', 'both')),
  is_iso45001 boolean not null default false,
  document_style text check (document_style in ('combined', 'separate', 'mixed')),
  audience text check (audience in ('employees_only', 'contractors_included', 'public_included')),
  contractor_own_sms boolean,
  has_multiple_sites boolean not null default false,
  language_style text check (language_style in ('plain', 'technical', 'formal')),
  doc_format text check (doc_format in ('digital', 'print', 'both')),
  system_maturity text check (system_maturity in ('new_build', 'improving_existing')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (map_id)
);

create table if not exists sms.zones (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references sms.maps(id) on delete cascade,
  zone_key text not null check (zone_key in ('foundation', 'safe_work', 'assurance')),
  label text not null,
  position_x double precision,
  position_y double precision,
  width double precision,
  height double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (map_id, zone_key)
);

create table if not exists sms.nodes (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references sms.maps(id) on delete cascade,
  zone_id uuid references sms.zones(id) on delete set null,
  parent_node_id uuid references sms.nodes(id) on delete set null,
  node_type text not null check (
    node_type in (
      'system_element',
      'work_activity',
      'hazard',
      'control',
      'document',
      'role',
      'process',
      'training_requirement',
      'legal_obligation'
    )
  ),
  label text not null,
  description text,
  status text not null default 'to_do' check (status in ('to_do', 'in_progress', 'done')),
  priority text check (priority in ('critical', 'high', 'medium', 'low')),
  owner_role text,
  position_x double precision,
  position_y double precision,
  source_response_keys text[] not null default array[]::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sms.edges (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references sms.maps(id) on delete cascade,
  source_node_id uuid not null references sms.nodes(id) on delete cascade,
  target_node_id uuid not null references sms.nodes(id) on delete cascade,
  edge_type text not null check (edge_type in ('feeds', 'governs', 'requires', 'supports', 'triggers')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists sms.gap_log (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references sms.maps(id) on delete cascade,
  session_id uuid not null references sms.question_sessions(id) on delete cascade,
  qs_group text,
  gap_description text not null,
  follow_up_question text,
  resolved boolean not null default false,
  resolution_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sms_responses_map on sms.responses(map_id);
create index if not exists idx_sms_responses_question_key on sms.responses(question_key);
create index if not exists idx_sms_nodes_map on sms.nodes(map_id);
create index if not exists idx_sms_nodes_node_type on sms.nodes(node_type);
create index if not exists idx_sms_nodes_parent_node on sms.nodes(parent_node_id);
create index if not exists idx_sms_edges_map on sms.edges(map_id);
create index if not exists idx_sms_gap_log_map_resolved on sms.gap_log(map_id, resolved);

drop trigger if exists trg_sms_maps_updated_at on sms.maps;
create trigger trg_sms_maps_updated_at before update on sms.maps for each row execute function sms.set_updated_at();
drop trigger if exists trg_sms_question_sessions_updated_at on sms.question_sessions;
create trigger trg_sms_question_sessions_updated_at before update on sms.question_sessions for each row execute function sms.set_updated_at();
drop trigger if exists trg_sms_responses_updated_at on sms.responses;
create trigger trg_sms_responses_updated_at before update on sms.responses for each row execute function sms.set_updated_at();
drop trigger if exists trg_sms_pref_flags_updated_at on sms.pref_flags;
create trigger trg_sms_pref_flags_updated_at before update on sms.pref_flags for each row execute function sms.set_updated_at();
drop trigger if exists trg_sms_zones_updated_at on sms.zones;
create trigger trg_sms_zones_updated_at before update on sms.zones for each row execute function sms.set_updated_at();
drop trigger if exists trg_sms_nodes_updated_at on sms.nodes;
create trigger trg_sms_nodes_updated_at before update on sms.nodes for each row execute function sms.set_updated_at();
drop trigger if exists trg_sms_edges_updated_at on sms.edges;
create trigger trg_sms_edges_updated_at before update on sms.edges for each row execute function sms.set_updated_at();
drop trigger if exists trg_sms_gap_log_updated_at on sms.gap_log;
create trigger trg_sms_gap_log_updated_at before update on sms.gap_log for each row execute function sms.set_updated_at();

alter table sms.maps enable row level security;
alter table sms.question_sessions enable row level security;
alter table sms.responses enable row level security;
alter table sms.pref_flags enable row level security;
alter table sms.zones enable row level security;
alter table sms.nodes enable row level security;
alter table sms.edges enable row level security;
alter table sms.gap_log enable row level security;

grant select, insert, update, delete on sms.maps to authenticated;
grant select, insert, update, delete on sms.question_sessions to authenticated;
grant select, insert, update, delete on sms.responses to authenticated;
grant select, insert, update, delete on sms.pref_flags to authenticated;
grant select, insert, update, delete on sms.zones to authenticated;
grant select, insert, update, delete on sms.nodes to authenticated;
grant select, insert, update, delete on sms.edges to authenticated;
grant select, insert, update, delete on sms.gap_log to authenticated;
grant all privileges on all tables in schema sms to service_role;

commit;
