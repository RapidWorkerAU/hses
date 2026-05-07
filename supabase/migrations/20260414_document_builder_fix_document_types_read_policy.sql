begin;

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

commit;
