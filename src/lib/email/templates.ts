/**
 * Modèles d'e-mails transactionnels Kairo.
 * HTML compatible clients mail (tableaux, styles en ligne, 600 px), version texte, contenu échappé.
 */
const COLORS = { navy: "#0e1a36", electric: "#3460ff", muted: "#545f78", line: "#e6e9f0", canvas: "#f7f8fb" };

export type Email = { subject: string; html: string; text: string };

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

type LayoutInput = {
  preheader: string;
  title: string;
  paragraphs: string[]; // texte brut, échappé ici
  cta?: { label: string; url: string };
  note?: string;
  /** Lien brut non échappé (modèles Supabase : {{ .ConfirmationURL }}). */
  rawUrl?: boolean;
};

export function layout({ preheader, title, paragraphs, cta, note, rawUrl }: LayoutInput) {
  const url = cta ? (rawUrl ? cta.url : escapeHtml(cta.url)) : "";
  const p = paragraphs.map((t) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COLORS.navy}">${escapeHtml(t)}</p>`).join("");
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:${COLORS.canvas};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.canvas}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px">
<tr><td style="padding:0 8px 20px"><span style="display:inline-block;background:${COLORS.navy};color:#fff;font-weight:700;font-size:15px;border-radius:8px;padding:6px 10px">K</span>
<span style="font-size:17px;font-weight:700;color:${COLORS.navy};vertical-align:middle;margin-left:8px">Kairo</span></td></tr>
<tr><td style="background:#ffffff;border:1px solid ${COLORS.line};border-radius:16px;padding:32px">
<h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;color:${COLORS.navy}">${escapeHtml(title)}</h1>
${p}
${cta ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px"><tr><td style="border-radius:10px;background:${COLORS.electric}"><a href="${url}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px">${escapeHtml(cta.label)}</a></td></tr></table>
<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:${COLORS.muted}">Le bouton ne fonctionne pas ? Copiez ce lien : <a href="${url}" style="color:${COLORS.electric};word-break:break-all">${url}</a></p>` : ""}
${note ? `<p style="margin:20px 0 0;padding-top:16px;border-top:1px solid ${COLORS.line};font-size:13px;line-height:1.5;color:${COLORS.muted}">${escapeHtml(note)}</p>` : ""}
</td></tr>
<tr><td style="padding:20px 8px;font-size:12px;line-height:1.5;color:${COLORS.muted}">Kairo · Le bon job, au bon moment.<br>Vous recevez cet e-mail car vous avez un compte Kairo. Gérez vos informations depuis votre espace.</td></tr>
</table></td></tr></table></body></html>`;
}

function text(title: string, paragraphs: string[], cta?: { label: string; url: string }, note?: string) {
  return [title, "", ...paragraphs, ...(cta ? ["", `${cta.label} : ${cta.url}`] : []), ...(note ? ["", note] : []), "", "— Kairo · Le bon job, au bon moment."].join("\n");
}

function build(subject: string, input: LayoutInput): Email {
  return { subject, html: layout(input), text: text(input.title, input.paragraphs, input.cta, input.note) };
}

const STATUS_TEXT: Record<string, { label: string; sentence: string }> = {
  sent: { label: "Envoyée", sentence: "Votre candidature a bien été transmise." },
  reviewing: { label: "En cours d'examen", sentence: "Le recruteur étudie actuellement votre profil." },
  interview: { label: "Entretien", sentence: "Bonne nouvelle : le recruteur souhaite vous rencontrer. Il vous contactera pour fixer un rendez-vous." },
  accepted: { label: "Acceptée", sentence: "Félicitations ! Votre candidature a été retenue." },
  rejected: { label: "Refusée", sentence: "Le recruteur n'a pas retenu votre candidature cette fois-ci. D'autres offres vous attendent." },
};

export const templates = {
  applicationConfirmation: (d: { candidateName: string; offerTitle: string; companyName: string; url: string }) =>
    build(`Candidature envoyée : ${d.offerTitle}`, {
      preheader: `Votre candidature chez ${d.companyName} a bien été transmise.`,
      title: "Votre candidature est envoyée",
      paragraphs: [`Bonjour ${d.candidateName},`, `Votre candidature au poste « ${d.offerTitle} » chez ${d.companyName} a bien été transmise au recruteur, avec votre profil et votre CV.`, "Vous serez prévenu·e par e-mail à chaque étape."],
      cta: { label: "Suivre ma candidature", url: d.url },
    }),

  applicationReceived: (d: { recruiterName: string; candidateName: string; offerTitle: string; url: string }) =>
    build(`Nouvelle candidature : ${d.offerTitle}`, {
      preheader: `${d.candidateName} a postulé à votre offre.`,
      title: "Nouvelle candidature",
      paragraphs: [`Bonjour ${d.recruiterName},`, `${d.candidateName} a postulé à votre offre « ${d.offerTitle} ».`, "Consultez son profil, ses disponibilités et son CV depuis votre espace recruteur."],
      cta: { label: "Voir la candidature", url: d.url },
      note: "Pensez à mettre à jour le statut : le candidat est informé automatiquement.",
    }),

  applicationStatus: (d: { candidateName: string; offerTitle: string; companyName: string; status: string; url: string }) => {
    const s = STATUS_TEXT[d.status] ?? STATUS_TEXT.sent!;
    return build(`Candidature « ${d.offerTitle} » : ${s.label}`, {
      preheader: s.sentence,
      title: `Candidature : ${s.label}`,
      paragraphs: [`Bonjour ${d.candidateName},`, `Votre candidature au poste « ${d.offerTitle} » chez ${d.companyName} est passée au statut « ${s.label} ».`, s.sentence],
      cta: { label: "Voir mes candidatures", url: d.url },
    });
  },

  subscriptionActivated: (d: { name: string; plan: string; limit: number; url: string }) =>
    build(`Votre abonnement ${d.plan} est actif`, {
      preheader: "Merci ! Vous pouvez publier vos offres.",
      title: `Abonnement ${d.plan} activé`,
      paragraphs: [`Bonjour ${d.name},`, `Merci pour votre confiance : votre formule ${d.plan} est active. Vous pouvez publier jusqu'à ${d.limit} annonces simultanément.`, "Votre facture est disponible depuis la page Abonnement, rubrique « Gérer mon abonnement »."],
      cta: { label: "Publier une offre", url: d.url },
    }),

  singleOfferPurchased: (d: { name: string; url: string }) =>
    build("Paiement confirmé : 1 annonce à l'unité", {
      preheader: "Votre crédit d'annonce est disponible.",
      title: "Votre annonce à l'unité est disponible",
      paragraphs: [`Bonjour ${d.name},`, "Votre paiement a bien été reçu. Vous pouvez publier une annonce supplémentaire, visible pendant 30 jours."],
      cta: { label: "Publier mon annonce", url: d.url },
    }),

  subscriptionRenewed: (d: { name: string; plan: string; amount: string; url: string }) =>
    build(`Abonnement ${d.plan} renouvelé`, {
      preheader: `Paiement de ${d.amount} reçu.`,
      title: "Votre abonnement est renouvelé",
      paragraphs: [`Bonjour ${d.name},`, `Le paiement de ${d.amount} pour votre formule ${d.plan} a bien été reçu. Merci !`],
      cta: { label: "Voir mon abonnement", url: d.url },
    }),

  paymentFailed: (d: { name: string; amount: string; url: string }) =>
    build("Action requise : échec du paiement de votre abonnement", {
      preheader: "Mettez à jour votre moyen de paiement pour conserver votre formule.",
      title: "Le paiement de votre abonnement a échoué",
      paragraphs: [`Bonjour ${d.name},`, `Nous n'avons pas pu prélever ${d.amount}. Stripe réessaiera automatiquement dans les prochains jours.`, "Pour éviter toute interruption, mettez à jour votre carte depuis la page Abonnement."],
      cta: { label: "Mettre à jour mon paiement", url: d.url },
      note: "Si vous avez déjà mis à jour votre moyen de paiement, vous pouvez ignorer ce message.",
    }),

  subscriptionEnded: (d: { name: string; url: string }) =>
    build("Votre abonnement Kairo a pris fin", {
      preheader: "Vos annonces en ligne restent visibles jusqu'à leur expiration.",
      title: "Votre abonnement a pris fin",
      paragraphs: [`Bonjour ${d.name},`, "Votre formule a pris fin. Vos annonces déjà en ligne restent visibles jusqu'à leur expiration.", "Vous pouvez reprendre un abonnement à tout moment."],
      cta: { label: "Voir les formules", url: d.url },
    }),

  /** Modèles pour Supabase Auth (collés dans Authentication → Emails), variable {{ .ConfirmationURL }}. */
  authConfirmSignup: () =>
    build("Confirmez votre adresse e-mail — Kairo", {
      preheader: "Un clic pour activer votre compte Kairo.",
      title: "Bienvenue sur Kairo",
      paragraphs: ["Pour activer votre compte, confirmez votre adresse e-mail. Le lien est valable 24 heures."],
      cta: { label: "Confirmer mon adresse", url: "{{ .ConfirmationURL }}" },
      note: "Si vous n'êtes pas à l'origine de cette inscription, ignorez ce message : aucun compte ne sera activé.",
      rawUrl: true,
    }),

  authResetPassword: () =>
    build("Réinitialisation de votre mot de passe — Kairo", {
      preheader: "Choisissez un nouveau mot de passe.",
      title: "Mot de passe oublié ?",
      paragraphs: ["Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Le lien est valable 1 heure."],
      cta: { label: "Choisir un nouveau mot de passe", url: "{{ .ConfirmationURL }}" },
      note: "Si vous n'avez rien demandé, ignorez ce message : votre mot de passe reste inchangé.",
      rawUrl: true,
    }),
};
