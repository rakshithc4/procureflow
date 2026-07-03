"use client";

import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { STATUSES } from "@/lib/pr";

// T4.6: dev-only gallery of every loading/empty/error state for manual review.
export default function DevStatesPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="flex flex-col gap-10">
      <h1 className="text-2xl font-semibold text-slate-900">Component states (dev only)</h1>

      <section>
        <h2 className="mb-3 text-lg font-medium">Status badges</h2>
        <div className="flex flex-wrap gap-3">
          {STATUSES.map((status) => (
            <StatusBadge key={status} status={status} />
          ))}
          <StatusBadge status="APPROVED" hasOrder />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Status timeline</h2>
        <div className="flex flex-col gap-4">
          <StatusTimeline status="DRAFT" hasOrder={false} />
          <StatusTimeline status="SUBMITTED" hasOrder={false} />
          <StatusTimeline status="APPROVED" hasOrder={false} />
          <StatusTimeline status="APPROVED" hasOrder />
          <StatusTimeline status="REJECTED" hasOrder={false} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Loading (skeleton)</h2>
        <div className="flex flex-col gap-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Empty</h2>
        <EmptyState
          title="No requisitions yet"
          description="Create your first purchase requisition to get started."
          action={<Button>New requisition</Button>}
        />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Error</h2>
        <ErrorState message="Could not reach the server. Please try again." onRetry={() => {}} />
      </section>
    </div>
  );
}
