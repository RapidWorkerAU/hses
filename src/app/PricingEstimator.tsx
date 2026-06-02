"use client";

import { useRef, useState } from "react";
import styles from "./PricingEstimator.module.css";

type QuoteType = "" | "document_development" | "management_system_design" | "safety_technology";
type UrgencyType = "" | "soon" | "scheduled" | "exploring";
type Step = 1 | 2 | 3;

const quoteTypes: Array<{
  value: Exclude<QuoteType, "">;
  label: string;
  description: string;
}> = [
  {
    value: "document_development",
    label: "Document Development",
    description: "Policies, procedures, plans, registers, forms, templates, and supporting document sets.",
  },
  {
    value: "management_system_design",
    label: "Management System Design",
    description: "Safety management systems, system architecture, governance structure, and implementation support.",
  },
  {
    value: "safety_technology",
    label: "Safety Technology",
    description: "Digital tools, system maps, workflow support, dashboards, and practical safety technology options.",
  },
];

const urgencyOptions: Array<{
  value: Exclude<UrgencyType, "">;
  label: string;
  description: string;
}> = [
  {
    value: "soon",
    label: "Urgent",
    description: "There is a deadline or external pressure.",
  },
  {
    value: "scheduled",
    label: "Planned",
    description: "Needed soon, with time to scope properly.",
  },
  {
    value: "exploring",
    label: "Exploring",
    description: "Still working out what is needed.",
  },
];

function getQuoteTypeLabel(value: QuoteType) {
  return quoteTypes.find((type) => type.value === value)?.label ?? "";
}

function getUrgencyLabel(value: UrgencyType) {
  return urgencyOptions.find((option) => option.value === value)?.label ?? "";
}

export default function PricingEstimator() {
  const [step, setStep] = useState<Step>(1);
  const [quoteType, setQuoteType] = useState<QuoteType>("");
  const [urgency, setUrgency] = useState<UrgencyType>("");
  const [urgencyDetails, setUrgencyDetails] = useState("");
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const urgencyDetailsRef = useRef<HTMLTextAreaElement | null>(null);

  const goToStepTwo = () => {
    setError(null);

    if (!quoteType) {
      setError("Please choose the type of quote you would like to discuss.");
      return;
    }

    setStep(2);
  };

  const goToStepThree = () => {
    setError(null);

    if (!urgency) {
      setError("Please choose how urgent the work is.");
      return;
    }

    if (!urgencyDetails.trim()) {
      setError("Please tell us a little about the project or work needed.");
      return;
    }

    setStep(3);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !businessName.trim() || !email.trim()) {
      setError("Please complete your name, business name, and email.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/public/pricing-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteType,
          quoteTypeLabel: getQuoteTypeLabel(quoteType),
          urgency,
          urgencyLabel: getUrgencyLabel(urgency),
          urgencyDetails: urgencyDetails.trim(),
          name: name.trim(),
          businessName: businessName.trim(),
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        setError(text || "We could not send your enquiry. Please try again.");
        return;
      }

      window.location.assign("/contact/success");
    } catch {
      setError("We could not send your enquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className={styles.estimator}>
      <div className={styles.card}>
        <div className={styles.panelHeader}>
          <h3>Request a Quote</h3>
        </div>

        <div className={styles.progress}>
          <div className={styles.progressMeta}>
            <span>Step {step} of 3</span>
            <span>{progressPercent}%</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {step === 1 ? (
          <div className={styles.form}>
            <div className={styles.section}>
              <div className={styles.sectionTopSingle}>
                <h4>What are you interested in?</h4>
                <p>
                  Choose the area that best matches the work you are planning. If the work crosses more than
                  one area, choose the closest fit and add the extra context in the next step.
                </p>
              </div>

              <div className={styles.optionGrid}>
                {quoteTypes.map((type) => {
                  const isSelected = quoteType === type.value;

                  return (
                    <button
                      key={type.value}
                      className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                      type="button"
                      onClick={() => {
                        setQuoteType(type.value);
                        setError(null);
                      }}
                      aria-pressed={isSelected}
                    >
                      <span>{type.label}</span>
                      <small>{type.description}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.actions}>
              <button className={styles.submitButton} type="button" onClick={goToStepTwo}>
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className={styles.form}>
            <div className={styles.section}>
              <div className={styles.sectionTopSingle}>
                <h4>How urgent is the work?</h4>
              </div>

              <div className={styles.urgencyGrid}>
                {urgencyOptions.map((option) => {
                  const isSelected = urgency === option.value;

                  return (
                    <button
                      key={option.value}
                      className={`${styles.optionCard} ${styles.urgencyCard} ${
                        isSelected ? styles.optionCardSelected : ""
                      }`}
                      type="button"
                      onClick={() => {
                        setUrgency(isSelected ? "" : option.value);
                        setError(null);
                      }}
                      aria-pressed={isSelected}
                    >
                      <span>{option.label}</span>
                      <small>{option.description}</small>
                    </button>
                  );
                })}
              </div>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Project or work details</span>
                <textarea
                  ref={urgencyDetailsRef}
                  value={urgencyDetails}
                  onChange={(event) => {
                    setUrgencyDetails(event.target.value);
                    event.target.style.height = "auto";
                    event.target.style.height = `${event.target.scrollHeight}px`;
                  }}
                  rows={3}
                  required
                />
              </label>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.actions}>
              <button className={styles.secondaryButton} type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button className={styles.submitButton} type="button" onClick={goToStepThree}>
                Continue
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.section}>
              <div className={styles.sectionTopSingle}>
                <h4>Your details</h4>
                <p>We will use these details to respond to your quote enquiry.</p>
              </div>

              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Name</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} required />
                </label>

                <label className={styles.field}>
                  <span>Business Name</span>
                  <input
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Email Address</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <label className={styles.field}>
                  <span>Phone Number</span>
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} />
                </label>
              </div>
            </div>

            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.actions}>
              <button className={styles.secondaryButton} type="button" onClick={() => setStep(2)}>
                Back
              </button>
              <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Submit Enquiry"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
}
