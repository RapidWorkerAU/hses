"use client";

import { useMemo, useState } from "react";
import styles from "./PricingEstimator.module.css";

const HOURLY_RATE = 150;
const GST_RATE = 0.1;

const documentOptions = [
  { label: "Manual", developmentHours: 24, reviewHours: 3, finalApprovalHours: 2 },
  { label: "Policy", developmentHours: 8, reviewHours: 1, finalApprovalHours: 1 },
  { label: "Management Plan", developmentHours: 38, reviewHours: 3, finalApprovalHours: 2 },
  { label: "Risk Assessment", developmentHours: 16, reviewHours: 4, finalApprovalHours: 2 },
  { label: "Guidance Note", developmentHours: 24, reviewHours: 2, finalApprovalHours: 1 },
  { label: "Procedure", developmentHours: 24, reviewHours: 2, finalApprovalHours: 2 },
  { label: "Work Instruction", developmentHours: 24, reviewHours: 3, finalApprovalHours: 2 },
  { label: "Form / Template", developmentHours: 8, reviewHours: 1, finalApprovalHours: 1 },
] as const;

const discoveryHours = 38;

const investigationOptions = {
  simple: 16,
  advanced: 38,
} as const;

const appOptions = {
  simple: 38,
  advanced: 95,
  complex: 228,
} as const;

type ServiceType = "" | "document_development" | "app_development" | "incident_investigation";
type InvestigationLevel = "" | keyof typeof investigationOptions;
type AppLevel = "" | keyof typeof appOptions;
type Step = 1 | 2 | 3;

type SubmittedEstimate =
  | {
      serviceType: "document_development";
      email: string;
      developmentHours: number;
      reviewHours: number;
      finalApprovalHours: number;
      totalHours: number;
      discoveryIncluded: boolean;
      documentSummary: Array<{ label: string; quantity: number }>;
    }
  | {
      serviceType: "incident_investigation";
      email: string;
      totalHours: number;
      level: keyof typeof investigationOptions;
    }
  | {
      serviceType: "app_development";
      email: string;
      totalHours: number;
      level: keyof typeof appOptions;
    };

function formatWholeHours(value: number) {
  return new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSelectionLabel(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export default function PricingEstimator() {
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [serviceType, setServiceType] = useState<ServiceType>("");
  const [investigationLevel, setInvestigationLevel] = useState<InvestigationLevel>("");
  const [appLevel, setAppLevel] = useState<AppLevel>("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedEstimate, setSubmittedEstimate] = useState<SubmittedEstimate | null>(null);

  const documentTotals = useMemo(() => {
    const baseTotals = documentOptions.reduce(
      (acc, option) => {
        const qty = quantities[option.label] ?? 0;
        acc.developmentHours += option.developmentHours * qty;
        acc.reviewHours += option.reviewHours * qty;
        acc.finalApprovalHours += option.finalApprovalHours * qty;
        acc.hasSelections = acc.hasSelections || qty > 0;
        return acc;
      },
      {
        developmentHours: 0,
        reviewHours: 0,
        finalApprovalHours: 0,
        hasSelections: false,
      }
    );

    const discoveryIncluded = true;
    const developmentHours =
      baseTotals.developmentHours + (discoveryIncluded ? discoveryHours : 0);
    const reviewHours = baseTotals.reviewHours;
    const finalApprovalHours = baseTotals.finalApprovalHours;
    const totalHours = developmentHours + reviewHours + finalApprovalHours;
    const subtotalExGst = totalHours * HOURLY_RATE;
    const gstAmount = subtotalExGst * GST_RATE;
    const totalIncGst = subtotalExGst + gstAmount;

    return {
      ...baseTotals,
      discoveryIncluded,
      developmentHours,
      reviewHours,
      finalApprovalHours,
      totalHours,
      subtotalExGst,
      gstAmount,
      totalIncGst,
    };
  }, [quantities]);

  const investigationTotals = useMemo(() => {
    if (!investigationLevel) return null;
    const totalHours = investigationOptions[investigationLevel];
    const subtotalExGst = totalHours * HOURLY_RATE;
    const gstAmount = subtotalExGst * GST_RATE;
    const totalIncGst = subtotalExGst + gstAmount;
    return { totalHours, subtotalExGst, gstAmount, totalIncGst };
  }, [investigationLevel]);

  const appTotals = useMemo(() => {
    if (!appLevel) return null;
    const totalHours = appOptions[appLevel];
    const subtotalExGst = totalHours * HOURLY_RATE;
    const gstAmount = subtotalExGst * GST_RATE;
    const totalIncGst = subtotalExGst + gstAmount;
    return { totalHours, subtotalExGst, gstAmount, totalIncGst };
  }, [appLevel]);

  const setDocumentQuantity = (label: string, nextValue: number) => {
    setQuantities((current) => ({
      ...current,
      [label]: Number.isFinite(nextValue) && nextValue > 0 ? Math.floor(nextValue) : 0,
    }));
  };

  const resetEstimator = () => {
    setStep(1);
    setName("");
    setBusinessName("");
    setEmail("");
    setServiceType("");
    setInvestigationLevel("");
    setAppLevel("");
    setQuantities({});
    setError(null);
    setIsSubmitting(false);
    setSubmittedEstimate(null);
  };

  const goToStepTwo = () => {
    setError(null);

    if (!name.trim() || !businessName.trim() || !email.trim()) {
      setError("Please complete your name, business name, and email.");
      return;
    }

    if (!serviceType) {
      setError("Please choose what you would like a price on.");
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (serviceType === "document_development") {
      if (!documentTotals.hasSelections) {
        setError("Please add at least one document quantity.");
        return;
      }
    }

    if (serviceType === "incident_investigation" && !investigationLevel) {
      setError("Please choose a level for investigation facilitation.");
      return;
    }

    if (serviceType === "app_development" && !appLevel) {
      setError("Please choose a complexity level for app development.");
      return;
    }

    let payload:
      | {
          name: string;
          businessName: string;
          email: string;
          serviceType: ServiceType;
          subtotalExGst: number;
          gstAmount: number;
          totalIncGst: number;
          totalHours: number;
          breakdown: Record<string, unknown>;
        }
      | null = null;

    let nextSubmittedEstimate: SubmittedEstimate | null = null;

    if (serviceType === "document_development") {
      payload = {
        name: name.trim(),
        businessName: businessName.trim(),
        email: email.trim(),
        serviceType,
        subtotalExGst: documentTotals.subtotalExGst,
        gstAmount: documentTotals.gstAmount,
        totalIncGst: documentTotals.totalIncGst,
        totalHours: documentTotals.totalHours,
        breakdown: {
          newBusiness: "yes",
          discoveryIncluded: true,
          developmentHours: documentTotals.developmentHours,
          reviewHours: documentTotals.reviewHours,
          finalApprovalHours: documentTotals.finalApprovalHours,
          lineItems: documentOptions
            .map((option) => ({
              label: option.label,
              quantity: quantities[option.label] ?? 0,
              developmentHours: option.developmentHours,
              reviewHours: option.reviewHours,
              finalApprovalHours: option.finalApprovalHours,
            }))
            .filter((item) => item.quantity > 0),
        },
      };

      nextSubmittedEstimate = {
        serviceType,
        email: email.trim(),
        developmentHours: documentTotals.developmentHours,
        reviewHours: documentTotals.reviewHours,
        finalApprovalHours: documentTotals.finalApprovalHours,
        totalHours: documentTotals.totalHours,
        discoveryIncluded: documentTotals.discoveryIncluded,
        documentSummary: documentOptions
          .map((option) => ({
            label: option.label,
            quantity: quantities[option.label] ?? 0,
          }))
          .filter((item) => item.quantity > 0),
      };
    }

    if (serviceType === "incident_investigation" && investigationTotals && investigationLevel) {
      payload = {
        name: name.trim(),
        businessName: businessName.trim(),
        email: email.trim(),
        serviceType,
        subtotalExGst: investigationTotals.subtotalExGst,
        gstAmount: investigationTotals.gstAmount,
        totalIncGst: investigationTotals.totalIncGst,
        totalHours: investigationTotals.totalHours,
        breakdown: {
          level: investigationLevel,
          totalHours: investigationTotals.totalHours,
        },
      };

      nextSubmittedEstimate = {
        serviceType,
        email: email.trim(),
        totalHours: investigationTotals.totalHours,
        level: investigationLevel,
      };
    }

    if (serviceType === "app_development" && appTotals && appLevel) {
      payload = {
        name: name.trim(),
        businessName: businessName.trim(),
        email: email.trim(),
        serviceType,
        subtotalExGst: appTotals.subtotalExGst,
        gstAmount: appTotals.gstAmount,
        totalIncGst: appTotals.totalIncGst,
        totalHours: appTotals.totalHours,
        breakdown: {
          level: appLevel,
          totalHours: appTotals.totalHours,
        },
      };

      nextSubmittedEstimate = {
        serviceType,
        email: email.trim(),
        totalHours: appTotals.totalHours,
        level: appLevel,
      };
    }

    if (!payload || !nextSubmittedEstimate) {
      setError("We could not prepare that estimate.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/public/pricing-estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      if (!response.ok) {
        setError(text || "We could not send the estimate email.");
        return;
      }

      setSubmittedEstimate(nextSubmittedEstimate);
      setStep(3);
    } catch {
      setError("We could not send the estimate email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className={styles.estimator}>
      <div className={styles.card}>
        <div className={styles.panelHeader}>
          <h3>Pricing Estimator Tool</h3>
          <p>
            Complete this quick form to receive a tailored cost estimate by
            email. It should only take a few minutes.
          </p>
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
            <div className={styles.fieldGrid}>
              <label className={styles.field}>
                <span>Name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>

              <label className={styles.field}>
                <span>Business Name</span>
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>Email Address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className={`${styles.field} ${styles.fieldFull}`}>
                <span>What type of quote is this for?</span>
                <select
                  value={serviceType}
                  onChange={(e) => {
                    setServiceType(e.target.value as ServiceType);
                    setError(null);
                  }}
                  required
                >
                  <option value="">Select an option</option>
                  <option value="document_development">Document Development</option>
                  <option value="app_development">App Development</option>
                  <option value="incident_investigation">Investigation Facilitation</option>
                </select>
              </label>
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
          <form className={styles.form} onSubmit={handleSubmit}>
            {serviceType === "document_development" ? (
              <div className={styles.section}>
                <div className={styles.sectionTopSingle}>
                  <div>
                    <h4>Document Development</h4>
                    <p>Add the quantity for each document type you want included.</p>
                  </div>
                </div>

                <div className={styles.documentsGrid}>
                  {documentOptions.map((option) => {
                    const qty = quantities[option.label] ?? 0;

                    return (
                      <div className={styles.documentCard} key={option.label}>
                        <h5>{option.label}</h5>
                        <div className={styles.documentCounter}>
                          <button
                            className={styles.counterButton}
                            type="button"
                            onClick={() => setDocumentQuantity(option.label, qty - 1)}
                            aria-label={`Decrease ${option.label} quantity`}
                          >
                            −
                          </button>
                          <strong>{qty}</strong>
                          <button
                            className={styles.counterButton}
                            type="button"
                            onClick={() => setDocumentQuantity(option.label, qty + 1)}
                            aria-label={`Increase ${option.label} quantity`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {serviceType === "incident_investigation" ? (
              <div className={styles.section}>
                <div className={styles.sectionTopSingle}>
                  <h4>Investigation Facilitation</h4>
                  <p>Choose the level of support you need.</p>
                </div>

                <div className={styles.optionGrid}>
                  {Object.keys(investigationOptions).map((level) => {
                    const typedLevel = level as keyof typeof investigationOptions;
                    const isSelected = investigationLevel === typedLevel;

                    return (
                      <button
                        key={typedLevel}
                        className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                        type="button"
                        onClick={() =>
                          setInvestigationLevel(isSelected ? "" : typedLevel)
                        }
                        aria-pressed={isSelected}
                      >
                        <span>{formatSelectionLabel(typedLevel)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {serviceType === "app_development" ? (
              <div className={styles.section}>
                <div className={styles.sectionTopSingle}>
                  <h4>App Development</h4>
                  <p>Choose the estimated build complexity.</p>
                </div>

                <div className={styles.optionGrid}>
                  {Object.keys(appOptions).map((level) => {
                    const typedLevel = level as keyof typeof appOptions;
                    const isSelected = appLevel === typedLevel;

                    return (
                      <button
                        key={typedLevel}
                        className={`${styles.optionCard} ${isSelected ? styles.optionCardSelected : ""}`}
                        type="button"
                        onClick={() => setAppLevel(isSelected ? "" : typedLevel)}
                        aria-pressed={isSelected}
                      >
                        <span>{formatSelectionLabel(typedLevel)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {error ? <div className={styles.error}>{error}</div> : null}

            <div className={styles.actions}>
              <button className={styles.secondaryButton} type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Sending estimate..." : "Submit Estimate"}
              </button>
            </div>
          </form>
        ) : null}

        {step === 3 && submittedEstimate ? (
          <div className={styles.form}>
            {submittedEstimate.serviceType === "document_development" ? (
              <>
                <div className={styles.documentCountSummary}>
                  <h5>Hours</h5>
                </div>
                <div className={styles.summaryGrid}>
                  <div className={styles.summaryRow}>
                    <span>Development</span>
                    <strong>{formatWholeHours(submittedEstimate.developmentHours)}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Review</span>
                    <strong>{formatWholeHours(submittedEstimate.reviewHours)}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Approval</span>
                    <strong>{formatWholeHours(submittedEstimate.finalApprovalHours)}</strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Total</span>
                    <strong>{formatWholeHours(submittedEstimate.totalHours)}</strong>
                  </div>
                </div>
              </>
            ) : null}

            {submittedEstimate.serviceType === "incident_investigation" ? (
              <div className={styles.summaryGrid}>
                <div className={styles.summaryRow}>
                  <span>Service Level</span>
                  <strong>{formatSelectionLabel(submittedEstimate.level)}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Allowed Hours</span>
                  <strong>{formatWholeHours(submittedEstimate.totalHours)}</strong>
                </div>
              </div>
            ) : null}

            {submittedEstimate.serviceType === "app_development" ? (
              <div className={styles.summaryGrid}>
                <div className={styles.summaryRow}>
                  <span>Complexity</span>
                  <strong>{formatSelectionLabel(submittedEstimate.level)}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Allowed Hours</span>
                  <strong>{formatWholeHours(submittedEstimate.totalHours)}</strong>
                </div>
              </div>
            ) : null}

            <div className={styles.resultMessage}>
              <div className={styles.resultDivider}></div>
              <div className={styles.backIntro}>
                <h4>Estimate Request Submitted</h4>
                <p>
                  Your price estimate has been emailed to {submittedEstimate.email}.
                  If it has not arrived within 5 minutes, please check your spam
                  folder.
                </p>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.submitButton} type="button" onClick={resetEstimator}>
                Reset Estimator Tool
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
