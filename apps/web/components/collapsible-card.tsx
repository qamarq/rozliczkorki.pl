"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useCollapsed } from "@/hooks/use-collapsed";
import { cn } from "@/lib/utils";

export function CollapsibleCard({
  id,
  title,
  icon,
  aside,
  className,
  children,
}: {
  id: string;
  title: ReactNode;
  icon?: ReactNode;
  aside?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useCollapsed(id);

  return (
    <Collapsible open={!collapsed} onOpenChange={(open) => setCollapsed(!open)} asChild>
      <Card className={cn("gap-3 p-4", collapsed && "gap-0", className)}>
        <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between gap-2 text-left">
          <span className="flex items-center gap-2">
            {icon}
            <span className="text-sm font-semibold">{title}</span>
          </span>
          <span className="flex items-center gap-2">
            {aside}
            <ChevronDown className="text-muted-foreground size-4 transition-transform group-data-[state=closed]/trigger:-rotate-90" />
          </span>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-3">
          {children}
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
