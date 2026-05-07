import type { Metadata } from "next";
import GoogleContactConversion from "./GoogleContactConversion";
import styles from "../ContactPage.module.css";

export const metadata: Metadata = {
  title: "Request Sent",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ContactSuccessPage() {
  return (
    <div className={`no-radius ${styles.contactPage}`}>
      <GoogleContactConversion
        conversionId={process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID}
        conversionLabel={process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_CONVERSION_LABEL}
      />

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
              <span className={styles.brandText}>Request sent</span>
            </div>

            <div className={styles.successStage}>
              <div className={styles.successState}>
                <span className={styles.successMark} aria-hidden="true">
                  <span />
                </span>
                <div>
                  <h1>Thanks, we received your request.</h1>
                  <p>
                    We respond within 48 hours to confirm fit, timing, and the
                    practical next step.
                  </p>
                </div>

                <div className={styles.successActions}>
                  <a className={styles.primaryAction} href="/">
                    Return to homepage
                  </a>
                </div>
              </div>
            </div>

          </div>
        </section>

        <aside className={styles.visualPanel} aria-label="HSES Industry Partners">
          <div className={styles.visualOverlay} />
          <div className={styles.visualContent}>
            <p className={styles.visualEyebrow}>HSES Industry Partners</p>
            <h2>We will come back with a practical way forward.</h2>
            <p>
              Your details have been sent through. The next response will be
              focused on fit, scope, and what needs to happen next.
            </p>
            <div className={styles.visualStats}>
              <span>Received</span>
              <span>Reviewing</span>
              <span>Next step</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
