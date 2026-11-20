import { describe, expect, it } from "vitest";
import type { JobOfferSummary } from "@/types/job";
import { buildSearchHref, countActiveFilters, parseSearchParams, PAGE_SIZE } from "@/lib/jobs/search-params";
import { monthlyEquivalent, searchInList } from "@/lib/jobs/search";
import { distanceKm, resolvePlace, suggestPlaces } from "@/lib/geo/communes";

const base: JobOfferSummary = {
  id: "x", slug: "x", title: "Vendeur", companyName: "ACME", companyLogoUrl: null, city: "Créteil", postalCode: "94000",
  communeCode: "94028", contractType: "cdi", workTime: "full_time", schedules: ["day"], sector: "retail",
  isStudentFriendly: false, salaryMin: null, salaryMax: null, salaryPeriod: null, shortDescription: "Vente en boutique",
  publishedAt: "2026-11-10T10:00:00.000Z", isFeatured: false, isDemo: true,
};
const offer = (o: Partial<JobOfferSummary>): JobOfferSummary => ({ ...base, ...o });
const search = (offers: JobOfferSummary[], params: Record<string, string | string[]>) => searchInList(offers, parseSearchParams(params));

describe("parseSearchParams", () => {
  it("applique les valeurs par défaut", () => {
    const c = parseSearchParams({});
    expect(c).toMatchObject({ contrat: [], horaire: [], secteur: [], etudiant: false, tri: "recent", page: 1 });
  });
  it("ignore les valeurs invalides au lieu d'échouer", () => {
    const c = parseSearchParams({ contrat: ["cdi", "pirate", "cdi"], rayon: "7", page: "-3", tri: "n'importe", salaire: "abc", temps: "x" });
    expect(c.contrat).toEqual(["cdi"]);
    expect(c.rayon).toBeUndefined();
    expect(c.page).toBe(1);
    expect(c.tri).toBe("recent");
    expect(c.salaire).toBeUndefined();
    expect(c.temps).toBeUndefined();
  });
  it("tronque les textes trop longs", () => {
    expect(parseSearchParams({ q: "a".repeat(500) }).q).toBeUndefined();
  });
  it("aller-retour URL", () => {
    const c = parseSearchParams({ q: "vente", lieu: "Créteil", rayon: "10", contrat: ["cdi", "cdd"], etudiant: "1", page: "2" });
    const href = buildSearchHref(c);
    const back = parseSearchParams(Object.fromEntries([...new URLSearchParams(href.split("?")[1]).keys()].map((k) => [k, new URLSearchParams(href.split("?")[1]).getAll(k)])));
    expect(back).toEqual(c);
    expect(buildSearchHref(c, { page: 1 })).not.toContain("page=");
    expect(countActiveFilters(c)).toBe(4);
  });
});

describe("géographie", () => {
  it("résout ville, code postal, arrondissement et département", () => {
    expect(resolvePlace("creteil")).toMatchObject({ kind: "point", label: "Créteil" });
    expect(resolvePlace("94000")).toMatchObject({ kind: "point", postalCodes: ["94000"] });
    expect(resolvePlace("Paris 11")).toMatchObject({ kind: "point", label: "Paris 11e" });
    expect(resolvePlace("75011")).toMatchObject({ kind: "point" });
    expect(resolvePlace("93")).toMatchObject({ kind: "department", department: "93" });
    expect(resolvePlace("Paris")).toMatchObject({ kind: "department", department: "75" });
    expect(resolvePlace("Lyon")).toEqual({ kind: "none" });
  });
  it("calcule des distances réalistes", () => {
    const paris11 = resolvePlace("Paris 11e");
    const creteil = resolvePlace("Créteil");
    if (paris11.kind !== "point" || creteil.kind !== "point") throw new Error();
    const d = distanceKm(paris11, creteil);
    expect(d).toBeGreaterThan(7);
    expect(d).toBeLessThan(11);
  });
  it("suggère des communes", () => {
    expect(suggestPlaces("vers")[0]?.value).toBe("Versailles");
    expect(suggestPlaces("9400").some((s) => s.value === "94000")).toBe(true);
    expect(suggestPlaces("a")).toEqual([]);
  });
});

describe("searchInList", () => {
  const offers = [
    offer({ id: "a", title: "Vendeur", communeCode: "94028", postalCode: "94000", city: "Créteil", contractType: "cdi", publishedAt: "2026-11-10T00:00:00Z" }),
    offer({ id: "b", title: "Serveur", communeCode: "75111", postalCode: "75011", city: "Paris 11e", contractType: "cdd", workTime: "part_time", schedules: ["evening", "weekend"], sector: "hospitality", isStudentFriendly: true, salaryMin: 12, salaryPeriod: "hour", publishedAt: "2026-11-12T00:00:00Z" }),
    offer({ id: "c", title: "Développeur", communeCode: "95127", postalCode: "95000", city: "Cergy", contractType: "alternance", sector: "tech", salaryMin: 40000, salaryMax: 45000, salaryPeriod: "year", publishedAt: "2026-11-11T00:00:00Z" }),
  ];
  const ids = (r: ReturnType<typeof searchInList>) => r.items.map((i) => i.id);

  it("trie par date décroissante par défaut", () => expect(ids(search(offers, {}))).toEqual(["b", "c", "a"]));
  it("trie par date croissante", () => expect(ids(search(offers, { tri: "ancien" }))).toEqual(["a", "c", "b"]));
  it("place les offres à la une en premier", () => expect(ids(search([...offers, offer({ id: "f", isFeatured: true, publishedAt: "2026-01-01T00:00:00Z" })], {}))[0]).toBe("f"));
  it("filtre par mot-clé sans accents ni casse", () => expect(ids(search(offers, { q: "DEVELOPPEUR" }))).toEqual(["c"]));
  it("filtre par contrat (plusieurs valeurs)", () => expect(ids(search(offers, { contrat: ["cdi", "alternance"] }))).toEqual(["c", "a"]));
  it("filtre temps partiel, étudiant, horaires, secteur", () => {
    expect(ids(search(offers, { temps: "part_time" }))).toEqual(["b"]);
    expect(ids(search(offers, { etudiant: "1" }))).toEqual(["b"]);
    expect(ids(search(offers, { horaire: "weekend" }))).toEqual(["b"]);
    expect(ids(search(offers, { secteur: "tech" }))).toEqual(["c"]);
  });
  it("filtre par salaire en équivalent mensuel et exclut les salaires non renseignés", () => {
    // b : 12 €/h ≈ 1 820 €/mois ; c : 45 000 €/an = 3 750 €/mois ; a : non renseigné → toujours exclue.
    expect(ids(search(offers, { salaire: "1800" }))).toEqual(["b", "c"]);
    expect(ids(search(offers, { salaire: "2000" }))).toEqual(["c"]);
  });
  it("filtre par commune exacte sans rayon", () => expect(ids(search(offers, { lieu: "Créteil" }))).toEqual(["a"]));
  it("filtre par rayon et trie par distance", () => {
    expect(ids(search(offers, { lieu: "Créteil", rayon: "10" }))).toEqual(["b", "a"]);
    expect(ids(search(offers, { lieu: "Créteil", rayon: "50", tri: "distance" }))).toEqual(["a", "b", "c"]);
  });
  it("filtre par département", () => expect(ids(search(offers, { lieu: "75" }))).toEqual(["b"]));
  it("recherche textuelle si le lieu est inconnu", () => {
    const r = search(offers, { lieu: "Lyon" });
    expect(r.placeFallback).toBe(true);
    expect(r.total).toBe(0);
  });
  it("pagine et borne la page demandée", () => {
    const many = Array.from({ length: PAGE_SIZE + 3 }, (_, i) => offer({ id: `m${i}`, publishedAt: new Date(2026, 0, i + 1).toISOString() }));
    const p2 = search(many, { page: "2" });
    expect(p2).toMatchObject({ total: PAGE_SIZE + 3, page: 2, pageCount: 2 });
    expect(p2.items).toHaveLength(3);
    expect(search(many, { page: "99" }).page).toBe(2);
  });
});

describe("monthlyEquivalent", () => {
  it("convertit heure, mois, année", () => {
    expect(Math.round(monthlyEquivalent(12, "hour"))).toBe(1820);
    expect(monthlyEquivalent(2000, "month")).toBe(2000);
    expect(monthlyEquivalent(36000, "year")).toBe(3000);
  });
});
