"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { storePortalSession } from "@/lib/supabase/portalSession";
import styles from "../auth/AuthPage.module.css";

type NoticeTone = "error" | "success" | "info";

type Notice = {
  tone: NoticeTone;
  title: string;
  body: string;
  allowResend?: boolean;
  resent?: boolean;
};

const getSiteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

export default function LoginClient() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/dashboard";
  const queryEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(queryEmail);
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isResending, setIsResending] = useState(false);

  const emailTrimmed = email.trim();

  useEffect(() => {
    setEmail((current) => current || queryEmail);
  }, [queryEmail]);

  useEffect(() => {
    let active = true;

    const routeAuthenticatedUser = async () => {
      const {
        data: { session },
      } = await supabaseBrowser.auth.getSession();

      if (!active) return;

      if (!session) {
        setIsCheckingSession(false);
        return;
      }

      storePortalSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: {
          email: session.user.email,
          id: session.user.id,
        },
      });
      window.location.replace(returnTo);
    };

    void routeAuthenticatedUser();

    return () => {
      active = false;
    };
  }, [returnTo]);

  const resendConfirmation = async () => {
    if (!emailTrimmed || isResending) return;

    try {
      setIsResending(true);
      const { error } = await supabaseBrowser.auth.resend({
        type: "signup",
        email: emailTrimmed,
        options: {
          emailRedirectTo: `${getSiteUrl()}/auth/set-password`,
        },
      });

      if (error) {
        setNotice({
          tone: "error",
          title: "We could not resend that email",
          body: error.message,
          allowResend: true,
        });
        return;
      }

      setNotice({
        tone: "success",
        title: "Confirmation email sent",
        body: "Check your inbox and spam folder for a fresh confirmation link.",
        resent: true,
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!emailTrimmed || !password) {
      setNotice({
        tone: "error",
        title: "Enter your email and password",
        body: "Use the HSES email and password for your portal account.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email: emailTrimmed,
        password,
      });

      if (error || !data.session) {
        const normalized = error?.message.toLowerCase() || "";
        const needsConfirmation =
          normalized.includes("email not confirmed") ||
          normalized.includes("not confirmed") ||
          normalized.includes("confirm your email");

        setNotice({
          tone: "error",
          title: needsConfirmation ? "Confirm your email first" : "We could not log you in",
          body: needsConfirmation
            ? "Your account exists, but the email confirmation step is still pending."
            : "Check your email and password. If you have not set a password yet, use the reset flow.",
          allowResend: needsConfirmation,
        });
        return;
      }

      storePortalSession({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          email: data.session.user.email,
          id: data.session.user.id,
        },
      });

      if (!rememberMe) {
        sessionStorage.setItem("hses_session_only", "true");
      } else {
        sessionStorage.removeItem("hses_session_only");
      }

      window.location.assign(returnTo);
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

  if (isCheckingSession) {
    return <div className={styles.loading}>Loading portal access...</div>;
  }

  const submitLabel = isSubmitting ? "Please wait..." : "Log in";

  const forgotHref = emailTrimmed
    ? `/forgot-password?email=${encodeURIComponent(emailTrimmed)}`
    : "/forgot-password";

  return (
    <div className={styles.page} data-login-page>
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
              <span className={styles.brandText}>Client Portal</span>
            </div>

            <div className={styles.copyBlock}>
              <h1>Secure access for HSES clients.</h1>
              <p>
                Sign in to access your dashboard, diagnostics, reporting, and map builder tools.
              </p>
            </div>

            <form
              onSubmit={handleLoginSubmit}
              className={styles.form}
            >
              <label className={styles.field}>
                <span className={styles.visuallyHidden}>Email address</span>
                <input
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
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

              <label className={styles.field}>
                <span className={styles.visuallyHidden}>Password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <Image
                    src={showPassword ? "/icons/visible.svg" : "/icons/hidden.svg"}
                    alt=""
                    aria-hidden="true"
                    width={18}
                    height={18}
                  />
                </button>
              </label>

              <div className={styles.formMeta}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <Link href={forgotHref} className={styles.metaLink}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.submitButton}
              >
                {submitLabel}
              </button>
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
                {notice.allowResend && !notice.resent ? (
                  <button
                    type="button"
                    className={styles.inlineButton}
                    onClick={() => void resendConfirmation()}
                    disabled={isResending}
                  >
                    {isResending ? "Resending..." : "Resend confirmation email"}
                  </button>
                ) : null}
              </div>
            ) : null}

            <p className={styles.authPrompt}>Accounts are created by HSES administrators only.</p>

            <p className={styles.footnote}>
              By continuing you agree to the <Link href="/privacy">Privacy Policy</Link> and{" "}
              <Link href="/disclaimer">Website Disclaimer</Link>.
            </p>
          </div>
        </section>

        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.visualLines} />
          <div className={styles.visualContent}>
            <div className={styles.visualIntro}>
              <p className={styles.visualEyebrow}>HSES Industry Partners</p>
              <h2 className={styles.visualHeading}>Built for practical safety, systems, and delivery work.</h2>
              <p className={styles.visualText}>
                HSES is evolving into a sharper suite of tools for safety professionals who need to plan systems clearly, keep records current, investigate well, assess risk with confidence, and present stronger operational insight.
              </p>
              <ul className={styles.visualList}>
                <li>Bring planning, investigations, risk work, and supporting records into one connected workspace.</li>
                <li>Track what matters with tools designed to make safety activity easier to structure, review, and communicate.</li>
                <li>Deliver more polished outputs for leaders, clients, and risk owners without relying on fragmented files.</li>
              </ul>
              <div className={styles.visualStats}>
                <div className={styles.visualStat}>
                  <span className={styles.visualStatValue}>Connected tools</span>
                  <span className={styles.visualStatLabel}>A growing workspace for practical safety delivery, not a collection of isolated forms.</span>
                </div>
                <div className={styles.visualStat}>
                  <span className={styles.visualStatValue}>Sharper insight</span>
                  <span className={styles.visualStatLabel}>Structure data and activity in ways that are easier to review, explain, and act on.</span>
                </div>
                <div className={styles.visualStat}>
                  <span className={styles.visualStatValue}>Professional output</span>
                  <span className={styles.visualStatLabel}>Present clearer evidence of work, progress, and control to the people relying on it.</span>
                </div>
              </div>
            </div>

          </div>
        </aside>
      </div>
    </div>
  );
}
