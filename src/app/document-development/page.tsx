import type { Metadata } from "next";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import Link from "next/link";
import PricingEstimator from "../PricingEstimator";
import styles from "./page.module.css";

const siteUrl = "https://www.hses.com.au";

const capabilityCards = [
  {
    title: "Built around the work",
    body: "The document starts with the task, operating context, risk profile and decisions people actually need to make.",
  },
  {
    title: "Connected to the system",
    body: "Policies, procedures, forms and registers are structured so they support each other instead of sitting as isolated files.",
  },
  {
    title: "Technically defensible",
    body: "Content is written by safety practitioners who understand legislation, controls, critical risk and site standards.",
  },
  {
    title: "Ready to implement",
    body: "The finished material is clear enough for inductions, audits, project packs and day-to-day supervision.",
  },
];

const buildIcons = [
  { src: "/images/policy-icon.png", alt: "Policy document icon" },
  { src: "/images/plan-icon.png", alt: "Plan document icon" },
  { src: "/images/procedure-icon1.png", alt: "Procedure document icon" },
  { src: "/images/procedure-icon2.png", alt: "Work instruction document icon" },
  { src: "/images/form-icon.png", alt: "Form document icon" },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Safety Document Development",
  serviceType: "Safety Document Development",
  description:
    "HSES Industry Partners develops WHS documents, procedures, plans, standards and document packs for high-risk businesses in Perth and across Australia.",
  provider: {
    "@id": `${siteUrl}/#organization`,
  },
  areaServed: {
    "@type": "City",
    name: "Perth",
  },
  url: `${siteUrl}/document-development`,
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: siteUrl,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Safety Document Development",
      item: `${siteUrl}/document-development`,
    },
  ],
};

export const metadata: Metadata = {
  title: {
    absolute:
      "Safety Document Development Perth | WHS Procedures and Plans | HSES Industry Partners",
  },
  description:
    "HSES Industry Partners develops WHS documents, procedures, plans, standards and document packs for high-risk businesses in Perth and across Australia. Built around the way your business actually works.",
  alternates: {
    canonical: "/document-development",
  },
  openGraph: {
    title: "Safety Document Development Perth | WHS Procedures and Plans | HSES Industry Partners",
    description:
      "WHS documents, procedures, plans, standards and document packs for high-risk businesses in Perth and across Australia. Built around the way your business actually works.",
    url: "/document-development",
    siteName: "HSES Industry Partners",
    images: [
      {
        url: "/images/documents-section.png",
        width: 900,
        height: 900,
        alt: "HSES safety document development examples",
      },
    ],
    type: "website",
  },
};

export default function DocumentDevelopmentPage() {
  return (
    <div className={styles.landing} data-product-landing-page>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([serviceSchema, breadcrumbSchema]),
        }}
      />

      <PublicSiteHeader active="documents" />

      <main>
        <section className={styles.hero}>
          <div className={`${styles.shell} ${styles.heroPanel}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Document development</p>
              <h1>Safety documents that make the system easier to run.</h1>
              <p className={styles.heroLead}>
                We build health, safety and environment documents around the way your
                business actually works, so the finished material is clear, credible
                and connected to the wider system.
              </p>

              <div className={styles.heroActions}>
                <a className={styles.primaryCta} href="#pricing">
                  Request a quote
                </a>
                <a className={styles.secondaryLink} href="#common-builds">
                  See what we build
                </a>
              </div>

              <dl className={styles.heroStats} aria-label="Document development focus areas">
                <div>
                  <dt>Build</dt>
                  <dd>Plans, procedures, standards and project packs</dd>
                </div>
                <div>
                  <dt>Improve</dt>
                  <dd>Existing documents that are outdated or hard to use</dd>
                </div>
                <div>
                  <dt>Connect</dt>
                  <dd>Content to work, risk, controls and accountability</dd>
                </div>
              </dl>
            </div>

          </div>
        </section>

        <section className={styles.documentSystem} id="document-system">
          <div className={`${styles.sectionShell} ${styles.documentSystemInner}`}>
            <div className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>Why it works</p>
              <h2>Good documents are not standalone paperwork. They are system infrastructure.</h2>
              <p>
                A useful document explains the work, the risk, the controls and the
                accountability behind it. We develop the document and the structure
                around it so people can find it, use it and maintain it.
              </p>
            </div>

            <div className={styles.capabilityGrid}>
              {capabilityCards.map((card) => (
                <article className={styles.capabilityCard} key={card.title}>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.buildSection} id="common-builds">
          <div className={`${styles.sectionShell} ${styles.buildSectionInner}`}>
            <div className={styles.buildPanel}>
              <div className={styles.buildCopy}>
                <p className={styles.sectionLabelLight}>Common builds</p>
                <h3>New documents, upgrades, and complete document packs.</h3>
                <p>
                  We can produce a single procedure, rebuild a complete document pack,
                  or map how your documents connect across the broader safety
                  management system.
                </p>
              </div>

              <div className={styles.buildIconRow} aria-label="Common document build types">
                {buildIcons.map((icon) => (
                  <img
                    key={icon.src}
                    src={icon.src}
                    alt={icon.alt}
                    className={styles.buildIcon}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.pricingSection} id="pricing">
          <div className={`${styles.sectionShell} ${styles.pricingSplit}`}>
            <div className={styles.pricingCopy}>
              <p className={styles.pricingHeading}>Pricing</p>
              <h2 className={styles.pricingTitle}>Need to Understand the Cost?</h2>
              <p>
                We understand that, in all businesses, cash flow is critical,
                and that overheads that don&apos;t generate income need to be
                planned carefully.
              </p>
              <p>
                Necessary improvements still need to be budgeted, staged, and
                explained to the people who approve the spend. A clear quote
                helps you understand what the work may involve before you make
                decisions about timing, scope, or internal priorities.
              </p>
              <p className={styles.pricingFollowUp}>
                Use this form to tell us whether you are looking at document
                development, management system design, or safety technology,
                and how urgent the work is. We will review the context and come
                back with the most practical next step for preparing a quote.
              </p>
              <p className={styles.pricingFinePrint}>
                We will not add you to a mailing list. Your enquiry is used to
                understand the likely work type, urgency, and scope so we can
                respond in a way that is useful for your cash flow and planning.
              </p>
            </div>

            <PricingEstimator />

            <p className={styles.pricingFinePrintMobile}>
              We will not add you to a mailing list. Your enquiry is used to
              understand the likely work type, urgency, and scope so we can
              respond in a way that is useful for your cash flow and planning.
            </p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.sectionShell} ${styles.footerInner}`}>
          <span>&copy; 2026 HSES Industry Partners, Perth, Western Australia</span>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/disclaimer">Website Disclaimer</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
