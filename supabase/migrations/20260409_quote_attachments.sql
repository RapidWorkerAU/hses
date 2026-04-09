create table if not exists public.quote_attachments (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  storage_bucket text not null default 'adminattachments',
  storage_path text not null unique,
  file_name text not null,
  file_size bigint,
  content_type text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists quote_attachments_quote_id_idx
  on public.quote_attachments (quote_id, created_at desc);
