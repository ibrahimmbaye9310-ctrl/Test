import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/server";
import { handleStripeEvent } from "@/lib/billing/webhook";

/**
 * Webhook Stripe. La signature (STRIPE_WEBHOOK_SECRET) est vérifiée sur le corps brut :
 * un appel qui ne vient pas de Stripe est rejeté avant toute écriture.
 */
/** Le traitement peut appeler Stripe et la base : marge de 30 s (Vercel). */
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    const result = await handleStripeEvent(event);
    return NextResponse.json({ received: true, result });
  } catch (e) {
    console.error("[stripe:webhook]", event.type, event.id, e instanceof Error ? e.message : e);
    // 500 : Stripe renverra l'événement plus tard (jusqu'à 3 jours).
    return NextResponse.json({ error: "Traitement impossible" }, { status: 500 });
  }
}
