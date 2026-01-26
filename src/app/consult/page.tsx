import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book a Discovery Call",
};

export default function ConsultPage() {
  return (
    <div className="page-stack no-radius">
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
          </div>
        </div>
      </header>

      <main>
        <section className="section">
          <div className="container">
            <div className="form-panel">
              <h1>Book a discovery call</h1>
              <p>Share what you need. We'll confirm fit and next steps.</p>
              <form
                className="lead-form"
                name="consult-request"
                method="post"
                data-netlify="true"
                data-netlify-honeypot="bot-field"
                action="/consult-thank-you"
              >
                <input type="hidden" name="form-name" value="consult-request" />
                <p className="field" hidden>
                  <label>
                    Don't fill this out:
                    <input name="bot-field" />
                  </label>
                </p>
                <label className="field">
                  <span>Name</span>
                  <input type="text" name="name" required />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input type="email" name="email" required />
                </label>
                <label className="field">
                  <span>Phone</span>
                  <input type="tel" name="phone" />
                </label>
                <label className="field">
                  <span>Company</span>
                  <input type="text" name="company" />
                </label>
                <label className="field">
                  <span>Location</span>
                  <select name="location">
                    <option value="">Select state</option>
                    <option value="NSW">New South Wales</option>
                    <option value="VIC">Victoria</option>
                    <option value="QLD">Queensland</option>
                    <option value="WA">Western Australia</option>
                    <option value="SA">South Australia</option>
                    <option value="TAS">Tasmania</option>
                    <option value="ACT">Australian Capital Territory</option>
                    <option value="NT">Northern Territory</option>
                  </select>
                </label>
                <label className="field">
                  <span>What you need</span>
                  <select name="need">
                    <option value="">Select an option</option>
                    <option value="design">Design a system</option>
                    <option value="build">Build a system</option>
                    <option value="fix">Fix a system</option>
                    <option value="implement">Implement a system</option>
                    <option value="other">Something else</option>
                  </select>
                </label>
                <label className="field">
                  <span>Preferred Meeting Date/Time</span>
                  <input type="datetime-local" name="timing" />
                </label>
                <label className="field">
                  <span>Additional context</span>
                  <textarea
                    name="context"
                    rows={3}
                    placeholder="Add any details we should know"
                  ></textarea>
                </label>
                <button type="submit" className="btn btn-primary">
                  Send request
                </button>
                <p className="form-note">
                  We respond within 48 hours. Details are only used to reply.
                </p>
              </form>
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
    </div>
  );
}


