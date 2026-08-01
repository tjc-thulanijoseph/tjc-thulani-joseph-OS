import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { PublicLayout } from "@/components/layout/public-layout";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News — TJC | Thulani Joseph" },
      { name: "description", content: "Announcements, releases and official updates." },
      { property: "og:title", content: "News — TJC | Thulani Joseph" },
      { property: "og:description", content: "Announcements, releases and official updates." },
      { property: "og:url", content: "/news" },
    ],
    links: [{ rel: "canonical", href: "/news" }],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <PageHero eyebrow="Newsroom" title="News" intro="Announcements, releases and official updates." />
      <EmptyState title="No announcements yet" body="Official announcements published from TJC OS will appear here." />
    </PublicLayout>
  );
}
