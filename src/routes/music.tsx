import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { PublicLayout } from "@/components/layout/public-layout";

export const Route = createFileRoute("/music")({
  head: () => ({
    meta: [
      { title: "Music — TJC | Thulani Joseph" },
      { name: "description", content: "Albums, singles and the sound of Thulani Joseph." },
      { property: "og:title", content: "Music — TJC | Thulani Joseph" },
      { property: "og:description", content: "Albums, singles and the sound of Thulani Joseph." },
      { property: "og:url", content: "/music" },
    ],
    links: [{ rel: "canonical", href: "/music" }],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <PageHero eyebrow="Music" title="Music" intro="Albums, singles and the sound of Thulani Joseph." />
      <EmptyState title="No releases published yet" body="Albums and songs added in the TJC OS Music Manager will be listed here." />
    </PublicLayout>
  );
}
