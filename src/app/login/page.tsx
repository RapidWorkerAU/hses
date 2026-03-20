import type { Metadata } from "next";
import { Suspense } from "react";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Client Portal Login",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen px-6 py-16 text-sm text-slate-600">Loading...</div>}>
      <LoginClient />
    </Suspense>
  );
}
