import styles from "./PricingEstimator.module.css";

// Online quote form disabled due to spam. Restore from git history to re-enable.
export default function PricingEstimator() {
  return (
    <div className={styles.estimator}>
      <div className={styles.card}>
        <div className={styles.panelHeader}>
          <h3>Request a Quote</h3>
        </div>

        <div className={styles.form}>
          <div className={styles.section}>
            <div className={styles.sectionTopSingle}>
              <h4>Email us for a quote</h4>
              <p>
                Tell us what you need (documents, a management system, or safety technology), how
                urgent it is, and your business name and contact details. We&apos;ll come back with
                pricing and next steps.
              </p>
            </div>
          </div>

          <div className={styles.actions}>
            <a className={styles.submitButton} href="mailto:ask@hses.com.au?subject=Quote%20request">
              Email ask@hses.com.au
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
