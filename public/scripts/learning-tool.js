
(() => {
  const steps = [
    {
      id: "S1",
      name: "Legislative Scope & Duty Mapping",
      purpose:
        "Define the WA mining WHS requirements, duty holders, and the exact scope your system must cover.",
      actions: {
        operator: [
          "Maintain a legal register for the WA WHS Act and WHS (Mines) Regulations 2022 plus applicable codes and guidance.",
          "Define the mine boundary, mining operations, and all contractors within scope.",
          "Identify statutory and appointed roles and link them to decision authority.",
          "Map mandatory plans and management system elements required for the mine.",
          "Record interface duties between the mine operator and service providers.",
          "Set review frequency and owners for each legal requirement."
        ],
        provider: [
          "Capture your duties under the WA WHS Act and WHS (Mines) Regulations 2022 for your scope.",
          "Record all mine operator requirements, site rules, and permit conditions.",
          "Define the boundaries of your work, equipment, and supervision on site.",
          "List the operator plans you must comply with and any plans you must provide.",
          "Confirm competency, licensing, and training obligations for your crew.",
          "Log acceptance of operator MSMS requirements and update triggers."
        ]
      },
      inputs: {
        operator: [
          "WA WHS Act",
          "WHS (Mines) Regulations 2022 (WA)",
          "Codes of practice and DMIRS guidance",
          "Mine licence or conditions",
          "Contractor scopes of work"
        ],
        provider: [
          "WA WHS Act",
          "WHS (Mines) Regulations 2022 (WA)",
          "Mine operator MSMS requirements",
          "Site rules and permit-to-work requirements",
          "Scope of work and equipment list"
        ]
      },
      outputs: {
        operator: [
          "Legal register with owners and review dates",
          "Defined MSMS scope statement",
          "Duty holder and interface map"
        ],
        provider: [
          "Contractor compliance register",
          "Scope and interface statement",
          "Site rule acceptance record"
        ]
      },
      evidence: [
        "Registers with version dates and sources",
        "Signed scope and interface confirmation",
        "Evidence of review cadence and approvals"
      ],
      docs: {
        operator: [
          "Legal register",
          "MSMS scope statement",
          "Duty holder matrix",
          "Interface management plan"
        ],
        provider: [
          "Contractor compliance register",
          "Scope of work statement",
          "Interface management plan",
          "Site rule acceptance record"
        ]
      },
      defensible: [
        "Current version and date captured for each legal source",
        "Named accountable person for each requirement",
        "Scope boundaries listed by site and activity",
        "Interfaces defined for shared controls and reporting",
        "Documented review schedule and last review date"
      ],
      references: [
        "ISO 45001 intent: context, leadership, planning",
        "Mine operator contract terms",
        "Site access agreements"
      ],
      influences: [
        "Change in legislation or regulator guidance",
        "New scope, site, or contract",
        "Operator MSMS update"
      ],
      triggers: [
        "New or amended WHS requirement",
        "Contract scope change",
        "Regulator notice or improvement requirement"
      ],
      links: {
        upstream: [],
        downstream: ["S2", "S3"],
        feedback: ["S12"]
      }
    },
    {
      id: "S2",
      name: "Governance, Roles & Consultation",
      purpose:
        "Set decision rights, consultation pathways, and accountability that can stand up to scrutiny.",
      actions: {
        operator: [
          "Define MSMS owner, site leadership, and accountable role holders.",
          "Set consultation processes with workers, HSRs, and contractors.",
          "Define decision pathways for hazard changes, plan approvals, and stop-work.",
          "Publish system structure, document control, and record storage locations.",
          "Define contractor governance requirements and interface meetings.",
          "Set escalation rules for critical control failures."
        ],
        provider: [
          "Assign contract manager, site supervisor, and safety focal points.",
          "Define consultation with workers and coordination with the mine operator.",
          "Document stop-work authority and escalation to the operator.",
          "Confirm document control and record retention expectations.",
          "Define approvals needed before changing tasks or controls.",
          "Set reporting cadence into operator governance forums."
        ]
      },
      inputs: [
        "Requirements register",
        "Org chart and role descriptions",
        "Consultation obligations and agreements",
        "Document control standards",
        "Critical control list"
      ],
      outputs: [
        "Governance map",
        "Consultation plan",
        "Decision authority matrix"
      ],
      evidence: [
        "Signed governance map",
        "Consultation minutes and attendance",
        "Document control audit trail"
      ],
      docs: {
        operator: [
          "MSMS manual",
          "Governance map",
          "Consultation procedure",
          "Decision authority matrix"
        ],
        provider: [
          "Contractor safety management plan",
          "Role and accountability matrix",
          "Consultation procedure",
          "Interface meeting schedule"
        ]
      },
      defensible: [
        "Named decision owners with delegated authority levels",
        "Consultation cadence with required attendance",
        "Escalation timeframes for critical control failures",
        "Records stored with controlled access",
        "Approvals documented for procedural changes"
      ],
      references: [
        "WHS consultation requirements",
        "ISO 45001 intent: leadership and worker participation"
      ],
      influences: [
        "Organizational restructure",
        "New contractor or interface risk"
      ],
      triggers: [
        "Change in statutory or appointed roles",
        "Major audit or incident finding"
      ],
      links: {
        upstream: ["S1"],
        downstream: ["S3", "S4"],
        feedback: ["S12"]
      }
    },
    {
      id: "S3",
      name: "Risk Method & Decision Rules",
      purpose:
        "Define how risk is rated, controls are selected, and residual risk is approved.",
      actions: {
        operator: [
          "Define consequence and likelihood scales with mining examples.",
          "Set risk matrix thresholds and required control tiers.",
          "Define residual risk acceptance rules and approval levels.",
          "Specify how combined or cumulative risks are treated.",
          "Align risk method to principal hazard management.",
          "Publish and train the method across all contractors."
        ],
        provider: [
          "Align your risk method to the operator risk matrix or bridge differences.",
          "Define how your tasks are rated and escalated to the operator.",
          "Set residual risk approval rules with operator sign-off triggers.",
          "Define how combined hazards with other contractors are assessed.",
          "Publish the method and ensure crew access in the field.",
          "Record deviations from the operator method with approvals."
        ]
      },
      inputs: [
        "Legal requirements",
        "Incident and exposure trends",
        "Critical control standards",
        "Operational constraints",
        "Operator risk requirements"
      ],
      outputs: [
        "Risk matrix and scales",
        "Control selection rules",
        "Residual risk approval rules"
      ],
      evidence: [
        "Risk method document approved",
        "Risk matrix communicated to crews",
        "Residual risk approvals logged"
      ],
      docs: [
        "Risk management procedure",
        "Risk matrix guide",
        "Residual risk approval form"
      ],
      defensible: [
        "Defined scales with clear mining examples",
        "Approval level for each residual risk tier",
        "Control hierarchy explicitly stated",
        "Method review date and owner recorded",
        "Training completion recorded"
      ],
      references: [
        "ISO 45001 intent: planning and risk",
        "Operator MSMS requirements"
      ],
      influences: [
        "New hazard or control technology",
        "Incident trend changes"
      ],
      triggers: [
        "Regulator guidance update",
        "High-risk incident or near miss"
      ],
      links: {
        upstream: ["S1", "S2"],
        downstream: ["S4", "S5"],
        feedback: ["S11", "S12"]
      }
    },
    {
      id: "S4",
      name: "Principal Hazards & Critical Controls",
      purpose:
        "Define the principal mining hazards and the controls that must not fail.",
      actions: {
        operator: [
          "List principal hazards relevant to the mine and activities.",
          "Assign critical controls to each principal hazard.",
          "Define control performance standards with measurable criteria.",
          "Set verification methods and frequency for each control.",
          "Link controls to emergency and health management plans.",
          "Review the hazard library at a fixed interval."
        ],
        provider: [
          "Map your tasks to the operator principal hazards and controls.",
          "Define your task-level controls that support critical controls.",
          "Confirm verification expectations and reporting into operator systems.",
          "Document control performance standards for your equipment.",
          "Escalate gaps where operator critical controls cannot be met.",
          "Review and update when tasks or equipment change."
        ]
      },
      inputs: [
        "Risk method and matrix",
        "Incident and near miss data",
        "Engineering standards and OEM guidance",
        "Field observations and audits",
        "Operator principal hazard list"
      ],
      outputs: [
        "Principal hazard register",
        "Critical control standards",
        "Verification methods"
      ],
      evidence: [
        "Updated hazard register with version control",
        "Control verification records",
        "Communication to field teams"
      ],
      docs: {
        operator: [
          "Principal hazard register",
          "Critical control standard",
          "Control verification checklist library"
        ],
        provider: [
          "Task hazard-control map",
          "Critical control support plan",
          "Verification checklist library"
        ]
      },
      defensible: [
        "Each principal hazard has defined critical controls",
        "Each critical control has performance criteria",
        "Verification method and frequency recorded",
        "Change log for additions and removals",
        "Review date and reviewer recorded"
      ],
      references: [
        "WHS (Mines) Regulations 2022 (WA)",
        "ISO 45001 intent: operational control"
      ],
      influences: [
        "New equipment or process change",
        "Incident trend for a specific hazard"
      ],
      triggers: [
        "Critical control failure",
        "New principal hazard identified"
      ],
      links: {
        upstream: ["S3"],
        downstream: ["S5", "S6", "S9"],
        feedback: ["S8", "S11", "S12"]
      }
    },
    {
      id: "S5",
      name: "Management Plans & Task Risk Registers",
      purpose:
        "Translate hazards into management plans and task-level risk controls.",
      actions: {
        operator: [
          "Develop required management plans for principal hazards and key risks.",
          "Define task boundaries and link each task to relevant hazards.",
          "Assign controls, verification points, and owner per task.",
          "Ensure plans integrate with contractor scopes and permits.",
          "Publish current versions in the operational system.",
          "Review plans when tasks, hazards, or controls change."
        ],
        provider: [
          "Create task risk registers aligned to the operator hazard library.",
          "Provide task management plans where required by the operator.",
          "Link each task to operator critical controls and verification.",
          "Define your supervision and approval points.",
          "Submit plans for operator review and acceptance.",
          "Update plans when scope or equipment changes."
        ]
      },
      inputs: [
        "Principal hazard register",
        "Risk method and matrix",
        "Task list and scope",
        "Control performance standards",
        "Operator permit-to-work constraints"
      ],
      outputs: [
        "Management plans",
        "Task risk registers",
        "Verification points per task"
      ],
      evidence: [
        "Approved management plans with version control",
        "Task risk registers signed off",
        "Crew briefing and distribution records"
      ],
      docs: {
        operator: [
          "Principal hazard management plans",
          "Task risk register",
          "Change control log"
        ],
        provider: [
          "Task risk register",
          "Task management plan",
          "Operator approval records"
        ]
      },
      defensible: [
        "Risk rating before and after controls recorded",
        "Controls tied to hazards and tasks",
        "Verification point listed for each control",
        "Change reason and date recorded",
        "Crew acknowledgement captured"
      ],
      references: [
        "Operator MSMS requirements",
        "ISO 45001 intent: planning and operational control"
      ],
      influences: [
        "Scope or method change",
        "New equipment introduced"
      ],
      triggers: [
        "New task or method",
        "Incident related to a task"
      ],
      links: {
        upstream: ["S3", "S4"],
        downstream: ["S6", "S7"],
        feedback: ["S8", "S11", "S12"]
      }
    },
    {
      id: "S6",
      name: "Operational Procedures & Work Permits",
      purpose:
        "Turn plans into controlled work steps, permits, and software workflows.",
      actions: {
        operator: [
          "Develop procedures for high-risk and regulated tasks.",
          "Embed critical control checks and stop-work triggers.",
          "Define permit-to-work requirements and approvals.",
          "Configure digital workflows for procedure access and acknowledgements.",
          "Approve procedures with named accountable roles.",
          "Publish current versions across all work areas."
        ],
        provider: [
          "Provide task procedures aligned to operator plans and permits.",
          "Embed critical control checks and prestart requirements.",
          "Use the operator permit-to-work system and approvals.",
          "Confirm digital access and crew acknowledgement of procedures.",
          "Record deviations and approvals before work starts.",
          "Ensure procedures match equipment and OEM constraints."
        ]
      },
      inputs: [
        "Management plans and task risk registers",
        "Critical control standards",
        "OEM instructions",
        "Field feedback",
        "Permit-to-work requirements"
      ],
      outputs: [
        "Approved procedures",
        "Embedded control checks",
        "Permit workflows and approvals"
      ],
      evidence: [
        "Procedure approval record",
        "Version control log",
        "Permit records and acknowledgements"
      ],
      docs: [
        "Work procedures",
        "Permit-to-work procedure",
        "Procedure change request"
      ],
      defensible: [
        "Procedures list all critical controls",
        "Stop-work triggers are measurable and clear",
        "Approval date and approver recorded",
        "Crew feedback recorded before approval",
        "Current version accessible on site"
      ],
      references: [
        "Operator MSMS requirements",
        "ISO 45001 intent: operational control"
      ],
      influences: [
        "Incident findings",
        "New equipment instructions"
      ],
      triggers: [
        "Procedure deviation or permit breach",
        "Control verification failure"
      ],
      links: {
        upstream: ["S5"],
        downstream: ["S7"],
        feedback: ["S8", "S11", "S12"]
      }
    },
    {
      id: "S7",
      name: "Field Verification & Control Assurance",
      purpose:
        "Verify critical controls each shift and capture proof of effectiveness.",
      actions: {
        operator: [
          "Complete prestart and critical control verification checks.",
          "Record deviations and immediate corrective actions.",
          "Stop work when a critical control is not met.",
          "Submit digital checks before shift end.",
          "Escalate repeated failures to site leadership.",
          "Review trend data in weekly assurance meetings."
        ],
        provider: [
          "Complete required prestart and task checks.",
          "Verify controls and submit evidence into operator systems.",
          "Stop work if critical controls are not met.",
          "Escalate deviations to the operator immediately.",
          "Record task-specific control checks and outcomes.",
          "Participate in assurance reviews when requested."
        ]
      },
      inputs: [
        "Operational procedures",
        "Critical control standards",
        "Task risk registers",
        "Daily work plan",
        "Stop-work rules"
      ],
      outputs: [
        "Daily check records",
        "Control verification results",
        "Deviation reports"
      ],
      evidence: [
        "Completed checklists",
        "Control verification records",
        "Stop-work and deviation logs"
      ],
      docs: [
        "Prestart checklist",
        "Critical control check form",
        "Mobile field app workflow"
      ],
      defensible: [
        "Each critical control verified at required frequency",
        "Time and location recorded on checks",
        "Deviations recorded with action taken",
        "Supervisor sign-off on unresolved issues",
        "Digital submission timestamped"
      ],
      references: [
        "Operator MSMS requirements",
        "ISO 45001 intent: performance evaluation"
      ],
      influences: [
        "Weather conditions",
        "Equipment faults"
      ],
      triggers: [
        "Critical control fails verification",
        "Repeated deviation in a short period"
      ],
      links: {
        upstream: ["S6", "S5"],
        downstream: ["S8", "S9"],
        feedback: ["S12"]
      }
    },
    {
      id: "S8",
      name: "Incident, Hazard & Statutory Reporting",
      purpose:
        "Capture incidents and hazards, meet notification duties, and drive corrective action.",
      actions: {
        operator: [
          "Report notifiable incidents to the regulator as required.",
          "Record hazards and near misses the same shift.",
          "Assign investigators and preserve critical evidence.",
          "Track corrective actions to closure and verify effectiveness.",
          "Share learnings and update plans where needed.",
          "Maintain statutory reporting records and correspondence."
        ],
        provider: [
          "Notify the operator immediately of incidents and hazards.",
          "Record incident details and immediate actions taken.",
          "Support investigation and evidence preservation.",
          "Track corrective actions for your scope to closure.",
          "Share learnings with crews and update procedures.",
          "Maintain records required by the operator and regulator."
        ]
      },
      inputs: [
        "Field verification records",
        "Worker observations",
        "Supervisor reports",
        "Equipment fault logs",
        "Exposure monitoring results"
      ],
      outputs: [
        "Incident reports",
        "Hazard reports",
        "Corrective action register"
      ],
      evidence: [
        "Incident report forms",
        "Corrective action close-out records",
        "Statutory notification records"
      ],
      docs: [
        "Incident reporting procedure",
        "Hazard observation form",
        "Corrective action register"
      ],
      defensible: [
        "Incident time, date, and location recorded",
        "Immediate actions recorded with owner",
        "Investigation assigned within defined timeframe",
        "Corrective actions assigned with due dates",
        "Close-out evidence recorded"
      ],
      references: [
        "WHS (Mines) Regulations 2022 (WA)",
        "ISO 45001 intent: incident management and improvement"
      ],
      influences: [
        "New incident trend",
        "Regulator inquiries"
      ],
      triggers: [
        "Notifiable incident or high-potential near miss",
        "Regulator request for information"
      ],
      links: {
        upstream: ["S7"],
        downstream: ["S11", "S12"],
        feedback: ["S4", "S5", "S6"]
      }
    },
    {
      id: "S9",
      name: "Inspections, Assurance & Verification",
      purpose:
        "Plan and perform assurance activities that prove controls and compliance.",
      actions: {
        operator: [
          "Schedule inspections based on principal hazards and critical controls.",
          "Inspect against standards, plans, and procedures.",
          "Record findings with objective evidence.",
          "Assign corrective actions with owners and due dates.",
          "Verify close-out and share results.",
          "Track assurance coverage across all contractors."
        ],
        provider: [
          "Complete inspections aligned to operator requirements.",
          "Provide inspection evidence to the operator.",
          "Assign and close corrective actions in your scope.",
          "Participate in joint assurance activities when requested.",
          "Track inspection trends and update procedures.",
          "Escalate repeated findings to the operator."
        ]
      },
      inputs: [
        "Critical control standards",
        "Field verification records",
        "Procedure requirements",
        "Assurance schedule",
        "Previous inspection results"
      ],
      outputs: [
        "Inspection reports",
        "Corrective action items",
        "Assurance summaries"
      ],
      evidence: [
        "Inspection reports with dates",
        "Corrective action close-out",
        "Assurance summary dashboard"
      ],
      docs: [
        "Inspection checklist",
        "Assurance schedule",
        "Corrective action tracker"
      ],
      defensible: [
        "Inspection frequency tied to risk level",
        "Finding evidence recorded (photo, measurement, or reading)",
        "Corrective action owner and due date recorded",
        "Close-out verified by supervisor",
        "Inspection results communicated to crews"
      ],
      references: [
        "ISO 45001 intent: evaluation and auditing",
        "Operator MSMS requirements"
      ],
      influences: [
        "Repeated deviations",
        "Change in risk level"
      ],
      triggers: [
        "Critical control failure",
        "Audit finding or regulator focus"
      ],
      links: {
        upstream: ["S7"],
        downstream: ["S11", "S12"],
        feedback: ["S4", "S5", "S6"]
      }
    },
    {
      id: "S10",
      name: "Health Exposure & Fitness for Work",
      purpose:
        "Measure exposure risks, protect worker health, and act on results.",
      actions: {
        operator: [
          "Define exposure monitoring plan for dust, noise, vibration, and chemicals.",
          "Ensure calibrated equipment and competent sampling.",
          "Compare results to exposure limits and trigger control changes.",
          "Implement health monitoring where required.",
          "Notify workers of results and follow-up actions.",
          "Store exposure data in a central system."
        ],
        provider: [
          "Follow operator exposure monitoring and health surveillance requirements.",
          "Record task-specific exposure controls and outcomes.",
          "Provide equipment calibration and maintenance records.",
          "Notify the operator of any exceedances or health concerns.",
          "Ensure fitness-for-work requirements are met for your team.",
          "Store exposure records in your system and share as required."
        ]
      },
      inputs: [
        "Hazard library",
        "Exposure limits",
        "Monitoring equipment records",
        "Field observations",
        "Shift rosters"
      ],
      outputs: [
        "Exposure results",
        "Control change requests",
        "Worker notifications"
      ],
      evidence: [
        "Monitoring logs",
        "Calibration certificates",
        "Worker notification records"
      ],
      docs: [
        "Exposure monitoring plan",
        "Sampling log",
        "Exposure results register"
      ],
      defensible: [
        "Monitoring schedule tied to exposure risk",
        "Calibration date recorded for each device",
        "Exposure result recorded with date and location",
        "Exceedance triggers documented actions",
        "Worker notification recorded"
      ],
      references: [
        "WHS (Mines) Regulations 2022 (WA)",
        "ISO 45001 intent: health protection"
      ],
      influences: [
        "Change in process or material",
        "New exposure limit published"
      ],
      triggers: [
        "Exposure result exceeds limit",
        "New chemical introduced"
      ],
      links: {
        upstream: ["S4"],
        downstream: ["S11", "S12"],
        feedback: ["S4", "S5", "S6"]
      }
    },
    {
      id: "S11",
      name: "System Audit & MSMS Verification",
      purpose:
        "Verify system performance against legal duties and operator expectations.",
      actions: {
        operator: [
          "Plan audits against legal requirements and MSMS elements.",
          "Verify evidence for each system element and critical control.",
          "Interview workers, supervisors, and contractors.",
          "Record non-conformances with objective evidence.",
          "Assign corrective actions with owners and due dates.",
          "Verify close-out and effectiveness."
        ],
        provider: [
          "Complete internal audits against operator requirements.",
          "Provide audit evidence to the operator when requested.",
          "Address non-conformances with corrective actions.",
          "Verify close-out and effectiveness for your scope.",
          "Participate in joint audits with the operator.",
          "Maintain audit trails for regulator review."
        ]
      },
      inputs: [
        "Inspection reports",
        "Incident reports",
        "Exposure results",
        "Field verification records",
        "Requirements register"
      ],
      outputs: [
        "Audit findings",
        "Corrective actions",
        "Audit summary report"
      ],
      evidence: [
        "Audit reports with evidence references",
        "Corrective action close-out",
        "Audit plan and checklist"
      ],
      docs: [
        "Audit plan",
        "Audit checklist",
        "Audit report"
      ],
      defensible: [
        "Evidence reference for each finding",
        "Corrective actions assigned within defined timeframe",
        "Close-out verified by auditor",
        "Audit scope and criteria documented",
        "Audit results communicated to leadership"
      ],
      references: [
        "ISO 45001 intent: performance evaluation",
        "Operator MSMS requirements"
      ],
      influences: [
        "Incident trends",
        "Regulator focus areas"
      ],
      triggers: [
        "Scheduled audit cycle",
        "Major incident or regulator notice"
      ],
      links: {
        upstream: ["S8", "S9", "S10"],
        downstream: ["S12"],
        feedback: ["S4", "S5", "S6"]
      }
    },
    {
      id: "S12",
      name: "Management Review & Improvement",
      purpose:
        "Decide and resource the changes that keep the system defensible and alive.",
      actions: {
        operator: [
          "Review audit findings, incidents, and control performance.",
          "Prioritize changes by risk, legal duty, and operational impact.",
          "Approve updates to plans, hazards, and procedures.",
          "Assign owners, deadlines, and resourcing.",
          "Confirm implementation and effectiveness review.",
          "Communicate decisions to site leadership and contractors."
        ],
        provider: [
          "Review incidents, findings, and operator feedback.",
          "Update procedures and plans within your scope.",
          "Escalate required MSMS changes to the operator.",
          "Assign owners and due dates for corrective actions.",
          "Verify changes are implemented and effective.",
          "Communicate updates to crews and the operator."
        ]
      },
      inputs: [
        "Audit findings",
        "Incident trend reports",
        "Assurance summaries",
        "Exposure results",
        "Operator feedback"
      ],
      outputs: [
        "Improvement decisions",
        "Approved change actions",
        "Priority update list"
      ],
      evidence: [
        "Management review minutes",
        "Decision log with dates",
        "Change action tracker"
      ],
      docs: [
        "Management review minutes",
        "Improvement action register",
        "Change approval record"
      ],
      defensible: [
        "Decision date and approver recorded",
        "Change owner and due date listed",
        "Priority ranking documented",
        "Resources allocated recorded",
        "Communication to field leaders logged"
      ],
      references: [
        "ISO 45001 intent: improvement",
        "Operator MSMS requirements"
      ],
      influences: [
        "Major incident",
        "Regulator notice or client change"
      ],
      triggers: [
        "Scheduled review date",
        "Significant system change or incident"
      ],
      links: {
        upstream: ["S11"],
        downstream: ["S4", "S5", "S6", "S7"],
        feedback: ["S1"]
      }
    }
  ];
  const generalOverrides = {
    S1: {
      name: "Legal Scope and Duty Mapping",
      purpose:
        "Define the WA WHS Act and WHS Regulations 2022 duties, scope, and interfaces that your system must cover.",
      actions: {
        operator: [
          "Maintain a legal register for the WA WHS Act, WHS Regulations 2022, and relevant codes of practice.",
          "Define the workplaces, activities, and contractor scopes covered by the system.",
          "Identify duty holders (PCBU, officers, workers, other PCBUs) and document interfaces.",
          "Map any licensing, high risk work, and notifiable incident obligations.",
          "Record which host requirements apply to contractors and subcontractors.",
          "Set review frequency and owners for each legal requirement."
        ],
        provider: [
          "Capture your duties under the WA WHS Act and WHS Regulations 2022 for your scope.",
          "Record host PCBU requirements, site rules, and permit conditions.",
          "Define boundaries of your work, equipment, and supervision.",
          "Confirm licensing, high risk work, and competency requirements for your crew.",
          "List any plans or documents required by the host PCBU.",
          "Log acceptance of host requirements and update triggers."
        ]
      },
      inputs: {
        operator: [
          "WA WHS Act",
          "WHS Regulations 2022 (WA)",
          "Codes of practice and WorkSafe guidance",
          "Contracts and scope of work",
          "High risk work and licensing requirements"
        ],
        provider: [
          "WA WHS Act",
          "WHS Regulations 2022 (WA)",
          "Host PCBU requirements",
          "Site rules and permit-to-work requirements",
          "Scope of work and equipment list"
        ]
      },
      outputs: {
        operator: [
          "Legal register with owners and review dates",
          "Defined WHS system scope statement",
          "Duty holder and interface map"
        ],
        provider: [
          "Contractor compliance register",
          "Scope and interface statement",
          "Site rule acceptance record"
        ]
      },
      docs: {
        operator: [
          "Legal register",
          "WHS system scope statement",
          "Duty holder matrix",
          "Contractor interface plan"
        ],
        provider: [
          "Contractor compliance register",
          "Scope of work statement",
          "Interface plan",
          "Site rule acceptance record"
        ]
      },
      influences: [
        "Change in legislation or regulator guidance",
        "New scope, site, or contract",
        "Host WHS system update"
      ],
      references: [
        "ISO 45001 intent: context and leadership",
        "Host PCBU contract terms",
        "WorkSafe WA guidance"
      ]
    },
    S2: {
      name: "Governance, Roles and Consultation",
      purpose:
        "Set decision rights, consultation pathways, and accountability for general WHS compliance.",
      actions: {
        operator: [
          "Define WHS system owner, officer due diligence roles, and accountable role holders.",
          "Set consultation processes with workers, HSRs, and contractors.",
          "Define decision pathways for hazard changes, approvals, and stop-work.",
          "Publish system structure, document control, and record storage locations.",
          "Define contractor governance requirements and coordination meetings.",
          "Set escalation rules for critical risk control failures."
        ],
        provider: [
          "Assign contract manager, site supervisor, and WHS focal points.",
          "Define consultation with workers and coordination with the host PCBU.",
          "Document stop-work authority and escalation to the host PCBU.",
          "Confirm document control and record retention expectations.",
          "Define approvals needed before changing tasks or controls.",
          "Set reporting cadence into host governance forums."
        ]
      },
      docs: {
        operator: [
          "WHS policy",
          "Governance map",
          "Consultation procedure",
          "Decision authority matrix"
        ],
        provider: [
          "Contractor WHS management plan",
          "Role and accountability matrix",
          "Consultation procedure",
          "Interface meeting schedule"
        ]
      },
      references: [
        "WHS consultation requirements",
        "ISO 45001 intent: leadership and worker participation"
      ]
    },
    S3: {
      name: "Risk Management Method",
      purpose:
        "Define how hazards are identified, risks are assessed, and controls are selected.",
      actions: {
        operator: [
          "Define consequence and likelihood scales with examples.",
          "Set risk matrix thresholds and required control tiers.",
          "Define residual risk acceptance rules and approval levels.",
          "Apply the hierarchy of control for all hazards.",
          "Specify how combined or cumulative risks are treated.",
          "Publish and train the method across workers and contractors."
        ],
        provider: [
          "Align your risk method to the host PCBU risk matrix or bridge differences.",
          "Define how your tasks are rated and escalated to the host PCBU.",
          "Set residual risk approval rules with host sign-off triggers.",
          "Define how combined hazards with other contractors are assessed.",
          "Publish the method and ensure crew access in the field.",
          "Record deviations from the host method with approvals."
        ]
      },
      references: [
        "ISO 45001 intent: planning and risk",
        "Host PCBU WHS requirements"
      ]
    },
    S4: {
      name: "Hazard Identification and Critical Risk Controls",
      purpose:
        "Define the hazards that can cause serious harm and the controls that must not fail.",
      actions: {
        operator: [
          "Maintain a hazard register for all activities and workplaces.",
          "Identify critical risks and assign critical controls.",
          "Define control performance standards with measurable criteria.",
          "Set verification methods and frequency for each control.",
          "Link controls to emergency and health management arrangements.",
          "Review the hazard and control library at a fixed interval."
        ],
        provider: [
          "Map your tasks to the host critical risks and controls.",
          "Define task controls that support host critical controls.",
          "Confirm verification expectations and reporting into host systems.",
          "Document control performance standards for your equipment.",
          "Escalate gaps where host critical controls cannot be met.",
          "Review and update when tasks or equipment change."
        ]
      },
      docs: {
        operator: [
          "Hazard register",
          "Critical control standard",
          "Control verification checklist library"
        ],
        provider: [
          "Task hazard-control map",
          "Critical control support plan",
          "Verification checklist library"
        ]
      },
      inputs: [
        "Risk method and matrix",
        "Incident and near miss data",
        "Engineering standards and OEM guidance",
        "Field observations and audits",
        "Host critical risk list"
      ],
      outputs: [
        "Hazard register",
        "Critical control standards",
        "Verification methods"
      ],
      evidence: [
        "Updated hazard register with version control",
        "Control verification records",
        "Communication to field teams"
      ],
      defensible: [
        "Each critical risk has defined critical controls",
        "Each critical control has performance criteria",
        "Verification method and frequency recorded",
        "Change log for additions and removals",
        "Review date and reviewer recorded"
      ],
      influences: [
        "New equipment or process change",
        "Incident trend for a specific hazard"
      ],
      triggers: [
        "Critical control failure",
        "New critical risk identified"
      ],
      references: [
        "WHS Regulations 2022 (WA)",
        "ISO 45001 intent: operational control"
      ]
    },
    S5: {
      name: "Risk Assessments and Safe Work Method Statements",
      purpose:
        "Translate hazards into task risk controls and required work documentation.",
      actions: {
        operator: [
          "Define when SWMS or equivalent task risk assessments are required.",
          "Define task boundaries and link each task to relevant hazards.",
          "Assign controls, verification points, and owner per task.",
          "Ensure plans integrate with contractor scopes and permits.",
          "Publish current versions in the operational system.",
          "Review assessments when tasks, hazards, or controls change."
        ],
        provider: [
          "Create task risk registers and SWMS where required.",
          "Align task controls to host critical controls and permits.",
          "Define your supervision and approval points.",
          "Submit plans for host review and acceptance.",
          "Brief crews and record acknowledgements.",
          "Update plans when scope or equipment changes."
        ]
      },
      docs: {
        operator: [
          "Task risk register",
          "SWMS criteria and templates",
          "Change control log"
        ],
        provider: [
          "Task risk register",
          "SWMS and task plans",
          "Host approval records"
        ]
      },
      inputs: [
        "Hazard register",
        "Risk method and matrix",
        "Task list and scope",
        "Control performance standards",
        "Host permit-to-work constraints"
      ],
      outputs: [
        "Task risk register",
        "SWMS and task plans",
        "Verification points per task"
      ],
      evidence: [
        "Approved SWMS and task plans with version control",
        "Task risk registers signed off",
        "Crew briefing and distribution records"
      ],
      defensible: [
        "Risk rating before and after controls recorded",
        "Controls tied to hazards and tasks",
        "Verification point listed for each control",
        "Change reason and date recorded",
        "Crew acknowledgement captured"
      ],
      influences: [
        "Scope or method change",
        "New equipment introduced"
      ],
      triggers: [
        "New task or method",
        "Incident related to a task"
      ],
      references: [
        "Host PCBU WHS requirements",
        "ISO 45001 intent: planning and operational control"
      ]
    },
    S6: {
      name: "Operational Procedures and Permits",
      purpose:
        "Turn plans into controlled work steps, permits, and software workflows.",
      actions: {
        operator: [
          "Develop procedures for high-risk and regulated tasks.",
          "Embed critical control checks and stop-work triggers.",
          "Define permit-to-work requirements and approvals.",
          "Configure digital workflows for procedure access and acknowledgements.",
          "Approve procedures with named accountable roles.",
          "Publish current versions across all work areas."
        ],
        provider: [
          "Provide task procedures aligned to host plans and permits.",
          "Embed critical control checks and prestart requirements.",
          "Use the host permit-to-work system and approvals.",
          "Confirm digital access and crew acknowledgement of procedures.",
          "Record deviations and approvals before work starts.",
          "Ensure procedures match equipment and OEM constraints."
        ]
      },
      references: [
        "Host PCBU WHS requirements",
        "ISO 45001 intent: operational control"
      ]
    },
    S7: {
      name: "Field Verification and Control Assurance",
      purpose:
        "Verify critical controls each shift and capture proof of effectiveness.",
      actions: {
        operator: [
          "Complete prestart and critical control verification checks.",
          "Record deviations and immediate corrective actions.",
          "Stop work when a critical control is not met.",
          "Submit digital checks before shift end.",
          "Escalate repeated failures to leadership.",
          "Review trend data in assurance meetings."
        ],
        provider: [
          "Complete required prestart and task checks.",
          "Verify controls and submit evidence into host systems.",
          "Stop work if critical controls are not met.",
          "Escalate deviations to the host PCBU immediately.",
          "Record task-specific control checks and outcomes.",
          "Participate in assurance reviews when requested."
        ]
      },
      references: [
        "Host PCBU WHS requirements",
        "ISO 45001 intent: performance evaluation"
      ]
    },
    S8: {
      name: "Incident, Hazard and Notifiable Reporting",
      purpose:
        "Capture incidents and hazards, meet notification duties, and drive corrective action.",
      actions: {
        operator: [
          "Report notifiable incidents to the regulator as required.",
          "Record hazards and near misses the same shift.",
          "Assign investigators and preserve critical evidence.",
          "Track corrective actions to closure and verify effectiveness.",
          "Share learnings and update plans where needed.",
          "Maintain statutory reporting records and correspondence."
        ],
        provider: [
          "Notify the host PCBU immediately of incidents and hazards.",
          "Record incident details and immediate actions taken.",
          "Support investigation and evidence preservation.",
          "Track corrective actions for your scope to closure.",
          "Share learnings with crews and update procedures.",
          "Maintain records required by the host PCBU and regulator."
        ]
      },
      references: [
        "WHS Regulations 2022 (WA)",
        "ISO 45001 intent: incident management and improvement"
      ]
    },
    S9: {
      name: "Inspections, Assurance and Verification",
      purpose:
        "Plan and perform assurance activities that prove controls and compliance.",
      actions: {
        operator: [
          "Schedule inspections based on critical risks and controls.",
          "Inspect against standards, plans, and procedures.",
          "Record findings with objective evidence.",
          "Assign corrective actions with owners and due dates.",
          "Verify close-out and share results.",
          "Track assurance coverage across contractors."
        ],
        provider: [
          "Complete inspections aligned to host requirements.",
          "Provide inspection evidence to the host PCBU.",
          "Assign and close corrective actions in your scope.",
          "Participate in joint assurance activities when requested.",
          "Track inspection trends and update procedures.",
          "Escalate repeated findings to the host PCBU."
        ]
      },
      references: [
        "ISO 45001 intent: evaluation and auditing",
        "Host PCBU WHS requirements"
      ]
    },
    S10: {
      name: "Health Exposure and Fitness for Work",
      purpose:
        "Measure exposure risks, protect worker health, and act on results.",
      actions: {
        operator: [
          "Define exposure monitoring plan for dust, noise, vibration, and chemicals.",
          "Ensure calibrated equipment and competent sampling.",
          "Compare results to exposure limits and trigger control changes.",
          "Implement health monitoring where required.",
          "Notify workers of results and follow-up actions.",
          "Store exposure data in a central system."
        ],
        provider: [
          "Follow host exposure monitoring and health surveillance requirements.",
          "Record task-specific exposure controls and outcomes.",
          "Provide equipment calibration and maintenance records.",
          "Notify the host PCBU of exceedances or health concerns.",
          "Ensure fitness-for-work requirements are met for your team.",
          "Store exposure records and share as required."
        ]
      },
      references: [
        "WHS Regulations 2022 (WA)",
        "ISO 45001 intent: health protection"
      ]
    },
    S11: {
      name: "System Audit and Verification",
      purpose:
        "Verify system performance against legal duties and host expectations.",
      actions: {
        operator: [
          "Plan audits against legal requirements and WHS system elements.",
          "Verify evidence for each system element and critical control.",
          "Interview workers, supervisors, and contractors.",
          "Record non-conformances with objective evidence.",
          "Assign corrective actions with owners and due dates.",
          "Verify close-out and effectiveness."
        ],
        provider: [
          "Complete internal audits against host requirements.",
          "Provide audit evidence to the host PCBU when requested.",
          "Address non-conformances with corrective actions.",
          "Verify close-out and effectiveness for your scope.",
          "Participate in joint audits with the host PCBU.",
          "Maintain audit trails for regulator review."
        ]
      },
      references: [
        "ISO 45001 intent: performance evaluation",
        "Host PCBU WHS requirements"
      ]
    },
    S12: {
      name: "Management Review and Improvement",
      purpose:
        "Decide and resource the changes that keep the system defensible and alive.",
      actions: {
        operator: [
          "Review audit findings, incidents, and control performance.",
          "Prioritize changes by risk, legal duty, and operational impact.",
          "Approve updates to plans, hazards, and procedures.",
          "Assign owners, deadlines, and resourcing.",
          "Confirm implementation and effectiveness review.",
          "Communicate decisions to leadership and contractors."
        ],
        provider: [
          "Review incidents, findings, and host feedback.",
          "Update procedures and plans within your scope.",
          "Escalate required system changes to the host PCBU.",
          "Assign owners and due dates for corrective actions.",
          "Verify changes are implemented and effective.",
          "Communicate updates to crews and the host PCBU."
        ]
      },
      references: [
        "ISO 45001 intent: improvement",
        "Host PCBU WHS requirements"
      ]
    }
  };

  const applyOverrides = (baseSteps, overrides) =>
    baseSteps.map((step) => {
      const override = overrides[step.id];
      if (!override) return step;
      return { ...step, ...override };
    });

  const stepsByRegulation = {
    mining: steps,
    general: applyOverrides(steps, generalOverrides)
  };

  const journeys = [
    {
      id: "build",
      name: "Build the System",
      summary: "Start at requirements and build each layer in order.",
      sequence: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10", "S11", "S12"]
    },
    {
      id: "field-loop",
      name: "How Work Feeds Improvement",
      summary: "Follow field checks into learning and change decisions.",
      sequence: ["S7", "S8", "S9", "S10", "S11", "S12", "S4", "S5", "S6", "S7"]
    },
    {
      id: "legal",
      name: "Legal Defensibility",
      summary: "See what a regulator expects to see and verify.",
      sequence: ["S1", "S2", "S3", "S4", "S6", "S7", "S9", "S11", "S12"]
    },
    {
      id: "critical",
      name: "Critical Controls",
      summary: "Hazards to controls to verification and learning.",
      sequence: ["S4", "S5", "S6", "S7", "S9", "S8", "S12"]
    },
    {
      id: "audit",
      name: "Audit Readiness",
      summary: "Follow evidence from field work to audit readiness.",
      sequence: ["S7", "S8", "S9", "S10", "S11", "S12"]
    },
    {
      id: "diagnose",
      name: "Post-Incident Diagnosis",
      summary: "Trace what failed after poor performance or a serious incident.",
      sequence: ["S8", "S7", "S6", "S5", "S4", "S3", "S2", "S1", "S11", "S12"]
    }
  ];

  const journeyIntents = {
    build:
      "Build the system from legal scope to governance, risk, controls, procedures, verification, learning, and review.",
    "field-loop":
      "Start where work happens and follow the evidence trail into reporting, assurance, and improvement decisions.",
    legal:
      "Highlight the steps regulators test first and the evidence chain that makes the system defensible.",
    critical:
      "Trace how critical risks are defined, controlled, verified, and strengthened through learning.",
    audit:
      "Follow the evidence chain that proves compliance and system effectiveness.",
    diagnose:
      "Work backwards from an incident to locate what failed and where the control chain broke."
  };

  const journeyStepNotes = {
    build: {
      S1: "Start with duty and scope.",
      S2: "Set accountability early.",
      S3: "Lock the risk method.",
      S4: "Define hazards and controls.",
      S5: "Translate into task plans.",
      S6: "Procedures make it real.",
      S7: "Verify controls in field.",
      S8: "Capture learning signals.",
      S9: "Assure and verify.",
      S10: "Protect health risks.",
      S11: "Audit the system.",
      S12: "Decide improvements."
    },
    "field-loop": {
      S7: "Work starts here.",
      S8: "Incidents feed learning.",
      S9: "Assurance proves controls.",
      S10: "Health data drives change.",
      S11: "Audit validates reality.",
      S12: "Decisions reset controls.",
      S4: "Update hazards.",
      S5: "Update task controls.",
      S6: "Update procedures."
    },
    legal: {
      S1: "Scope and duties.",
      S2: "Governance evidence.",
      S3: "Risk method proof.",
      S4: "Critical controls.",
      S6: "Procedural controls.",
      S7: "Verification records.",
      S9: "Assurance evidence.",
      S11: "Audit trail.",
      S12: "Management review."
    },
    critical: {
      S4: "Define critical controls.",
      S5: "Apply to tasks.",
      S6: "Embed in procedures.",
      S7: "Verify in the field.",
      S9: "Assure effectiveness.",
      S8: "Learn from failures.",
      S12: "Decide improvements."
    },
    audit: {
      S7: "Field evidence.",
      S8: "Incident trail.",
      S9: "Assurance proof.",
      S10: "Health evidence.",
      S11: "Audit findings.",
      S12: "Management review."
    },
    diagnose: {
      S8: "Incident origin.",
      S7: "Verification gaps.",
      S6: "Procedure gaps.",
      S5: "Task control gaps.",
      S4: "Hazard gaps.",
      S3: "Risk method gaps.",
      S2: "Governance gaps.",
      S1: "Scope gaps.",
      S11: "Audit context.",
      S12: "Decision gaps."
    }
  };

  const journeyStepHelp = {
    build: {
      S1: "Lock scope, duties, and interfaces so every document stays defensible.",
      S2: "Set decision rights, consultation, and escalation so accountability is clear.",
      S3: "Define the risk method so control choices are consistent and traceable.",
      S4: "List critical hazards and controls that must not fail.",
      S5: "Convert hazards into task plans people can actually use.",
      S6: "Turn plans into procedures and permits with stop‑work triggers.",
      S7: "Verify controls in the field to prove implementation.",
      S8: "Capture incidents and hazards to feed learning.",
      S9: "Assure that controls and plans are followed.",
      S10: "Monitor health exposures and act on results.",
      S11: "Audit the system to test evidence and gaps.",
      S12: "Decide changes, allocate resources, and confirm follow‑through."
    },
    "field-loop": {
      S7: "Work starts here; checks show real control performance.",
      S8: "Incidents reveal weak or failing controls.",
      S9: "Assurance tests if procedures are followed.",
      S10: "Health data exposes hidden risks.",
      S11: "Audits link field evidence to requirements.",
      S12: "Decisions drive updates to controls and procedures.",
      S4: "Update hazard and control libraries from learning.",
      S5: "Translate updates into task plans.",
      S6: "Revise procedures for the next cycle."
    },
    legal: {
      S1: "Legal register and scope are the first regulator check.",
      S2: "Governance proves accountability and consultation.",
      S3: "Risk method shows structured decision‑making.",
      S4: "Critical controls show real risk management.",
      S6: "Procedures and permits prove implementation.",
      S7: "Verification records show controls in place.",
      S9: "Assurance shows checks and follow‑up.",
      S11: "Audit trail shows compliance in practice.",
      S12: "Management review shows oversight and improvement."
    },
    critical: {
      S4: "Define critical controls that cannot fail.",
      S5: "Embed controls in task plans.",
      S6: "Procedures make controls explicit.",
      S7: "Verification proves controls work.",
      S9: "Assurance checks control effectiveness.",
      S8: "Failures reveal control gaps.",
      S12: "Decisions fund and approve fixes."
    },
    audit: {
      S7: "Field records form the evidence base.",
      S8: "Incidents show response and learning.",
      S9: "Assurance shows compliance checks.",
      S10: "Health data shows exposure control.",
      S11: "Audit findings confirm gaps.",
      S12: "Management review shows action and resourcing."
    },
    diagnose: {
      S8: "Start from the failure signal.",
      S7: "Check verification quality.",
      S6: "Check procedure quality and use.",
      S5: "Check task planning and controls.",
      S4: "Check hazard and control definitions.",
      S3: "Check risk method decisions.",
      S2: "Check decision rights and escalation.",
      S1: "Check scope and duty clarity.",
      S11: "Audit history adds context.",
      S12: "Decisions show if fixes were resourced."
    }
  };
  const rolesByRegulation = {
    mining: [
      { id: "operator", name: "Mine operator (MSMS owner)" },
      { id: "provider", name: "Service provider / contractor" }
    ],
    general: [
      { id: "operator", name: "Host PCBU" },
      { id: "provider", name: "Contractor / service provider" }
    ]
  };
  const regulations = [
    { id: "mining", name: "Mining (WHS Mines Regulations 2022)" },
    { id: "general", name: "General WHS (WHS Regulations 2022)" }
  ];

  const mapTrack = document.getElementById("mapTrack");
  const journeySelect = document.getElementById("journeySelect");
  const roleSelect = document.getElementById("roleSelect");
  const regulationSelect = document.getElementById("regulationSelect");
  const journeySummary = document.getElementById("journeySummary");
  const journeyIntent = document.getElementById("journeyIntent");
  const copyChecklist = document.getElementById("copyChecklist");
  const prevStep = document.getElementById("prevStep");
  const nextStep = document.getElementById("nextStep");

  const stepTitle = document.getElementById("stepTitle");
  const stepPurpose = document.getElementById("stepPurpose");
  const stepActions = document.getElementById("stepActions");
  const stepInputs = document.getElementById("stepInputs");
  const stepOutputs = document.getElementById("stepOutputs");
  const stepEvidence = document.getElementById("stepEvidence");
  const stepDocs = document.getElementById("stepDocs");
  const stepDefensible = document.getElementById("stepDefensible");
  const stepReferences = document.getElementById("stepReferences");
  const stepInfluences = document.getElementById("stepInfluences");
  const stepTriggers = document.getElementById("stepTriggers");
  const stepUpstream = document.getElementById("stepUpstream");
  const stepDownstream = document.getElementById("stepDownstream");
  const stepFeedback = document.getElementById("stepFeedback");
  const influencesSection = document.getElementById("influencesSection");
  const triggersSection = document.getElementById("triggersSection");
  const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
  const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));

  if (
    !mapTrack ||
    !journeySelect ||
    !roleSelect ||
    !regulationSelect ||
    !journeySummary ||
    !copyChecklist ||
    !prevStep ||
    !nextStep ||
    !stepTitle ||
    !stepPurpose ||
    !stepActions ||
    !stepInputs ||
    !stepOutputs ||
    !stepEvidence ||
    !stepDocs ||
    !stepDefensible ||
    !stepReferences ||
    !stepInfluences ||
    !stepTriggers ||
    !stepUpstream ||
    !stepDownstream ||
    !stepFeedback ||
    !influencesSection ||
    !triggersSection
  ) {
    return;
  }

  let activeRegulation = regulations[0];
  let activeSteps = stepsByRegulation[activeRegulation.id];
  let activeStep = activeSteps[0];
  let activeJourney = journeys[0];
  let activeRole = null;
  let walkthroughOn = true;

  const createList = (items, target) => {
    target.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      target.appendChild(li);
    });
  };

  const createLinkedList = (items, target) => {
    target.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "link-pill";
      button.textContent = item;
      const id = item.split(" ")[0];
      if (stepById(id)) {
        button.addEventListener("click", () => setActiveStep(id));
      }
      li.appendChild(button);
      target.appendChild(li);
    });
  };

  const createChips = (items, target) => {
    target.innerHTML = "";
    items.forEach((item) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = item;
      target.appendChild(chip);
    });
  };

  const stepById = (id) => activeSteps.find((step) => step.id === id);

  const resolveField = (step, key) => {
    const value = step[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === "object") {
      return value[activeRole.id] || value.default || [];
    }
    return [];
  };

  const getActiveRoles = () =>
    rolesByRegulation[activeRegulation.id] || rolesByRegulation.mining;

  const renderDetail = (step) => {
    stepTitle.textContent = `${step.id} - ${step.name}`;
    stepPurpose.textContent = step.purpose;
    createList(resolveField(step, "actions"), stepActions);
    createList(resolveField(step, "inputs"), stepInputs);
    createList(resolveField(step, "outputs"), stepOutputs);
    createList(resolveField(step, "evidence"), stepEvidence);
    createChips(resolveField(step, "docs"), stepDocs);
    createList(resolveField(step, "defensible"), stepDefensible);
    createList(resolveField(step, "references"), stepReferences);
    createList(resolveField(step, "influences"), stepInfluences);
    createList(resolveField(step, "triggers"), stepTriggers);
    const upstream = step.links.upstream
      .map((id) => stepById(id))
      .filter(Boolean)
      .map((item) => `${item.id} ${item.name}`);
    const downstream = step.links.downstream
      .map((id) => stepById(id))
      .filter(Boolean)
      .map((item) => `${item.id} ${item.name}`);
    const feedback = step.links.feedback
      .map((id) => stepById(id))
      .filter(Boolean)
      .map((item) => `${item.id} ${item.name}`);
    createLinkedList(upstream, stepUpstream);
    createLinkedList(downstream, stepDownstream);
    createLinkedList(feedback, stepFeedback);
  };

  const getMapSteps = () =>
    activeJourney.sequence
      .map((id) => stepById(id))
      .filter(Boolean);

  const renderMap = () => {
    const prevPositions = new Map();
    Array.from(mapTrack.querySelectorAll(".map-node")).forEach((node) => {
      prevPositions.set(node.dataset.step, node.getBoundingClientRect());
    });

    mapTrack.classList.add("is-animating");
    mapTrack.innerHTML = "";
    const mapSteps = getMapSteps();
    mapSteps.forEach((step, index) => {
      const node = document.createElement("button");
      node.className = "map-node";
      node.type = "button";
      node.dataset.step = step.id;
      const helpText =
        (journeyStepHelp[activeJourney.id] && journeyStepHelp[activeJourney.id][step.id]) ||
        "Review why this step appears in the journey and what it unlocks next.";
      node.innerHTML = `
        <div class="map-card">
          <div class="map-face map-front">
            <span class="node-index">${index + 1}</span>
            <span class="node-title">${step.name}</span>
            <span class="node-id">${step.id}</span>
            <button class="map-flip" type="button">Why this step?</button>
          </div>
          <div class="map-face map-back">
            <p class="map-back-title">${step.id} ${step.name}</p>
            <p class="map-back-text">${helpText}</p>
          </div>
        </div>
      `;
      node.addEventListener("click", () => {
        if (node.classList.contains("is-flipped")) {
          node.classList.remove("is-flipped");
        }
        setActiveStep(step.id);
      });
      const flipButtons = node.querySelectorAll(".map-flip");
      flipButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
          event.stopPropagation();
          node.classList.toggle("is-flipped");
        });
      });
      mapTrack.appendChild(node);
    });

    const nodes = Array.from(mapTrack.querySelectorAll(".map-node"));
    nodes.forEach((node) => {
      const prev = prevPositions.get(node.dataset.step);
      if (prev) {
        const next = node.getBoundingClientRect();
        const dx = prev.left - next.left;
        const dy = prev.top - next.top;
        if (dx || dy) {
          node.style.transition = "none";
          node.style.transform = `translate(${dx}px, ${dy}px)`;
          node.style.opacity = "0.6";
          requestAnimationFrame(() => {
            node.style.transition = "transform 450ms ease, opacity 450ms ease";
            node.style.transform = "";
            node.style.opacity = "1";
          });
        }
      } else {
        node.style.opacity = "0";
        requestAnimationFrame(() => {
          node.style.transition = "opacity 350ms ease";
          node.style.opacity = "1";
        });
      }
    });

    window.setTimeout(() => {
      mapTrack.classList.remove("is-animating");
      nodes.forEach((node) => {
        node.style.transition = "";
        node.style.transform = "";
      });
    }, 500);
  };

  const renderJourneyOptions = () => {
    journeySelect.innerHTML = "";
    journeys.forEach((journey) => {
      const option = document.createElement("option");
      option.value = journey.id;
      option.textContent = journey.name;
      journeySelect.appendChild(option);
    });
  };

  const renderRoleOptions = () => {
    roleSelect.innerHTML = "";
    getActiveRoles().forEach((role) => {
      const option = document.createElement("option");
      option.value = role.id;
      option.textContent = role.name;
      roleSelect.appendChild(option);
    });
  };

  const renderRegulationOptions = () => {
    regulationSelect.innerHTML = "";
    regulations.forEach((regulation) => {
      const option = document.createElement("option");
      option.value = regulation.id;
      option.textContent = regulation.name;
      regulationSelect.appendChild(option);
    });
  };

  const setJourney = (journeyId) => {
    activeJourney = journeys.find((j) => j.id === journeyId) || journeys[0];
    journeySummary.textContent = `${activeJourney.summary} (${activeJourney.sequence.length} steps)`;
    if (journeyIntent) {
      journeyIntent.textContent = journeyIntents[activeJourney.id] || "";
    }
    if (!activeJourney.sequence.includes(activeStep.id)) {
      activeStep = stepById(activeJourney.sequence[0]) || activeSteps[0];
    }
    renderMap();
    updateMapStates();
    renderDetail(activeStep);
  };

  const setRegulation = (regulationId) => {
    activeRegulation =
      regulations.find((regulation) => regulation.id === regulationId) ||
      regulations[0];
    activeSteps = stepsByRegulation[activeRegulation.id];
    const nextStep = activeSteps.find((step) => step.id === activeStep.id) || activeSteps[0];
    activeStep = nextStep;
    const nextRoles = getActiveRoles();
    activeRole = nextRoles.find((role) => role.id === activeRole?.id) || nextRoles[0];
    renderRoleOptions();
    roleSelect.value = activeRole.id;
    renderMap();
    updateMapStates();
    renderDetail(activeStep);
  };

  const setActiveStep = (stepId) => {
    const step = stepById(stepId);
    if (!step) return;
    activeStep = step;
    renderDetail(step);
    setActiveTab("actions");
    updateMapStates();
  };

  const updateMapStates = () => {
    const nodes = Array.from(document.querySelectorAll(".map-node"));
    const journeySet = new Set(activeJourney.sequence);

    nodes.forEach((node) => {
      const id = node.dataset.step;
      node.classList.toggle("is-active", id === activeStep.id);
      node.classList.toggle("is-journey", journeySet.has(id));
      node.classList.toggle("is-upstream", activeStep.links.upstream.includes(id));
      node.classList.toggle("is-downstream", activeStep.links.downstream.includes(id));
      node.classList.toggle("is-feedback", activeStep.links.feedback.includes(id));
    });

    highlightDiagram();
    updateWalkthroughButtons();
  };

  const updateWalkthroughButtons = () => {
    const index = activeJourney.sequence.indexOf(activeStep.id);
    prevStep.disabled = index <= 0;
    nextStep.disabled = index === -1 || index >= activeJourney.sequence.length - 1;
  };

  const goStep = (direction) => {
    if (!walkthroughOn) return;
    const index = activeJourney.sequence.indexOf(activeStep.id);
    if (index === -1) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= activeJourney.sequence.length) return;
    setActiveStep(activeJourney.sequence[nextIndex]);
  };

  const highlightDiagram = () => {
    const key = activeStep.id;
    const map = {
      S1: "dangers",
      S2: "dangers",
      S3: "risk",
      S4: "dangers",
      S5: "risk",
      S6: "steps",
      S7: "checks",
      S8: "lessons",
      S9: "findings",
      S10: "lessons",
      S11: "decisions",
      S12: "decisions"
    };
    const activeKey = map[key] || "dangers";
    const svg = document.querySelector(".flow-map svg");
    if (!svg) return;
    const items = svg.querySelectorAll("[data-key], [data-keys]");
    items.forEach((item) => {
      const itemKey = item.getAttribute("data-key");
      const itemKeys = item.getAttribute("data-keys");
      const keys = itemKey
        ? [itemKey]
        : itemKeys
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean);
      const match = keys.includes(activeKey);
      item.classList.toggle("is-active", match);
      item.classList.toggle("is-muted", !match);
    });
  };

  copyChecklist.addEventListener("click", () => {
    const payload = [
      `${activeStep.id} - ${activeStep.name} (${activeRole.name})`,
      "",
      "Required actions:",
      ...resolveField(activeStep, "actions").map((item) => `- ${item}`),
      "",
      "Minimum defensible detail:",
      ...resolveField(activeStep, "defensible").map((item) => `- ${item}`)
    ].join("\n");
    navigator.clipboard.writeText(payload).then(
      () => {
        copyChecklist.textContent = "Copied";
        setTimeout(() => {
          copyChecklist.textContent = "Copy checklist";
        }, 1200);
      },
      () => {
        copyChecklist.textContent = "Copy failed";
      }
    );
  });

  influencesSection.classList.add("is-visible");
  triggersSection.classList.add("is-visible");

  const setActiveTab = (tabId) => {
    tabButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === tabId);
    });
    tabPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === tabId);
    });
  };

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  prevStep.addEventListener("click", () => goStep(-1));
  nextStep.addEventListener("click", () => goStep(1));

  journeySelect.addEventListener("change", (event) => {
    setJourney(event.target.value);
  });
  roleSelect.addEventListener("change", (event) => {
    const roles = getActiveRoles();
    activeRole = roles.find((role) => role.id === event.target.value) || roles[0];
    renderDetail(activeStep);
  });
  regulationSelect.addEventListener("change", (event) => {
    setRegulation(event.target.value);
  });

  renderJourneyOptions();
  activeRole = getActiveRoles()[0];
  renderRoleOptions();
  roleSelect.value = activeRole.id;
  renderRegulationOptions();
  regulationSelect.value = activeRegulation.id;
  setActiveTab("actions");
  setJourney(activeJourney.id);
})();
