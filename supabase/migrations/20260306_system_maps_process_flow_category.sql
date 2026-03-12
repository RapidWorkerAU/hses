do $$
begin
  if to_regclass('ms.system_maps') is not null then
    alter table ms.system_maps
      drop constraint if exists system_maps_map_category_check;

    alter table ms.system_maps
      add constraint system_maps_map_category_check
      check (
        map_category = any (
          array[
            'document_map'::text,
            'bow_tie'::text,
            'incident_investigation'::text,
            'org_chart'::text,
            'process_flow'::text
          ]
        )
      );
  elsif to_regclass('public.system_maps') is not null then
    alter table public.system_maps
      drop constraint if exists system_maps_map_category_check;

    alter table public.system_maps
      add constraint system_maps_map_category_check
      check (
        map_category = any (
          array[
            'document_map'::text,
            'bow_tie'::text,
            'incident_investigation'::text,
            'org_chart'::text,
            'process_flow'::text
          ]
        )
      );
  end if;
end
$$;
