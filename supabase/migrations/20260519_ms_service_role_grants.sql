grant usage on schema ms to service_role;
grant all privileges on all tables in schema ms to service_role;
grant all privileges on all sequences in schema ms to service_role;
grant execute on all functions in schema ms to service_role;

alter default privileges in schema ms
  grant all privileges on tables to service_role;

alter default privileges in schema ms
  grant all privileges on sequences to service_role;

alter default privileges in schema ms
  grant execute on functions to service_role;

notify pgrst, 'reload schema';
