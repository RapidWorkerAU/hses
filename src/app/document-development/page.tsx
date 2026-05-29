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
  serviceType: "Work health and safety document development",
  description:
    "HSES Industry Partners develops health, safety and environment documents, procedures, plans, standards, and operational document packs for high-risk businesses.",
  provider: {
    "@type": "Organization",
    name: "HSES Industry Partners",
    url: siteUrl,
    logo: `${siteUrl}/images/logo-original-black.png`,
  },
  areaServed: {
    "@type": "Country",
    name: "Australia",
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
  title: "Safety Document Development",
  description:
    "HSES develops health and safety documents, procedures, plans, standards, and document packs that are technically credible and built around real work.",
  alternates: {
    canonical: "/document-development",
  },
  openGraph: {
    title: "Safety Document Development | HSES Industry Partners",
    description:
      "Health and safety documents, procedures, plans, standards, and document packs built around your operation.",
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
                  Get a cost estimate
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
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.sectionShell} ${styles.footerInner}`}>
          <span>&copy; 2026 HSES Industry Partners</span>
          <div className={styles.footerLinks}>
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/disclaimer">Website Disclaimer</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
