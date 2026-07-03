"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, ApiError } from "@/lib/api-client";
import { createRequisitionSchema } from "@/lib/pr";

const CURRENCIES = ["USD", "EUR", "GBP"];

export default function NewRequisitionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: api.createRequisition,
    onSuccess: (pr) => {
      queryClient.invalidateQueries({ queryKey: ["requisitions"] });
      toast.success("Requisition saved as draft");
      router.push(`/requisitions/${pr.ReqId}`);
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Could not save the requisition");
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const result = createRequisitionSchema.safeParse({ title, description, amount, currency });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle>
            <h1>New requisition</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
              {errors.title && <p className="text-sm text-status-rejected-fg">{errors.title}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={255}
                rows={4}
              />
              {errors.description && <p className="text-sm text-status-rejected-fg">{errors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {errors.amount && <p className="text-sm text-status-rejected-fg">{errors.amount}</p>}
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={(value) => value && setCurrency(value)}>
                  <SelectTrigger id="currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push("/requisitions")}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save draft"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
