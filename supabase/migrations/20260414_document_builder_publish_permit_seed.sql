begin;

with permit_type as (
  select dt.id
  from docbuilder.document_types dt
  where dt.slug = 'permit-to-work-procedure'
),
permit_version as (
  select dv.id, dv.document_type_id
  from docbuilder.document_type_versions dv
  join permit_type pt on pt.id = dv.document_type_id
  where dv.version_no = 1
)
update docbuilder.document_type_versions dv
set
  status = 'published',
  published_at = coalesce(dv.published_at, now()),
  updated_at = now()
from permit_version pv
where dv.id = pv.id;

with permit_type as (
  select dt.id
  from docbuilder.document_types dt
  where dt.slug = 'permit-to-work-procedure'
),
permit_version as (
  select dv.id, dv.document_type_id
  from docbuilder.document_type_versions dv
  join permit_type pt on pt.id = dv.document_type_id
  where dv.version_no = 1
)
update docbuilder.document_types dt
set
  status = 'active',
  active_version_id = pv.id,
  updated_at = now()
from permit_version pv
where dt.id = pv.document_type_id;

commit;
