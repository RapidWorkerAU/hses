import { redirect } from "next/navigation";

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata() {
  return { title: "Canvas Creator" };
}

export default async function LegacyMapBuilderCategoryPage() {
  redirect("/dashboard/map-builders");
}
