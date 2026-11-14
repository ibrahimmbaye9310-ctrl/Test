import { describe, expect, it } from "vitest";
import { companySchema, luhn, offerSchema } from "@/lib/validation/offer";
import { echo } from "@/lib/validation/common";

const valid = {
  title: "Vendeur·se", shortDescription: "Accueil et conseil des clients en boutique.", missions: "- Accueillir\n• Conseiller\n\n", profile: "", benefits: "",
  contractType: "cdd", workTime: "part_time", schedules: ["weekend"], sector: "retail", isStudentFriendly: true,
  salaryMin: "12,5", salaryMax: "", salaryPeriod: "hour", hoursPerWeek: "15", durationMonths: "6", remote: "none", location: "Créteil", intent: "publish",
};

describe("offre", () => {
  it("accepte une offre valide et normalise les listes et nombres", () => {
    const d = offerSchema.parse(valid);
    expect(d.missions).toEqual(["Accueillir", "Conseiller"]);
    expect(d.salaryMin).toBe(12.5);
    expect(d.salaryMax).toBeNull();
    expect(d.hoursPerWeek).toBe(15);
  });
  const errorsOf = (over: object) => {
    const r = offerSchema.safeParse({ ...valid, ...over });
    return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
  };
  it("exige au moins une mission et un horaire", () => {
    expect(errorsOf({ missions: "  \n " })).toContain("missions");
    expect(errorsOf({ schedules: [] })).toContain("schedules");
  });
  it("vérifie la cohérence du salaire", () => {
    expect(errorsOf({ salaryPeriod: null })).toContain("salaryPeriod");
    expect(errorsOf({ salaryMin: "", salaryMax: "2000" })).toContain("salaryMin");
    expect(errorsOf({ salaryMin: "2000", salaryMax: "1500", salaryPeriod: "month" })).toContain("salaryMax");
    expect(errorsOf({ salaryMin: "abc" })).toContain("salaryMin");
  });
  it("durée obligatoire hors CDI, interdite en CDI", () => {
    expect(errorsOf({ durationMonths: "" })).toContain("durationMonths");
    expect(errorsOf({ contractType: "cdi", durationMonths: "6" })).toContain("durationMonths");
    expect(errorsOf({ contractType: "cdi", durationMonths: "" })).toEqual([]);
  });
  it("refuse les valeurs hors référentiel", () => {
    expect(errorsOf({ contractType: "freelance" })).toContain("contractType");
    expect(errorsOf({ schedules: ["lundi"] })).toContain("schedules.0");
    expect(errorsOf({ hoursPerWeek: "60" })).toContain("hoursPerWeek");
  });
});

describe("entreprise", () => {
  it("complète l'adresse web et nettoie le SIRET", () => {
    const d = companySchema.parse({ name: "ACME", description: "", website: "www.acme.fr", siret: "732 829 320 00074", city: "", postalCode: "" });
    expect(d.website).toBe("https://www.acme.fr");
    expect(d.siret).toBe("73282932000074");
  });
  it("vérifie la clé du SIRET", () => {
    expect(luhn("73282932000074")).toBe(true);
    expect(luhn("73282932000075")).toBe(false);
    expect(companySchema.safeParse({ name: "ACME", description: "", website: "", siret: "12345678901234", city: "", postalCode: "" }).success).toBe(false);
  });
});

describe("echo", () => {
  it("conserve les choix multiples et exclut les mots de passe", () => {
    const fd = new FormData();
    fd.append("schedules", "morning"); fd.append("schedules", "night"); fd.append("password", "secret"); fd.append("title", "X");
    expect(echo(fd)).toEqual({ schedules: "morning,night", title: "X" });
  });
});
