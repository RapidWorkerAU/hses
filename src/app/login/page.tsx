import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "Client Portal Login",
};

export default function LoginPage() {
  return (
    <LoginClient />
  );
}
