import type { Metadata } from "next";
import SystemMapCanvasClient from "./SystemMapCanvasClient";

type MapPageProps = {
  params: Promise<{ mapId: string }>;
  searchParams: Promise<{ welcome?: string }>;
};

export const metadata: Metadata = {
  title: "Management System Map",
};

export default async function SystemMapPage({ params, searchParams }: MapPageProps) {
  const { mapId } = await params;
  const { welcome } = await searchParams;

  return <SystemMapCanvasClient mapId={mapId} showWelcomeOnLoad={welcome === "1"} />;
}
