import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    payloadObject = {
      ...session,
      customer_email: email,
    };

    const userResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        email_confirm: true,
      }),
    });

    if (!userResponse.ok && userResponse.status !== 422) {
      const userError = await userResponse.text();
      console.error("Supabase user create failed:", userError);
      return new Response(userError, { status: 500 });
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
