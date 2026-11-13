export type Role = "candidate" | "recruiter" | "admin";

export function homeForRole(role: Role) {
  if (role === "recruiter") return "/recruteur";
  if (role === "admin") return "/admin";
  return "/espace";
}

/** N'accepte que des chemins internes (évite les redirections ouvertes vers un autre site). */
export function safeNextPath(value: unknown, fallback: string) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) return fallback;
  return value.slice(0, 300);
}
