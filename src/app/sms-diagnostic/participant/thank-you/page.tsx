import "../../../diagnostic-access.css";
import { Suspense } from "react";
import ThankYouClient from "./ThankYouClient";

export default function ParticipantThankYouPage() {
  return (
    <div className="diagnostic-access-page">
      <div className="diagnostic-access-shell">
        <Suspense
          fallback={
            <div className="diagnostic-access-card">
              <h2>Loading...</h2>
            </div>
          }
        >
          <ThankYouClient />
        </Suspense>
      </div>
    </div>
  );
}
