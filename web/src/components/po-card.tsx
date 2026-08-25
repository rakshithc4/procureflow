import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PurchaseOrder } from "@/lib/pr";

export function PoCard({ po }: { po: PurchaseOrder }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Purchase Order</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Order ID</p>
          <p className="font-mono text-xs">{po.OrderId}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Vendor</p>
          <p>{po.VendorId}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Amount</p>
          <p>
            {po.OrderAmount} {po.Currency}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Order date</p>
          <p>{po.OrderDate}</p>
        </div>
      </CardContent>
    </Card>
  );
}
