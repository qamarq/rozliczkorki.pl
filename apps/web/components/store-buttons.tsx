"use client";

import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { AppStoreIcon, GooglePlayIcon } from "@/components/store-icons";
import { GOOGLE_PLAY_URL } from "@/lib/site";
import { cn } from "cn";

export function StoreButtons({ className }: { className?: string }) {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.iosWaitlist.status.useQuery();
  const vote = trpc.iosWaitlist.vote.useMutation({
    onSuccess: () => {
      utils.iosWaitlist.status.invalidate();
      toast.success("Dzięki! Twój głos się liczy.");
    },
    onError: () => toast.error("Nie udało się oddać głosu. Spróbuj ponownie."),
  });

  const votes = data?.votes;
  const canVote = data?.canVote && !data.hasVoted;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <Button size="lg" variant="outline" className="h-12 gap-3 px-4" asChild>
          <a href={GOOGLE_PLAY_URL} target="_blank" rel="noreferrer">
            <GooglePlayIcon className="size-6" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-muted-foreground text-[10px]">Pobierz z</span>
              <span className="text-sm font-semibold">Google Play</span>
            </span>
          </a>
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-12 gap-3 px-4"
          disabled={!canVote || vote.isPending}
          onClick={() => vote.mutate()}
        >
          {vote.isPending ? (
            <Loader2 className="size-6 animate-spin" />
          ) : data?.hasVoted ? (
            <Check className="text-success size-6" />
          ) : (
            <AppStoreIcon className="size-6 rounded-[22%]" />
          )}
          <span className="flex flex-col items-start leading-tight">
            <span className="text-muted-foreground text-[10px]">iOS — wkrótce</span>
            <span className="text-sm font-semibold">
              {data?.hasVoted ? "Głos oddany" : "Czekam na iOS"}
            </span>
          </span>
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        {isLoading || votes === undefined ? (
          <span className="inline-block h-4 w-56 animate-pulse rounded bg-current opacity-10" />
        ) : data?.hasVoted ? (
          <>
            Razem z Tobą na wersję na iOS czeka{" "}
            <span className="text-foreground font-semibold tabular-nums">{votes}</span>{" "}
            {plural(votes)}. <br />
            Damy znać mailem, gdy będzie gotowa.
          </>
        ) : data?.canVote ? (
          <>
            Na wersję na iOS czeka{" "}
            <span className="text-foreground font-semibold tabular-nums">{votes}</span>{" "}
            {plural(votes)}. Kliknij, żeby dorzucić swój głos.
          </>
        ) : (
          <>
            Na wersję na iOS czeka{" "}
            <span className="text-foreground font-semibold tabular-nums">{votes}</span>{" "}
            {plural(votes)}.{" "}
            <a href="/login" className="hover:text-foreground underline">
              Zaloguj się
            </a>
            , żeby zagłosować.
          </>
        )}
      </p>
    </div>
  );
}

function plural(n: number) {
  if (n === 1) return "osoba";
  const rest10 = n % 10;
  const rest100 = n % 100;
  if (rest10 >= 2 && rest10 <= 4 && (rest100 < 12 || rest100 > 14)) return "osoby";
  return "osób";
}
