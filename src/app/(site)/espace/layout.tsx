import type { Metadata } from "next";
import { EspaceNav } from "@/components/candidate/espace-nav";
import { UserAvatar } from "@/components/candidate/user-avatar";
import { requireUser } from "@/lib/auth/session";
import { signedFileUrl } from "@/lib/candidate/queries";
import { countUnread } from "@/lib/notifications/queries";

export const metadata: Metadata = { title: { default: "Mon espace", template: "%s · Mon espace Kairo" }, robots: { index: false } };

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser(["candidate"]);
  const [avatar, unread] = await Promise.all([signedFileUrl("avatars", user.profile.avatar_path), countUnread(user.id)]);
  return (
    <div className="container-page grid gap-6 py-8 lg:grid-cols-[220px_1fr] lg:gap-10 lg:py-12">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="mb-5 hidden items-center gap-3 px-1 lg:flex">
          <UserAvatar name={user.profile.full_name} url={avatar} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy-950">{user.profile.full_name}</p>
            <p className="truncate text-xs text-ink-subtle">{user.email}</p>
          </div>
        </div>
        <EspaceNav unread={unread} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
