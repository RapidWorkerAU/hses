import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import styles from "./ContactPage.module.css";

export const metadata: Metadata = {
  title: "Contact",
  description: "Contact HSES Industry Partners to discuss safety documents, systems, and technology.",
};

export default function ContactPage() {
  return (
    <div className={`no-radius ${styles.contactPage}`}>
      <div className={styles.shell}>
        <section className={styles.panel}>
          <div className={styles.panelInner}>
            <div className={styles.brandRow}>
              <a href="/" aria-label="HSES Industry Partners home">
                <img
                  src="/images/logo-black.png"
                  alt="HSES Industry Partners"
                  className={styles.brandImage}
                />
              </a>
              <span className={styles.brandText}>Contact HSES</span>
            </div>

            <ContactForm />

            <p className={styles.footnote}>
              Prefer email? <a href="mailto:ask@hses.com.au">ask@hses.com.au</a>
              {" "}or return to the <a href="/">homepage</a>.
            </p>
          </div>
        </section>

        <aside className={styles.visualPanel} aria-label="HSES Industry Partners">
          <div className={styles.visualOverlay} />
          <div className={styles.visualContent}>
            <p className={styles.visualEyebrow}>HSES Industry Partners</p>
            <h2>Safety documents, systems, and technology built around real operations.</h2>
            <p>
              Tell us what you need and we will come back with the right next step:
              a discovery call, a scope conversation, or a practical way forward.
            </p>
            <div className={styles.visualStats}>
              <span>Documents</span>
              <span>Systems</span>
              <span>Technology</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
