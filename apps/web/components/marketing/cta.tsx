import { PanelLink } from "@/components/marketing/panel-link";
import { Button } from "@/components/ui/button";

export function Cta({ href, label }: { href: string; label: string }) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-[#07090f] px-6 py-20 text-center text-white sm:py-24">
      <div
        aria-hidden
        className="absolute inset-x-0 -top-40 -z-10 mx-auto h-96 w-[60rem] max-w-none rounded-[100%] bg-[radial-gradient(closest-side,var(--brand-from),transparent_75%)] opacity-70 blur-2xl"
      />
      <div
        aria-hidden
        className="bg-dotgrid mask-fade-radial absolute inset-0 -z-10 opacity-40"
      />
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-5">
        <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
          Zacznij semestr z czystą głową
        </h2>
        <p className="text-pretty text-white/60">
          Załóż konto, dodaj pierwszego ucznia i sprawdź, ile czasu oszczędza jedno
          kliknięcie po lekcji.
        </p>
        <Button
          size="lg"
          className="h-11 bg-white px-6 text-base text-black hover:bg-white/90"
          asChild
        >
          <PanelLink href={href}>{label}</PanelLink>
        </Button>
        <p className="font-mono-ui text-xs text-white/40">
          darmowe · bez karty · po polsku
        </p>
      </div>
    </section>
  );
}
