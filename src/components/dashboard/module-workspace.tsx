import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardModule } from "@/config/dashboard-modules";
import { services } from "@/services";
import type { BaseRecord } from "@/types";

/**
 * Generic module workspace. Every content module renders through this shell and
 * reads through the repository contract, so connecting a backend lights them all up.
 */
export function ModuleWorkspace({ module }: { module: DashboardModule }) {
  const resource = module.resource;
  const query = useQuery({
    queryKey: ["module", resource],
    enabled: Boolean(resource),
    queryFn: async () => services().repository<BaseRecord>(resource!).list({ perPage: 20 }),
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">{module.group}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">{module.label}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{module.description}</p>
        </div>
        {resource && (
          <Button className="rounded-full" disabled>
            <Plus className="size-4" aria-hidden /> New
          </Button>
        )}
      </div>

      <Card className="mt-8 surface-panel border-border">
        <CardHeader>
          <CardTitle className="text-base font-medium">
            {resource ? "Records" : "Architecture ready"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!resource ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              This module is wired into the sidebar, routing and permission model. It has no data table of
              its own yet.
            </p>
          ) : query.isPending ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : query.data?.error ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{query.data.error.message}</p>
          ) : (query.data?.data.total ?? 0) === 0 ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              No records yet. Anything you add here appears instantly on the public site.
            </p>
          ) : (
            <div>
              <p className="numeric text-xs uppercase tracking-[0.2em] text-muted-foreground">
                {query.data?.data.total} records
              </p>
              <ul className="mt-4 divide-y divide-border">
                {query.data?.data.items.map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-4 py-3">
                    <span className="truncate text-sm">
                      {(record as BaseRecord & { title?: string; name?: string }).title ??
                        (record as BaseRecord & { name?: string }).name ??
                        record.id}
                    </span>
                    <span className="text-xs uppercase tracking-[0.18em] text-gold/70">{record.status}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
