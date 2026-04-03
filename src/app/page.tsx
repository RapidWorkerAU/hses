import type { Metadata } from "next";
import HomePageScripts from "./home-page-scripts";
import styles from "./HomePage.module.css";
import PricingEstimator from "./PricingEstimator";
import HeroRotatingWord from "./HeroRotatingWord";
import HomePageHeaderActions from "./HomePageHeaderActions";

export const metadata: Metadata = {
  title: "HSES Industry Partners",
};

export default function HomePage() {
  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={`${styles.shell} ${styles.header}`}>
          <div className={styles.headerRow}>
            <a href="/" className={styles.logoLink}>
              <img
                src="/images/logo-original-black.png"
                alt="HSES Industry Partners"
                className={styles.logo}
              />
            </a>

            <nav className={styles.desktopNav} aria-label="Primary">
              <a className={styles.desktopNavLink} href="#documents">
                Documents
              </a>
              <a className={styles.desktopNavLink} href="#systems">
                Systems
              </a>
              <a className={styles.desktopNavLink} href="#technology">
                Technology
              </a>
            </nav>

            <div className={styles.desktopActions}>
              <HomePageHeaderActions />
            </div>

            <button
              className={styles.menuToggle}
              type="button"
              aria-label="Open menu"
              aria-expanded="false"
              data-mobile-menu-toggle
            >
              <span className={styles.menuToggleInner}>
                <span className={styles.menuToggleLine}></span>
                <span className={styles.menuToggleLine}></span>
                <span className={styles.menuToggleLine}></span>
              </span>
            </button>
          </div>
        </div>

        <div className={`${styles.shell} ${styles.heroInner}`}>
          <div className={styles.heroPanel}>
            <div className={styles.heroPanelCopy}>
              <h1 className={styles.heroTitle}>
                <span className={styles.heroTitleTopLine}>
                  Safety{" "}
                  <HeroRotatingWord
                    words={["documents", "systems", "apps", "communications"]}
                    className={styles.heroTitleRotatingWord}
                  />
                </span>
                <span className={styles.heroTitleBottomLine}>
                  that make your business look good
                </span>
              </h1>

              <div className={styles.heroActions}>
                <button
                  className={`${styles.heroButton} ${styles.heroButtonPrimary} js-open-modal`}
                  type="button"
                >
                  Let&apos;s Talk
                </button>
                <a
                  className={`${styles.heroButton} ${styles.heroButtonSecondary}`}
                  href="#pricing"
                >
                  Get a cost estimate
                </a>
              </div>

              <a className={styles.heroEmailLink} href="mailto:ask@hses.com.au">
                Email us directly at ask@hses.com.au
                <span className={styles.heroEmailArrow} aria-hidden="true">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className={styles.trust} aria-label="Projects and teams influenced">
          <div className={`${styles.shell} ${styles.trustInner}`}>
            <h2 className={styles.trustHeading}>
              <span className={styles.trustHeadingPrimary}>Teams we&apos;ve influenced.</span>
              <span className={styles.trustHeadingSecondary}>Names you&apos;ll recognise.</span>
            </h2>

            <div className={styles.trustCarousel} aria-label="Client logos">
              <div className={styles.trustTrack}>
                <div className={styles.trustSlide}>
                  <img
                    src="/images/rio.png"
                    alt="Rio Tinto logo"
                    className={styles.trustLogo}
                  />
                  <img
                    src="/images/airport.png"
                    alt="Perth Airport logo"
                    className={styles.trustLogo}
                  />
                  <img
                    src="/images/enerpac.png"
                    alt="Enerpac logo"
                    className={styles.trustLogo}
                  />
                  <img
                    src="/images/chevron.png"
                    alt="Chevron logo"
                    className={styles.trustLogo}
                  />
                  <img
                    src="/images/inpex.png"
                    alt="Inpex logo"
                    className={styles.trustLogo}
                  />
                </div>
                <div className={styles.trustSlide} aria-hidden="true">
                  <img
                    src="/images/rio.png"
                    alt=""
                    className={styles.trustLogo}
                  />
                  <img
                    src="/images/airport.png"
                    alt=""
                    className={styles.trustLogo}
                  />
                  <img
                    src="/images/enerpac.png"
                    alt=""
                    className={styles.trustLogo}
                  />
                  <img
                    src="/images/chevron.png"
                    alt=""
                    className={styles.trustLogo}
                  />
                  <img
                    src="/images/inpex.png"
                    alt=""
                    className={styles.trustLogo}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.documents} id="documents">
          <div className={`${styles.shell} ${styles.documentsInner}`}>
            <div className={styles.documentsIntro}>
              <p className={styles.documentsEyebrow}>Documents</p>
              <h2 className={styles.documentsTitle}>
                We develop technical documents that don&apos;t sound like generic
                safety cr*p...
              </h2>
              <p className={styles.documentsSubhead}>
                or we can improve the documents you already have
              </p>
            </div>

            <div className={styles.documentsContent}>
              <div className={styles.documentsVisualColumn} aria-hidden="true">
                <img
                  src="/images/documentexamples.png"
                  alt=""
                  className={styles.documentsGraphic}
                />
              </div>

              <div className={styles.documentsContentsImageColumn} aria-hidden="true">
                <img
                  src="/images/contentssection.png"
                  alt=""
                  className={styles.documentsContentsImage}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.systems} id="systems">
          <div className={`${styles.shell} ${styles.systemsInner}`}>
            <div className={styles.systemsTop}>
              <div className={styles.systemsHeading}>
                <p className={styles.systemsEyebrow}>Systems</p>
                <h2>
                  A properly built safety management system connects every layer
                  of your business.
                </h2>
                <p className={`${styles.systemsIntro} ${styles.systemsIntroSecondary}`}>
                  Most businesses have safety documents. Very few have a system.
                  The difference is whether your policies, procedures, roles,
                  risks and controls are connected to each other and to the way
                  your operation actually runs.
                </p>
                <p className={styles.systemsIntro}>
                  We design and build safety management systems from the
                  architecture up. Before a single document gets written, we map
                  how your business operates, where accountability sits, and
                  what the system needs to hold together at scale. What gets
                  built reflects your operation, not a generic template someone
                  adapted.
                </p>

                <div className={styles.systemsActionsDesktop}>
                  <button
                    className={`${styles.systemsButton} js-open-modal`}
                    type="button"
                  >
                    Talk to us about your system
                  </button>
                  <a className={styles.systemsLink} href="#pricing">
                    See what a system build involves
                  </a>
                </div>
              </div>

              <div className={styles.systemsVisual}>
                <img
                  src="/images/systems-section.png"
                  alt="HSES systems overview"
                  className={styles.systemsImage}
                />
              </div>
            </div>

            <div className={styles.systemsGrid}>
              <article className={styles.systemsCard}>
                <span className={styles.systemsNumber}>01</span>
                <h3>System architecture</h3>
                <p>
                  We design the structure before anything is written. Every
                  element has a place and a purpose before we start.
                </p>
              </article>
              <article className={styles.systemsCard}>
                <span className={styles.systemsNumber}>02</span>
                <h3>Policy and framework</h3>
                <p>
                  The foundation of the system. Written to reflect your
                  business, your risk profile and your obligations.
                </p>
              </article>
              <article className={styles.systemsCard}>
                <span className={styles.systemsNumber}>03</span>
                <h3>Roles and accountability</h3>
                <p>
                  We define who owns what inside the system so that nothing
                  sits without a responsible party behind it.
                </p>
              </article>
              <article className={styles.systemsCard}>
                <span className={styles.systemsNumber}>04</span>
                <h3>Operational integration</h3>
                <p>
                  The system is built around how your business runs. Not the
                  other way around.
                </p>
              </article>
            </div>

            <div className={styles.systemsActionsMobile}>
              <button
                className={`${styles.systemsButton} js-open-modal`}
                type="button"
              >
                Talk to us about your system
              </button>
              <a className={styles.systemsLink} href="#pricing">
                See what a system build involves
              </a>
            </div>
          </div>
        </section>

        <section className={styles.technology} id="technology">
          <div className={`${styles.shell} ${styles.technologyShell}`}>
            <div className={styles.technologyHeader}>
              <p className={styles.sectionKickerCenter}>Technology</p>
              <h2 className={styles.sectionTitleLeft}>
                Technology we built because nothing else did the job properly.
              </h2>
            </div>

            <p className={styles.technologyIntro}>
              A suite of purpose-built safety technology covering system
              design, bow-tie development, document mapping, investigation
              management, org chart creation, and process flows. Available as
              standard products or developed to your exact operational
              requirements.
            </p>

            <div className={styles.technologyShowcase} aria-hidden="true">
              <img
                src="/images/safedoxexample.png"
                alt=""
                className={`${styles.technologyShot} ${styles.technologyShotLeft}`}
              />
              <img
                src="/images/investigationtoolexample.png"
                alt=""
                className={`${styles.technologyShot} ${styles.technologyShotCenter}`}
              />
              <img
                src="/images/hsesportalexample.png"
                alt=""
                className={`${styles.technologyShot} ${styles.technologyShotRight}`}
              />
            </div>

            <div className={styles.technologyDetails}>
              <article
                className={`${styles.technologyDetailCard} ${styles.technologyDetailCardAmber}`}
              >
                <div className={styles.technologyDetailHeader}>
                  <img
                    src="/images/safedox-logo-white.png"
                    alt="Safedox"
                    className={styles.technologyDetailLogo}
                  />
                  <span className={styles.technologyStatusSoon}>Coming soon</span>
                </div>
                <h3>Safedox</h3>
                <p>
                  A health and safety document builder that helps businesses
                  generate polished, fit-for-purpose documents quickly.
                </p>
                <button
                  className={`${styles.technologyActionLink} js-open-modal`}
                  type="button"
                >
                  Join the waitlist
                </button>
              </article>

              <article
                className={`${styles.technologyDetailCard} ${styles.technologyDetailCardCyan}`}
              >
                <div className={styles.technologyDetailHeader}>
                  <img
                    src="/images/investigation-tool.png"
                    alt="Investigation Tool"
                    className={styles.technologyDetailLogo}
                  />
                  <span className={styles.technologyStatusLive}>Live</span>
                </div>
                <h3>Investigation Tool</h3>
                <p>
                  A purpose-built investigation platform for mapping incidents,
                  managing evidence, and running structured workflows in one
                  place.
                </p>
                <a
                  className={styles.technologyActionLink}
                  href="https://www.investigationtool.com.au"
                  target="_blank"
                  rel="noreferrer"
                >
                  Access the tool
                </a>
              </article>

              <article
                className={`${styles.technologyDetailCard} ${styles.technologyDetailCardBlue}`}
              >
                <div className={styles.technologyDetailHeader}>
                  <img
                    src="/images/logo-original-white.png"
                    alt="HSES Client Portal"
                    className={`${styles.technologyDetailLogo} ${styles.technologyDetailLogoHses}`}
                  />
                  <span className={styles.technologyStatusContact}>Contact us</span>
                </div>
                <h3>HSES Client Portal</h3>
                <p>
                  The HSES platform for system mapping, document search,
                  bow-ties, org charts, and the wider safety management
                  infrastructure around them.
                </p>
                <button
                  className={`${styles.technologyActionLink} js-open-modal`}
                  type="button"
                >
                  Request access
                </button>
              </article>
            </div>

            <div className={styles.technologyMobileStack}>
              <div className={`${styles.technologyMobileItem} ${styles.technologyDetailCardAmber}`}>
                <article className={styles.technologyDetailCard}>
                  <div className={styles.technologyDetailHeader}>
                    <img
                      src="/images/safedox-logo-white.png"
                      alt="Safedox"
                      className={styles.technologyDetailLogo}
                    />
                    <span className={styles.technologyStatusSoon}>Coming soon</span>
                  </div>
                  <h3>Safedox</h3>
                  <p>
                    A health and safety document builder that helps businesses
                    generate polished, fit-for-purpose documents quickly.
                  </p>
                  <button
                    className={`${styles.technologyActionLink} js-open-modal`}
                    type="button"
                  >
                    Join the waitlist
                  </button>
                </article>
                <img
                  src="/images/safedoxexample.png"
                  alt=""
                  className={`${styles.technologyShot} ${styles.technologyShotMobile}`}
                />
              </div>

              <div className={`${styles.technologyMobileItem} ${styles.technologyDetailCardCyan}`}>
                <article className={styles.technologyDetailCard}>
                  <div className={styles.technologyDetailHeader}>
                    <img
                      src="/images/investigation-tool.png"
                      alt="Investigation Tool"
                      className={styles.technologyDetailLogo}
                    />
                    <span className={styles.technologyStatusLive}>Live</span>
                  </div>
                  <h3>Investigation Tool</h3>
                  <p>
                    A purpose-built investigation platform for mapping incidents,
                    managing evidence, and running structured workflows in one
                    place.
                  </p>
                  <a
                    className={styles.technologyActionLink}
                    href="https://www.investigationtool.com.au"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Access the tool
                  </a>
                </article>
                <img
                  src="/images/investigationtoolexample.png"
                  alt=""
                  className={`${styles.technologyShot} ${styles.technologyShotMobile}`}
                />
              </div>

              <div className={`${styles.technologyMobileItem} ${styles.technologyDetailCardBlue}`}>
                <article className={styles.technologyDetailCard}>
                  <div className={styles.technologyDetailHeader}>
                    <img
                      src="/images/logo-original-white.png"
                      alt="HSES Client Portal"
                      className={`${styles.technologyDetailLogo} ${styles.technologyDetailLogoHses}`}
                    />
                    <span className={styles.technologyStatusContact}>Contact us</span>
                  </div>
                  <h3>HSES Client Portal</h3>
                  <p>
                    The HSES platform for system mapping, document search,
                    bow-ties, org charts, and the wider safety management
                    infrastructure around them.
                  </p>
                  <button
                    className={`${styles.technologyActionLink} js-open-modal`}
                    type="button"
                  >
                    Request access
                  </button>
                </article>
                <img
                  src="/images/hsesportalexample.png"
                  alt=""
                  className={`${styles.technologyShot} ${styles.technologyShotMobile}`}
                />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.pricing} id="pricing">
          <div className={`${styles.shell} ${styles.pricingSplit}`}>
            <div className={styles.pricingCopy}>
              <p className={styles.pricingHeading}>Pricing</p>
              <h2 className={styles.pricingTitle}>After a Cost Estimate?</h2>
              <p>
                We understand that, in all businesses, cash flow is critical,
                and that overheads that don&apos;t generate income need to be
                planned.
              </p>
              <p>
                In honour of this, we have provided an estimation tool that you
                can use to get a rough estimate of what our standard services
                may cost for certain activities.
              </p>
              <p className={styles.pricingFollowUp}>
                You will be asked to enter your email address to receive the
                cost estimate. We may reach out to ask whether you have any
                follow-up questions about the estimate or any unique business
                needs that this estimate tool does not cover. We will only
                follow up once, and you will not be added to a mailing list.
              </p>
              <p className={styles.pricingFinePrint}>
                **Disclaimer** The figures in this estimate are based off
                average completion times for similar tasks. These cover standard
                tasks and do not account for unique business needs. HSES
                Industry Partners reserves the right to alter this estimate tool
                at any time and the figures you receive from this tool do not
                constitute a formal quote.
              </p>
            </div>

            <PricingEstimator />

            <p className={styles.pricingFinePrintMobile}>
              **Disclaimer** The figures in this estimate are based off
              average completion times for similar tasks. These cover standard
              tasks and do not account for unique business needs. HSES
              Industry Partners reserves the right to alter this estimate tool
              at any time and the figures you receive from this tool do not
              constitute a formal quote.
            </p>
          </div>

          <footer className={styles.footer}>
            <div className={`${styles.shell} ${styles.footerBar}`}>
              <span className={styles.footerCopy}>
                &copy; 2026 HSES Industry Partners
              </span>
              <div className={styles.footerLinks}>
                <a className={styles.footerLink} href="/privacy">
                  Privacy Policy
                </a>
                <a className={styles.footerLink} href="/disclaimer">
                  Website Disclaimer
                </a>
              </div>
            </div>
          </footer>
        </section>
      </main>

      <div className={styles.mobileMenu} data-mobile-menu>
        <div className={`${styles.mobileBackdrop} js-close-mobile-menu`}></div>
        <div className={styles.mobilePanel} role="dialog" aria-modal="true" aria-label="Menu">
          <div className={styles.mobilePanelHeader}>
            <img
              src="/images/logo-white.png"
              alt="HSES Industry Partners"
              className={styles.mobileLogo}
            />
            <button
              className={`${styles.mobileClose} js-close-mobile-menu`}
              type="button"
              aria-label="Close menu"
            >
              ×
            </button>
          </div>

          <nav className={styles.mobileNav} aria-label="Primary">
            <a className={`${styles.mobileNavLink} js-close-mobile-menu`} href="#documents">
              Documents
            </a>
            <a className={`${styles.mobileNavLink} js-close-mobile-menu`} href="#systems">
              Systems
            </a>
            <a className={`${styles.mobileNavLink} js-close-mobile-menu`} href="#technology">
              Technology
            </a>
              <HomePageHeaderActions variant="mobile" />
          </nav>
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
            <img src="/icons/close.svg" alt="" aria-hidden="true" className="modal-close-icon" />
          </button>
          <div className="form-panel modal-panel">
            <h2 id="modal-title">Book a discovery call</h2>
            <p>Share what you need. We&apos;ll confirm fit and next steps.</p>
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
                  Don&apos;t fill this out:
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
