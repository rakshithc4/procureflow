"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { PrTable } from "@/components/pr-table";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Status } from "@/lib/pr";

const STATUS_CHIPS: { label: string; value: Status | undefined }[] = [
  { label: "All", value: undefined },
  { label: "Draft", value: "DRAFT" },
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" },
];

export default function RequisitionsPage() {
  const [status, setStatus] = useState<Status | undefined>(undefined);
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["requisitions", status, search],
    queryFn: () => api.listRequisitions({ status, search: search || undefined }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Requisitions</h1>
        <Button nativeButton={false} render={<Link href="/requisitions/new" />}>New requisition</Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1" role="group" aria-label="Filter by status">
          {STATUS_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => setStatus(chip.value)}
              aria-pressed={status === chip.value}
              className={cn(
                "rounded-full border px-3 py-1 text-sm",
                status === chip.value
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50",
              )}
            >
              {chip.label}
            </button>
          ))}
        </div>
        <Input
          placeholder="Search by title…"
          aria-label="Search by title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {query.isLoading && (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading requisitions">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {query.isError && <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />}

      {query.isSuccess && query.data.value.length === 0 && (
        <EmptyState
          title="No requisitions yet"
          description="Create your first purchase requisition to get started."
          action={<Button nativeButton={false} render={<Link href="/requisitions/new" />}>New requisition</Button>}
        />
      )}

      {query.isSuccess && query.data.value.length > 0 && <PrTable data={query.data.value} />}
    </div>
  );
}
