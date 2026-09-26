import type { CSSProperties, ReactNode } from "react";
import { cn } from "cn";

type Line = {
  date: string;
  text: ReactNode;
  amount: ReactNode;
  tilt: number;
  shift: number;
};

export const NOTEBOOK_LINES: Line[] = [
  { date: "2.09", text: "Zosia – mat.", amount: "90 zł ✓", tilt: -0.7, shift: 0 },
  {
    date: "3.09",
    text: "Janek fiz. 1,5h",
    amount: (
      <>
        120 zł <span className="text-margin font-bold">???</span>
      </>
    ),
    tilt: 0.9,
    shift: 4,
  },
  {
    date: "4.09",
    text: "Ola – mat.",
    amount: (
      <>
        90 zł ✓ <span className="text-[0.75em] opacity-80 max-sm:hidden">przelew?</span>
      </>
    ),
    tilt: -0.4,
    shift: -2,
  },
  {
    date: "9.09",
    text: (
      <>
        Kuba <s>ang.</s> odwołał
      </>
    ),
    amount: <s>80 zł</s>,
    tilt: 0.6,
    shift: 6,
  },
  {
    date: "10.09",
    text: "Zosia",
    amount: (
      <>
        <s>80</s> 90 zł
      </>
    ),
    tilt: -1,
    shift: 1,
  },
];

export function NotebookTitle({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <span className="-rotate-[1.2deg] text-[30px] font-bold leading-none underline decoration-2 underline-offset-[6px] max-sm:text-[25px]">
        Wrzesień – korki
      </span>
      <span className="rotate-2 text-right text-[19px] leading-[1.05] opacity-85 max-sm:text-base">
        Zosia od wrz.
        <br />
        90 zł!!
      </span>
    </div>
  );
}

export function NotebookLine({
  line,
  index,
  className,
}: {
  line: Line;
  index: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mk-write grid grid-cols-[50px_auto_auto] items-center justify-start gap-4 whitespace-nowrap text-[23px] leading-none max-sm:grid-cols-[40px_auto_auto] max-sm:gap-2.5 max-sm:text-xl [&_s]:decoration-2",
        className,
      )}
      style={
        {
          "--i": index,
          transform: `rotate(${line.tilt}deg) translateX(${line.shift}px)`,
        } as CSSProperties
      }
    >
      <span className="text-[19px] opacity-80 max-sm:text-base">{line.date}</span>
      <span>{line.text}</span>
      <span>{line.amount}</span>
    </div>
  );
}

export function NotebookSum({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-start justify-center gap-1 whitespace-nowrap text-2xl font-bold max-sm:text-xl",
        className,
      )}
    >
      <span className="mk-write -rotate-1" style={{ "--i": 5 } as CSSProperties}>
        Razem: <s className="font-medium decoration-2 opacity-85">3 790</s> 3 850??
      </span>
      <span className="mk-stamp text-margin border-margin ml-7 rounded-[50%/46%] border-2 px-3.5 py-1 text-xl max-sm:ml-3 max-sm:text-[17px]">
        kto nie zapłacił?!
      </span>
    </div>
  );
}
