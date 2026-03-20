import type { Metadata } from "next";
import { Suspense } from "react";
import ForgotPasswordClient from "./ForgotPasswordClient";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen px-6 py-16 text-sm text-slate-600">Loading...</div>}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
