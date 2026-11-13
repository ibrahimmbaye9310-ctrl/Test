import { Badge } from "@/components/ui/badge";
import { applicationStatus } from "@/lib/config/applications";

export function ApplicationStatusBadge({ status }: { status: string }) {
  const s = applicationStatus(status);
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
