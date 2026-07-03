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
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                i <= active ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500",
              )}
              aria-current={i === active ? "step" : undefined}
            >
              {i + 1}
            </span>
            <span className={cn("text-sm", i <= active ? "text-slate-900" : "text-slate-600")}>{step}</span>
          </span>
          {i < STEPS.length - 1 && <span className="mx-3 h-px w-8 bg-slate-200" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
