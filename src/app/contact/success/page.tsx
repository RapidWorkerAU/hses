import type { Metadata } from "next";
import GoogleContactConversion from "./GoogleContactConversion";
import styles from "../../auth/AuthPage.module.css";

export const metadata: Metadata = {
  title: "Request Sent",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ContactSuccessPage() {
  return (
    <div className={styles.page}>
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
              <span className={styles.brandText}>Request Sent</span>
            </div>

            <div className={styles.copyBlock}>
              <h1>Thank you, we have received your enquiry.</h1>
              <p>
                We will review what you have sent through and get back to you within 1-3 business days.
                Our response will focus on the practical next step, what information we may need, and how
                to move the work forward in a way that suits your timing and budget planning.
              </p>
            </div>

            <a className={styles.homeButton} href="/">
              Return to homepage
            </a>
          </div>
        </section>

        <aside className={styles.visualPanel} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.visualLines} />
          <div className={styles.visualContent}>
            <div className={styles.visualIntro}>
              <p className={styles.visualEyebrow}>HSES Industry Partners</p>
              <h2 className={styles.visualHeading}>We will come back with a practical way forward.</h2>
              <p className={styles.visualText}>
                Your details have been sent through. The next response will be focused on fit, scope,
                timing, and what needs to happen next.
              </p>
              <div className={styles.visualStats}>
                <div className={styles.visualStat}>
                  <span className={styles.visualStatValue}>Received</span>
                  <span className={styles.visualStatLabel}>Your enquiry has been submitted to HSES.</span>
                </div>
                <div className={styles.visualStat}>
                  <span className={styles.visualStatValue}>Reviewing</span>
                  <span className={styles.visualStatLabel}>We will consider the work type, timing, and context.</span>
                </div>
                <div className={styles.visualStat}>
                  <span className={styles.visualStatValue}>Next step</span>
                  <span className={styles.visualStatLabel}>We will respond within 1-3 business days.</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
