import { cn } from "@/lib/utils";
import type { Status } from "@/lib/pr";

const STEPS = ["Created", "Submitted", "Decided", "PO"] as const;

function activeStepIndex(status: Status, hasOrder: boolean): number {
  if (status === "DRAFT") return 0;
  if (status === "SUBMITTED") return 1;
  if (status === "APPROVED" || status === "REJECTED") return hasOrder ? 3 : 2;
  return 0;
}

export function StatusTimeline({ status, hasOrder }: { status: Status; hasOrder: boolean }) {
  const active = activeStepIndex(status, hasOrder);
  return (
    <ol className="flex items-center" aria-label="Requisition status timeline">
      {STEPS.map((step, i) => (
        <li key={step} className="flex items-center">
          <span className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition-colors duration-300",
                i <= active ? "bg-primary text-primary-foreground shadow-sm shadow-primary/40" : "bg-muted text-muted-foreground",
              )}
              aria-current={i === active ? "step" : undefined}
            >
              {i + 1}
            </span>
            <span className={cn("text-sm", i <= active ? "font-medium text-foreground" : "text-muted-foreground")}>{step}</span>
          </span>
          {i < STEPS.length - 1 && (
            <span
              className={cn("mx-3 h-px w-8 transition-colors duration-300", i < active ? "bg-primary/50" : "bg-border")}
              aria-hidden="true"
            />
          )}
        </li>
      ))}
    </ol>
  );
}
