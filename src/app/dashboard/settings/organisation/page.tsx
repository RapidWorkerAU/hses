import AdminGate from "@/app/admin/AdminGate";
import { OrgSettingsForm } from "./OrgSettingsForm";

export default function OrganisationSettingsPage() {
  return (
    <AdminGate>
      <div className="p-6 max-w-3xl">
        <h2 className="text-[17px] font-semibold text-neutral-900 mb-[4px]">Organisation settings</h2>
        <p className="text-[13px] text-neutral-500 mb-6">Manage your brand colour and logo — these appear in the dashboard sidebar</p>
        <OrgSettingsForm />
      </div>
    </AdminGate>
  );
}
