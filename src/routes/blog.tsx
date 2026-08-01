import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { PublicLayout } from "@/components/layout/public-layout";

export const Route = createFileRoute("/blog")({
  head: () => ({
    meta: [
      { title: "Blog — TJC | Thulani Joseph" },
      { name: "description", content: "Notes, essays and reflections written by Thulani Joseph." },
      { property: "og:title", content: "Blog — TJC | Thulani Joseph" },
      { property: "og:description", content: "Notes, essays and reflections written by Thulani Joseph." },
      { property: "og:url", content: "/blog" },
    ],
    links: [{ rel: "canonical", href: "/blog" }],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <PageHero eyebrow="Journal" title="Blog" intro="Notes, essays and reflections written by Thulani Joseph." />
      <EmptyState title="No posts published yet" body="Posts written in the TJC OS Blog Manager will be published here." />
    </PublicLayout>
  );
}
