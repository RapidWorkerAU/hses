import "../../../diagnostic-access.css";
import ParticipantClient from "../ParticipantClient";

type PageProps = {
  params: { diagnosticId: string };
};

export default async function DiagnosticParticipantPage({ params }: PageProps) {
  const { diagnosticId } = await params;
  return (
    <div className="diagnostic-access-page">
      <div className="diagnostic-access-shell">
        <ParticipantClient diagnosticId={diagnosticId} />
      </div>
    </div>
  );
}
