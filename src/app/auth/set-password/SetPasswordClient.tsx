"use client";

import { type FormEvent, useEffect, useState } from "react";

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
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const canCallSupabase = Boolean(supabaseUrl && supabaseAnonKey);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = password.length > 0 && confirmPassword.length > 0 && password !== confirmPassword;

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

    // Clean the URL so the token is not left in the address bar.
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
        body: "Choose at least 10 characters to protect your diagnostic workspace.",
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
        body: "For security, please log in with your new password to access the dashboard.",
      });
    } catch (error) {
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
    <div className="set-password-body page-stack">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <a href="/">
              <img
                src="/images/logo-black.png"
                alt="HSES Industry Partners"
                className="header-logo"
              />
            </a>
          </div>
          <div className="header-actions">
            <a className="btn btn-primary" href="/consult">
              Book discovery call
            </a>
            <a className="btn btn-outline" href="/login">
              Client portal login
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="set-password-hero">
          <div className="login-container login-grid">
            <div className="login-copy">
              <p className="login-eyebrow">Client portal</p>
              <h1>Set your password to secure your workspace.</h1>
              <p className="login-lede">
                You are almost there. Set a strong password, then log in to access
                your diagnostic dashboard, participation tracking, and reporting.
              </p>
              <ul className="login-points">
                <li>This link is unique to your account.</li>
                <li>Set your password once, then log in normally.</li>
                <li>Your dashboard becomes available after login.</li>
              </ul>
            </div>
            <div className="login-panel set-password-panel">
              <img
                src="/images/login-icon.png"
                alt=""
                className="login-panel-logo"
              />
              <h2>{isComplete ? "Password set" : "Create your password"}</h2>
              <p>
                {isComplete
                  ? "Now log in with your new password."
                  : "Choose a strong password for your diagnostic owner account."}
              </p>

              {!isComplete ? (
                <form className="login-form set-password-form" onSubmit={handleSubmit}>
                  {email && (
                    <div className="set-password-email">
                      Account email: <strong>{email}</strong>
                    </div>
                  )}
                  {notice && (
                    <div className={`set-password-notice set-password-notice--${notice.tone}`}>
                      <strong>{notice.title}</strong>
                      <span>{notice.body}</span>
                    </div>
                  )}
                  <label className="field">
                    <span>New password</span>
                    <div className="set-password-input-row">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        autoComplete="new-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="set-password-toggle"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-pressed={showPassword}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>
                  <label className="field">
                    <span>Confirm password</span>
                    <div className="set-password-input-row">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="set-password-toggle"
                        onClick={() => setShowConfirmPassword((value) => !value)}
                        aria-pressed={showConfirmPassword}
                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                      >
                        {showConfirmPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                  </label>
                  {passwordsMismatch && (
                    <div className="set-password-match-hint set-password-match-hint--error" role="status">
                      Passwords do not match yet.
                    </div>
                  )}
                  {passwordsMatch && (
                    <div className="set-password-match-hint" role="status">
                      Passwords match.
                    </div>
                  )}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting || passwordsMismatch}
                  >
                    {isSubmitting ? "Saving password..." : "Set password"}
                  </button>
                </form>
              ) : (
                <div className="set-password-complete">
                  {notice && (
                    <div className={`set-password-notice set-password-notice--${notice.tone}`}>
                      <strong>{notice.title}</strong>
                      <span>{notice.body}</span>
                    </div>
                  )}
                  <div className="set-password-actions">
                    <a className="btn btn-outline" href={`/login?email=${encodeURIComponent(email)}`}>
                      Go to login page
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span className="footer-copy">&copy; 2025 HSES Industry Partners</span>
          <div className="footer-links">
            <a className="footer-link" href="/privacy">
              Privacy Policy
            </a>
            <a className="footer-link" href="/disclaimer">
              Website Disclaimer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
