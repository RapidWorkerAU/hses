import type { Metadata } from "next";
import PublicSiteHeader from "@/components/PublicSiteHeader";
import Link from "next/link";
import PricingEstimator from "../PricingEstimator";
import styles from "./page.module.css";

const siteUrl = "https://www.hses.com.au";

const capabilityCards = [
  {
    title: "Tools built around safety work",
    body: "The technology supports investigations, system mapping, documentation and operational learning rather than forcing the work into a generic platform.",
  },
  {
    title: "System context stays visible",
    body: "Documents, bow ties, process flows and investigation outputs can be understood as connected parts of the management system.",
  },
  {
    title: "Clearer information pathways",
    body: "The aim is to make information easier to find, explain and act on, so teams spend less time chasing context.",
  },
  {
    title: "Built for practical adoption",
    body: "Technology is selected or developed around the business need, the current system maturity and the way the work is actually managed.",
  },
];

const technologyOptions = [
  {
    status: "Available",
    logo: "/images/investigation-tool.png",
    logoAlt: "Investigation Tool",
    logoClassName: styles.optionLogoIcon,
    title: "Investigation Tool",
    body: "A guided investigation workspace for capturing what happened, organising evidence, working through causes and keeping actions connected to the event.",
  },
  {
    status: "Available",
    logo: "/images/logo-original-black.png",
    logoAlt: "HSES Portal",
    logoClassName: styles.optionLogoWide,
    title: "HSES Portal",
    body: "A practical system workspace for document maps, bow ties and process flows, helping teams show how information and controls connect.",
  },
  {
    status: "Coming soon",
    logo: "/images/safedox-logo.png",
    logoAlt: "Safedox",
    logoClassName: styles.optionLogoSafedox,
    title: "Safedox",
    body: "Auto-generated safety documentation designed to help produce clear, usable safety documents from structured inputs and system context.",
  },
];

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Safety Technology Options",
  serviceType: "Safety technology, investigation tools, portals and safety documentation automation",
  description:
    "HSES Industry Partners provides safety technology options including an investigation tool, HSES Portal for document maps, bow ties and process flows, and Safedox for auto-generated safety documentation.",
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
  url: `${siteUrl}/technology-options`,
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
      name: "Technology Options",
      item: `${siteUrl}/technology-options`,
    },
  ],
};

export const metadata: Metadata = {
  title: "Safety Technology Options",
  description:
    "HSES technology options include an investigation tool, HSES Portal for document maps, bow ties and process flows, and Safedox for auto-generated safety documentation.",
  alternates: {
    canonical: "/technology-options",
  },
  openGraph: {
    title: "Safety Technology Options | HSES Industry Partners",
    description:
      "Investigation tools, HSES Portal system mapping, and Safedox safety documentation automation.",
    url: "/technology-options",
    siteName: "HSES Industry Partners",
    images: [
      {
        url: "/images/dampier-salt.jpg",
        width: 1200,
        height: 630,
        alt: "HSES safety technology options",
      },
    ],
    type: "website",
  },
};

export default function TechnologyOptionsPage() {
  return (
    <div className={styles.landing} data-product-landing-page>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([serviceSchema, breadcrumbSchema]),
        }}
      />

      <PublicSiteHeader active="technology" />

      <main>
        <section className={styles.hero}>
          <div className={`${styles.shell} ${styles.heroPanel}`}>
            <div className={styles.heroCopy}>
              <p className={styles.kicker}>Technology options</p>
              <h1>Safety tools that make the system easier to use.</h1>
              <p className={styles.heroLead}>
                We use technology where it makes safety work clearer, faster and
                easier to explain. The tools support investigations, system maps,
                bow ties, process flows and safety documentation.
              </p>

              <div className={styles.heroActions}>
                <a className={styles.primaryCta} href="#pricing">
                  Get a cost estimate
                </a>
                <a className={styles.secondaryLink} href="#technology-options">
                  See the options
                </a>
              </div>

              <dl className={styles.heroStats} aria-label="Technology option focus areas">
                <div>
                  <dt>Investigate</dt>
                  <dd>Capture events, evidence, causes and actions in one workspace</dd>
                </div>
                <div>
                  <dt>Map</dt>
                  <dd>Show documents, bow ties and process flows in system context</dd>
                </div>
                <div>
                  <dt>Generate</dt>
                  <dd>Safedox is coming soon for auto-generated safety documents</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className={styles.technologySection} id="technology-logic">
          <div className={`${styles.sectionShell} ${styles.technologySectionInner}`}>
            <div className={styles.sectionIntro}>
              <p className={styles.sectionLabel}>Why it works</p>
              <h2>Technology is useful when it strengthens the system around the work.</h2>
              <p>
                The value is not another place to store information. The value is
                having tools that help people understand what happened, how work is
                controlled and how system information is linked.
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

        <section className={styles.optionsSection} id="technology-options">
          <div className={`${styles.sectionShell} ${styles.optionsSectionInner}`}>
            <div className={styles.optionsPanel}>
              <div className={styles.optionsCopy}>
                <p className={styles.sectionLabelLight}>Technology options</p>
                <h3>Investigation, mapping and documentation tools.</h3>
                <p>
                  These options can support a broader system design, a document
                  build, or a specific operational need where information needs to
                  be clearer and easier to use.
                </p>
              </div>

              <div className={styles.optionRail} aria-label="HSES technology options">
                {technologyOptions.map((option) => (
                  <article className={styles.optionItem} key={option.title}>
                    <div className={styles.optionLogoSlot}>
                      <img
                        src={option.logo}
                        alt={option.logoAlt}
                        className={`${styles.optionLogo} ${option.logoClassName}`}
                      />
                    </div>
                    <span>{option.status}</span>
                    <h4>{option.title}</h4>
                    <p>{option.body}</p>
                  </article>
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
