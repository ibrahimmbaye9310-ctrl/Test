import { describe, expect, it } from "vitest";
import { jobPostingJsonLd, safeJsonLd } from "@/lib/seo/job-posting";
import { pageWindow } from "@/components/jobs/pagination";
import { DEMO_OFFERS } from "@/lib/demo/offers";

const demo = DEMO_OFFERS[0]!;

describe("JobPosting JSON-LD", () => {
  it("n'est jamais produit pour une offre fictive", () => {
    expect(DEMO_OFFERS.every((o) => o.isDemo && jobPostingJsonLd(o) === null)).toBe(true);
  });
  it("contient les champs requis par Google pour une offre réelle", () => {
    const ld = jobPostingJsonLd({ ...demo, isDemo: false })!;
    expect(ld).toMatchObject({ "@type": "JobPosting", title: demo.title, datePosted: demo.publishedAt, validThrough: demo.validThrough });
    expect(ld.hiringOrganization.name).toBe(demo.companyName);
    expect(ld.jobLocation.address).toMatchObject({ addressCountry: "FR", postalCode: demo.postalCode });
    expect(ld.baseSalary?.value.unitText).toBe("MONTH");
  });
  it("échappe les chevrons pour empêcher la fermeture de la balise script", () => {
    expect(safeJsonLd({ x: "</script><script>alert(1)</script>" })).not.toContain("<");
  });
});

describe("données de démonstration", () => {
  it("sont toutes marquées comme fictives et ont des slugs uniques", () => {
    expect(DEMO_OFFERS.length).toBeGreaterThan(20);
    expect(new Set(DEMO_OFFERS.map((o) => o.slug)).size).toBe(DEMO_OFFERS.length);
    expect(DEMO_OFFERS.every((o) => o.companyName.includes("fictif") || o.companyName.includes("Fictif"))).toBe(true);
  });
});

describe("pageWindow", () => {
  it("affiche premières, dernières et pages voisines", () => {
    expect(pageWindow(1, 1)).toEqual([1]);
    expect(pageWindow(1, 3)).toEqual([1, 2, 3]);
    expect(pageWindow(6, 12)).toEqual([1, "…", 5, 6, 7, "…", 12]);
    expect(pageWindow(12, 12)).toEqual([1, "…", 11, 12]);
  });
});
