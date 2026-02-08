"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const searchParams = useSearchParams();

  const recoverRedirectTo = useMemo(() => {
    if (!siteUrl) return undefined;
    return `${siteUrl}/auth/set-password`;
  }, [siteUrl]);

  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "checking" | "not_found" | "unconfirmed" | "confirmed" | "error"
  >("idle");
  const [statusCheckedEmail, setStatusCheckedEmail] = useState("");
  const [notice, setNotice] = useState<{
    tone: "info" | "success" | "error";
    title: string;
    body: string;
  } | null>(null);
  const [loginNotice, setLoginNotice] = useState<{
    tone: "info" | "success" | "error";
    title: string;
    body: string;
  } | null>(null);

  const canCallSupabase = Boolean(supabaseUrl && supabaseAnonKey);
  const emailTrimmed = email.trim();
  const showResendAuth = mode === "forgot" && emailStatus === "unconfirmed";

  const handleLoginSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoginNotice(null);

    if (!emailTrimmed || !loginPassword) {
      setLoginNotice({
        tone: "error",
        title: "Enter your email and password",
        body: "Use the diagnostic owner email and the password you set.",
      });
      return;
    }

    if (!canCallSupabase) {
      setLoginNotice({
        tone: "error",
        title: "Login is not configured",
        body: "Supabase environment variables are missing. Please contact HSES.",
      });
      return;
    }

    try {
      setIsLoginSubmitting(true);
      const { data, error } = await supabaseBrowser.auth.signInWithPassword({
        email: emailTrimmed,
        password: loginPassword,
      });

      if (error || !data.session) {
        setLoginNotice({
          tone: "error",
          title: "We could not log you in",
          body:
            "Check your email and password. If you have not set a password yet, use the reset flow.",
        });
        return;
      }

      localStorage.setItem("hses_access_token", data.session.access_token);
      if (data.session.refresh_token) {
        localStorage.setItem("hses_refresh_token", data.session.refresh_token);
      }
      if (data.session.user?.email) {
        localStorage.setItem("hses_user_email", data.session.user.email);
      }
      if (data.session.user?.id) {
        localStorage.setItem("hses_user_id", data.session.user.id);
      }

      const returnTo = searchParams.get("returnTo");
      window.location.assign(returnTo || "/sms-diagnostic/dashboard");
    } catch (error) {
      setLoginNotice({
        tone: "error",
        title: "Something went wrong",
        body: "Please try again. If the issue continues, contact ask@hses.com.au.",
      });
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  useEffect(() => {
    if (mode !== "forgot") return;
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
      } catch (error) {
        if (controller.signal.aborted) return;
        setEmailStatus("error");
      }
    }, 400);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [emailTrimmed, mode]);

  const ensureEmailStatus = async () => {
    if (!emailTrimmed || emailTrimmed.length < 5) {
      setEmailStatus("idle");
      setStatusCheckedEmail("");
      return { status: "idle" as const };
    }

    if (statusCheckedEmail === emailTrimmed && emailStatus !== "checking") {
      return { status: emailStatus };
    }

    try {
      setEmailStatus("checking");
      const response = await fetch(
        `/api/auth/user-status?email=${encodeURIComponent(emailTrimmed)}`
      );

      if (!response.ok) {
        setEmailStatus("error");
        return { status: "error" as const };
      }

      const payload = (await response.json()) as {
        exists?: boolean;
        confirmed?: boolean;
      };

      setStatusCheckedEmail(emailTrimmed);
      if (!payload.exists) {
        setEmailStatus("not_found");
        return { status: "not_found" as const };
      }

      const nextStatus = payload.confirmed ? "confirmed" : "unconfirmed";
      setEmailStatus(nextStatus);
      return { status: nextStatus as const };
    } catch (error) {
      setEmailStatus("error");
      return { status: "error" as const };
    }
  };

  const handleRecover = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);

    if (!emailTrimmed) {
      setNotice({
        tone: "error",
        title: "Add your email",
        body: "Enter the email address used for your diagnostic owner account.",
      });
      return;
    }

    if (!canCallSupabase) {
      setNotice({
        tone: "error",
        title: "Login is not configured",
        body: "Supabase environment variables are missing. Please contact HSES.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const statusResult = await ensureEmailStatus();
      if (statusResult.status === "not_found") {
        setNotice({
          tone: "error",
          title: "We cannot find that client account",
          body:
            "This portal is only for diagnostic clients. Check the email used at purchase or contact ask@hses.com.au.",
        });
        return;
      }
      if (statusResult.status === "unconfirmed") {
        setNotice({
          tone: "info",
          title: "Your account is not authenticated yet",
          body:
            "Use the resend option below to verify your email first, then request a reset link.",
        });
        return;
      }
      if (statusResult.status === "error") {
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
          redirect_to: recoverRedirectTo,
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
        body:
          "If that email matches a client account, a reset link is on its way. It can take a few minutes.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        title: "Something went wrong",
        body: "Please try again. If it keeps happening, contact ask@hses.com.au.",
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
        body: "Enter your email first so we can resend the authentication email.",
      });
      return;
    }

    if (!canCallSupabase) {
      setNotice({
        tone: "error",
        title: "Login is not configured",
        body: "Supabase environment variables are missing. Please contact HSES.",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const statusResult = await ensureEmailStatus();
      if (statusResult.status !== "unconfirmed") {
        setNotice({
          tone: "info",
          title: "Authentication resend is not needed",
          body:
            statusResult.status === "confirmed"
              ? "This account is already authenticated. You can request a reset link."
              : "We could not confirm that this email belongs to a pending client account.",
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
        tone: "info",
        title: "Authentication email sent",
        body:
          "If your account exists but is not verified yet, we have sent a fresh authentication email.",
      });
    } catch (error) {
      setNotice({
        tone: "error",
        title: "Something went wrong",
        body: "Please try again. If it keeps happening, contact ask@hses.com.au.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-body page-stack">
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
        <section className="login-hero">
          <div className="login-container login-grid">
            <div className="login-copy">
              <p className="login-eyebrow">Client portal</p>
              <h1>Welcome back. Log in to your diagnostic workspace.</h1>
              <p className="login-lede">
                This portal is for organisations that have purchased a Safety
                Energy Loop Framework diagnostic assessment for their business
                and teams. Log in to access your diagnostic dashboard,
                participant progress, and reporting outputs.
              </p>
              <ul className="login-points">
                <li>Access your purchased diagnostic assessment.</li>
                <li>Track participation across teams and modules.</li>
                <li>Review actionable insights and export results.</li>
              </ul>
              <div
                className="login-lead-inline"
                role="note"
                aria-label="Diagnostic pathway"
                hidden
              >
                <h3>Not a client yet?</h3>
                <p>
                  You can start with the diagnostic today and assess your system
                  module by module with your team. We will turn the results into
                  clear next steps.
                </p>
                <div className="login-lead-actions">
                  <a className="btn btn-primary" href="/sms-diagnostic/purchase">
                    Start the diagnostic
                  </a>
                  <a className="btn btn-ghost" href="/sms-diagnostic">
                    See how it works
                  </a>
                </div>
              </div>
            </div>
            <div className="login-panel">
              <img
                src="/images/login-icon.png"
                alt=""
                className="login-panel-logo"
              />
              {mode === "login" ? (
                <>
                  <h2>Client portal login</h2>
                  <p>Use the login details provided to your diagnostic owner.</p>
                  <form className="login-form" onSubmit={handleLoginSubmit}>
                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                      />
                    </label>
                    <label className="field">
                      <span>Password</span>
                      <div className="set-password-input-row">
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          name="password"
                          autoComplete="current-password"
                          value={loginPassword}
                          onChange={(event) => setLoginPassword(event.target.value)}
                          required
                        />
                        <button
                          type="button"
                          className="set-password-toggle"
                          onClick={() => setShowLoginPassword((value) => !value)}
                          aria-pressed={showLoginPassword}
                          aria-label={showLoginPassword ? "Hide password" : "Show password"}
                        >
                          {showLoginPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </label>
                    {loginNotice && (
                      <div className={`login-notice login-notice--${loginNotice.tone}`} role="status">
                        <strong>{loginNotice.title}</strong>
                        <span>{loginNotice.body}</span>
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={isLoginSubmitting}>
                      {isLoginSubmitting ? "Logging in..." : "Log in"}
                    </button>
                    <button
                      type="button"
                      className="login-link"
                      onClick={() => {
                        setLoginNotice(null);
                        setNotice(null);
                        setMode("forgot");
                      }}
                    >
                      Forgot your password?
                    </button>
                    <div className="login-form-divider" role="presentation">
                      <span></span>
                      <span>Secure access</span>
                      <span></span>
                    </div>
                    <p className="form-note">
                      Need help? Email ask@hses.com.au.
                    </p>
                  </form>
                </>
              ) : (
                <>
                  <h2>Reset your password</h2>
                  <p>
                    Enter your diagnostic owner email and we will send a secure reset link.
                  </p>
                  <form className="login-form" onSubmit={handleRecover}>
                    <label className="field">
                      <span>Email</span>
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
                        value={email}
                        onChange={(event) => {
                          setEmail(event.target.value);
                          setNotice(null);
                        }}
                        required
                      />
                    </label>
                    {mode === "forgot" && emailStatus === "checking" && (
                      <div className="login-hint" role="status">
                        Checking your account...
                      </div>
                    )}
                    {notice && (
                      <div className={`login-notice login-notice--${notice.tone}`} role="status">
                        <strong>{notice.title}</strong>
                        <span>{notice.body}</span>
                      </div>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                      {isSubmitting ? "Sending link..." : "Send reset link"}
                    </button>
                    {showResendAuth && (
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={handleResendVerification}
                        disabled={isSubmitting}
                      >
                        Resend authentication email
                      </button>
                    )}
                    <button
                      type="button"
                      className="login-link"
                      onClick={() => {
                        setNotice(null);
                        setMode("login");
                      }}
                    >
                      Back to login
                    </button>
                    <p className="form-note">
                      If you do not receive an email, check spam or contact ask@hses.com.au.
                    </p>
                  </form>
                </>
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
