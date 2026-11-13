import { ButtonLink } from "@/components/ui/button";

export function FinalCta() {
  return (
    <section className="container-page pb-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-electric-500 to-electric-700 px-6 py-14 text-center sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-30 invert [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" aria-hidden />
        <h2 className="relative text-3xl font-semibold text-white sm:text-4xl">Votre prochain job commence ici.</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-lg text-electric-100">
          Créez votre profil gratuitement et postulez aux offres qui correspondent vraiment à votre rythme.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/inscription" size="lg" variant="secondary" className="ring-0">
            Créer mon profil gratuit
          </ButtonLink>
          <ButtonLink href="/inscription?role=recruteur" size="lg" variant="dark">
            Je recrute
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
