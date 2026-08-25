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
          <TableRow key={pr.ReqId} className="relative transition-colors duration-150 hover:bg-accent/50">
            <TableCell className="font-medium text-foreground">
              <Link href={`/requisitions/${pr.ReqId}`} className="static before:absolute before:inset-0">
                {pr.Title}
              </Link>
            </TableCell>
            <TableCell className="font-mono tabular-nums text-muted-foreground">{formatAmount(pr.Amount, pr.Currency)}</TableCell>
            <TableCell>
              <StatusBadge status={pr.Status} hasOrder={!!pr._Order} />
            </TableCell>
            <TableCell className="text-muted-foreground">{pr.RequestorId}</TableCell>
            <TableCell className="text-muted-foreground">{new Date(pr.ChangedAt).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
