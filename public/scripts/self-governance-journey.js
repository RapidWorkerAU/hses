(() => {
  const steps = [
    {
      id: "G1",
      name: "Leadership ownership & accountability",
      purpose: "Name who owns safety and how decisions are made.",
      actions: [
        "Name the safety owner and deputies.",
        "Write down who decides and who must be consulted.",
        "Agree how leaders review safety each month.",
        "Set how leaders remove barriers and resource controls."
      ],
      inputs: ["Org chart", "Role descriptions", "Legal duties list"],
      outputs: ["Named safety owner", "Decision rights map"],
      evidence: ["Signed role statements", "Leadership review notes"],
      defensible: [
        "Named owner for each decision",
        "Consultation rules are written",
        "Leadership review cadence is clear"
      ],
      maturity: {
        reactive: {
          summary: "Ownership is vague or delegated; decisions drift.",
          signals: [
            "No named owner for safety decisions.",
            "Consultation happens after decisions.",
            "Leadership reviews are irregular or skipped.",
            "Safety decisions are pushed down without authority.",
            "People are unsure who signs off on risk changes.",
            "Issues bounce between teams without a clear owner."
          ]
        },
        proactive: {
          summary: "Owners are named; decisions follow a basic cadence.",
          signals: [
            "Owners and deputies are listed.",
            "Consultation rules are followed.",
            "Leaders review safety monthly.",
            "Decision rights are documented in basic terms.",
            "Escalations happen but timing varies.",
            "Accountability is visible in meeting minutes."
          ]
        },
        resilient: {
          summary: "Ownership is visible and drives timely decisions.",
          signals: [
            "Leaders actively remove barriers.",
            "Decisions are fast and risk-led.",
            "Review outcomes are tracked to closure.",
            "Ownership is visible on-site and in governance forums.",
            "Decision trails show who, why, and when.",
            "People can name the owner without hesitation."
          ]
        }
      },
      docs: ["Governance map", "Accountability matrix"],
      links: { upstream: [], downstream: ["G2", "G3"], feedback: ["G6"] }
    },
    {
      id: "G2",
      name: "Decision rights & escalation",
      purpose: "Make sure high-risk decisions are made at the right level.",
      actions: [
        "Define approval thresholds for high-risk work.",
        "Set stop-work authority and triggers.",
        "Create escalation timeframes for control failures."
      ],
      inputs: ["High-risk tasks", "Permit rules", "Critical control list"],
      outputs: ["Approval matrix", "Stop-work triggers"],
      evidence: ["Approved decision matrix", "Stop-work rule briefings"],
      defensible: [
        "Approval thresholds are written",
        "Escalation timeframes are clear",
        "Stop-work authority is known"
      ],
      maturity: {
        reactive: {
          summary: "Approvals are informal and inconsistent.",
          signals: [
            "High-risk approvals are ad hoc.",
            "Stop-work authority is unclear.",
            "Escalations happen late.",
            "Permit decisions vary by supervisor.",
            "Risk thresholds are not written.",
            "People avoid escalation to keep work moving."
          ]
        },
        proactive: {
          summary: "Decision rights are documented and mostly followed.",
          signals: [
            "Approval thresholds are written.",
            "Stop-work triggers are briefed.",
            "Escalation timeframes are defined.",
            "Decision matrices are used but not audited.",
            "Higher-risk work gets senior review.",
            "Exceptions are handled case by case."
          ]
        },
        resilient: {
          summary: "Decisions align to risk and are made quickly.",
          signals: [
            "Escalations happen early.",
            "Decision trails are clear and complete.",
            "Risk approvals match capability.",
            "Stop-work is used without penalty.",
            "Escalation triggers are tested and refined.",
            "People can explain decision rights in plain terms."
          ]
        }
      },
      docs: ["Decision rights matrix", "Stop-work rules", "Permit process"],
      links: { upstream: ["G1"], downstream: ["G3", "G4"], feedback: ["G6"] }
    },
    {
      id: "G3",
      name: "Legal & risk governance",
      purpose: "Translate legal duties and risk boundaries into controls.",
      actions: [
        "Maintain the legal register and owners.",
        "Define critical risks and control standards.",
        "Set how controls are verified."
      ],
      inputs: ["Legal register", "Risk assessments", "Incident trends"],
      outputs: ["Critical control standards", "Verification plan"],
      evidence: ["Updated legal register", "Control standards approved"],
      defensible: [
        "Legal sources are current",
        "Critical controls are defined",
        "Verification is documented"
      ],
      maturity: {
        reactive: {
          summary: "Legal duties and risks are unclear or outdated.",
          signals: [
            "Legal register is incomplete.",
            "Critical risks are implied, not written.",
            "Verification is missing.",
            "Legal changes are not tracked.",
            "Risk controls are generic or copied.",
            "People are unsure what the duty requires."
          ]
        },
        proactive: {
          summary: "Duties and risks are documented with basic checks.",
          signals: [
            "Legal register is current.",
            "Critical risks have standards.",
            "Verification is scheduled.",
            "Legal duties are mapped to controls.",
            "Standards exist but quality varies.",
            "Assurance focuses on high-profile areas."
          ]
        },
        resilient: {
          summary: "Controls are owned and tested against performance.",
          signals: [
            "Legal changes trigger updates fast.",
            "Control standards are enforced.",
            "Verification results drive decisions.",
            "Control performance is measured and reviewed.",
            "Risk decisions are consistent across teams.",
            "People can explain the duty and the control."
          ]
        }
      },
      docs: ["Legal register", "Critical risk register", "Control standards"],
      links: { upstream: ["G1", "G2"], downstream: ["G4"], feedback: ["G6"] }
    },
    {
      id: "G4",
      name: "Governance routines",
      purpose: "Create a repeatable cycle for decisions, actions, and checks.",
      actions: [
        "Set meeting cadence and agenda.",
        "Track actions in one place with owners and dates.",
        "Review control performance and close actions."
      ],
      inputs: ["Meeting agenda", "Action backlog", "Assurance results"],
      outputs: ["Meeting minutes", "Closed actions"],
      evidence: ["Minutes with decisions", "Action close-out proof"],
      defensible: [
        "Meetings are regular",
        "Actions are closed with evidence",
        "Decisions are recorded"
      ],
      maturity: {
        reactive: {
          summary: "Routines are inconsistent and not followed through.",
          signals: [
            "Meetings are missed.",
            "Actions have no owners.",
            "Decisions are not recorded.",
            "Action lists are outdated or lost.",
            "Follow-up depends on individuals.",
            "Issues recur without closure."
          ]
        },
        proactive: {
          summary: "Routines are scheduled with partial follow-through.",
          signals: [
            "Meetings follow a cadence.",
            "Actions are tracked but lag.",
            "Decisions are documented.",
            "Action owners are listed.",
            "Close-out evidence is inconsistent.",
            "Agenda covers controls but not trends."
          ]
        },
        resilient: {
          summary: "Routines keep governance alive and accountable.",
          signals: [
            "Actions close with evidence.",
            "Control performance is reviewed.",
            "Decisions drive real change.",
            "Trends are reviewed and acted on quickly.",
            "Routines trigger resource shifts.",
            "Teams can show decision follow-through."
          ]
        }
      },
      docs: ["Meeting schedule", "Minutes template", "Action register"],
      links: { upstream: ["G2", "G3"], downstream: ["G5"], feedback: ["G6"] }
    },
    {
      id: "G5",
      name: "Assurance & verification",
      purpose: "Test if governance is working in practice.",
      actions: [
        "Check critical control verification records.",
        "Audit decision trails and approvals.",
        "Confirm escalation occurred on time."
      ],
      inputs: ["Verification logs", "Audit results", "Escalation records"],
      outputs: ["Assurance findings", "Governance gaps list"],
      evidence: ["Audit reports", "Verification logs"],
      defensible: [
        "Assurance is scheduled",
        "Findings are recorded",
        "Escalations are traceable"
      ],
      maturity: {
        reactive: {
          summary: "Assurance is sporadic and misses weak signals.",
          signals: [
            "Verification logs are incomplete.",
            "Findings are not tracked.",
            "Escalations are late or absent.",
            "Assurance focuses on paperwork only.",
            "Repeat issues are not flagged.",
            "No clear plan for what to test."
          ]
        },
        proactive: {
          summary: "Assurance exists but is not fully acted on.",
          signals: [
            "Audits run to schedule.",
            "Findings are recorded.",
            "Escalations are documented.",
            "Verification checks some critical controls.",
            "Actions are assigned but drift.",
            "Assurance is reactive to incidents."
          ]
        },
        resilient: {
          summary: "Assurance actively tests and strengthens governance.",
          signals: [
            "Trends trigger immediate action.",
            "Findings close with evidence.",
            "Assurance shapes priorities.",
            "Verification focuses on control performance.",
            "Weak signals are treated early.",
            "Leaders ask for assurance insights."
          ]
        }
      },
      docs: ["Assurance schedule", "Audit checklist", "Findings register"],
      links: { upstream: ["G4"], downstream: ["G6"], feedback: ["G3"] }
    },
    {
      id: "G6",
      name: "Management review & reset",
      purpose: "Decide changes and make governance stronger.",
      actions: [
        "Review trends and weak signals.",
        "Approve fixes and resource them.",
        "Update roles, controls, and routines."
      ],
      inputs: ["Trend reports", "Audit findings", "Incidents"],
      outputs: ["Decisions with owners", "Updated governance plan"],
      evidence: ["Management review minutes", "Updated plans"],
      defensible: [
        "Decisions are recorded",
        "Resources are assigned",
        "Updates are communicated"
      ],
      maturity: {
        reactive: {
          summary: "Reviews are irregular and decisions are slow.",
          signals: [
            "Trends are reviewed late.",
            "Decisions lack owners.",
            "Updates are not communicated.",
            "Actions are deferred without reasons.",
            "Resources do not shift to risk.",
            "Lessons are not shared."
          ]
        },
        proactive: {
          summary: "Reviews happen and drive some improvements.",
          signals: [
            "Trends are reviewed on schedule.",
            "Decisions have owners.",
            "Updates are communicated.",
            "Action plans exist but timing varies.",
            "Resources shift for high-risk issues.",
            "Learnings are shared after incidents."
          ]
        },
        resilient: {
          summary: "Reviews reset the system and reallocate resources fast.",
          signals: [
            "Weak signals trigger change.",
            "Resources shift to risk.",
            "Lessons are embedded quickly.",
            "Decisions are reviewed for effectiveness.",
            "Changes are tested and sustained.",
            "People can explain why changes were made."
          ]
        }
      },
      docs: ["Management review minutes", "Updated governance plan"],
      links: { upstream: ["G5"], downstream: ["G1", "G2"], feedback: ["G1"] }
    }
  ];

  const journeys = [
    {
      id: "build",
      name: "Build strong governance",
      summary: "Start with ownership and build through decisions, controls, and routines.",
      sequence: ["G1", "G2", "G3", "G4", "G5", "G6"]
    },
    {
      id: "diagnose",
      name: "Pressure test governance",
      summary: "Start with weak signals and trace back to decision failures.",
      sequence: ["G5", "G4", "G3", "G2", "G1", "G6"]
    }
  ];

  const journeyIntents = {
    build: "Build the core: ownership -> decision rights -> risk controls -> routines -> assurance -> review.",
    diagnose: "Pressure test: assurance failures -> routines -> risk -> decisions -> ownership -> reset."
  };

  const journeyStepHelp = {
    build: {
      G1: "Start with ownership so decisions have a clear home.",
      G2: "Set decision rights so risk approvals are clear.",
      G3: "Translate duties into critical controls.",
      G4: "Create routines that keep governance alive.",
      G5: "Verify governance works in practice.",
      G6: "Reset priorities and improve."
    },
    diagnose: {
      G5: "Start with what failed in assurance.",
      G4: "Check if routines caught the issues.",
      G3: "Test if controls were defined right.",
      G2: "Check if approvals were right.",
      G1: "Check ownership clarity.",
      G6: "Agree fixes and reset."
    }
  };

  const el = (id) => document.getElementById(id);
  const mapTrack = el("govMapTrack");
  const journeySelect = el("govJourneySelect");
  const journeyIntent = el("govJourneyIntent");
  const stepTitle = el("govStepTitle");
  const stepPurpose = el("govStepPurpose");
  const stepActions = el("govStepActions");
  const stepInputs = el("govStepInputs");
  const stepOutputs = el("govStepOutputs");
  const stepEvidence = el("govStepEvidence");
  const stepDefensible = el("govStepDefensible");
  const stepDocs = el("govStepDocs");
  const stepUpstream = el("govStepUpstream");
  const stepDownstream = el("govStepDownstream");
  const stepFeedback = el("govStepFeedback");
  const stepMaturityReactiveList = el("govStepMaturityReactiveList");
  const stepMaturityProactiveList = el("govStepMaturityProactiveList");
  const stepMaturityResilientList = el("govStepMaturityResilientList");
  const prevStep = el("govPrevStep");
  const nextStep = el("govNextStep");

  const tabButtons = Array.from(document.querySelectorAll(".gov-tab"));
  const tabPanels = Array.from(document.querySelectorAll(".gov-tab-panel"));

  if (
    !mapTrack ||
    !journeySelect ||
    !journeyIntent ||
    !stepTitle ||
    !stepPurpose ||
    !stepActions ||
    !stepInputs ||
    !stepOutputs ||
    !stepEvidence ||
    !stepDefensible ||
    !stepDocs ||
    !stepUpstream ||
    !stepDownstream ||
    !stepFeedback ||
    !stepMaturityReactiveList ||
    !stepMaturityProactiveList ||
    !stepMaturityResilientList ||
    !prevStep ||
    !nextStep
  ) {
    return;
  }

  let activeJourney = journeys[0];
  let activeStep = steps[0];

  const stepById = (id) => steps.find((step) => step.id === id);

  const renderList = (items, target) => {
    target.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      target.appendChild(li);
    });
  };

  const renderChips = (items, target) => {
    target.innerHTML = "";
    items.forEach((item) => {
      const chip = document.createElement("span");
      chip.className = "gov-chip";
      chip.textContent = item;
      target.appendChild(chip);
    });
  };

  const renderLinked = (items, target) => {
    target.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      target.appendChild(li);
    });
  };

  const renderDetail = (step) => {
    stepTitle.textContent = `${step.id} — ${step.name}`;
    stepPurpose.textContent = step.purpose;
    renderList(step.actions, stepActions);
    renderList(step.inputs, stepInputs);
    renderList(step.outputs, stepOutputs);
    renderList(step.evidence, stepEvidence);
    renderList(step.defensible, stepDefensible);
    renderChips(step.docs, stepDocs);
    renderList(step.maturity.reactive.signals, stepMaturityReactiveList);
    renderList(step.maturity.proactive.signals, stepMaturityProactiveList);
    renderList(step.maturity.resilient.signals, stepMaturityResilientList);
    renderLinked(
      step.links.upstream.map((id) => `${id} ${stepById(id).name}`),
      stepUpstream
    );
    renderLinked(
      step.links.downstream.map((id) => `${id} ${stepById(id).name}`),
      stepDownstream
    );
    renderLinked(
      step.links.feedback.map((id) => `${id} ${stepById(id).name}`),
      stepFeedback
    );
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

  const renderMap = () => {
    mapTrack.innerHTML = "";
    const mapSteps = activeJourney.sequence.map((id) => stepById(id)).filter(Boolean);
    mapSteps.forEach((step, index) => {
      const node = document.createElement("button");
      node.className = "gov-map-node";
      node.type = "button";
      node.dataset.step = step.id;
      const help =
        (journeyStepHelp[activeJourney.id] && journeyStepHelp[activeJourney.id][step.id]) ||
        "Why this step matters.";
      node.innerHTML = `
        <div class="gov-map-card">
          <div class="gov-map-face gov-map-front">
            <span class="gov-map-index">${index + 1}</span>
            <span class="gov-map-title">${step.name}</span>
            <span class="gov-map-id">${step.id}</span>
            <button class="gov-map-flip" type="button">Why this step?</button>
          </div>
          <div class="gov-map-face gov-map-back">
            <p class="gov-map-back-title">${step.id} ${step.name}</p>
            <p class="gov-map-back-text">${help}</p>
          </div>
        </div>
      `;
      node.addEventListener("click", () => {
        if (node.classList.contains("is-flipped")) {
          node.classList.remove("is-flipped");
        }
        setActiveStep(step.id);
      });
      node.querySelectorAll(".gov-map-flip").forEach((btn) => {
        btn.addEventListener("click", (event) => {
          event.stopPropagation();
          node.classList.toggle("is-flipped");
        });
      });
      mapTrack.appendChild(node);
    });
  };

  const updateMapStates = () => {
    const nodes = Array.from(document.querySelectorAll(".gov-map-node"));
    nodes.forEach((node) => {
      const id = node.dataset.step;
      node.classList.toggle("is-active", id === activeStep.id);
      node.classList.toggle("is-upstream", activeStep.links.upstream.includes(id));
      node.classList.toggle("is-downstream", activeStep.links.downstream.includes(id));
      node.classList.toggle("is-feedback", activeStep.links.feedback.includes(id));
    });
  };

  const setActiveStep = (stepId) => {
    const step = stepById(stepId);
    if (!step) return;
    activeStep = step;
    renderDetail(step);
    setActiveTab("actions");
    updateMapStates();
  };

  const setJourney = (journeyId) => {
    activeJourney = journeys.find((j) => j.id === journeyId) || journeys[0];
    journeyIntent.textContent = journeyIntents[activeJourney.id] || "";
    const first = stepById(activeJourney.sequence[0]) || steps[0];
    setActiveStep(first.id);
    renderMap();
    updateMapStates();
  };

  const setActiveTab = (tabId) => {
    tabButtons.forEach((button) => {
      button.classList.toggle("is-active", button.dataset.tab === tabId);
    });
    tabPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.panel === tabId);
    });
  };

  journeySelect.addEventListener("change", (event) => {
    setJourney(event.target.value);
  });

  prevStep.addEventListener("click", () => {
    const index = activeJourney.sequence.indexOf(activeStep.id);
    if (index > 0) setActiveStep(activeJourney.sequence[index - 1]);
  });
  nextStep.addEventListener("click", () => {
    const index = activeJourney.sequence.indexOf(activeStep.id);
    if (index < activeJourney.sequence.length - 1) {
      setActiveStep(activeJourney.sequence[index + 1]);
    }
  });

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });

  renderJourneyOptions();
  setActiveTab("actions");
  setJourney(activeJourney.id);
})();
