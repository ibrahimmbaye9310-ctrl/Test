import "server-only";
import type { JobOffer, SalaryPeriod } from "@/types/job";
import type { ContractType, Schedule, Sector, WorkTime } from "@/lib/config/taxonomy";
import { getCommune } from "@/lib/geo/communes";
import { slugify } from "@/lib/utils";

/**
 * ⚠️ DONNÉES DE DÉMONSTRATION — ENTIÈREMENT FICTIVES.
 * Entreprises et postes inventés pour illustrer l'interface. Toute ressemblance avec une entreprise existante
 * serait fortuite. Chaque offre porte isDemo: true : badge « Exemple fictif », noindex, aucune candidature possible,
 * jamais de données structurées JobPosting. Désactivées via NEXT_PUBLIC_ENABLE_DEMO_DATA=false.
 */

const COMPANIES: Record<string, string> = {
  "Maison Exemple (fictif)": "Enseigne fictive de décoration et d'art de vivre, imaginée pour la démonstration.",
  "Comptoir Démo (fictif)": "Restaurant de quartier fictif, cuisine maison et service rapide.",
  "LogiTest (fictif)": "Prestataire logistique fictif spécialisé dans le e-commerce.",
  "Studio Fictif": "Studio produit fictif qui conçoit des applications web et mobiles.",
  "Résidence Exemple (fictif)": "Établissement d'hébergement pour personnes âgées, fictif.",
  "Cabinet Démo (fictif)": "Cabinet de conseil fictif accompagnant les TPE et PME.",
  "Atelier Prototype (fictif)": "Entreprise du bâtiment fictive, rénovation de logements.",
  "Banque Imaginaire (fictif)": "Établissement financier fictif, réseau d'agences en Île-de-France.",
  "Agence Placebo (fictif)": "Agence de communication fictive, 20 collaborateurs.",
  "École Modèle (fictif)": "Organisme fictif de soutien scolaire et d'animation.",
  "Hôtel Maquette (fictif)": "Hôtel fictif de 80 chambres proche des transports.",
  "Supérette Témoin (fictif)": "Commerce de proximité fictif ouvert 7 jours sur 7.",
};

type Row = {
  title: string;
  company: keyof typeof COMPANIES;
  commune: string;
  contract: ContractType;
  time: WorkTime;
  schedules: Schedule[];
  sector: Sector;
  student?: boolean;
  salary?: [number, number | null, SalaryPeriod];
  hours?: number;
  months?: number;
  remote?: JobOffer["remote"];
  featured?: boolean;
  age: number;
  summary: string;
  missions: string[];
  profile: string[];
  benefits: string[];
};

const rows: Row[] = [
  { title: "Vendeur·se conseil", company: "Maison Exemple (fictif)", commune: "75111", contract: "cdi", time: "full_time", schedules: ["day"], sector: "retail", salary: [1900, 2150, "month"], hours: 35, featured: true, age: 0,
    summary: "Accueil et conseil clients dans une boutique de décoration, gestion des encaissements et mise en rayon.",
    missions: ["Accueillir et conseiller la clientèle", "Assurer les encaissements", "Participer à la mise en rayon et aux inventaires"], profile: ["Goût pour la décoration", "Première expérience en vente appréciée"], benefits: ["Remise employé", "Prime sur objectifs", "Mutuelle"] },
  { title: "Équipier·ère de restauration", company: "Comptoir Démo (fictif)", commune: "92012", contract: "cdd", time: "part_time", schedules: ["evening", "weekend"], sector: "hospitality", student: true, salary: [12.2, null, "hour"], hours: 15, months: 6, age: 1,
    summary: "Service en salle et préparation au comptoir, 15 h par semaine, compatible avec un emploi du temps étudiant.",
    missions: ["Préparer les commandes au comptoir", "Assurer le service en salle", "Respecter les règles d'hygiène"], profile: ["Débutant·e accepté·e", "Disponible soirs et week-ends"], benefits: ["Repas offert", "Planning adapté aux examens"] },
  { title: "Préparateur·rice de commandes", company: "LogiTest (fictif)", commune: "95527", contract: "interim", time: "full_time", schedules: ["morning"], sector: "logistics", salary: [1850, 2000, "month"], hours: 35, months: 3, age: 2,
    summary: "Préparation de commandes en entrepôt, CACES 1 apprécié. Mission de 3 mois renouvelable.",
    missions: ["Préparer les commandes avec un terminal", "Contrôler la qualité des colis", "Charger les quais d'expédition"], profile: ["CACES 1 apprécié", "Rigueur et ponctualité"], benefits: ["Prime de panier", "Indemnité transport"] },
  { title: "Développeur·se front-end en alternance", company: "Studio Fictif", commune: "75102", contract: "alternance", time: "full_time", schedules: ["day"], sector: "tech", student: true, months: 24, remote: "partial", featured: true, age: 3,
    summary: "Intégration d'interfaces React au sein d'une équipe produit de 8 personnes. Rythme 3 semaines / 1 semaine.",
    missions: ["Intégrer des interfaces en React et TypeScript", "Écrire des tests", "Participer aux revues de code"], profile: ["École de développement (bac+2 à bac+5)", "Bases solides en HTML, CSS et JavaScript"], benefits: ["Télétravail 2 jours par semaine", "Matériel fourni", "Mentorat"] },
  { title: "Aide-soignant·e de nuit", company: "Résidence Exemple (fictif)", commune: "94028", contract: "cdd", time: "full_time", schedules: ["night"], sector: "health", salary: [2100, 2350, "month"], hours: 35, months: 6, age: 4,
    summary: "Accompagnement des résidents la nuit au sein d'une équipe pluridisciplinaire. Diplôme d'État requis.",
    missions: ["Assurer les soins d'hygiène et de confort", "Surveiller l'état de santé des résidents", "Transmettre les informations à l'équipe de jour"], profile: ["Diplôme d'État d'aide-soignant", "Sens de l'écoute"], benefits: ["Prime de nuit", "Comité d'entreprise"] },
  { title: "Assistant·e administratif·ve", company: "Cabinet Démo (fictif)", commune: "93066", contract: "stage", time: "full_time", schedules: ["day"], sector: "admin", student: true, salary: [4.35, null, "hour"], hours: 35, months: 6, age: 6,
    summary: "Stage de 6 mois : gestion des dossiers clients, agenda et suivi de facturation.",
    missions: ["Gérer l'agenda et les rendez-vous", "Mettre à jour les dossiers clients", "Suivre la facturation"], profile: ["Formation assistanat ou gestion", "Maîtrise des outils bureautiques"], benefits: ["Tickets restaurant", "Remboursement transport à 50 %"] },
  { title: "Caissier·ère week-end", company: "Supérette Témoin (fictif)", commune: "93048", contract: "cdi", time: "part_time", schedules: ["weekend"], sector: "retail", student: true, salary: [12.1, null, "hour"], hours: 12, age: 1,
    summary: "CDI de 12 h le samedi et le dimanche, idéal pour compléter des études.",
    missions: ["Tenir la caisse", "Accueillir les clients", "Réassortir les rayons"], profile: ["Aisance relationnelle", "Disponible tous les week-ends"], benefits: ["Majoration du dimanche", "Remise employé"] },
  { title: "Réceptionniste de nuit", company: "Hôtel Maquette (fictif)", commune: "75117", contract: "cdi", time: "full_time", schedules: ["night"], sector: "hospitality", salary: [2000, 2200, "month"], hours: 35, age: 2,
    summary: "Accueil des clients, check-in tardifs et clôture de caisse dans un hôtel de 80 chambres.",
    missions: ["Accueillir les clients arrivant tard", "Effectuer l'audit de nuit", "Assurer la sécurité de l'établissement"], profile: ["Anglais courant", "Expérience en hôtellerie appréciée"], benefits: ["Prime de nuit", "Repas fournis"] },
  { title: "Chargé·e de communication", company: "Agence Placebo (fictif)", commune: "92050", contract: "cdi", time: "full_time", schedules: ["day"], sector: "marketing", salary: [36000, 42000, "year"], hours: 37, remote: "partial", age: 5,
    summary: "Conception de campagnes pour une dizaine de clients, en lien avec les équipes créatives.",
    missions: ["Piloter des campagnes multicanales", "Rédiger des contenus", "Suivre les indicateurs de performance"], profile: ["Bac+5 en communication", "2 ans d'expérience"], benefits: ["Télétravail 2 jours", "RTT", "Mutuelle prise en charge à 100 %"] },
  { title: "Animateur·rice périscolaire", company: "École Modèle (fictif)", commune: "94081", contract: "cdd", time: "part_time", schedules: ["morning", "evening"], sector: "education", student: true, salary: [12.5, null, "hour"], hours: 18, months: 10, age: 3,
    summary: "Encadrement d'enfants de 6 à 11 ans le matin avant l'école et le soir après la classe.",
    missions: ["Encadrer les enfants", "Proposer des activités ludiques", "Assurer la sécurité du groupe"], profile: ["BAFA apprécié", "Patience et dynamisme"], benefits: ["Horaires compatibles avec les études"] },
  { title: "Conseiller·ère clientèle bancaire", company: "Banque Imaginaire (fictif)", commune: "78646", contract: "cdi", time: "full_time", schedules: ["day"], sector: "finance", salary: [32000, 36000, "year"], hours: 37, featured: true, age: 0,
    summary: "Gestion d'un portefeuille de clients particuliers dans une agence du centre-ville.",
    missions: ["Conseiller les clients sur leurs projets", "Développer le portefeuille", "Assurer la conformité des dossiers"], profile: ["Bac+2/3 banque ou commerce", "Sens commercial"], benefits: ["13e mois", "Intéressement", "Prêt immobilier à taux préférentiel"] },
  { title: "Peintre en bâtiment", company: "Atelier Prototype (fictif)", commune: "91228", contract: "cdi", time: "full_time", schedules: ["morning", "day"], sector: "construction", salary: [2100, 2400, "month"], hours: 35, age: 7,
    summary: "Travaux de peinture et de finition sur des chantiers de rénovation de logements.",
    missions: ["Préparer les supports", "Appliquer peintures et revêtements", "Respecter les règles de sécurité"], profile: ["CAP peintre ou expérience équivalente", "Permis B apprécié"], benefits: ["Panier repas", "Véhicule de service"] },
  { title: "Développeur·se back-end", company: "Studio Fictif", commune: "75109", contract: "cdi", time: "full_time", schedules: ["day"], sector: "tech", salary: [48000, 58000, "year"], hours: 37, remote: "partial", age: 8,
    summary: "Conception d'API et de services pour des applications utilisées par des milliers de personnes.",
    missions: ["Concevoir et maintenir des API", "Optimiser les performances", "Participer aux choix d'architecture"], profile: ["3 ans d'expérience en Node.js ou Go", "Connaissance de PostgreSQL"], benefits: ["Télétravail 3 jours", "Budget formation", "BSPCE"] },
  { title: "Livreur·se à vélo", company: "Comptoir Démo (fictif)", commune: "75120", contract: "cdd", time: "part_time", schedules: ["evening", "weekend"], sector: "logistics", student: true, salary: [12.3, null, "hour"], hours: 15, months: 4, age: 2,
    summary: "Livraisons de commandes dans un rayon de 3 km, vélo électrique fourni.",
    missions: ["Livrer les commandes", "Vérifier les colis", "Entretenir le vélo"], profile: ["Bonne connaissance du quartier", "Sens de l'orientation"], benefits: ["Vélo électrique fourni", "Équipement de pluie"] },
  { title: "Infirmier·ère", company: "Résidence Exemple (fictif)", commune: "92063", contract: "cdi", time: "full_time", schedules: ["day"], sector: "health", salary: [2500, 2900, "month"], hours: 35, age: 10,
    summary: "Coordination des soins pour 40 résidents en lien avec le médecin coordinateur.",
    missions: ["Réaliser les soins techniques", "Gérer les traitements", "Encadrer les aides-soignants"], profile: ["Diplôme d'État infirmier", "Inscription à l'Ordre"], benefits: ["Prime d'installation", "Crèche partenaire"] },
  { title: "Employé·e polyvalent·e de magasin", company: "Supérette Témoin (fictif)", commune: "77288", contract: "cdi", time: "full_time", schedules: ["morning", "day"], sector: "retail", salary: [1830, 1900, "month"], hours: 35, age: 12,
    summary: "Réception des livraisons, mise en rayon et encaissement dans une supérette de centre-ville.",
    missions: ["Réceptionner les marchandises", "Mettre en rayon", "Tenir la caisse"], profile: ["Débutant·e accepté·e", "Ponctualité"], benefits: ["Mutuelle", "Remise employé"] },
  { title: "Chargé·e de recrutement en alternance", company: "Cabinet Démo (fictif)", commune: "95127", contract: "alternance", time: "full_time", schedules: ["day"], sector: "admin", student: true, months: 12, remote: "partial", age: 4,
    summary: "Sourcing, entretiens téléphoniques et suivi des candidats pour des PME clientes.",
    missions: ["Rédiger et publier des annonces", "Présélectionner les candidats", "Organiser les entretiens"], profile: ["Master RH en alternance", "Excellent relationnel"], benefits: ["Télétravail 1 jour", "Tickets restaurant"] },
  { title: "Serveur·se en brasserie", company: "Comptoir Démo (fictif)", commune: "75105", contract: "cdi", time: "full_time", schedules: ["day", "evening"], sector: "hospitality", salary: [1950, 2100, "month"], hours: 39, age: 1,
    summary: "Service midi et soir dans une brasserie de 90 couverts, en coupure.",
    missions: ["Accueillir et installer les clients", "Prendre les commandes", "Assurer l'encaissement"], profile: ["1 an d'expérience en salle", "Bonne présentation"], benefits: ["Pourboires", "Repas sur place", "2 jours de repos consécutifs"] },
  { title: "Cariste", company: "LogiTest (fictif)", commune: "91377", contract: "interim", time: "full_time", schedules: ["night"], sector: "logistics", salary: [13.5, 14.5, "hour"], hours: 35, months: 2, age: 5,
    summary: "Chargement et déchargement de camions de nuit sur une plateforme de distribution.",
    missions: ["Conduire un chariot élévateur", "Charger et décharger les camions", "Ranger les palettes"], profile: ["CACES 3 et 5 en cours de validité", "Expérience en entrepôt"], benefits: ["Majoration de nuit", "Prime d'assiduité"] },
  { title: "Professeur·e particulier·ère de mathématiques", company: "École Modèle (fictif)", commune: "78423", contract: "cdd", time: "part_time", schedules: ["evening", "weekend"], sector: "education", student: true, salary: [18, 22, "hour"], hours: 6, months: 9, age: 6,
    summary: "Cours à domicile pour des élèves de collège et lycée, 2 à 6 heures par semaine.",
    missions: ["Préparer et donner des cours", "Suivre la progression des élèves", "Échanger avec les familles"], profile: ["Étudiant·e en sciences (bac+2 minimum)", "Pédagogie"], benefits: ["Planning libre", "Déplacements proches de chez vous"] },
  { title: "Comptable", company: "Cabinet Démo (fictif)", commune: "92026", contract: "cdi", time: "full_time", schedules: ["day"], sector: "finance", salary: [34000, 38000, "year"], hours: 37, remote: "partial", age: 9,
    summary: "Tenue d'un portefeuille de dossiers de TPE jusqu'au bilan.",
    missions: ["Tenir la comptabilité", "Préparer les déclarations fiscales", "Établir les bilans"], profile: ["BTS/DCG comptabilité", "2 ans d'expérience en cabinet"], benefits: ["Télétravail 1 jour", "Prime annuelle"] },
  { title: "Graphiste en stage", company: "Agence Placebo (fictif)", commune: "75103", contract: "stage", time: "full_time", schedules: ["day"], sector: "marketing", student: true, salary: [4.35, null, "hour"], hours: 35, months: 6, age: 3,
    summary: "Création de visuels pour les réseaux sociaux et supports print de nos clients.",
    missions: ["Créer des visuels", "Décliner des chartes graphiques", "Préparer les fichiers d'impression"], profile: ["École d'art ou de design", "Maîtrise de la suite Adobe ou Figma"], benefits: ["Tickets restaurant", "Ambiance créative"] },
  { title: "Agent·e d'entretien", company: "Hôtel Maquette (fictif)", commune: "93001", contract: "cdi", time: "part_time", schedules: ["morning"], sector: "hospitality", salary: [12.1, null, "hour"], hours: 20, age: 11,
    summary: "Entretien des parties communes le matin, de 6 h à 10 h du lundi au vendredi.",
    missions: ["Nettoyer les parties communes", "Gérer le linge", "Signaler les anomalies"], profile: ["Débutant·e accepté·e", "Autonomie"], benefits: ["Horaires fixes", "Mutuelle"] },
  { title: "Électricien·ne", company: "Atelier Prototype (fictif)", commune: "77373", contract: "cdd", time: "full_time", schedules: ["morning", "day"], sector: "construction", salary: [2300, 2600, "month"], hours: 35, months: 12, age: 14,
    summary: "Mise aux normes électriques de logements en rénovation.",
    missions: ["Installer les réseaux électriques", "Poser les équipements", "Contrôler la conformité"], profile: ["CAP/BP électricien", "Habilitation électrique"], benefits: ["Véhicule de service", "Panier repas"] },
  { title: "Product designer", company: "Studio Fictif", commune: "75110", contract: "cdi", time: "full_time", schedules: ["day"], sector: "tech", salary: [45000, 52000, "year"], hours: 37, remote: "full", age: 15,
    summary: "Conception d'expériences utilisateur de bout en bout, de la recherche aux maquettes.",
    missions: ["Mener des entretiens utilisateurs", "Concevoir des parcours et maquettes", "Maintenir le design system"], profile: ["3 ans d'expérience en design produit", "Portfolio"], benefits: ["Télétravail total possible", "Budget matériel"] },
  { title: "Hôte·sse d'accueil", company: "Banque Imaginaire (fictif)", commune: "92004", contract: "cdd", time: "part_time", schedules: ["morning"], sector: "admin", student: true, salary: [12.4, null, "hour"], hours: 20, months: 6, age: 4,
    summary: "Accueil physique et téléphonique d'une agence, les matins du lundi au vendredi.",
    missions: ["Accueillir les visiteurs", "Gérer le standard", "Orienter les clients"], profile: ["Excellente présentation", "Anglais apprécié"], benefits: ["Horaires du matin uniquement"] },
  { title: "Manutentionnaire", company: "LogiTest (fictif)", commune: "94068", contract: "interim", time: "full_time", schedules: ["day"], sector: "logistics", student: true, salary: [12.1, null, "hour"], hours: 35, months: 1, age: 0,
    summary: "Mission d'un mois pendant les vacances, réception et tri de colis.",
    missions: ["Décharger les colis", "Trier selon les destinations", "Tenir le poste propre"], profile: ["Bonne condition physique", "Débutant·e accepté·e"], benefits: ["Indemnité de fin de mission", "Accès en transports en commun"] },
  { title: "Auxiliaire de vie", company: "Résidence Exemple (fictif)", commune: "95018", contract: "cdi", time: "part_time", schedules: ["morning", "weekend"], sector: "health", salary: [12.5, 13.2, "hour"], hours: 24, age: 6,
    summary: "Accompagnement des résidents dans les gestes du quotidien.",
    missions: ["Aider aux repas et à la toilette", "Proposer des activités", "Veiller au bien-être"], profile: ["DEAES apprécié", "Bienveillance"], benefits: ["Formation continue", "Majoration week-end"] },
];

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

export const DEMO_OFFERS: JobOffer[] = rows.map((r, i) => {
  const commune = getCommune(r.commune);
  if (!commune) throw new Error(`Commune inconnue dans les données de démo : ${r.commune}`);
  const published = daysAgo(r.age);
  const id = `demo-${i + 1}`;
  return {
    id,
    slug: `${slugify(`${r.title} ${commune.name}`)}-${id}`,
    title: r.title,
    companyName: r.company,
    companyLogoUrl: null,
    companyDescription: COMPANIES[r.company] ?? "",
    city: commune.name,
    postalCode: commune.postalCodes[0] ?? "",
    communeCode: commune.code,
    contractType: r.contract,
    workTime: r.time,
    schedules: r.schedules,
    sector: r.sector,
    isStudentFriendly: Boolean(r.student),
    salaryMin: r.salary?.[0] ?? null,
    salaryMax: r.salary?.[1] ?? null,
    salaryPeriod: r.salary?.[2] ?? null,
    shortDescription: r.summary,
    missions: r.missions,
    profile: r.profile,
    benefits: r.benefits,
    hoursPerWeek: r.hours ?? null,
    startDate: null,
    durationMonths: r.contract === "cdi" ? null : r.months ?? null,
    remote: r.remote ?? "none",
    publishedAt: published.toISOString(),
    validThrough: new Date(published.getTime() + 30 * 86_400_000).toISOString(),
    isFeatured: Boolean(r.featured),
    isDemo: true,
  };
});
