import type { Metadata } from "next";
import DashboardLogoutLink from "../../../DashboardLogoutLink";
import DashboardSessionText from "../../../DashboardSessionText";
import BusinessAdminLink from "../../../BusinessAdminLink";
import ClauseIndicatorClient from "./ClauseIndicatorClient";

export function generateMetadata(): Metadata {
  return {
    title: "Diagnostic results",
  };
}

export default async function DiagnosticResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="diagnostic-body page-stack dashboard-portal">
      <header className="site-header">
        <div className="header-inner">
          <div className="header-left">
            <a href="/">
              <img
                src="/images/logo-white.png"
                alt="HSES Industry Partners"
                className="header-logo"
              />
            </a>
          </div>
          <div className="header-actions">
            <div className="dashboard-session">
              <DashboardSessionText />
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="dashboard-shell">
          <aside className="dashboard-sidebar" aria-label="Dashboard navigation">
            <div className="dashboard-sidebar-inner">
              <div className="dashboard-sidebar-title">Client portal</div>
              <nav className="dashboard-sidebar-nav">
                <a className="dashboard-sidebar-link" href="/sms-diagnostic/dashboard">
                  Overview
                </a>
                <a
                  className="dashboard-sidebar-link is-active"
                  href="/sms-diagnostic/dashboard/diagnostics"
                >
                  Diagnostics
                </a>
                <a className="dashboard-sidebar-link" href="/sms-diagnostic/dashboard/codes">
                  Code register
                </a>
                <a className="dashboard-sidebar-link" href="/sms-diagnostic/access">
                  Access landing
                </a>
              </nav>
              <div className="dashboard-sidebar-footer">
                <BusinessAdminLink className="dashboard-sidebar-link" />
                <DashboardLogoutLink className="dashboard-sidebar-link dashboard-sidebar-link--logout" />
              </div>
            </div>
          </aside>

          <section className="dashboard-section dashboard-main">
            <div className="diagnostic-container">
              <div className="dashboard-page-header">
                <img
                  src="/images/SELF-Original-Logo.png"
                  alt="Safety Energy Loop Framework logo"
                  className="dashboard-page-logo"
                />
                <h1>Diagnostic results</h1>
              </div>
              <section className="dashboard-panel">
                <div className="dashboard-panel-header">
                  <h2>Intent and fundamental criteria</h2>
                  <p>Indicators update as access codes are completed.</p>
                </div>
                <div className="dashboard-table-wrap" role="region" aria-label="Diagnostic results table">
                  <table className="diagnostic-results-table">
                    <thead>
                      <tr className="results-superhead">
                        <th className="col-category">Category</th>
                        <th className="col-intent" colSpan={3}>
                          Intent and fundamental criteria
                        </th>
                        <th className="col-strength">Strength</th>
                      </tr>
                      <tr className="results-subhead">
                        <th />
                        <th className="col-number">#</th>
                        <th className="col-topic">Topic</th>
                        <th className="col-clauses">Clauses</th>
                        <th className="col-indicators">Indicators</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="results-category results-category--leadership" rowSpan={2}>
                          <div className="results-category-title">Leadership &amp; Accountability</div>
                        </td>
                        <td className="results-number">
                          <span>1.1</span>
                        </td>
                        <td className="results-topic">
                          <span>Leadership Intent and Expectations</span>
                        </td>
                        <td className="results-clauses">
                          <div className="results-clause">
                            Clarity and consistency of leadership safety intent
                          </div>
                          <div className="results-clause">
                            Translation of intent into roles, expectations and decisions
                          </div>
                          <div className="results-clause">
                            Shared understanding of safety intent across leadership layers
                          </div>
                          <div className="results-clause">
                            Visible alignment between what leaders say and what they do
                          </div>
                        </td>
                        <td className="results-indicator-list">
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Clarity and consistency of leadership safety intent"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Translation of intent into roles, expectations and decisions"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Shared understanding of safety intent across leadership layers"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Visible alignment between what leaders say and what they do"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="results-number">
                          <span>1.2</span>
                        </td>
                        <td className="results-topic">
                          <span>Leadership Accountability for Outcomes</span>
                        </td>
                        <td className="results-clauses">
                          <div className="results-clause">
                            Formal accountability for safety in leadership performance measures
                          </div>
                          <div className="results-clause">
                            Ownership of system performance and critical control health
                          </div>
                          <div className="results-clause">
                            Leadership response to incidents, risk and system failures
                          </div>
                          <div className="results-clause">
                            Consistency and fairness in how accountability is applied
                          </div>
                        </td>
                        <td className="results-indicator-list">
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Formal accountability for safety in leadership performance measures"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Ownership of system performance and critical control health"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Leadership response to incidents, risk and system failures"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Consistency and fairness in how accountability is applied"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="results-category results-category--decision" rowSpan={2}>
                          <div className="results-category-title">
                            Decision Rights &amp; Governance Structure
                          </div>
                        </td>
                        <td className="results-number">
                          <span>2.1</span>
                        </td>
                        <td className="results-topic">
                          <span>Decision Rights for High-Risk Work</span>
                        </td>
                        <td className="results-clauses">
                          <div className="results-clause">
                            Clarity of approval, escalation, and stop-work authority
                          </div>
                          <div className="results-clause">
                            Consistent application of decision rules in practice
                          </div>
                          <div className="results-clause">
                            Alignment between documented decision rights and real decisions
                          </div>
                          <div className="results-clause">
                            Functionality of escalation pathways under pressure
                          </div>
                        </td>
                        <td className="results-indicator-list">
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Clarity of approval, escalation, and stop-work authority"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Consistent application of decision rules in practice"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Alignment between documented decision rights and real decisions"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Functionality of escalation pathways under pressure"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="results-number">
                          <span>2.2</span>
                        </td>
                        <td className="results-topic">
                          <span>Governance Forums and Structure</span>
                        </td>
                        <td className="results-clauses">
                          <div className="results-clause">
                            Clarity of governance structure, roles, and forums
                          </div>
                          <div className="results-clause">
                            Quality and purposefulness of safety meetings and reviews
                          </div>
                          <div className="results-clause">
                            Decision-making, action tracking, and follow-through
                          </div>
                          <div className="results-clause">
                            Flow of safety information between frontline and leadership
                          </div>
                        </td>
                        <td className="results-indicator-list">
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Clarity of governance structure, roles, and forums"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Quality and purposefulness of safety meetings and reviews"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Decision-making, action tracking, and follow-through"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Flow of safety information between frontline and leadership"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="results-category results-category--legal" rowSpan={2}>
                          <div className="results-category-title">Legal &amp; Risk Governance</div>
                        </td>
                        <td className="results-number">
                          <span>3.1</span>
                        </td>
                        <td className="results-topic">
                          <span>Translation of Legal Duties</span>
                        </td>
                        <td className="results-clauses">
                          <div className="results-clause">Currency and relevance of the legal register</div>
                          <div className="results-clause">
                            Clear mapping of legal duties to controls and roles
                          </div>
                          <div className="results-clause">
                            Use of legal requirements in risk assessments and procedures
                          </div>
                          <div className="results-clause">
                            Systematic updates when laws or standards change
                          </div>
                        </td>
                        <td className="results-indicator-list">
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Currency and relevance of the legal register"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Clear mapping of legal duties to controls and roles"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Use of legal requirements in risk assessments and procedures"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Systematic updates when laws or standards change"
                            />
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="results-number">
                          <span>3.2</span>
                        </td>
                        <td className="results-topic">
                          <span>Risk Appetite and Decision Boundaries</span>
                        </td>
                        <td className="results-clauses">
                          <div className="results-clause">
                            Existence and clarity of a documented risk appetite
                          </div>
                          <div className="results-clause">
                            Consistent application of risk boundaries in decisions
                          </div>
                          <div className="results-clause">
                            Alignment between risk appetite, approvals, and planning
                          </div>
                          <div className="results-clause">
                            Leadership intervention when risk boundaries are approached
                          </div>
                        </td>
                        <td className="results-indicator-list">
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Existence and clarity of a documented risk appetite"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Consistent application of risk boundaries in decisions"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Alignment between risk appetite, approvals, and planning"
                            />
                          </div>
                          <div className="results-indicator-row">
                            <ClauseIndicatorClient
                              diagnosticId={id}
                              clause="Leadership intervention when risk boundaries are approached"
                            />
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <span className="footer-copy">&copy; 2025 HSES Industry Partners</span>
          <div className="footer-links">
            <a className="footer-link" href="/privacy">
              Privacy Policy
            </a>
            <a className="footer-link" href="/disclaimer">
              Website Disclaimer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
