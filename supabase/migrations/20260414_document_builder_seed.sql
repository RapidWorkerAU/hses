begin;

insert into docbuilder.jurisdictions (
  country_code,
  country_name,
  region_name,
  framework_name,
  language_code,
  is_active
)
values
  ('GLOBAL', 'Global', '', 'Objective Baseline', 'en', true),
  ('AU', 'Australia', '', 'National', 'en', true)
on conflict (country_code, region_name, framework_name) do update
set
  country_name = excluded.country_name,
  language_code = excluded.language_code,
  is_active = excluded.is_active,
  updated_at = now();

with upsert_document_type as (
  insert into docbuilder.document_types (
    slug,
    title,
    description,
    category,
    default_language_code,
    status
  )
  values (
    'permit-to-work-procedure',
    'Permit to Work Procedure',
    'Scaffolded document type for the upcoming AI-assisted permit to work procedure builder.',
    'procedure',
    'en',
    'draft'
  )
  on conflict (slug) do update
  set
    title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    default_language_code = excluded.default_language_code
  returning id
),
resolved_document_type as (
  select id from upsert_document_type
  union all
  select dt.id
  from docbuilder.document_types dt
  where dt.slug = 'permit-to-work-procedure'
  limit 1
),
upsert_version as (
  insert into docbuilder.document_type_versions (
    document_type_id,
    version_no,
    status,
    notes,
    requirements_mode
  )
  select
    id,
    1,
    'draft',
    'Initial scaffold seeded before template content, questions, and localisation rules are authored.',
    'hybrid'
  from resolved_document_type
  on conflict (document_type_id, version_no) do update
  set
    notes = excluded.notes,
    requirements_mode = excluded.requirements_mode
  returning document_type_id, id
)
update docbuilder.document_types dt
set updated_at = now()
from upsert_version uv
where dt.id = uv.document_type_id;

insert into docbuilder.document_style_profiles (
  document_type_id,
  key,
  title,
  description,
  theme_config,
  is_default,
  is_active
)
select
  dt.id,
  'hses-default',
  'HSES Default PDF',
  'Default branded PDF style profile for generated documents.',
  jsonb_build_object(
    'page', jsonb_build_object('size', 'A4', 'marginMm', 18),
    'cover', jsonb_build_object('showTitle', true, 'showVersion', true),
    'typography', jsonb_build_object('fontFamily', 'Segoe UI', 'baseFontSizePt', 10.5),
    'colours', jsonb_build_object('heading', '#0f2949', 'accent', '#126f89', 'text', '#14233a')
  ),
  true,
  true
from docbuilder.document_types dt
where dt.slug = 'permit-to-work-procedure'
on conflict (document_type_id, key) do update
set
  title = excluded.title,
  description = excluded.description,
  theme_config = excluded.theme_config,
  is_default = excluded.is_default,
  is_active = excluded.is_active,
  updated_at = now();

insert into docbuilder.document_type_jurisdiction_map (
  document_type_id,
  jurisdiction_id,
  support_level
)
select
  dt.id,
  j.id,
  case when j.country_code = 'GLOBAL' then 'supported' else 'planned' end
from docbuilder.document_types dt
join docbuilder.jurisdictions j
  on j.country_code in ('GLOBAL', 'AU')
where dt.slug = 'permit-to-work-procedure'
on conflict (document_type_id, jurisdiction_id) do update
set support_level = excluded.support_level;

commit;
