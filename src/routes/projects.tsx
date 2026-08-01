import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/layout/empty-state";
import { PageHero } from "@/components/layout/page-hero";
import { PublicLayout } from "@/components/layout/public-layout";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Projects — TJC | Thulani Joseph" },
      { name: "description", content: "Creative ventures, collaborations and work currently in progress." },
      { property: "og:title", content: "Projects — TJC | Thulani Joseph" },
      { property: "og:description", content: "Creative ventures, collaborations and work currently in progress." },
      { property: "og:url", content: "/projects" },
    ],
    links: [{ rel: "canonical", href: "/projects" }],
  }),
  component: Page,
});

function Page() {
  return (
    <PublicLayout>
      <PageHero eyebrow="Projects" title="Projects" intro="Creative ventures, collaborations and work currently in progress." />
      <EmptyState title="No projects published yet" body="Projects added in TJC OS will appear here as they are made public." />
    </PublicLayout>
  );
}
