"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, CircleDashed, Clock, XCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import { PrTable } from "@/components/pr-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUSES, type Status } from "@/lib/pr";
import { cn } from "@/lib/utils";

const METRIC_ICON: Record<Status, typeof CircleDashed> = {
  DRAFT: CircleDashed,
  SUBMITTED: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

const METRIC_CLASS: Record<Status, string> = {
  DRAFT: "bg-status-draft-bg text-status-draft-fg",
  SUBMITTED: "bg-status-submitted-bg text-status-submitted-fg",
  APPROVED: "bg-status-approved-bg text-status-approved-fg",
  REJECTED: "bg-status-rejected-bg text-status-rejected-fg",
};

export default function DashboardPage() {
  const query = useQuery({
    queryKey: ["requisitions", undefined, undefined],
    queryFn: () => api.listRequisitions(),
  });

  const counts = STATUSES.reduce(
    (acc, status) => {
      acc[status] = query.data?.value.filter((pr) => pr.Status === status).length ?? 0;
      return acc;
    },
    {} as Record<Status, number>,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <Button nativeButton={false} render={<Link href="/requisitions/new" />}>New requisition</Button>
      </div>

      {query.isLoading && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" role="status" aria-label="Loading metrics">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {query.isError && <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />}

      {query.isSuccess && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {STATUSES.map((status) => {
            const Icon = METRIC_ICON[status];
            return (
              <Card key={status} className="transition-shadow hover:shadow-md">
                <CardHeader className="flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-500">{status}</CardTitle>
                  <span
                    className={cn(
                      "flex size-7 items-center justify-center rounded-lg",
                      METRIC_CLASS[status],
                    )}
                  >
                    <Icon className="size-4" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-tight text-slate-900">{counts[status]}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-medium text-slate-900">Recent requisitions</h2>
        {query.isSuccess && query.data.value.length === 0 && (
          <EmptyState
            title="No requisitions yet"
            description="Create your first purchase requisition to get started."
            action={<Button nativeButton={false} render={<Link href="/requisitions/new" />}>New requisition</Button>}
          />
        )}
        {query.isSuccess && query.data.value.length > 0 && <PrTable data={query.data.value.slice(0, 5)} />}
      </div>
    </div>
  );
}
