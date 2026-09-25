import { Button } from "@/components/ui/button";
import { AppStoreIcon, GooglePlayIcon } from "@/components/store-icons";
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/site";
import { cn } from "cn";

const STORES = [
  {
    name: "Google Play",
    href: GOOGLE_PLAY_URL,
    icon: <GooglePlayIcon className="size-6" />,
  },
  {
    name: "App Store",
    href: APP_STORE_URL,
    icon: <AppStoreIcon className="size-6 rounded-[22%]" />,
  },
];

export function StoreButtons({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      {STORES.map(({ name, href, icon }) => (
        <Button
          key={name}
          size="lg"
          variant="outline"
          className="h-12 gap-3 px-4"
          asChild
        >
          <a href={href} target="_blank" rel="noreferrer">
            {icon}
            <span className="flex flex-col items-start leading-tight">
              <span className="text-muted-foreground text-[10px]">Pobierz z</span>
              <span className="text-sm font-semibold">{name}</span>
            </span>
          </a>
        </Button>
      ))}
    </div>
  );
}
