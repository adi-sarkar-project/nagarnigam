import { CheckCircle2, Clock, UserCog, Hourglass } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ComplaintStatus } from "@/types/app";

export function StatusBadge({
  status,
  className,
}: {
  status: ComplaintStatus;
  className?: string;
}) {
  const isResolved = status === "resolved";
  const isAssigned = status === "assigned";
  const isResolutionPending = status === "resolution_pending";
  let label = "Pending";
  let icon = <Clock className="h-3.5 w-3.5" />;
  let style = "bg-status-pending-bg text-status-pending";

  if (isResolved) {
    label = "Resolved";
    icon = <CheckCircle2 className="h-3.5 w-3.5" />;
    style = "bg-status-resolved-bg text-status-resolved";
  } else if (isAssigned) {
    label = "Assigned";
    icon = <UserCog className="h-3.5 w-3.5" />;
    style = "bg-primary/15 text-primary";
  } else if (isResolutionPending) {
    label = "Resolution Pending";
    icon = <Hourglass className="h-3.5 w-3.5" />;
    style = "bg-yellow-100 text-yellow-800";
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        style,
        className,
      )}
    >
      {icon}
      {label}
    </Badge>
  );
}
