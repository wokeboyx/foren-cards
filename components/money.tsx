import { format } from "@/domain/money";
import type { Money as M } from "@/domain/types";
import { cn } from "@/lib/utils";

/** Monetary value — explicit currency, tabular figures, never wraps mid-amount. */
export function Money({ value, code, className, sign }: { value: M; code?: boolean; className?: string; sign?: "+" | "-" }) {
  return (
    <span className={cn("tnum whitespace-nowrap", className)}>
      {sign}
      {format(value, { code })}
    </span>
  );
}
