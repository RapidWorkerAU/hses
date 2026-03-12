do $$
begin
  if to_regclass('ms.canvas_elements') is not null then
    alter table ms.canvas_elements
      drop constraint if exists canvas_elements_element_type_check;

    alter table ms.canvas_elements
      add constraint canvas_elements_element_type_check
      check (
        element_type = any (
          array[
            'category'::text,
            'system_circle'::text,
            'grouping_container'::text,
            'process_component'::text,
            'sticky_note'::text,
            'person'::text,
            'image_asset'::text,
            'text_box'::text,
            'table'::text,
            'shape_rectangle'::text,
            'shape_circle'::text,
            'shape_pill'::text,
            'shape_pentagon'::text,
            'shape_chevron_left'::text,
            'shape_arrow'::text,
            'bowtie_hazard'::text,
            'bowtie_top_event'::text,
            'bowtie_threat'::text,
            'bowtie_consequence'::text,
            'bowtie_control'::text,
            'bowtie_escalation_factor'::text,
            'bowtie_recovery_measure'::text,
            'bowtie_degradation_indicator'::text,
            'bowtie_risk_rating'::text,
            'incident_sequence_step'::text,
            'incident_outcome'::text,
            'incident_task_condition'::text,
            'incident_factor'::text,
            'incident_system_factor'::text,
            'incident_control_barrier'::text,
            'incident_evidence'::text,
            'incident_finding'::text,
            'incident_recommendation'::text
          ]
        )
      );
  elsif to_regclass('public.canvas_elements') is not null then
    alter table public.canvas_elements
      drop constraint if exists canvas_elements_element_type_check;

    alter table public.canvas_elements
      add constraint canvas_elements_element_type_check
      check (
        element_type = any (
          array[
            'category'::text,
            'system_circle'::text,
            'grouping_container'::text,
            'process_component'::text,
            'sticky_note'::text,
            'person'::text,
            'image_asset'::text,
            'text_box'::text,
            'table'::text,
            'shape_rectangle'::text,
            'shape_circle'::text,
            'shape_pill'::text,
            'shape_pentagon'::text,
            'shape_chevron_left'::text,
            'shape_arrow'::text,
            'bowtie_hazard'::text,
            'bowtie_top_event'::text,
            'bowtie_threat'::text,
            'bowtie_consequence'::text,
            'bowtie_control'::text,
            'bowtie_escalation_factor'::text,
            'bowtie_recovery_measure'::text,
            'bowtie_degradation_indicator'::text,
            'bowtie_risk_rating'::text,
            'incident_sequence_step'::text,
            'incident_outcome'::text,
            'incident_task_condition'::text,
            'incident_factor'::text,
            'incident_system_factor'::text,
            'incident_control_barrier'::text,
            'incident_evidence'::text,
            'incident_finding'::text,
            'incident_recommendation'::text
          ]
        )
      );
  end if;
end
$$;
