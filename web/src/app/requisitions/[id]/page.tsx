"use client";

import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import type { PurchaseRequisition } from "@/lib/pr";
import { StatusBadge } from "@/components/status-badge";
import { StatusTimeline } from "@/components/status-timeline";
import { ActionBar } from "@/components/action-bar";
import { PoCard } from "@/components/po-card";
import { EmptyState } from "@/components/empty-state";
import { ErrorState } from "@/components/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function RequisitionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const queryKey = ["requisition", id];

  const query = useQuery({ queryKey, queryFn: () => api.getRequisition(id) });

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey });
    queryClient.invalidateQueries({ queryKey: ["requisitions"] });
  }

  const submitMutation = useMutation({
    mutationFn: () => api.submitForApproval(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PurchaseRequisition>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, { ...previous, Status: "SUBMITTED" });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(err instanceof ApiError ? err.message : "Could not submit the requisition");
    },
    onSuccess: () => toast.success("Requisition submitted for approval"),
    onSettled: invalidateAll,
  });

  const approveMutation = useMutation({
    mutationFn: (note: string) => api.approve(id, note),
    onMutate: async (note: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PurchaseRequisition>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, { ...previous, Status: "APPROVED", ApproverNote: note });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(err instanceof ApiError ? err.message : "Could not approve the requisition");
    },
    onSuccess: () => toast.success("Requisition approved"),
    onSettled: invalidateAll,
  });

  const rejectMutation = useMutation({
    mutationFn: (note: string) => api.reject(id, note),
    onMutate: async (note: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<PurchaseRequisition>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, { ...previous, Status: "REJECTED", ApproverNote: note });
      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast.error(err instanceof ApiError ? err.message : "Could not reject the requisition");
    },
    onSuccess: () => toast.success("Requisition rejected"),
    onSettled: invalidateAll,
  });

  const createPoMutation = useMutation({
    mutationFn: (vendorId: string) => api.createPo(id, vendorId),
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not create the purchase order");
    },
    onSuccess: () => toast.success("Purchase order created"),
    onSettled: invalidateAll,
  });

  if (query.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-96" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (query.isError) {
    return <ErrorState message={(query.error as Error).message} onRetry={() => query.refetch()} />;
  }

  if (!query.data) {
    return <EmptyState title="Requisition not found" description="It may have been deleted." />;
  }

  const pr = query.data;
  const role = session?.user?.role ?? "requestor";
  const hasOrder = !!pr._Order;
  const pending =
    submitMutation.isPending || approveMutation.isPending || rejectMutation.isPending || createPoMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{pr.Title}</h1>
          <p className="mt-1 text-sm text-slate-500">Requested by {pr.RequestorId}</p>
        </div>
        <StatusBadge status={pr.Status} hasOrder={hasOrder} />
      </div>

      <StatusTimeline status={pr.Status} hasOrder={hasOrder} />

      <ActionBar
        role={role}
        status={pr.Status}
        hasOrder={hasOrder}
        pending={pending}
        onSubmit={() => submitMutation.mutate()}
        onApprove={(note) => approveMutation.mutate(note)}
        onReject={(note) => rejectMutation.mutate(note)}
        onCreatePo={(vendorId) => createPoMutation.mutate(vendorId)}
      />

      <Card>
        <CardContent className="grid grid-cols-1 gap-4 pt-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Description</p>
            <p>{pr.Description || "—"}</p>
          </div>
          <div>
            <p className="text-slate-500">Amount</p>
            <p>
              {pr.Amount} {pr.Currency}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Approver</p>
            <p>{pr.ApproverId ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-500">Approver note</p>
            <p>{pr.ApproverNote ?? "—"}</p>
          </div>
        </CardContent>
      </Card>

      {pr._Order && <PoCard po={pr._Order} />}
    </div>
  );
}
