import type { Metadata } from "next";
import HomePageScripts from "./home-page-scripts";

export const metadata: Metadata = {
  title: "HSES Industry Partners",
};

export default function HomePage() {
  return (
    <div className="home-page">
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
            <button className="btn btn-primary js-open-modal" type="button">
              Book discovery call
            </button>
            <a className="btn btn-outline" href="/login">
              Client portal login
            </a>
          </div>
          <button
            className="header-menu-toggle js-mobile-menu-toggle"
            type="button"
            aria-label="Open menu"
            aria-expanded="false"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="top">
          <div className="hero-bg"></div>
          <div className="hero-overlay"></div>
          <div className="hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">
                Work Health &amp; Safety (WHS) management systems suited to
                operational risk.
              </p>
              <h1>
                Health &amp; Safety Management Systems for fast-growing,
                high-risk businesses in Australia.
              </h1>
              <p className="hero-lede">
                We design, build, document, and implement Work Health &amp;
                Safety (WHS) Management Systems your clients will accept.
              </p>
              <div className="hero-ctas">
                <button className="btn btn-primary js-open-modal" type="button">
                  Book a discovery call
                </button>
              </div>
            </div>
            <div className="hero-visual">
              <img
                src="/images/filestransparent.png"
                alt="Safety system files"
                className="hero-visual-img"
              />
            </div>
          </div>
        </section>

        <section className="trust-strip" aria-label="Clients and standards">
          <div className="trust-inner logos-only">
            <h2 className="trust-heading">
              Projects/ teams we've influenced. Problems we've helped solve.
              Names you'll recognise.
            </h2>
            <div className="trust-logos-wrap">
              <button
                className="trust-nav trust-nav--prev"
                type="button"
                aria-label="Previous logos"
              >
                &lsaquo;
              </button>
              <div className="trust-logos">
                <img src="/images/rio.png" alt="Rio Tinto logo" />
                <img src="/images/airport.png" alt="Airport logo" />
                <img src="/images/enerpac.png" alt="Enerpac logo" />
                <img src="/images/chevron.png" alt="Chevron logo" />
                <img src="/images/inpex.png" alt="Inpex logo" />
              </div>
              <button
                className="trust-nav trust-nav--next"
                type="button"
                aria-label="Next logos"
              >
                &rsaquo;
              </button>
            </div>
          </div>
        </section>

        <section
          className="systems-led"
          aria-label="Safety Management Systems introduction"
        >
          <div className="container systems-led-inner systems-led-split">
            <div className="systems-led-left">
              <img
                src="/images/managementsystem.png"
                alt="Health &amp; Safety management system illustration"
                className="systems-led-visual"
              />
            </div>
            <div className="systems-led-right">
              <header className="systems-led-header systems-led-header--left">
                <h2>Safety Management Systems are more than documents</h2>
                <p>
                  Writing procedures and forms is important. Connecting
                  information and designing processes is important. Using
                  technology is helpful. A WHS Management System is the
                  structure that makes these parts work together.
                </p>
              </header>

              <div className="docs-grid systems-led-grid systems-led-grid--compact">
                <article className="doc-card">
                  <div className="doc-number">01</div>
                  <div className="doc-copy">
                    <h3>We develop documents</h3>
                    <p>
                      We write safety procedures and forms that make risk
                      controls clear and support a Work Health and Safety
                      Management System.
                    </p>
                  </div>
                </article>
                <article className="doc-card">
                  <div className="doc-number">02</div>
                  <div className="doc-copy">
                    <h3>We connect your information</h3>
                    <p>
                      We connect governance, registers, and records so your WHS
                      Management System works as one system.
                    </p>
                  </div>
                </article>
                <article className="doc-card">
                  <div className="doc-number">03</div>
                  <div className="doc-copy">
                    <h3>We design process flows</h3>
                    <p>
                      We map how work happens so contractor management and
                      supervision sit inside the Safety Management System.
                    </p>
                  </div>
                </article>
                <article className="doc-card">
                  <div className="doc-number">04</div>
                  <div className="doc-copy">
                    <h3>We work with big tech</h3>
                    <p>
                      We align software and reporting to strengthen incident
                      learning and keep the system current.
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="systems-led systems-led-approach" aria-label="Systems led approach">
          <div className="container systems-led-inner">
            <div className="systems-led-content">
              <div className="systems-led-copy">
                <h3>Our systems led approach</h3>
                <p>
                  At HSES Industry Partners, we use the Safety Energy Loop
                  Framework&trade; to design, assess, and repair WHS Management
                  Systems so they match how work is done in your business.
                </p>
              </div>
              <div className="systems-led-logo" aria-hidden="true">
                <img src="/images/SELF-Original-Logo.png" alt="" />
              </div>
            </div>

            <div className="systems-led-pillars">
              <div className="pillar">
                <div className="pillar-icon" aria-hidden="true">
                  <img src="/images/leadership-icon.png" alt="" />
                </div>
                <h4>Governance &amp; Accountability</h4>
                <ul className="pillar-list">
                  <li>
                    <b>1.1</b> Leadership &amp; Governance
                  </li>
                  <li>
                    <b>1.2</b> Descision Rights &amp; Structure
                  </li>
                  <li>
                    <b>1.3</b> Legal &amp; Risk
                  </li>
                  <li>
                    <b>1.4</b> Escalation &amp; Speaking-Up
                  </li>
                </ul>
              </div>
              <div className="pillar">
                <div className="pillar-icon" aria-hidden="true">
                  <img src="/images/risk-icon.png" alt="" />
                </div>
                <h4>Risk &amp; Control</h4>
                <ul className="pillar-list">
                  <li>
                    <b>2.1</b> Hazard Identification
                  </li>
                  <li>
                    <b>2.2</b> Risk Assessment
                  </li>
                  <li>
                    <b>2.3</b> Controls (Critical &amp; Standard)
                  </li>
                  <li>
                    <b>2.4</b> Verification of Controls
                  </li>
                </ul>
              </div>
              <div className="pillar">
                <div className="pillar-icon" aria-hidden="true">
                  <img src="/images/operations-icon.png" alt="" />
                </div>
                <h4>Operational Delivery</h4>
                <ul className="pillar-list">
                  <li>
                    <b>3.1</b> Safe Work Planning
                  </li>
                  <li>
                    <b>3.2</b> Competence &amp; Training
                  </li>
                  <li>
                    <b>3.3</b> Contractor Management
                  </li>
                  <li>
                    <b>3.4</b> Emergency Preparedness
                  </li>
                </ul>
              </div>
              <div className="pillar">
                <div className="pillar-icon" aria-hidden="true">
                  <img src="/images/learning-icon.png" alt="" />
                </div>
                <h4>Learning &amp; Improvement</h4>
                <ul className="pillar-list">
                  <li>
                    <b>4.1</b> Incident Management
                  </li>
                  <li>
                    <b>4.2</b> Performance Monitoring
                  </li>
                  <li>
                    <b>4.3</b> Audit &amp; Assurance
                  </li>
                  <li>
                    <b>4.4</b> Continuous Improvement
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="systems-led-cta" aria-label="Governance Core check">
          <div className="systems-led-cta-inner">
            <h3>
              Start with a <u>FREE</u> Governance Core check
            </h3>
            <p>
              Governance is often assumed to be working, but it drives how risk
              decisions are made across the business. Complete the short self
              assessment to see where your governance supports your system and
              where it creates gaps. You will receive a free Governance SELF
              assessment tool after you finish.
            </p>
            <div className="systems-led-cta-options">
              <div className="systems-led-cta-option">
                <div className="cta-icon" aria-hidden="true">
                  <img src="/images/loop-icon.png" alt="" />
                </div>
                <h4>Learn about the Safety Energy Loop Framework&trade;</h4>
                <p>
                  Explore how the SELF pillars connect governance, risk
                  controls, operational delivery, and incident learning.
                </p>
                <a className="btn btn-outline" href="/self-framework">
                  Learn about the Safety Energy Loop Framework&trade;
                </a>
              </div>
              <div className="systems-led-cta-divider" aria-hidden="true"></div>
              <div className="systems-led-cta-option">
                <div className="cta-icon" aria-hidden="true">
                  <img src="/images/survey-icon.png" alt="" />
                </div>
                <h4>Complete the FREE Governance SELF assessment</h4>
                <p>
                  Finish the short check and receive your Governance SELF
                  assessment tool with clear next steps.
                </p>
                <a
                  className="btn btn-outline"
                  href="https://hsesindustrypartners.scoreapp.com"
                >
                  Complete the free Governance self assessment
                </a>
              </div>
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

      <div className="mobile-menu" data-mobile-menu>
        <div className="mobile-menu-backdrop js-close-mobile-menu"></div>
        <div className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="mobile-menu-header">
            <img
              src="/images/logo-black.png"
              alt="HSES Industry Partners"
              className="mobile-menu-logo"
            />
          </div>
          <div className="mobile-menu-divider"></div>
          <nav className="mobile-menu-links" aria-label="Primary">
            <button className="btn btn-primary js-open-modal js-close-mobile-menu" type="button">
              Book discovery call
            </button>
            <a className="btn btn-outline js-close-mobile-menu" href="/login">
              Client portal login
            </a>
          </nav>
          <button className="mobile-menu-close js-close-mobile-menu" type="button">
            Close menu
          </button>
        </div>
      </div>

      <div className="modal" data-modal>
        <div className="modal-backdrop js-close-modal"></div>
        <div
          className="modal-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
        >
          <button className="modal-close js-close-modal" type="button" aria-label="Close">
            x
          </button>
          <div className="form-panel modal-panel">
            <h2 id="modal-title">Book a discovery call</h2>
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
      </div>

      <HomePageScripts />
    </div>
  );
}


