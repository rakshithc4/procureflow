"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RejectDialog } from "@/components/reject-dialog";
import { allowedActions, type Role, type Status } from "@/lib/pr";

// Detail-page action bar: buttons come only from the role×status matrix in
// lib/pr.ts — no inline role checks here.
interface ActionBarProps {
  role: Role;
  status: Status;
  hasOrder: boolean;
  pending?: boolean;
  onSubmit: () => void;
  onApprove: (note: string) => void;
  onReject: (note: string) => void;
  onCreatePo: (vendorId: string) => void;
}

export function ActionBar({ role, status, hasOrder, pending, onSubmit, onApprove, onReject, onCreatePo }: ActionBarProps) {
  const actions = allowedActions(role, status, hasOrder);

  const [approveOpen, setApproveOpen] = useState(false);
  const [approveNote, setApproveNote] = useState("");

  const [poOpen, setPoOpen] = useState(false);
  const [vendorId, setVendorId] = useState("");
  const [vendorError, setVendorError] = useState("");

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {actions.includes("submit") && (
        <Button
          disabled={pending}
          onClick={() => {
            if (window.confirm("Submit this requisition for approval? This cannot be undone.")) onSubmit();
          }}
        >
          Submit for Approval
        </Button>
      )}

      {actions.includes("approve") && (
        <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
          <DialogTrigger render={<Button disabled={pending} />}>Approve</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve requisition</DialogTitle>
              <DialogDescription>A note is optional.</DialogDescription>
            </DialogHeader>
            <Textarea
              placeholder="Note (optional)"
              value={approveNote}
              onChange={(e) => setApproveNote(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  onApprove(approveNote);
                  setApproveOpen(false);
                  setApproveNote("");
                }}
              >
                Approve
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {actions.includes("reject") && <RejectDialog onReject={onReject} disabled={pending} />}

      {actions.includes("createPo") && (
        <Dialog open={poOpen} onOpenChange={setPoOpen}>
          <DialogTrigger render={<Button disabled={pending} />}>Create Purchase Order</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create purchase order</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vendor-id">Vendor ID</Label>
              <Input
                id="vendor-id"
                value={vendorId}
                maxLength={10}
                onChange={(e) => {
                  setVendorId(e.target.value);
                  if (vendorError) setVendorError("");
                }}
              />
              {vendorError && <p className="text-sm text-status-rejected-fg">{vendorError}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPoOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!vendorId.trim()) {
                    setVendorError("Vendor ID is required");
                    return;
                  }
                  onCreatePo(vendorId);
                  setPoOpen(false);
                  setVendorId("");
                }}
              >
                Create PO
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
