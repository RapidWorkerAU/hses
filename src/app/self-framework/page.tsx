import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Safety Energy Loop Framework",
};

export default function SelfFrameworkPage() {
  return (
    <div className="lss-body">
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
        <section className="lss-hero">
          <div className="lss-hero-inner">
            <div className="lss-hero-copy">
              <p className="lss-kicker">Safety Energy Loop Framework&trade; (SELF)</p>
              <h1 className="lss-title">
                Build safety systems that perform under real pressure.
              </h1>
              <p className="lss-lede">
                A practical, integrated approach to building, running, and
                stress testing health and safety systems that actually function
                under pressure.
              </p>
              <div className="lss-hero-actions">
                <button className="btn btn-primary js-open-modal" type="button">
                  Talk through your system
                </button>
                <a className="btn btn-outline" href="#framework">
                  See the framework
                </a>
              </div>
              <div className="lss-hero-highlights">
                <div className="lss-highlight">
                  <span className="lss-highlight-label">One structure</span>
                  <span className="lss-highlight-value">Two directions</span>
                </div>
                <div className="lss-highlight">
                  <span className="lss-highlight-label">Purpose</span>
                  <span className="lss-highlight-value">Find what fails fast</span>
                </div>
              </div>
            </div>
            <div className="lss-hero-visual">
              <img
                src="/images/lss-hero.png"
                alt="Safety Energy Loop Framework visual"
                className="lss-hero-image"
              />
            </div>
          </div>
        </section>

        <div className="section-separator">
          <a className="down-link" href="#positioning" aria-label="Scroll to positioning section">
            <span className="down-indicator">&darr;</span>
          </a>
        </div>

        <section className="lss-section lss-positioning" id="positioning">
          <div className="lss-container">
            <div className="lss-section-header">
              <img
                src="/images/SELF-Original-Logo.png"
                alt="Safety Energy Loop Framework logo"
                className="self-logo"
              />
              <p className="lss-eyebrow">Positioning statement</p>
              <h2>
                Most health and safety systems are built like filing cabinets.
                The Safety Energy Loop Framework&trade; is built like an organism.
              </h2>
            </div>
            <div className="lss-positioning-grid">
              <div className="lss-positioning-copy">
                <p>
                  It is designed to grow with your business, respond to real
                  risk, and clearly reveal where your system is strong, fragile,
                  or broken.
                </p>
                <p className="lss-strong">
                  This is not a template. It is a way of thinking.
                </p>
                <p>
                  The Safety Energy Loop Framework&trade; (SELF) helps
                  organisations design safety systems that are equally powerful
                  for building strong foundations and diagnosing system failure.
                  One structure. Two directions. No guesswork.
                </p>
              </div>
              <div className="lss-positioning-visual">
                <div className="lss-contrast-card">
                  <span className="lss-contrast-title">Filing cabinet systems</span>
                  <p>Static, document-heavy, and disconnected from work reality.</p>
                </div>
                <div className="lss-contrast-card lss-contrast-card--bold">
                  <span className="lss-contrast-title">SELF systems</span>
                  <p>Adaptive, risk-led, and designed for leaders and frontline teams.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="section-separator">
          <a className="down-link" href="#framework" aria-label="Scroll to framework section">
            <span className="down-indicator">&darr;</span>
          </a>
        </div>

        <section className="lss-section lss-framework" id="framework">
          <div className="lss-container">
            <div className="lss-section-header">
              <p className="lss-eyebrow">What the framework is</p>
              <h2>
                The Safety Energy Loop Framework&trade; (SELF) organises health and
                safety into four connected domains that work together as a single,
                integrated whole.
              </h2>
              <p>
                Each domain has a distinct purpose. Each one depends on the
                others. When one fails, the system shows you exactly where and why.
              </p>
            </div>
            <div className="lss-domain-grid">
              <article className="lss-domain-card">
                <div className="lss-domain-index">01</div>
                <h3>The Governance Core</h3>
                <p className="lss-domain-subhead">Who owns safety</p>
                <p>
                  This is the brain of the system. It clarifies leadership
                  accountability, decision making, and how legal duties translate
                  into real action on site.
                </p>
                <p className="lss-domain-note">
                  When this is strong, safety is purposeful. When this is weak,
                  everything else becomes cosmetic.
                </p>
              </article>
              <article className="lss-domain-card">
                <div className="lss-domain-index">02</div>
                <h3>The Risk Backbone</h3>
                <p className="lss-domain-subhead">What actually matters</p>
                <p>
                  This is the spine of the system. It ensures organisations
                  understand real hazards, make clear risk-based decisions, and
                  define controls that are objective, verifiable, and meaningful.
                </p>
                <p className="lss-domain-note">
                  This is where generic safety turns into credible, defensible
                  risk management.
                </p>
              </article>
              <article className="lss-domain-card">
                <div className="lss-domain-index">03</div>
                <h3>The Delivery Engine</h3>
                <p className="lss-domain-subhead">Does it work in the field</p>
                <p>
                  This is where theory meets reality. It connects safe work
                  planning, competence, contractor management, and emergency
                  readiness into a coherent operational approach.
                </p>
                <p className="lss-domain-note">
                  It prioritises simplicity, usability, and effectiveness in
                  day-to-day work.
                </p>
              </article>
              <article className="lss-domain-card">
                <div className="lss-domain-index">04</div>
                <h3>The Learning Loop</h3>
                <p className="lss-domain-subhead">Are we getting better</p>
                <p>
                  This is the nervous system of the framework. It turns
                  incidents, data, and assurance into genuine improvement rather
                  than repetitive corrective actions.
                </p>
                <p className="lss-domain-note">
                  Mature organisations do not simply investigate incidents. They
                  evolve because of them.
                </p>
              </article>
            </div>
          </div>
        </section>

        <div className="section-separator">
          <a className="down-link" href="#direction" aria-label="Scroll to how it works section">
            <span className="down-indicator">&darr;</span>
          </a>
        </div>

        <section className="lss-section lss-direction" id="direction">
          <div className="lss-container">
            <div className="lss-section-header">
              <p className="lss-eyebrow">How it works in practice</p>
              <h2>
                The Safety Energy Loop Framework&trade; (SELF) is deliberately
                designed to work in two directions.
              </h2>
            </div>
            <div className="lss-direction-grid">
              <article className="lss-direction-card">
                <h3>When building a system</h3>
                <ol>
                  <li>Move forward from leadership intent.</li>
                  <li>Clarify real risks and controls.</li>
                  <li>Deliver safe work in the field.</li>
                  <li>Build continuous learning.</li>
                </ol>
                <p className="lss-direction-note">
                  Forward direction builds a system that stands up under pressure.
                </p>
              </article>
              <article className="lss-direction-card">
                <h3>When diagnosing a broken system</h3>
                <ol>
                  <li>Start with recurring incidents.</li>
                  <li>Trace weak controls.</li>
                  <li>Expose unclear risks.</li>
                  <li>Reveal unclear accountability.</li>
                </ol>
                <p className="lss-direction-note">
                  Backward direction shows exactly where the system failed.
                </p>
              </article>
            </div>
            <div className="lss-direction-foot">
              <span>Same framework. Different lens.</span>
            </div>
          </div>
        </section>

        <div className="section-separator">
          <a className="down-link" href="#difference" aria-label="Scroll to why this is different section">
            <span className="down-indicator">&darr;</span>
          </a>
        </div>

        <section className="lss-section lss-difference" id="difference">
          <div className="lss-container">
            <div className="lss-section-header">
              <p className="lss-eyebrow">Why this is different</p>
              <h2>
                Traditional safety systems prioritise compliance over people. The
                Safety Energy Loop Framework&trade; (SELF) reverses that order.
              </h2>
            </div>
            <div className="lss-difference-grid">
              <div className="lss-difference-column">
                <h3>It prioritises</h3>
                <ul>
                  <li>Clarity over complexity.</li>
                  <li>Real evidence over paperwork.</li>
                  <li>Leadership ownership over delegation.</li>
                  <li>Practical usability over theoretical perfection.</li>
                  <li>Continuous learning over static documentation.</li>
                </ul>
              </div>
              <div className="lss-difference-column lss-difference-panel">
                <p>
                  It is built for organisations that want safety to be a strength
                  rather than a burden.
                </p>
                <img
                  src="/images/ashleigh-darwin.jpg"
                  alt="Team reviewing safety systems on site"
                  className="lss-difference-image"
                />
              </div>
            </div>
          </div>
        </section>

        <div className="section-separator">
          <a className="down-link" href="#audience" aria-label="Scroll to who this is for section">
            <span className="down-indicator">&darr;</span>
          </a>
        </div>

        <section className="lss-section lss-audience" id="audience">
          <div className="lss-container">
            <div className="lss-audience-grid">
              <div className="lss-audience-copy">
                <div className="lss-section-header">
                  <p className="lss-eyebrow">Who this is for</p>
                  <h2>The Safety Energy Loop Framework&trade; (SELF) is designed for organisations that</h2>
                </div>
                <ul>
                  <li>Operate in high-risk industries.</li>
                  <li>Want more than minimum compliance.</li>
                  <li>Are frustrated with bloated, impractical safety systems.</li>
                  <li>Need a clear way to build, measure, and improve safety performance.</li>
                  <li>Want a system that makes sense to leaders, supervisors, and workers alike.</li>
                </ul>
              </div>
              <img
                src="/images/system-flow.png"
                alt="System flow framework graphic"
                className="lss-audience-image"
              />
            </div>
          </div>
        </section>

        <section className="lss-cta" id="cta" hidden>
          <div className="lss-container">
            <div className="lss-cta-inner">
              <div className="lss-cta-intro">
                <p className="lss-eyebrow">Start with the Safety Energy Loop Framework</p>
                <h2>Choose your path: guided assessment or self-diagnostic.</h2>
                <p>
                  Engage HSES to assess your system against the framework with
                  you, or run the SELF diagnostic at your own pace and uncover
                  where the system is strong, fragile, or failing under pressure.
                </p>
              </div>
              <div className="lss-cta-split">
                <article className="lss-cta-card lss-cta-card--primary">
                  <div className="lss-cta-visual image-placeholder" aria-hidden="true">
                    Diagnostic
                  </div>
                  <h3>Run the SELF diagnostic yourself</h3>
                  <p>
                    Complete the diagnostic survey solo or with a team. Work
                    module by module and receive practical, actionable insights
                    you can use immediately.
                  </p>
                  <div className="lss-cta-card-actions">
                    <a className="btn btn-primary" href="/sms-diagnostic">
                      Start the SELF diagnostic
                    </a>
                  </div>
                </article>
                <article className="lss-cta-card">
                  <div className="lss-cta-visual image-placeholder" aria-hidden="true">
                    Guided
                  </div>
                  <h3>Assess with an HSES specialist</h3>
                  <p>
                    Book a discovery call and we will walk your leadership team
                    through assessing your business against SELF and prioritising
                    the right next moves.
                  </p>
                  <div className="lss-cta-card-actions">
                    <button className="btn btn-outline js-open-modal" type="button">
                      Book a discovery call
                    </button>
                  </div>
                </article>
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
            <form className="lead-form" action="#" method="post">
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
                  <option value="framework">Safety Energy Loop Framework (SELF)</option>
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

      <Script id="self-framework-scripts" strategy="afterInteractive">
        {String.raw`
    (() => {
      const modal = document.querySelector('[data-modal]');
      if (!modal) return;
      const dialog = modal.querySelector('.modal-dialog');
      const openers = document.querySelectorAll('.js-open-modal');
      const closers = modal.querySelectorAll('.js-close-modal');
      const footerMenuToggle = document.querySelector('.footer-menu-toggle');
      const footerMenu = document.querySelector('.footer-menu');
      const mobileMenu = document.querySelector('[data-mobile-menu]');
      const mobileMenuToggle = document.querySelector('.js-mobile-menu-toggle');
      const mobileMenuClosers = mobileMenu ? mobileMenu.querySelectorAll('.js-close-mobile-menu') : [];

      const open = () => {
        modal.classList.add('is-visible');
        dialog.focus();
        document.body.style.overflow = 'hidden';
      };

      const close = () => {
        modal.classList.remove('is-visible');
        document.body.style.overflow = '';
      };

      openers.forEach(btn => btn.addEventListener('click', open));
      closers.forEach(btn => btn.addEventListener('click', close));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) close();
      });
      document.addEventListener('keyup', (e) => {
        if (e.key === 'Escape') {
          close();
          if (mobileMenu && mobileMenu.classList.contains('is-open')) {
            mobileMenu.classList.remove('is-open');
            document.body.classList.remove('mobile-menu-open');
            if (mobileMenuToggle) {
              mobileMenuToggle.setAttribute('aria-expanded', 'false');
            }
          }
        }
      });

      if (footerMenuToggle && footerMenu) {
        footerMenuToggle.addEventListener('click', () => {
          footerMenu.classList.toggle('is-open');
        });
      }

      if (mobileMenuToggle && mobileMenu) {
        mobileMenuToggle.addEventListener('click', () => {
          mobileMenu.classList.add('is-open');
          document.body.classList.add('mobile-menu-open');
          mobileMenuToggle.setAttribute('aria-expanded', 'true');
        });
        mobileMenuClosers.forEach((btn) => {
          btn.addEventListener('click', () => {
            mobileMenu.classList.remove('is-open');
            document.body.classList.remove('mobile-menu-open');
            mobileMenuToggle.setAttribute('aria-expanded', 'false');
          });
        });
      }
    })();
  `}
      </Script>
    </div>
  );
}


