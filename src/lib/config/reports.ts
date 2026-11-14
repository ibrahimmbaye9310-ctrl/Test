export const REPORT_REASONS = [
  { value: "fraud", label: "Arnaque ou demande d'argent" },
  { value: "discriminatory", label: "Contenu discriminatoire" },
  { value: "misleading", label: "Informations trompeuses (salaire, contrat…)" },
  { value: "filled", label: "Poste déjà pourvu" },
  { value: "inappropriate", label: "Contenu inapproprié" },
  { value: "other", label: "Autre" },
] as const;
