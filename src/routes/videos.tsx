import { createFileRoute } from "@tanstack/react-router";
import { PublishedCollection } from "@/components/public/published-collection";
import { PageHero } from "@/components/layout/page-hero";
import { PublicLayout } from "@/components/layout/public-layout";

export const Route = createFileRoute("/videos")({
  head: () => ({
    meta: [
      { title: "Videos — TJC | Thulani Joseph" },
      { name: "description", content: "Visual work, performances and film by Thulani Joseph." },
      { property: "og:title", content: "Videos — TJC | Thulani Joseph" },
      { property: "og:description", content: "Visual work, performances and film by Thulani Joseph." },
      { property: "og:url", content: "/videos" },
    ],
    links: [{ rel: "canonical", href: "/videos" }],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <PageHero eyebrow="Videos" title="Videos" intro="Visual work, performances and film by Thulani Joseph." />
      <PublishedCollection resource="videos" emptyTitle="No videos published yet" emptyBody="Videos added in the TJC OS Video Manager will be listed here." />
    </PublicLayout>
  );
}
