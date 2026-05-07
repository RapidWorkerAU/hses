begin;

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

commit;
