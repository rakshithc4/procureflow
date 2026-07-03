import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-status-rejected-border bg-status-rejected-bg py-16 text-center">
      <AlertTriangle className="size-8 text-status-rejected-fg" aria-hidden="true" />
      <div>
        <p className="font-medium text-status-rejected-fg">Something went wrong</p>
        <p className="text-sm text-slate-600">{message}</p>
      </div>
      <Button variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
