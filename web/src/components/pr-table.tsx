import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import type { PurchaseRequisition } from "@/lib/pr";

function formatAmount(amount: string, currency: string) {
  const value = Number(amount);
  return `${Number.isFinite(value) ? value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : amount} ${currency}`;
}

export function PrTable({ data }: { data: PurchaseRequisition[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Requestor</TableHead>
          <TableHead>Last changed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((pr) => (
          <TableRow key={pr.ReqId} className="relative hover:bg-slate-50">
            <TableCell className="font-medium text-slate-900">
              <Link href={`/requisitions/${pr.ReqId}`} className="static before:absolute before:inset-0">
                {pr.Title}
              </Link>
            </TableCell>
            <TableCell className="tabular-nums text-slate-600">{formatAmount(pr.Amount, pr.Currency)}</TableCell>
            <TableCell>
              <StatusBadge status={pr.Status} hasOrder={!!pr._Order} />
            </TableCell>
            <TableCell className="text-slate-600">{pr.RequestorId}</TableCell>
            <TableCell className="text-slate-600">{new Date(pr.ChangedAt).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
