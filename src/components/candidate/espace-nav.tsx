import { SpaceNav } from "@/components/layout/space-nav";

export function EspaceNav({ unread = 0 }: { unread?: number }) {
  return (
    <SpaceNav
      label="Espace candidat"
      root="/espace"
      items={[
        { href: "/espace", label: "Tableau de bord", icon: "dashboard" },
        { href: "/espace/profil", label: "Mon profil", icon: "profile" },
        { href: "/espace/candidatures", label: "Candidatures", icon: "send" },
        { href: "/espace/favoris", label: "Favoris", icon: "bookmark" },
        { href: "/espace/notifications", label: "Notifications", icon: "bell", badge: unread },
        { href: "/espace/compte", label: "Compte", icon: "settings" },
      ]}
    />
  );
}
