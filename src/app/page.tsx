import type { Metadata } from "next";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import Link from "next/link";
import HomePageScripts from "./home-page-scripts";
import styles from "./HomePage.module.css";
import PricingEstimator from "./PricingEstimator";
import HeroRotatingWord from "./HeroRotatingWord";
import HomePageHeaderActions from "./HomePageHeaderActions";
import HeroBackgroundVideo from "./HeroBackgroundVideo";

export const metadata: Metadata = {
  title: "HSES Industry Partners",
};

export default function HomePage() {
  return (
    <div className={styles.page} data-home-page>
      <PublicSiteHeader />

      <header className={styles.hero}>
        <div className={`${styles.shell} ${styles.heroInner}`}>
          <div className={styles.heroPanel}>
            <div className={styles.heroMedia} aria-hidden="true">
              <HeroBackgroundVideo />
            </div>
            <div className={styles.heroPanelOverlay} aria-hidden="true"></div>
            <div className={styles.heroFeatureImage} aria-hidden="true"></div>
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
                <a
                  className={`${styles.heroButton} ${styles.heroButtonPrimary}`}
                  href="/contact"
                >
                  Let&apos;s Talk
                </a>
                <a
                  className={`${styles.heroButton} ${styles.heroButtonSecondary}`}
                  href="#pricing"
                >
                  Get a cost estimate
                </a>
              </div>

              <a className={styles.heroEmailLink} href="mailto:ask@hses.com.au">
                <span className={styles.heroEmailPill}>
                  Email us directly at ask@hses.com.au
                </span>
                <span className={styles.heroEmailArrow} aria-hidden="true">
                  <span>›</span>
                  <span>›</span>
                  <span>›</span>
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

        <section className={styles.systems} id="systems">
          <div className={`${styles.shell} ${styles.systemsInner}`}>
            <div className={styles.systemsTop}>
              <div className={styles.systemsHeading}>
                <p className={styles.systemsEyebrow}>Connected systems</p>
                <h2>
                  Documents, systems and technology work best when they are
                  built as one connected system.
                </h2>
                <p className={`${styles.systemsIntro} ${styles.systemsIntroSecondary}`}>
                  Powerful systems are not built from documents alone, and
                  technology does not fix a weak structure. The power comes from
                  how procedures, responsibilities, controls and tools connect
                  to the real work.
                </p>
                <p className={styles.systemsIntro}>
                  We map the system first, then build the documents, workflows
                  and digital tools around it. That keeps information findable,
                  ownership clear and the whole system easier to use, maintain
                  and defend.
                </p>

                <div className={styles.systemsActionsDesktop}>
                  <a
                    className={styles.systemsButton}
                    href="/contact"
                  >
                    Build a connected system
                  </a>
                  <a className={styles.systemsLink} href="#pricing">
                    Get a cost estimate
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
                <h3>Document architecture</h3>
                <p>
                  Policies, procedures, forms and workflows are structured so
                  people can find what they need and understand how it connects.
                </p>
              </article>
              <article className={styles.systemsCard}>
                <span className={styles.systemsNumber}>02</span>
                <h3>System framework</h3>
                <p>
                  Roles, risks, controls and assurance activities are mapped so
                  the system has a clear logic behind it.
                </p>
              </article>
              <article className={styles.systemsCard}>
                <span className={styles.systemsNumber}>03</span>
                <h3>Digital enablement</h3>
                <p>
                  Technology supports the system where it makes information
                  easier to access, update, search and act on.
                </p>
              </article>
              <article className={styles.systemsCard}>
                <span className={styles.systemsNumber}>04</span>
                <h3>Operational rhythm</h3>
                <p>
                  The final build reflects how teams plan work, make decisions,
                  verify controls and improve over time.
                </p>
              </article>
            </div>

            <div className={styles.systemsActionsMobile}>
              <a
                className={styles.systemsButton}
                href="/contact"
              >
                Build a connected system
              </a>
              <a className={styles.systemsLink} href="#pricing">
                Get a cost estimate
              </a>
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
            <Link className={`${styles.mobileNavLink} js-close-mobile-menu`} href="/document-development">
              Documents
            </Link>
            <Link className={`${styles.mobileNavLink} js-close-mobile-menu`} href="/system-design">
              Systems
            </Link>
            <Link className={`${styles.mobileNavLink} js-close-mobile-menu`} href="/technology-options">
              Technology
            </Link>
            <a className={`${styles.mobileNavLink} js-close-mobile-menu`} href="#pricing">
              Pricing
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
              name="contact-request"
              method="post"
              action="/api/public/contact-request"
            >
              <input type="hidden" name="form-name" value="contact-request" />
              <input type="hidden" name="bot-field" />
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
