import type { Metadata } from "next";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import Link from "next/link";
import PricingEstimator from "../PricingEstimator";
import styles from "./page.module.css";

const siteUrl = "https://www.hses.com.au";

const capabilityCards = [
  {
    title: "Mapped before development",
    body: "We use a system design mapping tool to identify the structure the business needs before documents, workflows or technology are built.",
  },
  {
    title: "Designed around the business",
    body: "The map reflects the work, risk profile, sites, contractors, governance needs and current level of system maturity.",
  },
  {
    title: "Connections made visible",
    body: "Documents, registers, forms, actions, assurance activities and reporting points are linked so information moves cleanly through the system.",
  },
  {
    title: "Development schedule clarified",
    body: "The finished map helps us plan the build sequence, dependencies and priorities so development can happen in a practical order.",
  },
];

const mapSteps = [
  "Business context",
  "Required structure",
  "Component links",
  "Build sequence",
  "Implementation plan",
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Safety Management System Design",
  serviceType: "Safety management system design and system mapping",
  description:
    "HSES Industry Partners designs safety management systems using a system design mapping tool to identify required structure, system connections and development schedules.",
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
  url: `${siteUrl}/system-design`,
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
      name: "System Design",
      item: `${siteUrl}/system-design`,
    },
  ],
};

export const metadata: Metadata = {
  title: "Safety Management System Design",
  description:
    "HSES designs safety management systems using mapping tools that clarify structure, connected system components and practical development schedules.",
  alternates: {
    canonical: "/system-design",
  },
  openGraph: {
    title: "Safety Management System Design | HSES Industry Partners",
    description:
      "System design mapping for safety management systems, connected documents, workflows, responsibilities and development planning.",
    url: "/system-design",
    siteName: "HSES Industry Partners",
    images: [
      {
        url: "/images/header.jpg",
        width: 1200,
        height: 630,
        alt: "HSES system design and planning",
      },
    ],
    type: "website",
  },
};

export default function SystemDesignPage() {
  return (
    <div className={styles.landing} data-product-landing-page>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([serviceSchema, breadcrumbSchema]),
        }}
      />

      <PublicSiteHeader active="systems" />

      <main>
        <section className={styles.hero}>
          <div className={`${styles.shell} ${styles.heroPanel}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>System design</p>
              <h1>Safety management systems designed before they are built.</h1>
              <p className={styles.heroLead}>
                We map the structure of your safety management system first, then
                use that map to plan what needs to be built, how the pieces connect
                and what should happen in what order.
              </p>

              <div className={styles.heroActions}>
                <a className={styles.primaryCta} href="#pricing">
                  Get a cost estimate
                </a>
                <a className={styles.secondaryLink} href="#mapping-tool">
                  See the mapping approach
                </a>
              </div>

              <dl className={styles.heroStats} aria-label="System design focus areas">
                <div>
                  <dt>Structure</dt>
                  <dd>Identify the system components each business actually needs</dd>
                </div>
                <div>
                  <dt>Connections</dt>
                  <dd>Show how documents, workflows and information are linked</dd>
                </div>
                <div>
                  <dt>Schedule</dt>
                  <dd>Turn the design into a practical development plan</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className={styles.systemSection} id="system-logic">
          <div className={`${styles.sectionShell} ${styles.systemSectionInner}`}>
            <div className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>Why it works</p>
              <h2>A powerful system is not a collection of files. It is a connected operating structure.</h2>
              <p>
                The mapping process helps us explain how information flows through
                the system, where responsibilities sit and how each component
                supports safer, more efficient work.
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

        <section className={styles.mapSection} id="mapping-tool">
          <div className={`${styles.sectionShell} ${styles.mapSectionInner}`}>
            <div className={styles.mapPanel}>
              <div className={styles.mapCopy}>
                <p className={styles.sectionLabelLight}>System design mapping tool</p>
                <h3>The map becomes the plan for the build.</h3>
                <p>
                  Our system design mapping tool helps identify and refine the
                  required structure for different businesses. It also shows
                  relationships between system components, so the development
                  schedule is based on what needs to connect, not just a list of
                  isolated tasks.
                </p>
              </div>

              <ol className={styles.mapFlow} aria-label="System design mapping sequence">
                {mapSteps.map((step, index) => (
                  <li className={styles.mapStep} key={step}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {step}
                  </li>
                ))}
              </ol>
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
