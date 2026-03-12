begin;

insert into risk.consequence_levels (id, code, label, sort_order)
values
  (1, '1', 'Negligible', 1),
  (2, '2', 'Minor', 2),
  (3, '3', 'Moderate', 3),
  (4, '4', 'Major', 4),
  (5, '5', 'Critical', 5)
on conflict (id) do update
set
  code = excluded.code,
  label = excluded.label,
  sort_order = excluded.sort_order;

insert into risk.likelihood_levels (id, code, label, sort_order)
values
  ('A', 'A', 'Almost Certain', 1),
  ('B', 'B', 'Likely', 2),
  ('C', 'C', 'Possible', 3),
  ('D', 'D', 'Unlikely', 4),
  ('E', 'E', 'Remote', 5)
on conflict (id) do update
set
  code = excluded.code,
  label = excluded.label,
  sort_order = excluded.sort_order;

insert into risk.risk_matrix (likelihood_id, consequence_id, ranking_code, ranking_label, quantitative_class)
values
  ('A', 1, 'A1', 'Low', 'I - Low'),
  ('A', 2, 'A2', 'Medium', 'II - Moderate'),
  ('A', 3, 'A3', 'Significant', 'III - High'),
  ('A', 4, 'A4', 'High', 'IV - Critical'),
  ('A', 5, 'A5', 'High', 'IV - Critical'),
  ('B', 1, 'B1', 'Low', 'I - Low'),
  ('B', 2, 'B2', 'Medium', 'II - Moderate'),
  ('B', 3, 'B3', 'Significant', 'III - High'),
  ('B', 4, 'B4', 'High', 'IV - Critical'),
  ('B', 5, 'B5', 'High', 'IV - Critical'),
  ('C', 1, 'C1', 'Low', 'I - Low'),
  ('C', 2, 'C2', 'Medium', 'II - Moderate'),
  ('C', 3, 'C3', 'Medium', 'II - Moderate'),
  ('C', 4, 'C4', 'Significant', 'III - High'),
  ('C', 5, 'C5', 'High', 'IV - Critical'),
  ('D', 1, 'D1', 'Low', 'I - Low'),
  ('D', 2, 'D2', 'Low', 'I - Low'),
  ('D', 3, 'D3', 'Medium', 'II - Moderate'),
  ('D', 4, 'D4', 'Significant', 'III - High'),
  ('D', 5, 'D5', 'Significant', 'III - High'),
  ('E', 1, 'E1', 'Low', 'I - Low'),
  ('E', 2, 'E2', 'Low', 'I - Low'),
  ('E', 3, 'E3', 'Low', 'I - Low'),
  ('E', 4, 'E4', 'Significant', 'III - High'),
  ('E', 5, 'E5', 'Significant', 'III - High')
on conflict (likelihood_id, consequence_id) do update
set
  ranking_code = excluded.ranking_code,
  ranking_label = excluded.ranking_label,
  quantitative_class = excluded.quantitative_class;

insert into risk.control_types (code, label, sort_order)
values
  ('elimination', '1 - Elimination', 1),
  ('substitution', '2 - Substitution', 2),
  ('engineering', '3 - Engineering', 3),
  ('administrative', '4 - Administrative', 4),
  ('ppe', '5 - Personal Protective Equipment', 5)
on conflict (code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into risk.project_phases (code, label, sort_order)
values
  ('startup_mobilisation', 'Start Up/ Mobilisation', 1),
  ('construction_execution', 'Construction / Execution', 2),
  ('commissioning', 'Commissioning', 3),
  ('normal_operations', 'Normal Operations', 4),
  ('planned_maintenance', 'Planned Maintenance', 5),
  ('unplanned_maintenance', 'Unplanned Maintenance', 6),
  ('emergency_conditions', 'Emergency Conditions', 7),
  ('decommissioning', 'Decommissioning', 8),
  ('closure', 'Closure', 9),
  ('transit_conditions', 'Transit Conditions', 10)
on conflict (code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into risk.risk_statuses (code, label, sort_order)
values
  ('draft', 'Draft', 1),
  ('open', 'Open', 2),
  ('in_review', 'In Review', 3),
  ('closed', 'Closed', 4)
on conflict (code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into risk.hazard_types (code, label, definition, sort_order)
values
  ('biological', 'Biological', 'Potential for harm caused by exposure to biological hazards, including flora and fauna, and subclasses of agents.', 1),
  ('climatic_natural_events', 'Climatic_Natural_Events', 'Potential for harm from exposure to extreme natural, environmental or climatic sources/events.', 2),
  ('electrical_magnetic', 'Electrical_Magnetic', 'Potential for harm from close exposure to electrical or magnetic energy sources.', 3),
  ('ergonomics', 'Ergonomics', 'Potential for exposure to physical actions/forces, poor design, or repetitive movement.', 4),
  ('external_threats', 'External_Threats', 'Potential for harm from external sources/events outside the operation direct control.', 5),
  ('gravity', 'Gravity', 'Potential for person/object/structure to fall or move unexpectedly due to gravitational forces.', 6),
  ('lighting', 'Lighting', 'Potential for harm from overexposure to light or inadequate lighting.', 7),
  ('natural_environment_ecosystem', 'Natural_Environment_Ecosystem', 'Potential to harm or degrade natural environment/ecosystem from operations.', 8),
  ('mechanical', 'Mechanical', 'Potential for unintended interaction with mechanical energy, equipment and uncontrolled movement.', 9),
  ('personal_behavioural', 'Personal_Behavioural', 'Potential for harm from undesirable behavioural actions, stressors or stress.', 10),
  ('pressure', 'Pressure', 'Potential for harm from sudden release of pressure from a source.', 11),
  ('radiation', 'Radiation', 'Potential for harm from exposure to radiation waves from natural or manufactured sources.', 12),
  ('social_cultural', 'Social_Cultural', 'Potential for business activities to interact with social/cultural expectations leading to impact.', 13),
  ('sound_vibration', 'Sound_Vibration', 'Potential for harm from prolonged exposure to excessive noise or vibration.', 14),
  ('substances', 'Substances', 'Potential for harm from unexpected exposure to substances/materials and reactivity.', 15),
  ('thermal_fire_explosion', 'Thermal_Fire_Explosion', 'Potential for harm from temperature extremes, fire and explosion sources.', 16),
  ('vehicles_transportation', 'Vehicles_Transportation', 'Potential for harm from operation of self-propelled equipment and moving impact/collision.', 17),
  ('waste', 'Waste', 'Potential for harm from inadequate management/disposal of waste material.', 18),
  ('work_environment', 'Work_Environment', 'Potential for harm from workplace conditions and specific physical location.', 19)
on conflict (code) do update
set
  label = excluded.label,
  definition = excluded.definition,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into risk.impact_categories (code, label, sort_order)
values
  ('personnel_safety', 'Personnel_Safety', 1),
  ('personnel_health', 'Personnel_Health', 2),
  ('environment', 'Environment', 3),
  ('cultural_heritage', 'Cultural_Heritage', 4),
  ('community', 'Community', 5),
  ('reputation', 'Reputation', 6),
  ('compliance', 'Compliance', 7),
  ('production_productivity', 'Production_Productivity', 8),
  ('revenue', 'Revenue', 9),
  ('operating_cost', 'Operating_Cost', 10),
  ('schedule', 'Schedule', 11),
  ('other', 'Other', 12)
on conflict (code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into risk.hazard_subtypes (hazard_type_id, code, label, sort_order)
select ht.id, v.code, v.label, v.sort_order
from risk.hazard_types ht
join (
  values
    ('vehicles_transportation', 'aircraft', 'Aircraft', 1),
    ('vehicles_transportation', 'heavy_vehicles', 'Heavy Vehicles', 2),
    ('vehicles_transportation', 'motorcycles', 'Motorcycles', 3),
    ('mechanical', 'crushing', 'Crushing', 1),
    ('mechanical', 'cutting_or_severing', 'Cutting or Severing', 2),
    ('mechanical', 'stored_energy', 'Stored Energy', 3),
    ('pressure', 'hydraulic', 'Hydraulic', 1),
    ('pressure', 'pneumatic', 'Pneumatic', 2),
    ('pressure', 'steam', 'Steam', 3),
    ('gravity', 'fall_from_height', 'Fall from Height', 1),
    ('gravity', 'falling_object_material', 'Falling Object / Material', 2),
    ('lighting', 'high_level', 'High Level', 1),
    ('lighting', 'low_level', 'Low Level', 2),
    ('work_environment', 'confined_spaces', 'Confined Spaces', 1),
    ('work_environment', 'wet_slippery_conditions', 'Wet / Slick / Slippery Conditions', 2),
    ('sound_vibration', 'noise_continuous', 'Noise (Continuous)', 1),
    ('sound_vibration', 'vibration_community', 'Vibration (Community issue)', 2),
    ('ergonomics', 'bending_twisting', 'Bending/Twisting', 1),
    ('ergonomics', 'repetitive_motion_actions', 'Repetitive Motion Actions', 2),
    ('external_threats', 'civil_unrest', 'Civil Unrest', 1),
    ('external_threats', 'sabotage', 'Sabotage', 2),
    ('biological', 'bacteria', 'Bacteria', 1),
    ('biological', 'virus', 'Virus', 2),
    ('climatic_natural_events', 'flood', 'Flood', 1),
    ('climatic_natural_events', 'lightning', 'Lightning', 2),
    ('climatic_natural_events', 'storms', 'Storms', 3),
    ('thermal_fire_explosion', 'ambient_heat', 'Ambient Heat', 1),
    ('thermal_fire_explosion', 'explosion_gas', 'Explosion - Gas', 2),
    ('thermal_fire_explosion', 'fire_surface_fixed_plant', 'Fire - Surface - Fixed Plant', 3),
    ('waste', 'hazardous_waste', 'Hazardous Waste', 1),
    ('waste', 'office_paper_cardboard', 'Office / Paper / Cardboard', 2),
    ('natural_environment_ecosystem', 'land_filling', 'Land Filling', 1),
    ('natural_environment_ecosystem', 'water_abstraction', 'Water Abstraction', 2),
    ('personal_behavioural', 'fatigue', 'Fatigue', 1),
    ('personal_behavioural', 'stress', 'Stress', 2),
    ('social_cultural', 'cultural_heritage_sites', 'Cultural Heritage - Sites', 1),
    ('social_cultural', 'stakeholder_expectations', 'Stakeholder Expectations', 2),
    ('electrical_magnetic', 'arc_flash', 'Arc Flash', 1),
    ('electrical_magnetic', 'ac_110_480_volts', 'AC 110-480 Volts', 2)
) as v(hazard_type_code, code, label, sort_order)
on ht.code = v.hazard_type_code
on conflict (hazard_type_id, code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

insert into risk.impact_subcategories (impact_category_id, code, label, sort_order)
select ic.id, v.code, v.label, v.sort_order
from risk.impact_categories ic
join (
  values
    ('personnel_safety', 'abrasions', 'Abrasions', 1),
    ('personnel_safety', 'amputation', 'Amputation', 2),
    ('personnel_safety', 'burns', 'Burns', 3),
    ('personnel_safety', 'electric_shock', 'Electric shock', 4),
    ('personnel_safety', 'electrocution', 'Electrocution', 5),
    ('personnel_safety', 'sprains_strains', 'Sprains / strains', 6),
    ('personnel_health', 'cardiovascular_system', 'Cardiovascular System', 1),
    ('personnel_health', 'infectious_and_parasitic', 'Infectious and Parasitic', 2),
    ('personnel_health', 'mental_disorders', 'Mental Disorders', 3),
    ('environment', 'acid_rock_drainage_ard', 'Acid Rock Drainage (ARD)', 1),
    ('environment', 'contamination_air', 'Contamination - Air', 2),
    ('environment', 'contamination_soil', 'Contamination - Soil', 3),
    ('environment', 'contamination_water', 'Contamination - Water', 4),
    ('community', 'community_trust', 'Community Trust', 1),
    ('community', 'demonstrations_protests', 'Demonstrations/ Protests', 2),
    ('compliance', 'contract_service_agreement', 'Contract / service agreement', 1),
    ('compliance', 'legislation_potential', 'Legislation (potential)', 2),
    ('compliance', 'non_conformance_policy', 'Non-conformance: Policy', 3),
    ('reputation', 'customer_service', 'Customer Service', 1),
    ('reputation', 'customer_stakeholder_complaint', 'Customer / Stakeholder Complaint', 2),
    ('operating_cost', 'equipment_property_damage', 'Equipment/Property damage', 1),
    ('operating_cost', 'utilities', 'Utilities', 2),
    ('revenue', 'decrease', 'Decrease', 1),
    ('revenue', 'increase', 'Increase', 2),
    ('schedule', 'change_disruptions', 'Change / Disruptions', 1),
    ('schedule', 'demurrage_delays', 'Demurrage / Delays', 2),
    ('production_productivity', 'inventory_stockpile', 'Inventory / Stockpile', 1),
    ('production_productivity', 'quality_contamination', 'Quality - Contamination', 2),
    ('production_productivity', 'quality_out_of_specification', 'Quality - Out of specification', 3),
    ('production_productivity', 'quantity_output', 'Quantity / output', 4),
    ('cultural_heritage', 'damage_or_destruction_physical_heritage', 'Damage or Destruction of Physical Heritage', 1),
    ('cultural_heritage', 'disturbance_burial_grounds_sacred_sites', 'Disturbance to Burial Grounds or Sacred Sites', 2)
) as v(impact_category_code, code, label, sort_order)
on ic.code = v.impact_category_code
on conflict (impact_category_id, code) do update
set
  label = excluded.label,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

commit;
