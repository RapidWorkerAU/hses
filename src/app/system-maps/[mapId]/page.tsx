import type { Metadata } from "next";
import SystemMapCanvasClient from "./SystemMapCanvasClient";

type MapPageProps = {
  params: Promise<{ mapId: string }>;
};

export const metadata: Metadata = {
  title: "Management System Map",
};

export default async function SystemMapPage({ params }: MapPageProps) {
  const { mapId } = await params;

  return <SystemMapCanvasClient mapId={mapId} />;
}

