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

// US3 AC2: reject requires a note. Shared by the detail-page action bar and
// the approvals queue's inline actions so the required-note rule lives once.
export function RejectDialog({
  onReject,
  disabled,
  size,
}: {
  onReject: (note: string) => void;
  disabled?: boolean;
  size?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" size={size} disabled={disabled} />}>
        Reject
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject requisition</DialogTitle>
          <DialogDescription>A note is required when rejecting.</DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Reason for rejection"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError("");
          }}
        />
        {error && <p className="text-sm text-status-rejected-fg">{error}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!note.trim()) {
                setError("A note is required when rejecting a requisition");
                return;
              }
              onReject(note);
              setOpen(false);
              setNote("");
            }}
          >
            Reject
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
