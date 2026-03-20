import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HsesDashboardShell from "../../HsesDashboardShell";
import PortalAccessGate from "../../PortalAccessGate";
import MapBuilderLandingClient from "../../MapBuilderLandingClient";
import { MAP_BUILDER_CATEGORIES, MAP_BUILDER_CATEGORY_BY_SLUG } from "../../mapBuilderCategories";

export async function generateStaticParams() {
  return MAP_BUILDER_CATEGORIES.map((category) => ({
    categorySlug: category.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}): Promise<Metadata> {
  const { categorySlug } = await params;
  const category = MAP_BUILDER_CATEGORY_BY_SLUG.get(categorySlug);

  if (!category) {
    return { title: "Map Builder" };
  }

  return {
    title: category.title,
  };
}

export default async function MapBuilderCategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>;
}) {
  const { categorySlug } = await params;
  const category = MAP_BUILDER_CATEGORY_BY_SLUG.get(categorySlug);

  if (!category) {
    notFound();
  }

  return (
    <HsesDashboardShell eyebrow="Map Builders" title={category.title} subtitle={category.subtitle}>
      <PortalAccessGate portalKey={category.key}>
        <MapBuilderLandingClient category={category} />
      </PortalAccessGate>
    </HsesDashboardShell>
  );
}
