alter role authenticator set pgrst.db_schemas = 'public,graphql_public,ms,risk,docbuilder,sms';

notify pgrst, 'reload config';
notify pgrst, 'reload schema';
