import { CheckCircle2, CircleDashed, Clock, PackageCheck, XCircle } from "lucide-react";
import { STATUS_LABEL, statusIntent, type Status, type StatusIntent } from "@/lib/pr";
import { cn } from "@/lib/utils";

const ICON: Record<StatusIntent, typeof CircleDashed> = {
  draft: CircleDashed,
  submitted: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
  poCreated: PackageCheck,
};

const CLASS: Record<StatusIntent, string> = {
  draft: "bg-status-draft-bg text-status-draft-fg border-status-draft-border",
  submitted: "bg-status-submitted-bg text-status-submitted-fg border-status-submitted-border",
  approved: "bg-status-approved-bg text-status-approved-fg border-status-approved-border",
  rejected: "bg-status-rejected-bg text-status-rejected-fg border-status-rejected-border",
  poCreated: "bg-status-poCreated-bg text-status-poCreated-fg border-status-poCreated-border",
};

export function StatusBadge({ status, hasOrder = false }: { status: Status; hasOrder?: boolean }) {
  const intent = statusIntent(status, hasOrder);
  const Icon = ICON[intent];
  return (
    <span
      data-testid="status-badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold tracking-wide shadow-[0_0_0_1px_rgba(0,0,0,0)] transition-all duration-200 hover:shadow-[0_0_16px_-4px_currentColor]",
        CLASS[intent],
      )}
    >
      <Icon className={cn("size-3.5", intent === "submitted" && "animate-soft-pulse")} aria-hidden="true" />
      {STATUS_LABEL[intent]}
    </span>
  );
}
