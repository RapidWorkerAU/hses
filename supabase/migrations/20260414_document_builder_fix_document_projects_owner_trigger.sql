begin;

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

drop trigger if exists trg_document_projects_owner on docbuilder.document_projects;

create trigger trg_document_projects_owner
before insert on docbuilder.document_projects
for each row
execute function docbuilder.set_document_project_owner();

commit;
