(() => {
  const tabs = Array.from(document.querySelectorAll(".gov-tab"));
  const stepsEl = document.getElementById("govSteps");
  const looksEl = document.getElementById("govLooks");
  const soundsEl = document.getElementById("govSounds");
  const feelsEl = document.getElementById("govFeels");
  const signalsEl = document.getElementById("govSignals");
  const docsEl = document.getElementById("govDocs");
  const peopleEl = document.getElementById("govPeople");
  const panelTitle = document.getElementById("govPanelTitle");
  const panelIntro = document.getElementById("govPanelIntro");

  if (
    !stepsEl ||
    !looksEl ||
    !soundsEl ||
    !feelsEl ||
    !signalsEl ||
    !docsEl ||
    !peopleEl ||
    !panelTitle ||
    !panelIntro
  ) {
    return;
  }

  const data = {
    build: {
      title: "Build strong governance in simple steps",
      intro:
        "Use this path when you are building from scratch or lifting a weak system. Keep it simple and repeat it every month.",
      steps: [
        {
          title: "Name owners and decision rights",
          intent: "People know who decides and who must be consulted.",
          inputs: ["Org chart", "Role descriptions", "Legal duties list"],
          outputs: ["Decision rights matrix", "Named safety owner"],
          docs: ["Governance map", "Accountability matrix"]
        },
        {
          title: "Set your safety decision rhythm",
          intent: "Leaders meet often enough to control risk.",
          inputs: ["Risk list", "Recent incidents", "Action backlog"],
          outputs: ["Meeting cadence", "Agenda template"],
          docs: ["Governance meeting schedule", "Minutes template"]
        },
        {
          title: "Define critical risks and controls",
          intent: "Everyone knows the few controls that must not fail.",
          inputs: ["Risk assessments", "Critical control list"],
          outputs: ["Critical control standard"],
          docs: ["Critical risk register", "Control standards"]
        },
        {
          title: "Set approval and stop-work rules",
          intent: "High-risk work is approved and stopped when needed.",
          inputs: ["High-risk tasks", "Permit rules"],
          outputs: ["Approval thresholds", "Stop-work triggers"],
          docs: ["Permit-to-work process", "Stop-work rules"]
        },
        {
          title: "Track actions and verify close-out",
          intent: "Issues are fixed and proven, not just logged.",
          inputs: ["Audit findings", "Incidents", "Assurance results"],
          outputs: ["Closed actions", "Evidence of fix"],
          docs: ["Action register", "Close-out evidence"]
        },
        {
          title: "Review and reset",
          intent: "Leadership checks what changed and what still needs work.",
          inputs: ["Trend reports", "Action status", "Control performance"],
          outputs: ["Management decisions", "Updated priorities"],
          docs: ["Management review minutes", "Updated plan"]
        }
      ],
      looks: [
        "Clear org chart with safety roles and backups.",
        "Decision records with dates and signatures.",
        "A small set of critical risks and controls everyone knows.",
        "Actions closed on time, not parked."
      ],
      sounds: [
        "“We know who owns this decision.”",
        "“Show me the control check before we start.”",
        "“We stop work when the control fails.”"
      ],
      feels: [
        "People speak up without fear.",
        "Leaders ask for evidence, not opinions.",
        "Work feels planned, not rushed."
      ],
      signals: [
        "Decisions are slow or unclear.",
        "The same issues repeat each month.",
        "Controls are on paper but not checked.",
        "People avoid raising bad news."
      ],
      docs: [
        "Governance map",
        "Decision rights matrix",
        "Critical risk register",
        "Meeting minutes",
        "Action tracker",
        "Verification records"
      ],
      people:
        "People should know: who decides, what to do when a control fails, and how to raise issues fast."
    },
    diagnose: {
      title: "Pressure test governance when it feels off",
      intro:
        "Use this path when you feel chronic unease or a near miss shakes confidence. Start with signals, then test decisions.",
      steps: [
        {
          title: "Start from the last failure",
          intent: "Anchor the review in a real event, not theory.",
          inputs: ["Incident report", "Witness notes"],
          outputs: ["Timeline of events", "Key decision points"],
          docs: ["Incident log", "Investigation notes"]
        },
        {
          title: "Trace the decision trail",
          intent: "Find who approved, who checked, and who escalated.",
          inputs: ["Approvals", "Permits", "Emails or records"],
          outputs: ["Decision trail map"],
          docs: ["Approval records", "Decision matrix"]
        },
        {
          title: "Verify critical control checks",
          intent: "Prove controls were checked before the task.",
          inputs: ["Prestart records", "Verification logs"],
          outputs: ["Control check evidence"],
          docs: ["Verification records", "Checklists"]
        },
        {
          title: "Compare plan vs reality",
          intent: "See where the plan was bypassed or unclear.",
          inputs: ["Procedures", "SWMS or plans"],
          outputs: ["Gaps between plan and work"],
          docs: ["Task plans", "Work procedures"]
        },
        {
          title: "Test governance routines",
          intent: "See if leaders saw the risk and acted.",
          inputs: ["Meeting minutes", "Action tracker"],
          outputs: ["Missed signals list"],
          docs: ["Governance minutes", "Action register"]
        },
        {
          title: "Fix, assign, verify",
          intent: "Agree the fix and check it sticks.",
          inputs: ["Findings", "Root causes"],
          outputs: ["Assigned fixes", "Verification plan"],
          docs: ["Corrective action plan", "Verification plan"]
        }
      ],
      looks: [
        "Decision trail is clear and time-stamped.",
        "Control checks exist and match the task.",
        "Leaders can explain why a decision was made.",
        "Actions are closed with proof."
      ],
      sounds: [
        "“Here is the approval and the control check.”",
        "“We escalated within the set time.”",
        "“This change is now in the procedure.”"
      ],
      feels: [
        "Clarity instead of blame.",
        "People trust the process.",
        "Fixes actually change work."
      ],
      signals: [
        "Approvals are verbal or missing.",
        "Controls are checked after the task.",
        "Leaders are surprised by incidents.",
        "The same fix keeps returning."
      ],
      docs: [
        "Incident report",
        "Approval records",
        "Control verification logs",
        "Meeting minutes",
        "Action close-out evidence"
      ],
      people:
        "People should know: the escalation path, the stop-work rule, and how to report weak signals."
    }
  };

  const renderList = (items, target) => {
    target.innerHTML = "";
    items.forEach((item) => {
      const li = document.createElement("li");
      li.textContent = item;
      target.appendChild(li);
    });
  };

  const renderSteps = (items, target) => {
    target.innerHTML = "";
    items.forEach((step, index) => {
      const card = document.createElement("div");
      card.className = "gov-step";
      card.innerHTML = `
        <div class="gov-step-head">
          <span class="gov-step-index">${index + 1}</span>
          <h4>${step.title}</h4>
        </div>
        <p class="gov-step-intent">${step.intent}</p>
        <div class="gov-step-grid">
          <div>
            <p class="gov-kicker">Inputs</p>
            <ul>${step.inputs.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
          <div>
            <p class="gov-kicker">Outputs</p>
            <ul>${step.outputs.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
          <div>
            <p class="gov-kicker">Documents</p>
            <ul>${step.docs.map((item) => `<li>${item}</li>`).join("")}</ul>
          </div>
        </div>
      `;
      target.appendChild(card);
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

  const setTab = (id) => {
    const payload = data[id] || data.build;
    panelTitle.textContent = payload.title;
    panelIntro.textContent = payload.intro;
    renderSteps(payload.steps, stepsEl);
    renderList(payload.looks, looksEl);
    renderList(payload.sounds, soundsEl);
    renderList(payload.feels, feelsEl);
    renderList(payload.signals, signalsEl);
    renderChips(payload.docs, docsEl);
    peopleEl.textContent = payload.people;
    tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.tab === id);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => setTab(tab.dataset.tab));
  });

  setTab("build");
})();
