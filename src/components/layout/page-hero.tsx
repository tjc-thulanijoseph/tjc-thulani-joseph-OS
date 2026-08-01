export function PageHero({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "var(--gradient-halo)" }}
      />
      <div className="container-tjc relative section-y">
        <p className="text-xs uppercase tracking-[0.32em] text-gold">{eyebrow}</p>
        <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">{intro}</p>
      </div>
    </section>
  );
}
