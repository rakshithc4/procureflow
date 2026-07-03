"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { api, ApiError } from "@/lib/api-client";
import { StatusBadge } from "@/components/status-badge";
import { RejectDialog } from "@/components/reject-dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";

// US5 AC1: approver-only queue of SUBMITTED requisitions with one-click actions.
export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["requisitions", "SUBMITTED", undefined],
    queryFn: () => api.listRequisitions({ status: "SUBMITTED" }),
  });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ["requisitions"] });
    queryClient.invalidateQueries({ queryKey: ["requisition"] });
  }

  const approveMutation = useMutation({
    mutationFn: (id: string) => api.approve(id, ""),
    onSuccess: () => toast.success("Requisition approved"),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not approve the requisition"),
    onSettled: invalidateAll,
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => api.reject(id, note),
    onSuccess: () => toast.success("Requisition rejected"),
    onError: (err) => toast.error(err instanceof ApiError ? err.message : "Could not reject the requisition"),
    onSettled: invalidateAll,
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-slate-900">Approvals</h1>

      {query.isLoading && (
        <div className="flex flex-col gap-2" role="status" aria-label="Loading approvals">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}

      {query.isError && <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />}

      {query.isSuccess && query.data.value.length === 0 && (
        <EmptyState title="Nothing to approve" description="There are no requisitions awaiting a decision." />
      )}

      {query.isSuccess && query.data.value.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requestor</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.data.value.map((pr) => (
              <TableRow key={pr.ReqId}>
                <TableCell className="font-medium text-slate-900">
                  <Link href={`/requisitions/${pr.ReqId}`}>{pr.Title}</Link>
                </TableCell>
                <TableCell className="tabular-nums text-slate-600">
                  {pr.Amount} {pr.Currency}
                </TableCell>
                <TableCell>
                  <StatusBadge status={pr.Status} />
                </TableCell>
                <TableCell className="text-slate-600">{pr.RequestorId}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(pr.ReqId)}
                  >
                    Approve
                  </Button>
                  <RejectDialog
                    size="sm"
                    disabled={rejectMutation.isPending}
                    onReject={(note) => rejectMutation.mutate({ id: pr.ReqId, note })}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
