import type { Metadata } from "next";
import SetPasswordClient from "./SetPasswordClient";

export const metadata: Metadata = {
  title: "Set Your Password",
};

export default function SetPasswordPage() {
  return <SetPasswordClient />;
}
