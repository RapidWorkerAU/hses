export const dynamic = "force-dynamic";

import { createStructuredOpenAiResponse } from "@/lib/ai/openai";
import { getOwnedSmsMap, getSmsAuth, sanitizeText } from "../../../_utils";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type GuidedOption = {
  id: string;
  label: string;
  description?: string;
};

type GuidedQuestion = {
  group: string;
  key: string;
  label: string;
  prompt: string;
  selectionMode: "single" | "multi";
  allowOther: boolean;
  otherPrompt: string;
  options: GuidedOption[];
};

type QuestionDefinition = Omit<GuidedQuestion, "group">;

type TailoredQuestionPayload = {
  prompt: string;
  options: Array<{
    label: string;
    description: string;
  }>;
};

type GapPayload = {
  gaps: Array<{
    qs_group: string;
    gap_description: string;
    follow_up_question: string;
  }>;
};

const groupOrder: Record<string, number> = {
  QS2: 2,
  QS3: 3,
  QS4: 4,
  QS5: 5,
  QS6: 6,
  QS7: 7,
  preferences: 8,
};

const groupDetails: Record<string, { label: string; completeLabel: string }> = {
  QS2: { label: "Activities", completeLabel: "Activities captured" },
  QS3: { label: "People", completeLabel: "People and roles captured" },
  QS4: { label: "Hazards", completeLabel: "Hazards captured" },
  QS5: { label: "Controls", completeLabel: "Controls captured" },
  QS6: { label: "History", completeLabel: "Incident history captured" },
  QS7: { label: "Future", completeLabel: "Future plans captured" },
  preferences: { label: "Preferences", completeLabel: "Preferences captured" },
};

const questionBank: Record<string, QuestionDefinition[]> = {
  QS2: [
    {
      key: "work_activity_types",
      label: "Main work activities",
      prompt: "Which of these best describe the work the business does day to day?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other main work activities or tasks.",
      options: [
        { id: "routine_operations", label: "Routine operations", description: "Regular day-to-day work." },
        { id: "site_or_field_work", label: "Site or field work", description: "Work away from a fixed office." },
        { id: "maintenance", label: "Maintenance", description: "Repairs, servicing, inspections, or upkeep." },
        { id: "plant_equipment", label: "Plant or equipment operation", description: "Using vehicles, machinery, tools, or equipment." },
        { id: "deliveries_logistics", label: "Deliveries or logistics", description: "Transport, loading, unloading, or warehousing." },
        { id: "customer_facing", label: "Customer or client-facing work", description: "Work around clients, visitors, or the public." },
      ],
    },
    {
      key: "higher_risk_tasks",
      label: "Higher-risk tasks",
      prompt: "Which tasks need the most planning, supervision, or controls?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Describe any other task that needs extra planning or control.",
      options: [
        { id: "working_at_heights", label: "Working at heights", description: "Ladders, roofs, platforms, or elevated work." },
        { id: "mobile_plant", label: "Mobile plant or vehicles", description: "Forklifts, trucks, utes, cranes, or moving equipment." },
        { id: "manual_handling", label: "Manual handling", description: "Lifting, carrying, awkward postures, or repetitive work." },
        { id: "hazardous_substances", label: "Hazardous substances", description: "Chemicals, fumes, dusts, fuels, or gases." },
        { id: "electrical", label: "Electrical work or energy sources", description: "Electrical systems, isolation, or stored energy." },
        { id: "contractor_work", label: "Contractor work", description: "Work done by contractors or subcontractors." },
      ],
    },
    {
      key: "work_locations",
      label: "Work locations",
      prompt: "Where does the work usually take place?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other work locations.",
      options: [
        { id: "office", label: "Office", description: "Office or administration environment." },
        { id: "workshop", label: "Workshop", description: "Workshop, yard, depot, or maintenance area." },
        { id: "client_sites", label: "Client sites", description: "Customer, client, or third-party locations." },
        { id: "construction_or_project_sites", label: "Construction or project sites", description: "Temporary project or site-based work." },
        { id: "vehicles_or_road", label: "Vehicles or road", description: "Driving, transport, or mobile work." },
        { id: "public_areas", label: "Public areas", description: "Places where members of the public may be present." },
      ],
    },
  ],
  QS3: [
    {
      key: "roles_doing_work",
      label: "Roles doing the work",
      prompt: "Which roles directly carry out the work?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other roles that directly carry out the work.",
      options: [
        { id: "employees", label: "Employees", description: "Direct workers doing the task." },
        { id: "field_crews", label: "Field crews", description: "People carrying out site or field work." },
        { id: "plant_operators", label: "Plant or equipment operators", description: "People operating vehicles, plant, tools, or equipment." },
        { id: "maintenance_workers", label: "Maintenance workers", description: "People doing repairs, servicing, or inspections." },
        { id: "contractors", label: "Contractors", description: "External workers or service providers doing the work." },
        { id: "admin_support", label: "Administration or support roles", description: "People supporting the work but not usually doing physical tasks." },
      ],
    },
    {
      key: "work_supervision",
      label: "Work supervision",
      prompt: "Who supervises the work day to day?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other role that supervises day-to-day work.",
      options: [
        { id: "team_leader", label: "Team leader", description: "Coordinates workers during the shift or task." },
        { id: "site_supervisor", label: "Site supervisor", description: "Supervises work at site or crew level." },
        { id: "operations_manager", label: "Operations manager", description: "Oversees day-to-day operational delivery." },
        { id: "project_manager", label: "Project manager", description: "Supervises project delivery and coordination." },
        { id: "contractor_supervisor", label: "Contractor supervisor", description: "Supervises contractor or subcontractor work." },
        { id: "self_supervised", label: "Workers self-supervise", description: "Workers mostly manage their own task flow." },
      ],
    },
    {
      key: "safety_compliance_accountability",
      label: "Safety compliance accountability",
      prompt: "Who has final accountability for meeting safety compliance obligations?",
      selectionMode: "single",
      allowOther: true,
      otherPrompt: "Describe who has final accountability for safety compliance.",
      options: [
        { id: "business_owner", label: "Business owner / director", description: "Final accountability for legal and business compliance." },
        { id: "ceo_general_manager", label: "CEO / general manager", description: "Senior accountable officer for compliance." },
        { id: "operations_manager", label: "Operations manager", description: "Accountable for compliance in operations." },
        { id: "site_or_project_manager", label: "Site / project manager", description: "Accountable for compliance at site or project level." },
        { id: "hse_manager", label: "HSE manager / advisor", description: "Owns compliance support, advice, and monitoring." },
        { id: "external_consultant", label: "External consultant", description: "Provides compliance advice but may not own accountability." },
      ],
    },
    {
      key: "safety_decision_makers",
      label: "Safety decision makers",
      prompt: "Who makes day-to-day safety decisions when work conditions change?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other role that makes day-to-day safety decisions.",
      options: [
        { id: "workers", label: "Workers", description: "Pause, stop, or adjust work when conditions change." },
        { id: "team_leader", label: "Team leader", description: "Makes immediate decisions for the crew or task." },
        { id: "site_supervisor", label: "Site supervisor", description: "Approves changes or controls at site level." },
        { id: "operations_manager", label: "Operations manager", description: "Makes operational safety decisions." },
        { id: "hse_advisor", label: "HSE advisor", description: "Advises on controls, risk, and compliance." },
        { id: "contractor_supervisor", label: "Contractor supervisor", description: "Makes decisions for contractor work." },
      ],
    },
    {
      key: "training_induction_needs",
      label: "Training and induction",
      prompt: "Who needs induction, training, licences, or competency checks?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other people who need training or competency checks.",
      options: [
        { id: "new_workers", label: "New workers", description: "Company induction and role-specific training." },
        { id: "contractors", label: "Contractors", description: "Contractor induction and verification." },
        { id: "supervisors", label: "Supervisors", description: "Leadership, inspections, and incident response." },
        { id: "plant_operators", label: "Plant or equipment operators", description: "Licences, VOCs, or authorisations." },
        { id: "emergency_roles", label: "Emergency roles", description: "Wardens, first aiders, or response roles." },
        { id: "visitors", label: "Visitors", description: "Visitor rules, escorts, or briefings." },
      ],
    },
  ],
  QS4: [
    {
      key: "hazard_categories",
      label: "Hazard categories",
      prompt: "Which hazard types are most relevant to this business?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other hazard types.",
      options: [
        { id: "manual_tasks", label: "Manual tasks", description: "Lifting, carrying, repetition, or awkward posture." },
        { id: "plant_equipment", label: "Plant and equipment", description: "Moving parts, vehicles, tools, or machinery." },
        { id: "slips_trips_falls", label: "Slips, trips, and falls", description: "Same-level falls or access hazards." },
        { id: "working_at_heights", label: "Working at heights", description: "Falls from ladders, platforms, roofs, or edges." },
        { id: "hazardous_substances", label: "Hazardous substances", description: "Chemicals, dusts, fumes, or gases." },
        { id: "psychosocial", label: "Psychosocial hazards", description: "Stress, fatigue, workload, violence, or bullying." },
      ],
    },
    {
      key: "exposed_people",
      label: "People exposed",
      prompt: "Who could be exposed to the main hazards?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other people who could be exposed.",
      options: [
        { id: "employees", label: "Employees", description: "Direct workers." },
        { id: "contractors", label: "Contractors", description: "Contractors or subcontractors." },
        { id: "visitors", label: "Visitors", description: "Visitors entering the workplace." },
        { id: "clients", label: "Clients / customers", description: "Clients, customers, or residents." },
        { id: "public", label: "Members of public", description: "Public users or people nearby." },
        { id: "young_or_new_workers", label: "New or vulnerable workers", description: "New, young, inexperienced, or lone workers." },
      ],
    },
    {
      key: "highest_priority_hazards",
      label: "Priority hazards",
      prompt: "Which hazards would you treat as the highest priority?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Describe any other high-priority hazard.",
      options: [
        { id: "serious_injury_potential", label: "Serious injury potential", description: "Could cause fatality or serious harm." },
        { id: "frequent_exposure", label: "Frequent exposure", description: "People are exposed often." },
        { id: "many_people_exposed", label: "Many people exposed", description: "Affects several workers or workgroups." },
        { id: "hard_to_control", label: "Hard to control", description: "Controls are complex or inconsistent." },
        { id: "regulatory_focus", label: "Regulatory focus area", description: "Likely to draw regulator attention." },
        { id: "uncertain", label: "Not sure yet", description: "Needs more review during map generation." },
      ],
    },
  ],
  QS5: [
    {
      key: "existing_controls",
      label: "Existing controls",
      prompt: "Which controls or safety measures are already in place?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other existing controls or measures.",
      options: [
        { id: "policies_procedures", label: "Policies or procedures", description: "Written rules, procedures, or SWMS." },
        { id: "risk_assessments", label: "Risk assessments", description: "Hazard registers, JHAs, or risk reviews." },
        { id: "training_inductions", label: "Training and inductions", description: "Induction, licences, VOCs, or toolbox talks." },
        { id: "inspections_checklists", label: "Inspections or checklists", description: "Workplace, equipment, or site checks." },
        { id: "ppe", label: "PPE", description: "Personal protective equipment requirements." },
        { id: "incident_reporting", label: "Incident reporting", description: "Reporting, investigation, or corrective actions." },
      ],
    },
    {
      key: "control_strength",
      label: "Control maturity",
      prompt: "How mature are the current safety controls?",
      selectionMode: "single",
      allowOther: true,
      otherPrompt: "Briefly describe the current level of control maturity.",
      options: [
        { id: "mostly_informal", label: "Mostly informal", description: "Controls exist but are not well documented." },
        { id: "some_documented", label: "Some documented", description: "Some procedures or forms exist." },
        { id: "well_established", label: "Well established", description: "Controls are documented and used regularly." },
        { id: "needs_review", label: "Needs review", description: "Controls exist but may be outdated or inconsistent." },
        { id: "not_sure", label: "Not sure", description: "Needs assessment during system build." },
      ],
    },
    {
      key: "documents_needed",
      label: "Documents needed",
      prompt: "Which document types are likely to be needed or improved?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other documents needed.",
      options: [
        { id: "safety_policy", label: "Safety policy", description: "Commitment and responsibilities." },
        { id: "risk_register", label: "Risk register", description: "Hazards, controls, and priorities." },
        { id: "safe_work_procedures", label: "Safe work procedures", description: "Task-specific safe work instructions." },
        { id: "training_matrix", label: "Training matrix", description: "Role training and competency requirements." },
        { id: "emergency_plan", label: "Emergency plan", description: "Emergency roles, contacts, and response." },
        { id: "inspection_forms", label: "Inspection forms", description: "Planned checks and records." },
      ],
    },
  ],
  QS6: [
    {
      key: "incident_history",
      label: "Incident history",
      prompt: "What incident history should shape this safety system?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other incident history or lessons learned.",
      options: [
        { id: "no_significant_history", label: "No significant history", description: "No known serious incidents or patterns." },
        { id: "injuries", label: "Injuries", description: "Recordable injuries or first aid cases." },
        { id: "near_misses", label: "Near misses", description: "Events that could have caused harm." },
        { id: "property_damage", label: "Property or equipment damage", description: "Damage events or asset loss." },
        { id: "regulator_attention", label: "Regulator attention", description: "Notices, inspections, or regulator contact." },
        { id: "recurring_issues", label: "Recurring issues", description: "Repeated hazards, complaints, or non-conformances." },
      ],
    },
    {
      key: "learning_themes",
      label: "Learning themes",
      prompt: "Which themes keep coming up from incidents, near misses, or observations?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other recurring themes.",
      options: [
        { id: "communication", label: "Communication", description: "Handover, consultation, or unclear instructions." },
        { id: "training", label: "Training or competency", description: "Skills, induction, licences, or supervision gaps." },
        { id: "planning", label: "Planning", description: "Work planning, risk review, or pre-start checks." },
        { id: "equipment", label: "Equipment condition", description: "Maintenance, guarding, defects, or suitability." },
        { id: "procedure_use", label: "Procedure use", description: "Procedures not followed or not practical." },
        { id: "fatigue_workload", label: "Fatigue or workload", description: "Hours, pressure, resourcing, or stress." },
      ],
    },
  ],
  QS7: [
    {
      key: "future_changes",
      label: "Future changes",
      prompt: "Which future changes should this system be designed to handle?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other future changes or plans.",
      options: [
        { id: "growth", label: "Business growth", description: "More workers, work volume, or complexity." },
        { id: "new_sites", label: "New sites or locations", description: "Additional workplaces or client sites." },
        { id: "new_work_types", label: "New work types", description: "New tasks, services, or project types." },
        { id: "new_equipment", label: "New equipment", description: "New plant, vehicles, tools, or technology." },
        { id: "more_contractors", label: "More contractor involvement", description: "More outsourced or subcontracted work." },
        { id: "certification_or_audit", label: "Certification or audit", description: "ISO 45001, client audits, or compliance reviews." },
      ],
    },
    {
      key: "system_priorities",
      label: "System priorities",
      prompt: "What should the finished system map prioritise?",
      selectionMode: "multi",
      allowOther: true,
      otherPrompt: "Add any other system priorities.",
      options: [
        { id: "simple_documents", label: "Simple practical documents", description: "Documents people can actually use." },
        { id: "clear_roles", label: "Clear roles and ownership", description: "Who does what and who owns each control." },
        { id: "hazard_control_focus", label: "Hazard-control focus", description: "Clear links between hazards and controls." },
        { id: "contractor_management", label: "Contractor management", description: "Better contractor onboarding and control." },
        { id: "audit_readiness", label: "Audit readiness", description: "Evidence, records, and review points." },
        { id: "growth_scalability", label: "Scalability", description: "A system that grows with the business." },
      ],
    },
  ],
  preferences: [
    {
      key: "language_style",
      label: "Language style",
      prompt: "What language style should the safety documents use?",
      selectionMode: "single",
      allowOther: false,
      otherPrompt: "",
      options: [
        { id: "plain", label: "Plain", description: "Simple language for everyday use." },
        { id: "technical", label: "Technical", description: "More detailed technical wording." },
        { id: "formal", label: "Formal", description: "Formal governance and audit wording." },
      ],
    },
    {
      key: "doc_format",
      label: "Document format",
      prompt: "How will people usually access the safety documents?",
      selectionMode: "single",
      allowOther: false,
      otherPrompt: "",
      options: [
        { id: "digital", label: "Digital", description: "Mostly online or screen-based." },
        { id: "print", label: "Print", description: "Mostly printed, posted, or physically issued." },
        { id: "both", label: "Both", description: "Needs to work digitally and in print." },
      ],
    },
    {
      key: "has_multiple_sites",
      label: "Multiple sites",
      prompt: "Does the system need to cover more than one site or location?",
      selectionMode: "single",
      allowOther: false,
      otherPrompt: "",
      options: [
        { id: "yes", label: "Yes", description: "The system should account for multiple sites or locations." },
        { id: "no", label: "No", description: "The system is mainly for one site or operating location." },
      ],
    },
    {
      key: "contractor_own_sms",
      label: "Contractor systems",
      prompt: "Do contractors usually work under their own safety management system?",
      selectionMode: "single",
      allowOther: true,
      otherPrompt: "Briefly describe how contractor safety systems are handled.",
      options: [
        { id: "yes", label: "Yes", description: "Contractors generally use their own safety systems." },
        { id: "no", label: "No", description: "Contractors generally work under this business's system." },
        { id: "mixed", label: "Mixed", description: "It depends on the contractor or work type." },
        { id: "not_sure", label: "Not sure", description: "This needs to be decided during system design." },
      ],
    },
  ],
};

const aiModel = "gpt-4o";

const trim = (value: string, maxLength: number) => {
  const text = value.replace(/\s+/g, " ").trim();
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() : text;
};

const toOptionId = (value: string) =>
  trim(value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""), 64) || "option";

const normalizeHistory = (value: unknown): ChatMessage[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry): ChatMessage | null => {
      if (!entry || typeof entry !== "object") return null;
      const role = (entry as { role?: unknown }).role;
      const content = (entry as { content?: unknown }).content;
      if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
      return { role, content: trim(content, 4000) };
    })
    .filter((entry): entry is ChatMessage => Boolean(entry))
    .slice(-30);
};

const buildCapturedContext = ({
  prefFlags,
  responses,
}: {
  prefFlags: Record<string, unknown> | null;
  responses: Array<Record<string, unknown>>;
}) => {
  const prefLines = prefFlags
    ? Object.entries(prefFlags)
        .filter(([key, value]) => !["id", "map_id", "created_at", "updated_at"].includes(key) && value !== null && value !== "")
        .map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    : [];

  const responseLines = responses.map((row) => {
    const key = typeof row.question_key === "string" ? row.question_key : "answer";
    const label = typeof row.question_label === "string" ? row.question_label : key;
    const value = typeof row.response_value === "string" ? row.response_value : "";
    return `- ${key} (${label}): ${value}`;
  });

  return [...prefLines, ...responseLines].join("\n") || "- No fixed context has been captured yet.";
};

const buildFallbackQuestion = (group: string, index: number): GuidedQuestion | null => {
  const definition = questionBank[group]?.[index];
  if (!definition) return null;
  return {
    group,
    ...definition,
  };
};

const buildGuidedQuestion = async ({
  group,
  index,
  context,
}: {
  group: string;
  index: number;
  context: string;
}): Promise<GuidedQuestion | null> => {
  const fallback = buildFallbackQuestion(group, index);
  if (!fallback) return null;

  try {
    const result = await createStructuredOpenAiResponse<TailoredQuestionPayload>({
      model: aiModel,
      systemPrompt:
        "You tailor answer options for guided safety management system intake questions. Return JSON only. Keep options concise, relevant, and practical. Do not combine multiple concepts in one option. Do not include an Other option; the UI adds Other separately.",
      userPrompt: JSON.stringify({
        captured_context: context,
        group,
        question_key: fallback.key,
        base_prompt: fallback.prompt,
        selection_mode: fallback.selectionMode,
        seed_options: fallback.options,
        instruction:
          "Return the base_prompt unchanged as prompt. Return 4 to 7 answer options that fit the business context. Prefer options from the seed list when suitable, but adapt labels and descriptions to the business context. Do not broaden, merge, or rewrite the question intent.",
      }),
      schema: {
        name: "sms_guided_question",
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["prompt", "options"],
          properties: {
            prompt: { type: "string" },
            options: {
              type: "array",
              minItems: 4,
              maxItems: 7,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["label", "description"],
                properties: {
                  label: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        strict: true,
      },
    });

    return {
      ...fallback,
      prompt: fallback.prompt,
      options: result.data.options.map((option) => ({
        id: toOptionId(option.label),
        label: trim(option.label, 80),
        description: trim(option.description, 140),
      })),
    };
  } catch {
    return fallback;
  }
};

const summariseGuidedAnswer = ({
  question,
  selectedOptions,
  otherText,
}: {
  question: GuidedQuestion;
  selectedOptions: string[];
  otherText: string;
}) => {
  const selectedLabels = selectedOptions
    .map((id) => question.options.find((option) => option.id === id)?.label)
    .filter((label): label is string => Boolean(label));
  const parts = [...selectedLabels];
  if (otherText) parts.push(`Other: ${otherText}`);
  return parts.join("; ");
};

const buildPrefFlagUpdate = ({
  question,
  selectedOptions,
}: {
  question: GuidedQuestion;
  selectedOptions: string[];
}) => {
  const firstValue = selectedOptions[0] ?? null;

  if (question.group !== "preferences" || !firstValue) return null;

  switch (question.key) {
    case "language_style":
      return ["plain", "technical", "formal"].includes(firstValue) ? { language_style: firstValue } : null;
    case "doc_format":
      return ["digital", "print", "both"].includes(firstValue) ? { doc_format: firstValue } : null;
    case "has_multiple_sites":
      if (firstValue === "yes") return { has_multiple_sites: true };
      if (firstValue === "no") return { has_multiple_sites: false };
      return null;
    case "contractor_own_sms":
      if (firstValue === "yes") return { contractor_own_sms: true };
      if (firstValue === "no") return { contractor_own_sms: false };
      return { contractor_own_sms: null };
    default:
      return null;
  }
};

const runGapAnalysis = async ({
  responses,
}: {
  responses: Array<Record<string, unknown>>;
}) => {
  const result = await createStructuredOpenAiResponse<GapPayload>({
    model: aiModel,
    systemPrompt:
      "You are reviewing safety management system intake data for completeness. Identify only meaningful gaps that would affect building the system map. Return JSON only.",
    userPrompt: JSON.stringify({ responses }),
    schema: {
      name: "sms_gap_analysis",
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["gaps"],
        properties: {
          gaps: {
            type: "array",
            maxItems: 10,
            items: {
              type: "object",
              additionalProperties: false,
              required: ["qs_group", "gap_description", "follow_up_question"],
              properties: {
                qs_group: { type: "string", enum: ["QS2", "QS3", "QS4", "QS5", "QS6", "QS7"] },
                gap_description: { type: "string" },
                follow_up_question: { type: "string" },
              },
            },
          },
        },
      },
      strict: true,
    },
  });

  return result.data.gaps.map((gap) => ({
    qs_group: gap.qs_group,
    gap_description: trim(gap.gap_description, 800),
    follow_up_question: trim(gap.follow_up_question, 400),
  }));
};

const parseSelectedOptions = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? trim(item, 80) : ""))
    .filter(Boolean)
    .slice(0, 12);
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ mapId: string }> }
) {
  const { mapId } = await params;
  const auth = await getSmsAuth(request);
  if (!auth.ok) return auth.response;

  let body: {
    requestQuestion?: unknown;
    selectedOptions?: unknown;
    otherSelected?: unknown;
    otherText?: unknown;
    advanceToGroup?: unknown;
    gapResponse?: unknown;
    completeGapAnalysis?: unknown;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { supabase, user } = auth;

  try {
    const map = await getOwnedSmsMap(supabase, mapId, user.id);
    if (!map) return Response.json({ error: "System map not found." }, { status: 404 });

    const [sessionResult, prefResult, responsesResult] = await Promise.all([
      supabase
        .schema("sms")
        .from("question_sessions")
        .select("id,current_qs_group,current_question_index,ai_conversation_history,gap_analysis_complete")
        .eq("map_id", map.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.schema("sms").from("pref_flags").select("*").eq("map_id", map.id).maybeSingle(),
      supabase
        .schema("sms")
        .from("responses")
        .select("qs_group,question_key,question_label,response_value,response_type,confidence")
        .eq("map_id", map.id)
        .order("created_at", { ascending: true }),
    ]);

    if (sessionResult.error || !sessionResult.data?.id) {
      throw new Error(sessionResult.error?.message || "Question session not found.");
    }
    if (prefResult.error) throw new Error(prefResult.error.message);
    if (responsesResult.error) throw new Error(responsesResult.error.message);

    const session = sessionResult.data;
    const currentGroup = typeof session.current_qs_group === "string" ? session.current_qs_group : "QS2";
    const currentIndex = Number.isInteger(session.current_question_index) ? session.current_question_index : 0;
    const previousHistory = normalizeHistory(session.ai_conversation_history);
    const responses = (responsesResult.data ?? []) as Array<Record<string, unknown>>;
    const context = buildCapturedContext({
      prefFlags: prefResult.data,
      responses,
    });
    const gapResponse = sanitizeText(body.gapResponse, 5000);
    const completeGapAnalysis = Boolean(body.completeGapAnalysis);

    if (currentGroup === "gap_analysis" && (gapResponse || completeGapAnalysis)) {
      if (gapResponse) {
        const { data: existingGapResponse, error: existingGapResponseError } = await supabase
          .schema("sms")
          .from("responses")
          .select("id")
          .eq("map_id", map.id)
          .eq("session_id", session.id)
          .eq("qs_group", "gap_analysis")
          .eq("question_key", "gap_analysis_follow_up")
          .limit(1)
          .maybeSingle();

        if (existingGapResponseError) throw new Error(existingGapResponseError.message);

        if (existingGapResponse?.id) {
          const { error: updateGapResponseError } = await supabase
            .schema("sms")
            .from("responses")
            .update({
              question_label: "Gap analysis follow-up answers",
              response_value: gapResponse,
              response_type: "ai_extracted",
              confidence: "confirmed",
            })
            .eq("id", existingGapResponse.id);
          if (updateGapResponseError) throw new Error(updateGapResponseError.message);
        } else {
          const { error: insertGapResponseError } = await supabase.schema("sms").from("responses").insert({
            map_id: map.id,
            session_id: session.id,
            qs_group: "gap_analysis",
            question_key: "gap_analysis_follow_up",
            question_label: "Gap analysis follow-up answers",
            response_value: gapResponse,
            response_type: "ai_extracted",
            confidence: "confirmed",
          });
          if (insertGapResponseError) throw new Error(insertGapResponseError.message);
        }
      }

      const { error: gapUpdateError } = await supabase
        .schema("sms")
        .from("gap_log")
        .update({
          resolved: true,
          resolution_response: gapResponse || "Completed without extra detail.",
        })
        .eq("map_id", map.id)
        .eq("session_id", session.id)
        .eq("resolved", false);
      if (gapUpdateError) throw new Error(gapUpdateError.message);

      const messageContent = gapResponse
        ? "Thanks, I have saved those follow-up notes. The intake is complete."
        : "The intake is complete without extra follow-up detail.";
      const nextHistory = [
        ...previousHistory,
        ...(gapResponse ? [{ role: "user" as const, content: `Gap analysis follow-up answers: ${gapResponse}` }] : []),
        { role: "assistant" as const, content: messageContent },
      ].slice(-30);

      const [{ data: updatedSession, error: updateSessionError }, mapUpdateResult] = await Promise.all([
        supabase
          .schema("sms")
          .from("question_sessions")
          .update({
            current_qs_group: "complete",
            current_question_index: 0,
            ai_conversation_history: nextHistory,
            gap_analysis_complete: true,
            last_active_at: new Date().toISOString(),
          })
          .eq("id", session.id)
          .select("id,map_id,current_qs_group,current_question_index,ai_conversation_history,gap_analysis_complete,last_active_at")
          .single(),
        supabase.schema("sms").from("maps").update({ status: "complete" }).eq("id", map.id),
      ]);

      if (updateSessionError) throw new Error(updateSessionError.message);
      if (mapUpdateResult.error) throw new Error(mapUpdateResult.error.message);

      return Response.json({
        session: updatedSession,
        message: { role: "assistant", content: messageContent, savedCount: gapResponse ? 1 : 0 },
        guidedQuestion: null,
        groupComplete: true,
      });
    }

    const advanceToGroup = typeof body.advanceToGroup === "string" ? body.advanceToGroup : "";

    if (advanceToGroup) {
      const currentOrder = groupOrder[currentGroup] ?? 0;
      const targetOrder = groupOrder[advanceToGroup] ?? 0;
      if (!targetOrder || targetOrder <= currentOrder) {
        return Response.json({ error: "Invalid section advance." }, { status: 400 });
      }

      const guidedQuestion = await buildGuidedQuestion({ group: advanceToGroup, index: 0, context });
      const content = `Moved to ${groupDetails[advanceToGroup]?.label ?? "the next section"}.`;
      const nextHistory = [
        ...previousHistory,
        { role: "assistant" as const, content },
      ].slice(-30);

      const { data: updatedSession, error: updateError } = await supabase
        .schema("sms")
        .from("question_sessions")
        .update({
          current_qs_group: advanceToGroup,
          current_question_index: 0,
          ai_conversation_history: nextHistory,
          last_active_at: new Date().toISOString(),
        })
        .eq("id", session.id)
        .select("id,map_id,current_qs_group,current_question_index,ai_conversation_history,gap_analysis_complete,last_active_at")
        .single();

      if (updateError) throw new Error(updateError.message);

      return Response.json({
        session: updatedSession,
        message: { role: "assistant", content, savedCount: 0 },
        guidedQuestion,
      });
    }

    if (body.requestQuestion) {
      const guidedQuestion = await buildGuidedQuestion({ group: currentGroup, index: currentIndex, context });
      return Response.json({
        session,
        message: {
          role: "assistant",
          content: guidedQuestion?.prompt ?? `${groupDetails[currentGroup]?.completeLabel ?? "This section"} is complete.`,
          savedCount: 0,
        },
        guidedQuestion,
        groupComplete: !guidedQuestion,
      });
    }

    const question = await buildGuidedQuestion({ group: currentGroup, index: currentIndex, context });
    if (!question) {
      return Response.json({
        session,
        message: {
          role: "assistant",
          content: `${groupDetails[currentGroup]?.completeLabel ?? "This section"} is complete. Use the continue button when you are ready.`,
          savedCount: 0,
        },
        guidedQuestion: null,
        groupComplete: true,
      });
    }

    const selectedOptions = parseSelectedOptions(body.selectedOptions);
    const otherText = sanitizeText(body.otherText, 1600);
    const otherSelected = Boolean(body.otherSelected);

    if (!selectedOptions.length && !otherText) {
      return Response.json({ error: "Choose at least one option or add Other context." }, { status: 400 });
    }

    if (otherSelected && otherText.length < 12) {
      return Response.json({
        session,
        message: {
          role: "assistant",
          content: question.otherPrompt,
          savedCount: 0,
        },
        guidedQuestion: question,
        needsMoreDetail: true,
      });
    }

    const responseValue = summariseGuidedAnswer({ question, selectedOptions, otherText });
    const { data: existing } = await supabase
      .schema("sms")
      .from("responses")
      .select("id")
      .eq("map_id", map.id)
      .eq("session_id", session.id)
      .eq("qs_group", question.group)
      .eq("question_key", question.key)
      .limit(1)
      .maybeSingle();

    if (existing?.id) {
      const { error: updateResponseError } = await supabase
        .schema("sms")
        .from("responses")
        .update({
          question_label: question.label,
          response_value: responseValue,
          response_type: "ai_extracted",
          confidence: "confirmed",
        })
        .eq("id", existing.id);
      if (updateResponseError) throw new Error(updateResponseError.message);
    } else {
      const { error: insertError } = await supabase.schema("sms").from("responses").insert({
        map_id: map.id,
        session_id: session.id,
        qs_group: question.group,
        question_key: question.key,
        question_label: question.label,
        response_value: responseValue,
        response_type: "ai_extracted",
        confidence: "confirmed",
      });
      if (insertError) throw new Error(insertError.message);
    }

    const prefFlagUpdate = buildPrefFlagUpdate({ question, selectedOptions });
    if (prefFlagUpdate) {
      const { error: prefUpdateError } = await supabase
        .schema("sms")
        .from("pref_flags")
        .upsert(
          {
            map_id: map.id,
            ...prefFlagUpdate,
          },
          { onConflict: "map_id" }
        );
      if (prefUpdateError) throw new Error(prefUpdateError.message);
    }

    const nextIndex = currentIndex + 1;
    const refreshedContext = `${context}\n- ${question.key} (${question.label}): ${responseValue}`;
    const nextQuestion = await buildGuidedQuestion({ group: currentGroup, index: nextIndex, context: refreshedContext });
    let nextGroup = currentGroup;
    let gapQuestions: string[] = [];
    let messageContent = nextQuestion
      ? "Saved. Next question:"
      : `${groupDetails[currentGroup]?.completeLabel ?? "This section"} is complete. Use the continue button when you are ready.`;

    if (!nextQuestion && currentGroup === "preferences" && !session.gap_analysis_complete) {
      const { data: allResponses, error: reloadError } = await supabase
        .schema("sms")
        .from("responses")
        .select("qs_group,question_key,question_label,response_value,response_type,confidence")
        .eq("map_id", map.id)
        .order("created_at", { ascending: true });
      if (reloadError) throw new Error(reloadError.message);

      const gaps = await runGapAnalysis({ responses: (allResponses ?? []) as Array<Record<string, unknown>> });
      if (gaps.length) {
        const { error: gapInsertError } = await supabase.schema("sms").from("gap_log").insert(
          gaps.map((gap) => ({
            map_id: map.id,
            session_id: session.id,
            qs_group: gap.qs_group,
            gap_description: gap.gap_description,
            follow_up_question: gap.follow_up_question,
            resolved: false,
          }))
        );
        if (gapInsertError) throw new Error(gapInsertError.message);
        gapQuestions = gaps.map((gap) => gap.follow_up_question);
        nextGroup = "gap_analysis";
        messageContent = `I have a few follow-up questions before I close the intake:\n${gapQuestions.map((questionText, index) => `${index + 1}. ${questionText}`).join("\n")}`;
      } else {
        nextGroup = "complete";
        messageContent = "The intake is complete. I have enough information to prepare the safety management system map.";
      }
    }

    const nextHistory = [
      ...previousHistory,
      { role: "user" as const, content: `${question.label}: ${responseValue}` },
      { role: "assistant" as const, content: messageContent },
    ].slice(-30);

    const { data: updatedSession, error: updateError } = await supabase
      .schema("sms")
      .from("question_sessions")
      .update({
        current_qs_group: nextGroup,
        current_question_index: nextGroup === currentGroup ? nextIndex : 0,
        ai_conversation_history: nextHistory,
        gap_analysis_complete: nextGroup === "complete" || session.gap_analysis_complete,
        last_active_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .select("id,map_id,current_qs_group,current_question_index,ai_conversation_history,gap_analysis_complete,last_active_at")
      .single();

    if (updateError) throw new Error(updateError.message);

    return Response.json({
      session: updatedSession,
      message: {
        role: "assistant",
        content: messageContent,
        savedCount: 1,
        gapQuestions,
      },
      guidedQuestion: nextQuestion,
      groupComplete: !nextQuestion,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to continue the intake conversation." },
      { status: 500 }
    );
  }
}
