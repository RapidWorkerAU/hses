import { TableSkeleton } from "@/components/loading/HsesLoaders";

export default function SystemMapsLoading() {
  return (
    <div className="diagnostic-body page-stack dashboard-portal dashboard-portal--business-admin dashboard-portal--no-sidebar system-maps-page">
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
        </div>
      </header>

      <main>
        <section className="dashboard-section dashboard-main">
          <div className="diagnostic-container">
            <a className="dashboard-back-link" href="/dashboard">
              <img src="/icons/back.svg" alt="" className="dashboard-back-icon" />
              <span>Back</span>
            </a>
            <div className="dashboard-page-header dashboard-page-header--flush">
              <h1>Management System Maps</h1>
              <p className="dashboard-page-helper">
                Create and manage management system design maps you own or that are shared with you.
              </p>
            </div>
            <TableSkeleton rows={7} columns="5% 13% 15% 12% 10% 10% 12.5% 12.5% 10%" showToolbar />
          </div>
        </section>
      </main>
    </div>
  );
}
