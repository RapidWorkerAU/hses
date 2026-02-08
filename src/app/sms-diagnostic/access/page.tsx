import "../../diagnostic-access.css";
import AccessClient from "./AccessClient";

export default function DiagnosticAccessPage() {
  return (
    <div className="diagnostic-access-page">
      <div className="diagnostic-access-shell">
        <div className="diagnostic-access-logo">
          <img src="/images/logo-black.png" alt="HSES Industry Partners" />
        </div>
        <AccessClient />
        <p className="diagnostic-access-help">
          Your access code was emailed to you by the diagnostic owner. If you do not have it,
          contact your coordinator or email ask@hses.com.au.
        </p>
      </div>
    </div>
  );
}
