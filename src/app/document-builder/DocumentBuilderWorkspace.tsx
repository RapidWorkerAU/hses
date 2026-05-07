import Link from "next/link";
import styles from "./DocumentBuilderWorkspace.module.css";

type WorkspaceMetric = {
  label: string;
  value: string;
};

type WorkspaceSection = {
  title: string;
  body: string;
};

type WorkspaceAction = {
  href: string;
  label: string;
  secondary?: boolean;
};

export default function DocumentBuilderWorkspace({
  eyebrow,
  title,
  description,
  metrics,
  sections,
  actions,
  notes,
}: {
  eyebrow: string;
  title: string;
  description: string;
  metrics: WorkspaceMetric[];
  sections: WorkspaceSection[];
  actions: WorkspaceAction[];
  notes?: string[];
}) {
  return (
    <div className={styles.panel}>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </section>

      <section className={styles.metaRow}>
        {metrics.map((metric) => (
          <article key={metric.label} className={styles.metaCard}>
            <span className={styles.metaLabel}>{metric.label}</span>
            <span className={styles.metaValue}>{metric.value}</span>
          </article>
        ))}
      </section>

      <section className={styles.actionRow}>
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`${styles.actionLink} ${action.secondary ? styles.actionLinkSecondary : ""}`.trim()}
          >
            <span>{action.label}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </section>

      <section className={styles.grid}>
        {sections.map((section) => (
          <article key={section.title} className={styles.sectionCard}>
            <h3>{section.title}</h3>
            <p>{section.body}</p>
          </article>
        ))}
      </section>

      {notes?.length ? (
        <section className={styles.notes}>
          <h3>Current Build Notes</h3>
          <ul>
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
