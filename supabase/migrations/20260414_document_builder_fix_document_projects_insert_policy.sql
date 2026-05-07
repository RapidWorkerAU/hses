begin;

alter table docbuilder.document_projects
  alter column owner_user_id set default auth.uid();

drop policy if exists p_document_projects_insert on docbuilder.document_projects;

create policy p_document_projects_insert on docbuilder.document_projects
for insert to authenticated
with check (true);

commit;
