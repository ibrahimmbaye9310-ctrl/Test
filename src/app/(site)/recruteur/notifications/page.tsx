import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getNotifications } from "@/lib/notifications/queries";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser(["recruiter"], "/recruteur/notifications");
  const items = await getNotifications(user.id);
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold sm:text-3xl">Notifications</h1>
      </header>
      <NotificationList items={items} />
    </div>
  );
}
