"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";
import type { Notification } from "@/lib/supabase/database.types";
import { markNotificationsReadAction } from "@/lib/notifications/actions";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/misc";
import { cn, formatRelativeDate } from "@/lib/utils";

export function NotificationList({ items }: { items: Notification[] }) {
  const [pending, start] = useTransition();
  const unread = items.filter((n) => !n.read_at).length;
  if (items.length === 0) return <EmptyState icon={<Bell />} title="Aucune notification" description="Vous serez prévenu·e ici des nouvelles candidatures et des changements de statut." />;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted" aria-live="polite">{unread ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu"}</p>
        {unread > 0 && (
          <Button variant="ghost" size="sm" loading={pending} onClick={() => start(() => markNotificationsReadAction())}>
            {!pending && <CheckCheck aria-hidden />} Tout marquer comme lu
          </Button>
        )}
      </div>
      <ul className="divide-y divide-line overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-line">
        {items.map((n) => {
          const content = (
            <>
              <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read_at ? "bg-transparent" : "bg-electric-500")} aria-hidden />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm", n.read_at ? "text-navy-800" : "font-semibold text-navy-950")}>{n.title}</span>
                {n.body && <span className="mt-0.5 block text-sm text-ink-muted">{n.body}</span>}
                <span className="mt-1 block text-xs text-ink-subtle">{formatRelativeDate(n.created_at)}</span>
              </span>
              {!n.read_at && <span className="sr-only">(non lue)</span>}
            </>
          );
          return (
            <li key={n.id}>
              {n.link ? (
                <Link href={n.link} onClick={() => !n.read_at && markNotificationsReadAction(n.id)} className="flex gap-3 p-4 transition hover:bg-navy-50/50 sm:px-5">
                  {content}
                </Link>
              ) : (
                <div className="flex gap-3 p-4 sm:px-5">{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
