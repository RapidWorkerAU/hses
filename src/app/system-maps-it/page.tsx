import type { Metadata } from "next";
import SystemMapsListClient from "./SystemMapsListClient";

export const metadata: Metadata = {
  title: "Management System Maps",
};

export default function SystemMapsPage() {
  return <SystemMapsListClient />;
}
