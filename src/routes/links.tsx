import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { PublicLayout } from "@/components/layout/public-layout";

export const Route = createFileRoute("/links")({
  head: () => ({
    meta: [
      { title: "Links — TJC | Thulani Joseph" },
      { name: "description", content: "Every official channel and platform in one place." },
      { property: "og:title", content: "Links — TJC | Thulani Joseph" },
      { property: "og:description", content: "Every official channel and platform in one place." },
      { property: "og:url", content: "/links" },
    ],
    links: [{ rel: "canonical", href: "/links" }],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <PageHero eyebrow="Links" title="All links" intro="Every official channel and platform in one place." />
      <EmptyState title="No links published yet" body="Official links managed in TJC OS will be listed here." />
    </PublicLayout>
  );
}
