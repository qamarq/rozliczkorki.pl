import { ArrowRight } from "lucide-react";
import { PanelLink } from "@/components/marketing/panel-link";
import { Reveal } from "@/components/marketing/reveal";
import { StoreButtons } from "@/components/store-buttons";

export function Cta({ href, label }: { href: string; label: string }) {
  return (
    <Reveal className="bg-inverse text-inverse-foreground border-inverse-border mk-reveal grid items-end gap-10 rounded-[28px] border px-6 py-10 sm:p-14 lg:grid-cols-[minmax(0,1.2fr)_auto]">
      <div className="flex flex-col gap-4">
        <h2 className="font-display text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.012em] sm:text-5xl">
          Zacznij od najbliższej lekcji.
        </h2>
        <p className="text-inverse-foreground/70 max-w-lg text-pretty text-lg">
          Dodaj ucznia i wpisz pierwsze zajęcia. Zajmie Ci to mniej niż jedna przerwa
          między lekcjami.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <PanelLink
          href={href}
          className="bg-primary text-primary-foreground group inline-flex h-12 items-center gap-2 rounded-xl px-5 font-semibold transition-[filter] hover:brightness-110"
        >
          {label}
          <ArrowRight className="size-[18px] transition-transform group-hover:translate-x-0.5" />
        </PanelLink>
        <StoreButtons tone="outline" />
      </div>
    </Reveal>
  );
}
