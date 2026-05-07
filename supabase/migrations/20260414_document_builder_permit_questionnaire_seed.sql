begin;

with permit_version as (
  select dv.id
  from docbuilder.document_type_versions dv
  join docbuilder.document_types dt on dt.id = dv.document_type_id
  where dt.slug = 'permit-to-work-procedure'
    and dv.version_no = 1
),
section_seed(section_key, title, order_index, objective) as (
  values
    ('cover-page', 'Cover Page', 10, 'Document identity, approval, and issue metadata for the project-specific permit to work procedure.'),
    ('scope', 'Scope', 20, 'Defines the entities, workers, contractors, and work situations to which the procedure applies.'),
    ('project-applicability', 'Project Applicability', 30, 'Captures the project-specific operating context, jurisdiction, location, and applicability constraints.'),
    ('roles-responsibilities', 'Roles & Responsibilities', 40, 'Defines the named project roles and their permit-related responsibilities without changing the base table structure.'),
    ('permit-framework', 'Permit Framework and Types', 50, 'Defines active permit categories, work boundaries, and permit validity framework for this project.'),
    ('hazard-identification', 'Hazard Identification and Control', 60, 'Defines hazard identification methods, energy sources, prerequisite controls, and linked safety systems.'),
    ('authorisation-issue', 'Permit Preparation, Authorisation and Issue', 70, 'Describes the lifecycle of permit initiation, review, acceptance, and supporting evidence.'),
    ('site-control-display', 'Site Control, Display and Access', 80, 'Defines how permits are displayed, work areas are demarcated, and access is controlled.'),
    ('monitoring-validity-change', 'Monitoring, Validity and Change', 90, 'Defines permit monitoring frequency, suspension triggers, and reinstatement controls.'),
    ('closure-handover', 'Permit Closure and Shift Handover', 100, 'Defines work completion checks, permit close-out, and shift transfer requirements.'),
    ('non-standard-scenarios', 'Non-Standard and High-Risk Scenarios', 110, 'Defines concurrent operations, contractor interface management, and escalation controls.'),
    ('training-competency', 'Training, Competency and Records', 120, 'Defines training, competency, record retention, and related implementation controls.'),
    ('assurance', 'Assurance', 130, 'Defines assurance activities, review frequencies, and compliance reporting requirements.'),
    ('references', 'References', 140, 'Lists jurisdictional, project, and supporting documents referenced by the procedure.'),
    ('change-log', 'Change Log', 150, 'Records project-specific departures from the base procedure and the safety-equivalent alternatives adopted.')
),
inserted_sections as (
  insert into docbuilder.document_sections (
    document_type_version_id,
    key,
    title,
    order_index,
    objective,
    generation_mode,
    is_required,
    allow_user_edit,
    metadata
  )
  select
    pv.id,
    ss.section_key,
    ss.title,
    ss.order_index,
    ss.objective,
    'rewrite',
    true,
    true,
    jsonb_build_object('seed_source', 'claude_questionnaire_block')
  from permit_version pv
  cross join section_seed ss
  on conflict (document_type_version_id, key) do update
  set
    title = excluded.title,
    order_index = excluded.order_index,
    objective = excluded.objective,
    metadata = excluded.metadata,
    updated_at = now()
  returning id, key
),
group_seed(group_key, title, description, order_index, feeds) as (
  values
    ('A', 'Project and Organisational Context', 'Feeds cover page, scope, and project applicability content.', 10, 'Cover page; Scope (§2); Project Applicability (§3)'),
    ('B', 'Roles and Responsibilities', 'Feeds the roles and responsibilities table and role-specific text.', 20, 'Roles & Responsibilities table (§4)'),
    ('C', 'Permit Framework and Types', 'Feeds the permit framework, permit register, and permit boundary content.', 30, 'PTW Framework (§5)'),
    ('D', 'Hazard Identification and Control', 'Feeds hazard identification, energy isolation, and control interaction content.', 40, 'Hazard identification and controls (§6)'),
    ('E', 'Permit Preparation, Authorisation and Issue', 'Feeds permit workflow, review, authorisation, and issue requirements.', 50, 'Preparation and issue (§7)'),
    ('F', 'Site Control, Display and Access', 'Feeds display, area control, interface management, and emergency control.', 60, 'Site control and access (§8)'),
    ('G', 'Monitoring, Validity and Change', 'Feeds permit validity, monitoring, suspension, and reinstatement.', 70, 'Permit validity and suspension (§9)'),
    ('H', 'Permit Closure and Shift Handover', 'Feeds work completion, close-out, and handover requirements.', 80, 'Close-out and handover (§10)'),
    ('I', 'Non-Standard and High-Risk Scenarios', 'Feeds SIMOPS, contractor interfaces, and escalation pathways.', 90, 'Non-standard scenarios (§11)'),
    ('J', 'Training, Competency and Records', 'Feeds training, competency, retention, and assurance-related text.', 100, 'Training (§13), Records (§14), Assurance (§15)'),
    ('K', 'Document Control and References', 'Feeds references, change log, cover page approvals, and document control metadata.', 110, 'Project Applicability (§3); References (§16); Change Log (§17); Cover page')
),
inserted_groups as (
  insert into docbuilder.document_question_groups (
    document_type_version_id,
    key,
    title,
    description,
    order_index
  )
  select
    pv.id,
    gs.group_key,
    gs.title,
    gs.description || ' Feeds: ' || gs.feeds,
    gs.order_index
  from permit_version pv
  cross join group_seed gs
  on conflict (document_type_version_id, key) do update
  set
    title = excluded.title,
    description = excluded.description,
    order_index = excluded.order_index,
    updated_at = now()
  returning id, key
)
select null where false;

with permit_group as (
  select dqg.id, dqg.key
  from docbuilder.document_question_groups dqg
  join docbuilder.document_type_versions dv on dv.id = dqg.document_type_version_id
  join docbuilder.document_types dt on dt.id = dv.document_type_id
  where dt.slug = 'permit-to-work-procedure'
    and dv.version_no = 1
),
question_seed(group_key, question_key, label, help_text, question_type, order_index, metadata) as (
  values
    ('A','A1','What is the full legal name of the organisation that will own and implement this procedure?','Replaces the placeholder "Company" throughout the document with the correct entity name and is used on the cover page, in the Purpose, Scope, and throughout all procedural references.','short_text',10,jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('A','A2','What is the project name, and where is the project located? Provide the country, region or province, and the name of the specific site or mine.','Populates the Project Applicability table and cover page. The country determines which regulatory references apply across the entire document.','long_text',20,jsonb_build_object('output_types', jsonb_build_array('document_text','table'),'target_tables', jsonb_build_array('project_applicability'))),
    ('A','A3','What type of project is this, and at what stage is it currently? For example: new construction, expansion of an existing operation, active production, care and maintenance, or decommissioning and site closure.','Determines which work activities are in scope, the nature of interface risks, and the appropriate permit types for the framework section.','long_text',30,jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('A','A4','Which country''s legislation and workplace safety regulations govern this project? If the project spans more than one jurisdiction, list each country and the specific region or state where relevant.','Drives all regulatory references in the Purpose, Scope, and References table.','long_text',40,jsonb_build_object('output_types', jsonb_build_array('document_text','table'),'target_tables', jsonb_build_array('references'))),
    ('A','A5','What is the name of the government body responsible for enforcing workplace health and safety in this jurisdiction? Provide its full name and any abbreviation commonly used on site. If multiple bodies apply, list each and their area of responsibility.','Anchors the procedure to enforceable legal obligations using the local regulator names rather than assumed Australian terminology.','long_text',50,jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('A','A6','List the specific laws, regulations, decrees, or codes of practice that this procedure must comply with. Include the full title and year of each document. If your project operates under a national framework with additional local or regional obligations, include both levels.','Populates the References table and ensures the procedure aligns to the enforceable standards in the country of operation.','long_text',60,jsonb_build_object('output_types', jsonb_build_array('table'),'target_tables', jsonb_build_array('references'))),
    ('A','A7','Who will this procedure apply to — workers directly employed by your organisation, workers engaged through third-party contractors, or both? Describe the relationship: is your organisation directing all work on site, or are there independent contractors managing their own work teams?','Shapes the Scope and all multi-party language in the procedure while avoiding jurisdiction-specific legal designations.','long_text',70,jsonb_build_object('output_types', jsonb_build_array('document_text'))),

    ('B','B1','List every role title that exists on this project. For each role, provide: (1) the exact job title as used on this project, (2) whether the role belongs to your organisation or to a contractor, and (3) a brief description of what that person does day-to-day in relation to work authorisation and supervision.','The Roles & Responsibilities table keeps its existing three-column, vertically-merged structure. Only the role title text and activity description text change; everything else is preserved.','long_text',10,jsonb_build_object('output_types', jsonb_build_array('table'),'preserve_structure', true,'table_shape', jsonb_build_object('columns', jsonb_build_array('Role / Team Title','Activity Description','Section'),'role_title_vertical_span', true))),
    ('B','B2','Which role on this project is responsible for formally authorising and issuing permits? Is this a dedicated full-time position, or does an existing role such as a site supervisor or area superintendent carry this responsibility in addition to their other duties?','Names the actual role used on this project rather than using a generic descriptor and shapes the corresponding responsibility statements.','long_text',20,jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('B','B3','Is there a separate senior oversight role responsible for coordinating multiple concurrent permits during large-scale or high-complexity work — such as major shutdowns, simultaneous operations, or multi-team work fronts? If yes, what is this role called on your project?','Changes whether the Authorised Permit Officer function is separate from the Permit Issuer on this project.','long_text',30,jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('B','B4','Where contractors are involved, who has the authority to issue permits within a contractor''s work area — a representative from your organisation, the contractor''s own senior supervisor, or does this depend on the nature of the work? Describe how this authority is assigned and communicated.','Allows authority assignment language to reflect the actual multi-contractor arrangement on the project.','long_text',40,jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('B','B5','What is the health, safety, environment and community (HSEC) function called on this project? How many dedicated HSEC personnel are assigned to this project, and what are their role titles?','Replaces the base document''s generic HSESC role group with the actual local function name and role titles.','long_text',50,jsonb_build_object('output_types', jsonb_build_array('document_text'))),

    ('C','C1','Which high-risk work activities will take place on this project? Select all that apply: working at height, confined space entry, hot work, electrical work, crane and lifting operations, excavation and ground disturbance, isolation of hazardous energy, work in or near water, work near a radiation source. List any additional high-risk activities specific to your project that are not included here.','Determines which permit types are active for this project and which are not applicable.','multi_select',10,jsonb_build_object('output_types', jsonb_build_array('document_text','table'),'target_tables', jsonb_build_array('permit_types_register'))),
    ('C','C2','Does this project use a digital permit management system, a physical paper-based system, or a combination of both? If a digital system is used, what is the name of the platform or software?','Changes the procedural language for permit display, status visibility, emergency control, and record retention from generic principles to system-specific steps.','single_select',20,jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('C','C3','How does your project track and display the status of all active permits across the site — for example, a physical permit board at a central location, an electronic dashboard, a combination of both, or another method? Where is it located, and who is responsible for keeping it current?','Describes the actual status visibility system in use and the responsible role.','long_text',30,'{"output_types":["document_text","diagram"],"diagram_type":"system_schematic"}'::jsonb),
    ('C','C4','What is the maximum duration a permit remains valid on this project? Does it expire at the end of each work shift, after a fixed number of hours, or at another defined time? Are there specific permit types that have a different or shorter validity period?','States the project''s actual shift length and default validity rule rather than leaving this to interpretation.','long_text',40,jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('C','C5','Are there defined work zones or restricted areas on this project — for example, active plant areas, exclusion zones around equipment, areas requiring specialist access, or zones with atmospheric or ground hazards? If yes, describe each zone type and how it is physically marked out on site.','Lets the procedure reference actual demarcation materials and colour coding used on the project.','long_text',50,'{"output_types":["document_text","diagram"],"diagram_type":"site_zone_key"}'::jsonb),

    ('D','D1','Which types of hazardous energy are present on this project? List all that apply: electrical (low voltage), electrical (high voltage), mechanical moving parts, hydraulic systems, pneumatic systems, process chemicals, thermal sources, gravitational energy from elevated loads or structures, stored or residual pressure, and any others specific to your operation.','Allows the procedure to identify the specific energy types present and remove those that are not.','multi_select',10,jsonb_build_object('output_types', jsonb_build_array('structured_list'))),
    ('D','D2','Does your project have a formal procedure for isolating hazardous energy before work begins — commonly known as a lockout/tagout or energy isolation procedure? If yes, what is it called and what is its document reference? Describe how it connects to the permit: does isolation need to be completed and verified before a permit is issued, or do the two processes run in parallel?','Names the actual energy isolation document and describes the sequence of interaction with the permit process.','long_text',20,'{"output_types":["document_text","flowchart"],"diagram_type":"ptw_energy_isolation_interaction"}'::jsonb),
    ('D','D3','What tool or method does your project use to assess risk before a permit is issued for high-risk work? For example: a job hazard analysis, task risk assessment, safe work method statement, or a site-specific form. What is it called on your project, what is its document reference, and who is responsible for completing it?','Names the specific pre-permit risk assessment tool and its owner.','long_text',30,jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('D','D4','What framework does your project use to select and apply controls for identified hazards — for example, a hierarchy of controls from elimination through to personal protective equipment? Who is responsible for confirming that the required controls are in place before a permit is authorised?','Makes the control framework and sign-off responsibility explicit for the project.','long_text',40,'{"output_types":["document_text","diagram"],"diagram_type":"control_hierarchy"}'::jsonb),
    ('D','D5','Are there other formal safety control documents or systems on this project that must be in place before or alongside a permit — for example, a confined space entry form, a hot work checklist, a lifting management plan, an electrical isolation register, or an excavation approval? For each one, state what it is called, its document reference, and whether it must be completed before the permit is issued or managed at the same time.','Allows the procedure to define which documents are prerequisites and which are concurrent controls.','long_text',50,jsonb_build_object('output_types', jsonb_build_array('table'),'target_tables', jsonb_build_array('control_system_interaction_matrix')))
)
insert into docbuilder.document_questions (
  group_id,
  key,
  label,
  help_text,
  question_type,
  is_required,
  order_index,
  metadata
)
select
  pg.id,
  qs.question_key,
  qs.label,
  qs.help_text,
  qs.question_type,
  true,
  qs.order_index,
  qs.metadata
from permit_group pg
join question_seed qs on qs.group_key = pg.key
on conflict (group_id, key) do update
set
  label = excluded.label,
  help_text = excluded.help_text,
  question_type = excluded.question_type,
  is_required = excluded.is_required,
  order_index = excluded.order_index,
  metadata = excluded.metadata,
  updated_at = now();

with permit_group as (
  select dqg.id, dqg.key
  from docbuilder.document_question_groups dqg
  join docbuilder.document_type_versions dv on dv.id = dqg.document_type_version_id
  join docbuilder.document_types dt on dt.id = dv.document_type_id
  where dt.slug = 'permit-to-work-procedure'
    and dv.version_no = 1
),
question_seed(group_key, question_key, label, help_text, question_type, order_index, metadata) as (
  values
    ('E','E1','Describe the step-by-step process for how a permit is initiated and issued on your project — from the moment a supervisor or work planner identifies that a permit is needed, through to the point where work is authorised to start. Name the roles involved at each step and describe what they physically do.','This is the single most important workflow question for converting the authorisation section from what to how.', 'long_text', 10, jsonb_build_object('output_types', jsonb_build_array('document_text','flowchart'),'diagram_type','full_permit_lifecycle')),
    ('E','E2','How far in advance must a permit application be submitted before the planned start of work? Is there a different minimum lead time for certain types of high-risk work — for example, confined space entry, electrical high-voltage work, or work requiring specialist equipment?','Adds timing rules to prevent last-minute permit pressure.', 'long_text', 20, jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('E','E3','What supporting documents must be attached to or referenced on a permit application? For each permit type active on your project, list what must accompany it — for example, a risk assessment, an isolation plan, a lifting plan, a sketch or drawing of the work area, an atmospheric test result.','Enables a permit type-specific supporting documents table to be built into the issue section.', 'long_text', 30, jsonb_build_object('output_types', jsonb_build_array('table'),'target_tables', jsonb_build_array('permit_supporting_documents'))),
    ('E','E4','How is permit acceptance confirmed on your project — by verbal confirmation with a physical signature on the permit, a digital sign-off in the permit system, or another method? Who from the work team must acknowledge the permit before work begins — the supervisor only, or all workers?','Describes the actual acceptance mechanism used on the project.', 'long_text', 40, jsonb_build_object('output_types', jsonb_build_array('document_text'))),

    ('F','F1','How is the active permit physically displayed at the work location? For example: a printed copy placed in a permit box attached to the barricade, a document displayed on a tablet or device at the access point, a copy posted at a designated site notice board. Describe what the display looks like and where it is positioned relative to the work area.','Workers and auditors need to know exactly what to look for when they arrive at a work area.', 'long_text', 10, '{"output_types":["document_text","image"],"image_type":"permit_display_example"}'::jsonb),
    ('F','F2','Are permit documents required in more than one language on this project? If yes, which languages are needed, and who is responsible for ensuring that translated versions are accurate, current, and available at the worksite?','Lets the procedure state the actual language requirements for the workforce on the project.', 'long_text', 20, jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('F','F3','What physical demarcation materials and methods are used to mark out permit work areas on this project? For example: coloured barrier tape with a defined colour code, temporary fencing, hard barricading, warning signs with specific wording, cones or witches hats. Is there a project standard or site rule that defines these materials?','The procedure needs to describe the actual demarcation materials and colour coding convention used on site.', 'long_text', 30, jsonb_build_object('output_types', jsonb_build_array('document_text','table'),'target_tables', jsonb_build_array('demarcation_types_standards'))),
    ('F','F4','How is access to an active permit area controlled on your project? For example: a physical gate or barrier with a lock, a sign-in register at the access point, a requirement for a pre-entry briefing from the permit holder, or escort by an authorised person. Who is authorised to grant access, and how is unauthorised access detected and managed?','Describes the specific mechanism for managing entry to a permit area on this project.', 'long_text', 40, jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('F','F5','In an emergency requiring all work to stop immediately, who has the authority to suspend all active permits on site? What is the communication method used to alert all affected personnel — for example, a siren, radio broadcast, a public address system, or a warden notification chain? Describe the sequence of steps from the moment an emergency is declared to all work being stopped.','The procedure must name the alert system, communication chain, and responsible role so it can be followed under pressure.', 'long_text', 50, '{"output_types":["document_text","flowchart"],"diagram_type":"emergency_permit_suspension"}'::jsonb),

    ('G','G1','How often must the person holding the permit physically check that all permit conditions and controls remain in place during active work? State a specific interval — for example, every two hours, at each break, or continuously for certain permit types. Does the monitoring frequency change for higher-risk permit types?','Without a specific frequency, monitoring remains a stated requirement rather than a practical one.', 'long_text', 10, jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('G','G2','Describe the site conditions or events that would require work to stop immediately and the permit to be suspended. Consider conditions specific to your project such as: weather thresholds (wind, lightning, heavy rain), unexpected ground conditions, equipment failure, unplanned proximity of other work, discovery of an unidentified service or hazard, a change in the number or composition of the work party.','A project-specific list ensures workers can identify the actual conditions on their site that require them to stop.', 'long_text', 20, jsonb_build_object('output_types', jsonb_build_array('structured_list'))),
    ('G','G3','Once a permit has been suspended, what must happen before work can resume? Describe the steps in sequence: who reassesses the situation, what documentation is required, who authorises reinstatement, and how is the reinstated permit communicated back to the work team?','The reinstatement pathway needs to be described step by step so workers understand what happens after they stop work and what they need to do to restart.', 'long_text', 30, '{"output_types":["document_text","flowchart"],"diagram_type":"permit_reinstatement"}'::jsonb),

    ('H','H1','Describe the step-by-step process for closing a permit once work is finished. Who inspects the work area to confirm it is safe, who records that area restoration is complete, and how is the permit formally cancelled in your system? What physical or digital action marks the permit as closed?','A defined close-out sequence and checklist makes this section directly usable in the field.', 'long_text', 10, '{"output_types":["document_text","table"],"target_tables":["permit_closeout_checklist"]}'::jsonb),
    ('H','H2','What are the working shift patterns on this project? For example: 10-hour day shift and 10-hour night shift, 12-hour rotating shifts, or standard 8-hour shifts. How far before the end of a shift must the permit handover process begin to ensure it can be completed properly?','The actual shift pattern determines the default permit validity window and the handover timeline that must be built into the procedure.', 'long_text', 20, jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('H','H3','How is shift handover for active permits conducted on your project — a face-to-face review at the worksite between outgoing and incoming supervisors, a written handover log completed by the outgoing permit holder, a transfer process within the digital permit system, or a combination? Who from the incoming shift must be present, and what confirmation is recorded?','Face-to-face handover and electronic transfer involve very different steps, and the procedure must describe the one that applies.', 'long_text', 30, jsonb_build_object('output_types', jsonb_build_array('document_text'))),

    ('I','I1','Are situations expected on this project where multiple different work activities will occur at the same time within the same area or in areas that interact with each other? If yes, describe two or three typical examples from this project. Who has the authority to approve these concurrent operations, and what documents or plans are required before they can proceed?','A project with genuine concurrent work scenarios needs named approval authority and specific coordination mechanisms.', 'long_text', 10, '{"output_types":["document_text","table"],"target_tables":["concurrent_operations_register"]}'::jsonb),
    ('I','I2','Where multiple contractors are working on site simultaneously, how is permit authority managed? Is there a single permit authority for the whole site, or does each work package or contractor area have its own? How are permit conflicts between different work groups identified and resolved before work begins?','In multi-contractor environments this requires a coordination mechanism such as a shared permit log or area authority matrix.', 'long_text', 20, jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('I','I3','Describe the escalation path for a safety concern raised in connection with a permit that cannot be resolved at the work site level. List the roles in sequence from the person who raises the issue through to the most senior authority on the project who can make a final decision. At what level in that chain can work be permanently stopped?','The AI should generate this as a sequential escalation flowchart using the named project roles from this answer.', 'long_text', 30, '{"output_types":["flowchart"],"diagram_type":"safety_issue_escalation"}'::jsonb),

    ('J','J1','What training or induction must a worker complete before they are permitted to participate in or supervise work under a permit on this project? Is the training requirement the same for all workers, or does it differ by role — for example, with additional requirements for permit issuers, supervisors, or workers on specific permit types?','The PTW procedure itself needs at minimum a summary of role-based training requirements so supervisors know what to verify before issuing or accepting a permit.', 'long_text', 10, '{"output_types":["table"],"target_tables":["role_based_training_requirements"]}'::jsonb),
    ('J','J2','What is the minimum competency or qualification required for the role that issues and authorises permits on this project? For example: a specific formal qualification, a minimum number of years of relevant experience, completion of a company-endorsed assessment, or an industry certification recognised in the country of operation.','This gap is critical for implementation, particularly in jurisdictions where permit issuer competency is a legal requirement.', 'long_text', 20, jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('J','J3','How long must completed permit records be retained on this project, and where are they stored — in a physical archive, a document management system, or the permit platform itself? Who is responsible for managing this? Does the retention period differ between permit types or between countries of operation?','The PTW procedure needs a practical retention statement that can be followed without cross-referencing another document.', 'long_text', 30, jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('J','J4','What assurance activities are planned for the permit system on this project — for example, periodic permit audits by HSEC, field verification checks by supervision, monthly permit compliance reporting, or scheduled external reviews? State who conducts each activity and at what frequency.','The procedure needs the project''s actual assurance schedule, named responsible roles, and a reporting pathway.', 'long_text', 40, '{"output_types":["document_text","table"],"target_tables":["assurance_schedule"]}'::jsonb),

    ('K','K1','What document number should be assigned to this procedure under your project''s document control system? What revision number does it start at, and what is the effective date?','Populates the document number and revision fields on the cover page and in the document header.', 'long_text', 10, jsonb_build_object('output_types', jsonb_build_array('document_text'))),
    ('K','K2','Who will originate, review, and approve this procedure on your project? For each person, provide their full name, their role title on the project, and whether they are employed by your organisation or engaged as a contractor.','Populates the approval block table on the cover page.', 'long_text', 20, '{"output_types":["table"],"target_tables":["cover_page_approval_block"]}'::jsonb),
    ('K','K3','Are there any requirements in the base procedure that cannot be applied on your project as written? For each one, describe the original requirement, explain why it cannot be implemented on this project, and propose an alternative that achieves the same safety outcome.','Directly populates the Change Log and the Project Applicability section.', 'long_text', 30, '{"output_types":["table"],"target_tables":["change_log"]}'::jsonb),
    ('K','K4','Are there project-specific documents that should be added to the References section — for example, a project HSEC management plan, an emergency response plan, a risk assessment template, a contractor safety management framework, or any locally required safety standards that are specific to the country of operation?','Allows the project-specific implementation to add its own reference register so the procedure is self-contained.', 'long_text', 40, jsonb_build_object('output_types', jsonb_build_array('table'),'target_tables', jsonb_build_array('references')))
)
insert into docbuilder.document_questions (
  group_id,
  key,
  label,
  help_text,
  question_type,
  is_required,
  order_index,
  metadata
)
select
  pg.id,
  qs.question_key,
  qs.label,
  qs.help_text,
  qs.question_type,
  true,
  qs.order_index,
  qs.metadata
from permit_group pg
join question_seed qs on qs.group_key = pg.key
on conflict (group_id, key) do update
set
  label = excluded.label,
  help_text = excluded.help_text,
  question_type = excluded.question_type,
  is_required = excluded.is_required,
  order_index = excluded.order_index,
  metadata = excluded.metadata,
  updated_at = now();

with permit_sections as (
  select ds.id, ds.key
  from docbuilder.document_sections ds
  join docbuilder.document_type_versions dv on dv.id = ds.document_type_version_id
  join docbuilder.document_types dt on dt.id = dv.document_type_id
  where dt.slug = 'permit-to-work-procedure'
    and dv.version_no = 1
),
permit_questions as (
  select dq.id, dq.key
  from docbuilder.document_questions dq
  join docbuilder.document_question_groups dqg on dqg.id = dq.group_id
  join docbuilder.document_type_versions dv on dv.id = dqg.document_type_version_id
  join docbuilder.document_types dt on dt.id = dv.document_type_id
  where dt.slug = 'permit-to-work-procedure'
    and dv.version_no = 1
),
mapping_seed(question_key, section_key, influence_type, weight) as (
  values
    ('A1','cover-page','primary',1.00), ('A1','scope','primary',1.00),
    ('A2','cover-page','primary',1.00), ('A2','project-applicability','primary',1.00), ('A2','references','secondary',0.50),
    ('A3','project-applicability','primary',1.00), ('A3','permit-framework','secondary',0.70),
    ('A4','scope','secondary',0.60), ('A4','project-applicability','primary',1.00), ('A4','references','primary',1.00),
    ('A5','scope','secondary',0.60), ('A5','references','secondary',0.70),
    ('A6','references','primary',1.00),
    ('A7','scope','primary',1.00), ('A7','roles-responsibilities','secondary',0.60),

    ('B1','roles-responsibilities','primary',1.00),
    ('B2','roles-responsibilities','primary',1.00), ('B2','authorisation-issue','secondary',0.70),
    ('B3','roles-responsibilities','secondary',0.70), ('B3','non-standard-scenarios','secondary',0.60),
    ('B4','roles-responsibilities','secondary',0.60), ('B4','non-standard-scenarios','primary',1.00),
    ('B5','roles-responsibilities','primary',1.00), ('B5','assurance','secondary',0.50),

    ('C1','permit-framework','primary',1.00),
    ('C2','permit-framework','secondary',0.70), ('C2','site-control-display','secondary',0.70), ('C2','training-competency','secondary',0.40),
    ('C3','permit-framework','secondary',0.50), ('C3','site-control-display','primary',1.00),
    ('C4','permit-framework','primary',1.00), ('C4','monitoring-validity-change','secondary',0.70),
    ('C5','permit-framework','secondary',0.70), ('C5','site-control-display','primary',1.00),

    ('D1','hazard-identification','primary',1.00),
    ('D2','hazard-identification','primary',1.00), ('D2','authorisation-issue','secondary',0.60),
    ('D3','hazard-identification','primary',1.00), ('D3','authorisation-issue','secondary',0.60),
    ('D4','hazard-identification','primary',1.00),
    ('D5','hazard-identification','primary',1.00), ('D5','authorisation-issue','secondary',0.50),

    ('E1','authorisation-issue','primary',1.00),
    ('E2','authorisation-issue','primary',1.00),
    ('E3','authorisation-issue','primary',1.00),
    ('E4','authorisation-issue','primary',1.00),

    ('F1','site-control-display','primary',1.00),
    ('F2','site-control-display','primary',1.00),
    ('F3','site-control-display','primary',1.00),
    ('F4','site-control-display','primary',1.00),
    ('F5','site-control-display','primary',1.00), ('F5','non-standard-scenarios','secondary',0.50),

    ('G1','monitoring-validity-change','primary',1.00),
    ('G2','monitoring-validity-change','primary',1.00),
    ('G3','monitoring-validity-change','primary',1.00),

    ('H1','closure-handover','primary',1.00),
    ('H2','closure-handover','primary',1.00), ('H2','permit-framework','secondary',0.40),
    ('H3','closure-handover','primary',1.00),

    ('I1','non-standard-scenarios','primary',1.00),
    ('I2','non-standard-scenarios','primary',1.00), ('I2','roles-responsibilities','secondary',0.40),
    ('I3','non-standard-scenarios','primary',1.00),

    ('J1','training-competency','primary',1.00),
    ('J2','training-competency','primary',1.00), ('J2','roles-responsibilities','secondary',0.50),
    ('J3','training-competency','secondary',0.50), ('J3','references','secondary',0.30),
    ('J4','assurance','primary',1.00), ('J4','training-competency','secondary',0.40),

    ('K1','cover-page','primary',1.00),
    ('K2','cover-page','primary',1.00),
    ('K3','project-applicability','secondary',0.60), ('K3','change-log','primary',1.00),
    ('K4','references','primary',1.00)
)
insert into docbuilder.document_question_section_map (
  question_id,
  section_id,
  influence_type,
  weight
)
select
  pq.id,
  ps.id,
  ms.influence_type,
  ms.weight
from mapping_seed ms
join permit_questions pq on pq.key = ms.question_key
join permit_sections ps on ps.key = ms.section_key
on conflict (question_id, section_id) do update
set
  influence_type = excluded.influence_type,
  weight = excluded.weight;

commit;

