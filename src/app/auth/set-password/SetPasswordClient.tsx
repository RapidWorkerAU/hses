"use client";

import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useEffect, useState } from "react";
import styles from "../AuthPage.module.css";

type NoticeTone = "info" | "success" | "error";

type Notice = {
  tone: NoticeTone;
  title: string;
  body: string;
};

export default function SetPasswordClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const canCallSupabase = Boolean(supabaseUrl && supabaseAnonKey);
  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const params = new URLSearchParams(hash);
    const tokenFromHash = params.get("access_token");
    const emailFromHash = params.get("email") ?? "";

    if (!tokenFromHash) {
      setNotice({
        tone: "error",
        title: "This link is missing session details",
        body: "Please use the latest email link, or request a fresh reset from the login page.",
      });
      return;
    }

    setAccessToken(tokenFromHash);
    if (emailFromHash) {
      setEmail(emailFromHash);
    }

    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!accessToken) {
      setNotice({
        tone: "error",
        title: "Missing session token",
        body: "Please return to the login page and request a fresh reset link.",
      });
      return;
    }

    if (!canCallSupabase) {
      setNotice({
        tone: "error",
        title: "Password setup is not configured",
        body: "Supabase environment variables are missing. Please contact ask@hses.com.au.",
      });
      return;
    }

    if (!password || password.length < 10) {
      setNotice({
        tone: "error",
        title: "Use a stronger password",
        body: "Choose at least 10 characters to protect your HSES portal account.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setNotice({
        tone: "error",
        title: "Passwords do not match",
        body: "Please confirm the same password in both fields.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey as string,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          password,
        }),
      });

      if (!response.ok) {
        setNotice({
          tone: "error",
          title: "We could not set your password",
          body: "Your link may have expired. Request a new reset link from the login page.",
        });
        return;
      }

      setIsComplete(true);
      setNotice({
        tone: "success",
        title: "Password set successfully",
        body: "Your new password is ready. Log in to continue to the HSES dashboard.",
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
              <span className={styles.brandText}>Set Password</span>
            </div>

            <div className={styles.copyBlock}>
              <h1>{isComplete ? "Password updated." : "Create a strong password."}</h1>
              <p>
                {isComplete
                  ? "Your password has been saved. Use it to sign in to your HSES client dashboard."
                  : "Set a new password for your HSES portal account, then log in to access the dashboard."}
              </p>
            </div>

            {!isComplete ? (
              <form className={styles.form} onSubmit={handleSubmit}>
                {email ? (
                  <div className={styles.accountEmail}>
                    Account email: <strong>{email}</strong>
                  </div>
                ) : null}

                <label className={styles.field}>
                  <span className={styles.visuallyHidden}>New password</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    autoComplete="new-password"
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

                <label className={`${styles.field} ${passwordsMismatch ? styles.fieldError : ""}`}>
                  <span className={styles.visuallyHidden}>Confirm password</span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={() => setShowConfirmPassword((value) => !value)}
                    aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                  >
                    <Image
                      src={showConfirmPassword ? "/icons/visible.svg" : "/icons/hidden.svg"}
                      alt=""
                      aria-hidden="true"
                      width={18}
                      height={18}
                    />
                  </button>
                </label>

                {passwordsMismatch ? (
                  <p className={styles.validationText}>Passwords do not match yet.</p>
                ) : passwordsMatch ? (
                  <p className={styles.helperText}>Passwords match.</p>
                ) : (
                  <p className={styles.helperText}>Use at least 10 characters for your new password.</p>
                )}

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={isSubmitting || passwordsMismatch}
                >
                  {isSubmitting ? "Saving password..." : "Set password"}
                </button>
              </form>
            ) : (
              <div className={styles.form}>
                <Link
                  href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
                  className={styles.submitButton}
                  style={{ display: "grid", placeItems: "center", textDecoration: "none" }}
                >
                  Go to login page
                </Link>
              </div>
            )}

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

            <p className={styles.footnote}>
              Need a fresh link? Return to <Link href="/forgot-password">forgot password</Link> and request another reset email.
            </p>
          </div>
        </section>

        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.visualLines} />
          <div className={styles.visualContent}>
            <div className={styles.visualIntro}>
              <p className={styles.visualEyebrow}>HSES Industry Partners</p>
              <h2 className={styles.visualHeading}>Finish the reset, then go back to work.</h2>
              <p className={styles.visualText}>
                This password screen completes the secure recovery flow and returns you to the same HSES portal login experience.
              </p>
              <ul className={styles.visualList}>
                <li>Secure token-based reset from the email link.</li>
                <li>One new password for your HSES dashboard account.</li>
                <li>Return to login immediately after the update is complete.</li>
              </ul>
            </div>

            <div className={styles.visualBadge}>
              Password setup for HSES diagnostics, portal reporting, and map builder access.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
