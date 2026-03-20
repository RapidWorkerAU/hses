"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "../auth/AuthPage.module.css";

type NoticeTone = "error" | "success" | "info";
type EmailStatus = "idle" | "checking" | "not_found" | "unconfirmed" | "confirmed" | "error";

type Notice = {
  tone: NoticeTone;
  title: string;
  body: string;
};

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

export default function ForgotPasswordClient() {
  const searchParams = useSearchParams();
  const queryEmail = searchParams.get("email") || "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [email, setEmail] = useState(queryEmail);
  const [emailStatus, setEmailStatus] = useState<EmailStatus>("idle");
  const [statusCheckedEmail, setStatusCheckedEmail] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailTrimmed = email.trim();
  const canCallSupabase = Boolean(supabaseUrl && supabaseAnonKey);
  const showResendAuth = emailStatus === "unconfirmed";

  useEffect(() => {
    setEmail((current) => current || queryEmail);
  }, [queryEmail]);

  useEffect(() => {
    if (!emailTrimmed || emailTrimmed.length < 5) {
      setEmailStatus("idle");
      setStatusCheckedEmail("");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        setEmailStatus("checking");
        const response = await fetch(
          `/api/auth/user-status?email=${encodeURIComponent(emailTrimmed)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          setEmailStatus("error");
          return;
        }

        const payload = (await response.json()) as {
          exists?: boolean;
          confirmed?: boolean;
        };

        setStatusCheckedEmail(emailTrimmed);
        if (!payload.exists) {
          setEmailStatus("not_found");
          return;
        }

        setEmailStatus(payload.confirmed ? "confirmed" : "unconfirmed");
      } catch {
        if (controller.signal.aborted) return;
        setEmailStatus("error");
      }
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [emailTrimmed]);

  const ensureEmailStatus = async () => {
    if (!emailTrimmed || emailTrimmed.length < 5) {
      setEmailStatus("idle");
      setStatusCheckedEmail("");
      return "idle" as const;
    }

    if (statusCheckedEmail === emailTrimmed && emailStatus !== "checking") {
      return emailStatus;
    }

    try {
      setEmailStatus("checking");
      const response = await fetch(
        `/api/auth/user-status?email=${encodeURIComponent(emailTrimmed)}`
      );

      if (!response.ok) {
        setEmailStatus("error");
        return "error" as const;
      }

      const payload = (await response.json()) as {
        exists?: boolean;
        confirmed?: boolean;
      };

      setStatusCheckedEmail(emailTrimmed);
      if (!payload.exists) {
        setEmailStatus("not_found");
        return "not_found" as const;
      }

      const nextStatus = payload.confirmed ? "confirmed" : "unconfirmed";
      setEmailStatus(nextStatus);
      return nextStatus;
    } catch {
      setEmailStatus("error");
      return "error" as const;
    }
  };

  const handleRecover = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!emailTrimmed) {
      setNotice({
        tone: "error",
        title: "Add your email",
        body: "Enter the email address used for your HSES client account.",
      });
      return;
    }

    if (!canCallSupabase) {
      setNotice({
        tone: "error",
        title: "Reset is not configured",
        body: "Supabase environment variables are missing. Please contact HSES.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const statusResult = await ensureEmailStatus();
      if (statusResult === "not_found") {
        setNotice({
          tone: "error",
          title: "We cannot find that account",
          body: "Check the email used for your HSES portal account or contact ask@hses.com.au.",
        });
        return;
      }

      if (statusResult === "unconfirmed") {
        setNotice({
          tone: "info",
          title: "Confirm your email first",
          body: "Use the resend option below to verify your email before requesting a reset link.",
        });
        return;
      }

      if (statusResult === "error") {
        setNotice({
          tone: "error",
          title: "We could not check that account",
          body: "Please try again in a moment, or contact ask@hses.com.au.",
        });
        return;
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/recover`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey as string,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          email: emailTrimmed,
          redirect_to: `${getSiteUrl()}/auth/set-password`,
        }),
      });

      if (!response.ok) {
        setNotice({
          tone: "error",
          title: "We could not send that reset link",
          body: "Please check the email and try again, or contact ask@hses.com.au.",
        });
        return;
      }

      setNotice({
        tone: "success",
        title: "Check your inbox",
        body: "If that email matches an HSES account, a reset link is on its way now.",
      });
    } catch {
      setNotice({
        tone: "error",
        title: "Something went wrong",
        body: "Please try again. If the issue continues, contact ask@hses.com.au.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setNotice(null);

    if (!emailTrimmed) {
      setNotice({
        tone: "error",
        title: "Add your email",
        body: "Enter your email first so we can resend the confirmation email.",
      });
      return;
    }

    if (!canCallSupabase) {
      setNotice({
        tone: "error",
        title: "Reset is not configured",
        body: "Supabase environment variables are missing. Please contact HSES.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const statusResult = await ensureEmailStatus();
      if (statusResult !== "unconfirmed") {
        setNotice({
          tone: "info",
          title: "A resend is not needed",
          body:
            statusResult === "confirmed"
              ? "This account is already confirmed. You can request a reset link."
              : "We could not confirm that this email belongs to a pending account.",
        });
        return;
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey as string,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          type: "signup",
          email: emailTrimmed,
        }),
      });

      if (!response.ok) {
        setNotice({
          tone: "error",
          title: "We could not resend that email",
          body: "Please check the email and try again, or contact ask@hses.com.au.",
        });
        return;
      }

      setNotice({
        tone: "success",
        title: "Confirmation email sent",
        body: "If the account exists and is still pending, a fresh confirmation email is on its way.",
      });
    } catch {
      setNotice({
        tone: "error",
        title: "Something went wrong",
        body: "Please try again. If the issue continues, contact ask@hses.com.au.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.brandRow}>
              <Image
                src="/images/logo-black.png"
                alt="HSES Industry Partners"
                width={128}
                height={44}
                className={styles.brandImage}
              />
              <span className={styles.brandText}>Password Reset</span>
            </div>

            <div className={styles.copyBlock}>
              <h1>Reset your portal password.</h1>
              <p>
                Enter the email used for your HSES client account and we will send a secure link to create a new password.
              </p>
            </div>

            <form className={styles.form} onSubmit={handleRecover}>
              <label className={styles.field}>
                <span className={styles.visuallyHidden}>Email address</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setNotice(null);
                  }}
                  required
                />
                <Image
                  src="/icons/email.svg"
                  alt=""
                  aria-hidden="true"
                  width={18}
                  height={18}
                  className={styles.fieldIcon}
                />
              </label>

              {emailStatus === "checking" ? (
                <p className={styles.helperText}>Checking your account...</p>
              ) : (
                <p className={styles.helperText}>Use the same email you use to log in to the HSES portal.</p>
              )}

              <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                {isSubmitting ? "Sending link..." : "Send reset link"}
              </button>

              {showResendAuth ? (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => void handleResendVerification()}
                  disabled={isSubmitting}
                >
                  Resend confirmation email
                </button>
              ) : null}
            </form>

            {notice ? (
              <div
                className={`${styles.notice} ${
                  notice.tone === "error"
                    ? styles.noticeError
                    : notice.tone === "success"
                      ? styles.noticeSuccess
                      : ""
                }`}
                role="status"
              >
                <p className={styles.noticeTitle}>{notice.title}</p>
                <p className={styles.noticeText}>{notice.body}</p>
              </div>
            ) : null}

            <p className={styles.authPrompt}>
              Remembered your password? <Link href="/login" className={styles.metaLink}>Back to sign in</Link>
            </p>

            <p className={styles.footnote}>
              If you do not receive an email, check spam or contact <a href="mailto:ask@hses.com.au">ask@hses.com.au</a>.
            </p>
          </div>
        </section>

        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.visualLines} />
          <div className={styles.visualContent}>
            <div className={styles.visualIntro}>
              <p className={styles.visualEyebrow}>HSES Industry Partners</p>
              <h2 className={styles.visualHeading}>Recover access without leaving the HSES portal flow.</h2>
              <p className={styles.visualText}>
                Password recovery checks the account first, then sends a secure reset link for confirmed users.
              </p>
              <ul className={styles.visualList}>
                <li>Reset links land on the HSES branded set-password page.</li>
                <li>Pending accounts can request a fresh confirmation email here.</li>
                <li>Confirmed users can return to the dashboard after setting a new password.</li>
              </ul>
            </div>

            <div className={styles.visualBadge}>
              Client account recovery for HSES dashboard, diagnostics, and map builder access.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
