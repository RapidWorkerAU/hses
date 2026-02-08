create table if not exists public.quote_number_sequences (
  year int primary key,
  last_number int not null
);

create or replace function public.next_quote_number(p_year int)
returns int
language plpgsql
security definer
as $$
declare
  next_number int;
begin
  insert into public.quote_number_sequences (year, last_number)
  values (p_year, 0)
  on conflict (year) do nothing;

  select last_number into next_number
  from public.quote_number_sequences
  where year = p_year
  for update;

  next_number := next_number + 1;

  update public.quote_number_sequences
  set last_number = next_number
  where year = p_year;

  return next_number;
end;
$$;
