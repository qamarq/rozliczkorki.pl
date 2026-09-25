import { cn } from "cn";

export function SectionHeading({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-4", className)}>
      <h2 className="font-display text-balance text-[2rem] font-semibold leading-[1.06] tracking-[-0.012em] sm:text-[2.6rem] lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="text-muted-foreground max-w-xl text-pretty text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
