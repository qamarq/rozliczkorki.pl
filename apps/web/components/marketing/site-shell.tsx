import type { ComponentProps } from "react";
import { cn } from "cn";

export function SiteShell({ className, children, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "marketing-site bg-background text-foreground relative isolate min-h-svh overflow-x-clip",
        className,
      )}
      {...props}
    >
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            "<style>.mk-reveal,.mk-pop{opacity:1!important;transform:none!important}.mk-grow-x,.mk-grow-y{transform:none!important}</style>",
        }}
      />
      {children}
    </div>
  );
}
