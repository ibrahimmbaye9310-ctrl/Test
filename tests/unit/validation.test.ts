import { describe, expect, it } from "vitest";
import { signUpSchema, newPasswordSchema } from "@/lib/validation/auth";
import { availabilitySchema, preferencesSchema, profileInfoSchema, skillsSchema, sniffMime, validateUpload } from "@/lib/validation/profile";
import { homeForRole, safeNextPath } from "@/lib/auth/redirects";

const base = { role: "candidate", fullName: "Alice Martin", email: " Alice@Exemple.FR ", password: "motdepasse42", terms: "on" };

describe("inscription", () => {
  it("accepte un candidat valide et normalise l'e-mail", () => {
    const r = signUpSchema.safeParse(base);
    expect(r.success && r.data.email).toBe("alice@exemple.fr");
  });
  it("refuse un mot de passe faible", () => {
    for (const password of ["court1", "sanschiffreaucun", "1234567890"]) expect(signUpSchema.safeParse({ ...base, password }).success).toBe(false);
  });
  it("exige l'acceptation des CGU", () => expect(signUpSchema.safeParse({ ...base, terms: undefined }).success).toBe(false));
  it("refuse le rôle admin", () => expect(signUpSchema.safeParse({ ...base, role: "admin" }).success).toBe(false));
  it("exige le nom d'entreprise pour un recruteur", () => {
    expect(signUpSchema.safeParse({ ...base, role: "recruiter" }).success).toBe(false);
    expect(signUpSchema.safeParse({ ...base, role: "recruiter", companyName: "ACME" }).success).toBe(true);
  });
  it("vérifie la confirmation du mot de passe", () => {
    expect(newPasswordSchema.safeParse({ password: "motdepasse42", confirm: "autre" }).success).toBe(false);
    expect(newPasswordSchema.safeParse({ password: "motdepasse42", confirm: "motdepasse42" }).success).toBe(true);
  });
});

describe("profil", () => {
  it("transforme les champs vides en null et valide formats", () => {
    const r = profileInfoSchema.parse({ fullName: "Alice", phone: "", city: " Créteil ", postalCode: "94000", headline: "", bio: "" });
    expect(r).toMatchObject({ phone: null, city: "Créteil", postalCode: "94000", headline: null });
    expect(profileInfoSchema.safeParse({ fullName: "Alice", phone: "abc", city: "", postalCode: "", headline: "", bio: "" }).success).toBe(false);
    expect(profileInfoSchema.safeParse({ fullName: "Alice", phone: "", city: "", postalCode: "9400", headline: "", bio: "" }).success).toBe(false);
  });
  it("déduplique les compétences et limite à 30", () => {
    expect(skillsSchema.parse({ skills: ["Excel", "excel", " Anglais "] }).skills).toEqual(["Excel", "Anglais"]);
    expect(skillsSchema.safeParse({ skills: Array.from({ length: 31 }, (_, i) => `s${i}`) }).success).toBe(false);
  });
  it("refuse des horaires ou contrats inconnus", () => {
    expect(availabilitySchema.safeParse({ availability: ["weekend", "lundi"], availabilityNote: "" }).success).toBe(false);
    expect(preferencesSchema.safeParse({ desiredContracts: ["cdi"], desiredWorkTime: null, desiredSectors: [], searchRadiusKm: "7", openToWork: true }).success).toBe(false);
    expect(preferencesSchema.parse({ desiredContracts: ["cdi"], desiredWorkTime: "part_time", desiredSectors: ["tech"], searchRadiusKm: "10", openToWork: true }).searchRadiusKm).toBe(10);
  });
});

describe("fichiers", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16 - b.length).fill(0)]);
  const pdf = bytes(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31);
  const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  const exe = bytes(0x4d, 0x5a);
  it("détecte le vrai format", () => {
    expect(sniffMime(pdf)).toBe("application/pdf");
    expect(sniffMime(png)).toBe("image/png");
    expect(sniffMime(exe)).toBeNull();
  });
  it("accepte un vrai PDF comme CV", () => expect(validateUpload("cv", { size: 1000, type: "application/pdf" }, pdf)).toBeNull());
  it("refuse un exécutable renommé en .pdf", () => expect(validateUpload("cv", { size: 1000, type: "application/pdf" }, exe)).toMatch(/Format/));
  it("refuse une image comme CV", () => expect(validateUpload("cv", { size: 1000, type: "image/png" }, png)).toMatch(/Format/));
  it("refuse un fichier trop lourd ou vide", () => {
    expect(validateUpload("cv", { size: 5 * 1024 * 1024, type: "application/pdf" }, pdf)).toMatch(/lourd/);
    expect(validateUpload("avatar", { size: 0, type: "image/png" }, png)).toMatch(/vide/);
  });
});

describe("redirections", () => {
  it("n'autorise que les chemins internes", () => {
    expect(safeNextPath("/espace/profil", "/")).toBe("/espace/profil");
    for (const bad of ["https://evil.fr", "//evil.fr", "/\\evil.fr", "javascript:alert(1)", undefined, "/a\r\nSet-Cookie:x"]) expect(safeNextPath(bad, "/espace")).toBe("/espace");
  });
  it("oriente chaque rôle vers son espace", () => {
    expect(homeForRole("candidate")).toBe("/espace");
    expect(homeForRole("recruiter")).toBe("/recruteur");
    expect(homeForRole("admin")).toBe("/admin");
  });
});
