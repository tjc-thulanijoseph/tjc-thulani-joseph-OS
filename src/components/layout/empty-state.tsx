import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/**
 * Honest empty state. Content is published from TJC OS — nothing is faked here.
 */
export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <section className="container-tjc section-y">
      <div className="surface-panel mx-auto max-w-2xl rounded-2xl p-10 text-center">
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <Button asChild variant="outline" className="mt-8 hairline-gold bg-transparent text-gold hover:bg-accent">
          <Link to="/contact">Get in touch</Link>
        </Button>
      </div>
    </section>
  );
}
