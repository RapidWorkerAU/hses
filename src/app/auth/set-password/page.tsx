import type { Metadata } from "next";
import { Suspense } from "react";
import SetPasswordClient from "./SetPasswordClient";

export const metadata: Metadata = {
  title: "Set Your Password",
};

export default function SetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen px-6 py-16 text-sm text-slate-600">Loading...</div>}>
      <SetPasswordClient />
    </Suspense>
  );
}
