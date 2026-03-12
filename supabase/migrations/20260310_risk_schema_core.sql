begin;

create extension if not exists pgcrypto;
create schema if not exists risk;

grant usage on schema risk to anon, authenticated, service_role;

create or replace function risk.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists risk.industries (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk.project_phases (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk.risk_statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk.control_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk.hazard_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  definition text,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk.hazard_subtypes (
  id uuid primary key default gen_random_uuid(),
  hazard_type_id uuid not null references risk.hazard_types(id) on delete cascade,
  code text not null,
  label text not null,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (hazard_type_id, code),
  unique (hazard_type_id, label)
);

create table if not exists risk.impact_categories (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk.impact_subcategories (
  id uuid primary key default gen_random_uuid(),
  impact_category_id uuid not null references risk.impact_categories(id) on delete cascade,
  code text not null,
  label text not null,
  sort_order int not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (impact_category_id, code),
  unique (impact_category_id, label)
);

create table if not exists risk.consequence_levels (
  id smallint primary key,
  code text not null unique,
  label text not null,
  sort_order smallint not null unique
);

create table if not exists risk.likelihood_levels (
  id char(1) primary key,
  code text not null unique,
  label text not null,
  sort_order smallint not null unique
);

create table if not exists risk.risk_matrix (
  likelihood_id char(1) not null references risk.likelihood_levels(id),
  consequence_id smallint not null references risk.consequence_levels(id),
  ranking_code text not null,
  ranking_label text not null,
  quantitative_class text,
  primary key (likelihood_id, consequence_id),
  unique (ranking_code)
);

create table if not exists risk.risk_assessments (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) > 0),
  description text,
  status_id uuid references risk.risk_statuses(id),
  industry_id uuid references risk.industries(id),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk.risk_records (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references risk.risk_assessments(id) on delete cascade,
  risk_code text not null,
  project_phase_id uuid references risk.project_phases(id),
  hazard_type_id uuid references risk.hazard_types(id),
  hazard_subtype_id uuid references risk.hazard_subtypes(id),
  risk_status_id uuid references risk.risk_statuses(id),
  scenario_description text,
  cause_description text,
  impact_category_id uuid references risk.impact_categories(id),
  impact_subcategory_id uuid references risk.impact_subcategories(id),
  impact_description text,
  current_controls text,
  preferred_control_type_id uuid references risk.control_types(id),
  consequence_inherent_id smallint references risk.consequence_levels(id),
  likelihood_inherent_id char(1) references risk.likelihood_levels(id),
  risk_ranking_inherent_code text,
  risk_ranking_inherent_label text,
  quantitative_class_inherent text,
  new_controls text,
  consequence_residual_id smallint references risk.consequence_levels(id),
  likelihood_residual_id char(1) references risk.likelihood_levels(id),
  risk_ranking_residual_code text,
  risk_ranking_residual_label text,
  quantitative_class_residual text,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, risk_code)
);

create table if not exists risk.control_library (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  title text not null,
  description text,
  control_type_id uuid references risk.control_types(id),
  owner_user_id uuid references auth.users(id) on delete set null,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists risk.risk_record_controls (
  risk_record_id uuid not null references risk.risk_records(id) on delete cascade,
  control_id uuid not null references risk.control_library(id) on delete restrict,
  control_phase text not null check (control_phase in ('current', 'additional')),
  note text,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  primary key (risk_record_id, control_id, control_phase)
);

create index if not exists idx_risk_assessments_owner on risk.risk_assessments(owner_user_id);
create index if not exists idx_risk_assessments_public on risk.risk_assessments(is_public);
create index if not exists idx_risk_records_assessment on risk.risk_records(assessment_id);
create index if not exists idx_risk_records_owner on risk.risk_records(owner_user_id);
create index if not exists idx_risk_records_public on risk.risk_records(is_public);
create unique index if not exists idx_control_library_owner_code_unique
  on risk.control_library (coalesce(owner_user_id, '00000000-0000-0000-0000-000000000000'::uuid), code);
create index if not exists idx_hazard_subtypes_type on risk.hazard_subtypes(hazard_type_id, sort_order);
create index if not exists idx_impact_subcategories_category on risk.impact_subcategories(impact_category_id, sort_order);

create trigger trg_industries_updated_at before update on risk.industries for each row execute function risk.set_updated_at();
create trigger trg_project_phases_updated_at before update on risk.project_phases for each row execute function risk.set_updated_at();
create trigger trg_risk_statuses_updated_at before update on risk.risk_statuses for each row execute function risk.set_updated_at();
create trigger trg_control_types_updated_at before update on risk.control_types for each row execute function risk.set_updated_at();
create trigger trg_hazard_types_updated_at before update on risk.hazard_types for each row execute function risk.set_updated_at();
create trigger trg_hazard_subtypes_updated_at before update on risk.hazard_subtypes for each row execute function risk.set_updated_at();
create trigger trg_impact_categories_updated_at before update on risk.impact_categories for each row execute function risk.set_updated_at();
create trigger trg_impact_subcategories_updated_at before update on risk.impact_subcategories for each row execute function risk.set_updated_at();
create trigger trg_risk_assessments_updated_at before update on risk.risk_assessments for each row execute function risk.set_updated_at();
create trigger trg_risk_records_updated_at before update on risk.risk_records for each row execute function risk.set_updated_at();
create trigger trg_control_library_updated_at before update on risk.control_library for each row execute function risk.set_updated_at();

create or replace function risk.validate_record_lookups()
returns trigger
language plpgsql
as $$
declare
  subtype_type_id uuid;
  subimpact_category_id uuid;
begin
  if new.hazard_subtype_id is not null then
    select hs.hazard_type_id into subtype_type_id
    from risk.hazard_subtypes hs
    where hs.id = new.hazard_subtype_id;

    if subtype_type_id is null then
      raise exception 'Invalid hazard_subtype_id';
    end if;
    if new.hazard_type_id is null then
      new.hazard_type_id = subtype_type_id;
    elsif new.hazard_type_id <> subtype_type_id then
      raise exception 'hazard_subtype_id does not belong to hazard_type_id';
    end if;
  end if;

  if new.impact_subcategory_id is not null then
    select isc.impact_category_id into subimpact_category_id
    from risk.impact_subcategories isc
    where isc.id = new.impact_subcategory_id;

    if subimpact_category_id is null then
      raise exception 'Invalid impact_subcategory_id';
    end if;
    if new.impact_category_id is null then
      new.impact_category_id = subimpact_category_id;
    elsif new.impact_category_id <> subimpact_category_id then
      raise exception 'impact_subcategory_id does not belong to impact_category_id';
    end if;
  end if;

  return new;
end;
$$;

create or replace function risk.apply_risk_ratings()
returns trigger
language plpgsql
as $$
declare
  inherent_row risk.risk_matrix%rowtype;
  residual_row risk.risk_matrix%rowtype;
begin
  if new.likelihood_inherent_id is not null and new.consequence_inherent_id is not null then
    select * into inherent_row
    from risk.risk_matrix rm
    where rm.likelihood_id = new.likelihood_inherent_id
      and rm.consequence_id = new.consequence_inherent_id;
    new.risk_ranking_inherent_code := inherent_row.ranking_code;
    new.risk_ranking_inherent_label := inherent_row.ranking_label;
    new.quantitative_class_inherent := inherent_row.quantitative_class;
  else
    new.risk_ranking_inherent_code := null;
    new.risk_ranking_inherent_label := null;
    new.quantitative_class_inherent := null;
  end if;

  if new.likelihood_residual_id is not null and new.consequence_residual_id is not null then
    select * into residual_row
    from risk.risk_matrix rm
    where rm.likelihood_id = new.likelihood_residual_id
      and rm.consequence_id = new.consequence_residual_id;
    new.risk_ranking_residual_code := residual_row.ranking_code;
    new.risk_ranking_residual_label := residual_row.ranking_label;
    new.quantitative_class_residual := residual_row.quantitative_class;
  else
    new.risk_ranking_residual_code := null;
    new.risk_ranking_residual_label := null;
    new.quantitative_class_residual := null;
  end if;

  return new;
end;
$$;

create trigger trg_risk_records_validate_lookups before insert or update on risk.risk_records for each row execute function risk.validate_record_lookups();
create trigger trg_risk_records_apply_ratings before insert or update on risk.risk_records for each row execute function risk.apply_risk_ratings();

alter table risk.industries enable row level security;
alter table risk.project_phases enable row level security;
alter table risk.risk_statuses enable row level security;
alter table risk.control_types enable row level security;
alter table risk.hazard_types enable row level security;
alter table risk.hazard_subtypes enable row level security;
alter table risk.impact_categories enable row level security;
alter table risk.impact_subcategories enable row level security;
alter table risk.consequence_levels enable row level security;
alter table risk.likelihood_levels enable row level security;
alter table risk.risk_matrix enable row level security;
alter table risk.risk_assessments enable row level security;
alter table risk.risk_records enable row level security;
alter table risk.control_library enable row level security;
alter table risk.risk_record_controls enable row level security;

grant select on risk.industries to authenticated;
grant select on risk.project_phases to authenticated;
grant select on risk.risk_statuses to authenticated;
grant select on risk.control_types to authenticated;
grant select on risk.hazard_types to authenticated;
grant select on risk.hazard_subtypes to authenticated;
grant select on risk.impact_categories to authenticated;
grant select on risk.impact_subcategories to authenticated;
grant select on risk.consequence_levels to authenticated;
grant select on risk.likelihood_levels to authenticated;
grant select on risk.risk_matrix to authenticated;

grant select, insert, update, delete on risk.risk_assessments to authenticated;
grant select, insert, update, delete on risk.risk_records to authenticated;
grant select, insert, update, delete on risk.control_library to authenticated;
grant select, insert, update, delete on risk.risk_record_controls to authenticated;

grant all privileges on all tables in schema risk to service_role;

create policy p_lookup_read_industries on risk.industries for select to authenticated using (is_active = true);
create policy p_lookup_read_project_phases on risk.project_phases for select to authenticated using (is_active = true);
create policy p_lookup_read_risk_statuses on risk.risk_statuses for select to authenticated using (is_active = true);
create policy p_lookup_read_control_types on risk.control_types for select to authenticated using (is_active = true);
create policy p_lookup_read_hazard_types on risk.hazard_types for select to authenticated using (is_active = true);
create policy p_lookup_read_hazard_subtypes on risk.hazard_subtypes for select to authenticated using (is_active = true);
create policy p_lookup_read_impact_categories on risk.impact_categories for select to authenticated using (is_active = true);
create policy p_lookup_read_impact_subcategories on risk.impact_subcategories for select to authenticated using (is_active = true);
create policy p_lookup_read_consequence_levels on risk.consequence_levels for select to authenticated using (true);
create policy p_lookup_read_likelihood_levels on risk.likelihood_levels for select to authenticated using (true);
create policy p_lookup_read_risk_matrix on risk.risk_matrix for select to authenticated using (true);

create policy p_risk_assessments_select on risk.risk_assessments for select to authenticated using (owner_user_id = auth.uid() or is_public = true);
create policy p_risk_assessments_insert on risk.risk_assessments for insert to authenticated with check (owner_user_id = auth.uid());
create policy p_risk_assessments_update on risk.risk_assessments for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy p_risk_assessments_delete on risk.risk_assessments for delete to authenticated using (owner_user_id = auth.uid());

create policy p_risk_records_select on risk.risk_records for select to authenticated
using (
  owner_user_id = auth.uid()
  or is_public = true
  or exists (
    select 1 from risk.risk_assessments ra
    where ra.id = assessment_id
      and (ra.owner_user_id = auth.uid() or ra.is_public = true)
  )
);
create policy p_risk_records_insert on risk.risk_records for insert to authenticated
with check (
  owner_user_id = auth.uid()
  and exists (
    select 1 from risk.risk_assessments ra
    where ra.id = assessment_id
      and ra.owner_user_id = auth.uid()
  )
);
create policy p_risk_records_update on risk.risk_records for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy p_risk_records_delete on risk.risk_records for delete to authenticated using (owner_user_id = auth.uid());

create policy p_control_library_select on risk.control_library for select to authenticated using (owner_user_id = auth.uid() or is_public = true);
create policy p_control_library_insert on risk.control_library for insert to authenticated with check (owner_user_id = auth.uid());
create policy p_control_library_update on risk.control_library for update to authenticated using (owner_user_id = auth.uid()) with check (owner_user_id = auth.uid());
create policy p_control_library_delete on risk.control_library for delete to authenticated using (owner_user_id = auth.uid());

create policy p_record_controls_select on risk.risk_record_controls for select to authenticated
using (
  exists (
    select 1 from risk.risk_records rr
    where rr.id = risk_record_id
      and (rr.owner_user_id = auth.uid() or rr.is_public = true)
  )
);
create policy p_record_controls_insert on risk.risk_record_controls for insert to authenticated
with check (
  exists (
    select 1 from risk.risk_records rr
    where rr.id = risk_record_id and rr.owner_user_id = auth.uid()
  )
);
create policy p_record_controls_update on risk.risk_record_controls for update to authenticated
using (
  exists (
    select 1 from risk.risk_records rr
    where rr.id = risk_record_id and rr.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from risk.risk_records rr
    where rr.id = risk_record_id and rr.owner_user_id = auth.uid()
  )
);
create policy p_record_controls_delete on risk.risk_record_controls for delete to authenticated
using (
  exists (
    select 1 from risk.risk_records rr
    where rr.id = risk_record_id and rr.owner_user_id = auth.uid()
  )
);

commit;
