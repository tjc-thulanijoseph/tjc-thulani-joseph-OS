import { createFileRoute, notFound } from "@tanstack/react-router";
import { DASHBOARD_MODULES, getModule } from "@/config/dashboard-modules";
import { ModuleWorkspace } from "@/components/dashboard/module-workspace";
import { OverviewModule } from "@/components/dashboard/overview-module";

export const Route = createFileRoute("/_authenticated/dashboard/$module")({
  beforeLoad: ({ params }) => {
    if (!getModule(params.module)) throw notFound();
  },
  head: ({ params }) => {
    const module = DASHBOARD_MODULES.find((m) => m.slug === params.module);
    return {
      meta: [
        { title: `${module?.label ?? "Module"} — TJC OS` },
        { name: "robots", content: "noindex" },
      ],
    };
  },
  component: ModulePage,
});

function ModulePage() {
  const { module: slug } = Route.useParams();
  const module = getModule(slug)!;
  if (module.slug === "overview") return <OverviewModule />;
  return <ModuleWorkspace module={module} />;
}
