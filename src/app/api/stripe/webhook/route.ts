import Stripe from "stripe";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const codesPriceId = process.env.STRIPE_CODES_PRICE_ID;

export async function POST(request: Request) {
  if (!stripeSecretKey || !webhookSecret) {
    return new Response("Missing Stripe webhook configuration.", { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing Stripe signature.", { status: 400 });
  }

  const body = await request.text();
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Invalid webhook signature.";
    return new Response(message, { status: 400 });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  let payloadObject =
    event.type === "checkout.session.completed" ? event.data.object : event;

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const email =
      session.customer_email ?? session.customer_details?.email ?? null;

    if (!email) {
      return new Response("Missing customer email.", { status: 400 });
    }

    let participantCount = 0;
    if (codesPriceId) {
      const lineItems = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 100 }
      );
      const codesItem = lineItems.data.find(
        (item) => item.price?.id === codesPriceId
      );
      participantCount = codesItem?.quantity ?? 0;
    }

    payloadObject = {
      ...session,
      customer_email: email,
      metadata: {
        ...(session.metadata ?? {}),
        participant_count: String(participantCount),
      },
    };

    const headers = {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
    };

    const userCreateResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          password: randomUUID().replace(/-/g, "").slice(0, 16),
          email_confirm: true,
        }),
      }
    );

    if (!userCreateResponse.ok && userCreateResponse.status !== 422) {
      const userError = await userCreateResponse.text();
      console.error("Supabase user create failed:", userError);
      return new Response(userError, { status: 500 });
    }

    const userLookupResponse = await fetch(
      `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          apikey: supabaseServiceRoleKey,
          Authorization: `Bearer ${supabaseServiceRoleKey}`,
        },
      }
    );

    if (!userLookupResponse.ok) {
      const lookupError = await userLookupResponse.text();
      console.error("Supabase user lookup failed:", lookupError);
      return new Response(lookupError, { status: 500 });
    }

    const lookupData = (await userLookupResponse.json()) as {
      users?: Array<{ email?: string }>;
    };

    const userFound = lookupData.users?.some((user) => user.email === email);
    if (!userFound) {
      return new Response("Auth user still missing after create.", {
        status: 500,
      });
    }
  }

  const payload = {
    stripe_event_id: event.id,
    event_type: event.type,
    payload: payloadObject,
  };

  const insertResponse = await fetch(`${supabaseUrl}/rest/v1/stripe_events`, {
    method: "POST",
    headers: {
      apikey: supabaseServiceRoleKey,
      Authorization: `Bearer ${supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });

  if (!insertResponse.ok && insertResponse.status !== 409) {
    const errorText = await insertResponse.text();
    console.error("Supabase insert failed:", insertResponse.status, errorText);
    return new Response(errorText, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
