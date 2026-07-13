import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal Dashboard",
};

export default function DashboardPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 p-6 bg-[#f7f8fa]" />
    </div>
  );
}
