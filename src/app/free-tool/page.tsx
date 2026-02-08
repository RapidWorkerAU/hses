import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Download the Self-Assessment Tool",
};

export default function FreeToolPage() {
  return (
    <div className="page-stack no-radius free-tool-body">
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
            <a className="btn btn-primary" href="/">
              Back to site
            </a>
            <a className="btn btn-outline" href="/login">
              Client portal login
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="download-section">
          <div className="container">
            <div className="download-card" id="downloadCard">
              <img
                className="download-hero"
                src="/images/free-download.png"
                alt="Free download"
              />
              <h1>Download the Self-Assessment Tool</h1>
              <p className="download-helper">
                Use the password from your ScoreApp results page to unlock the
                download. This tool helps you map gaps quickly and prepare for
                the next step.
              </p>
              <div className="download-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" role="img" aria-label="Download icon">
                  <path d="M12 3a1 1 0 0 1 1 1v8.59l2.3-2.3a1 1 0 1 1 1.4 1.42l-4.01 4a1 1 0 0 1-1.4 0l-4.01-4a1 1 0 1 1 1.4-1.42L11 12.59V4a1 1 0 0 1 1-1zM5 19a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1z" />
                </svg>
              </div>
              <a
                className="btn btn-primary download-btn"
                href="/downloads/SELF-Assessment-Sheet.xlsx"
                download
              >
                Download the Excel tool
              </a>
            </div>
          </div>
        </section>
      </main>

      <div
        className="password-overlay"
        id="passwordOverlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-title"
      >
        <div className="password-panel">
          <h2 id="password-title">Enter your access password</h2>
          <p>
            Use the password shown on your ScoreApp results page to unlock the
            download.
          </p>
          <form id="passwordForm">
            <label className="field">
              <span>Password</span>
              <div className="password-input">
                <input type="password" name="password" autoComplete="off" required />
                <button className="password-toggle" type="button" aria-pressed="false">
                  Show
                </button>
              </div>
              <div className="password-hint">Password is case sensitive.</div>
            </label>
            <button className="btn btn-primary" type="submit">
              Unlock download
            </button>
            <div className="password-error" id="passwordError" role="status" aria-live="polite"></div>
          </form>
        </div>
      </div>

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
          <button
            className="footer-menu-toggle"
            type="button"
            aria-label="Open footer menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div className="footer-menu">
            <a className="footer-link" href="/privacy">
              Privacy Policy
            </a>
            <a className="footer-link" href="/disclaimer">
              Website Disclaimer
            </a>
          </div>
        </div>
      </footer>

      <Script id="free-tool-scripts" strategy="afterInteractive">
        {String.raw`
    (() => {
      const overlay = document.getElementById('passwordOverlay');
      const form = document.getElementById('passwordForm');
      const error = document.getElementById('passwordError');
      const card = document.getElementById('downloadCard');
      const PASSWORD = 'SELF-Assessment-2026';

      const lock = () => {
        card.classList.remove('download-unlocked');
      };

      const unlock = () => {
        overlay.style.display = 'none';
        card.classList.add('download-unlocked');
      };

      lock();

      const toggle = form.querySelector('.password-toggle');
      const input = form.querySelector('input[name="password"]');

      toggle.addEventListener('click', () => {
        const isHidden = input.type === 'password';
        input.type = isHidden ? 'text' : 'password';
        toggle.textContent = isHidden ? 'Hide' : 'Show';
        toggle.setAttribute('aria-pressed', String(isHidden));
      });

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        const value = input.value.trim();
        if (value === PASSWORD) {
          error.textContent = '';
          unlock();
          form.reset();
          return;
        }
        error.textContent = 'That password does not match. Please try again.';
      });
    })();
  `}
      </Script>
    </div>
  );
}


