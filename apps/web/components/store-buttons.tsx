import { AppStoreIcon, GooglePlayIcon } from "@/components/store-icons";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/site";
import { cn } from "cn";

const STORES = [
  {
    name: "App Store",
    href: APP_STORE_URL,
    icon: <AppStoreIcon className="size-[22px] rounded-[22%]" />,
  },
  {
    name: "Google Play",
    href: GOOGLE_PLAY_URL,
    icon: <GooglePlayIcon className="size-[22px]" />,
  },
];

export function StoreButtons({
  className,
  tone = "solid",
}: {
  className?: string;
  tone?: "solid" | "outline";
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2.5", className)}>
      {STORES.map(({ name, href, icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex h-12 items-center gap-2.5 rounded-xl border pl-3.5 pr-4 transition-[translate,box-shadow,border-color] duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0",
            tone === "solid"
              ? "border-inverse-border bg-inverse text-inverse-foreground hover:shadow-[0_10px_24px_-12px_rgb(21_25_53/0.6)]"
              : "border-inverse-foreground/25 hover:border-inverse-foreground/60",
          )}
        >
          {icon}
          <span className="flex flex-col leading-tight">
            <span className="text-[10.5px] opacity-70">Pobierz z</span>
            <span className="text-[15px] font-semibold">{name}</span>
          </span>
        </a>
      ))}
    </div>
  );
}
