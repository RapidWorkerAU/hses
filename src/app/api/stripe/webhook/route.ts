import Stripe from "stripe";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const codesPriceId = process.env.STRIPE_CODES_PRICE_ID;
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

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

  if (!supabaseUrl || !supabaseServiceRoleKey || !siteUrl) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  if (!resendApiKey || !resendFromEmail) {
    return new Response("Missing Resend configuration.", { status: 500 });
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
      const inviteResponse = await fetch(
        `${supabaseUrl}/auth/v1/admin/generate_link`,
        {
          method: "POST",
          headers: {
            apikey: supabaseServiceRoleKey,
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "invite",
            email,
            redirect_to: `${siteUrl}/auth/set-password`,
          }),
        }
      );

      if (!inviteResponse.ok) {
        const inviteError = await inviteResponse.text();
        console.error("Supabase invite link failed:", inviteError);
        return new Response(inviteError, { status: 500 });
      }

      const invitePayload = (await inviteResponse.json()) as {
        action_link?: string;
      };

      if (!invitePayload.action_link) {
        return new Response("Invite link missing.", { status: 500 });
      }

      const resend = new Resend(resendApiKey);
      const sendInvite = await resend.emails.send({
        from: resendFromEmail,
        to: email,
        subject: "Your diagnostic purchase is confirmed",
        text: `Thanks for your purchase.\n\nSet your password to access your diagnostic dashboard:\n${invitePayload.action_link}\n\nIf you need help, reply to this email.`,
      });

      if (sendInvite.error) {
        console.error("Resend invite email failed:", sendInvite.error);
        return new Response("Invite email failed.", { status: 500 });
      }
    } else {
      const magicLinkResponse = await fetch(
        `${supabaseUrl}/auth/v1/admin/generate_link`,
        {
          method: "POST",
          headers: {
            apikey: supabaseServiceRoleKey,
            Authorization: `Bearer ${supabaseServiceRoleKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: "magiclink",
            email,
            redirect_to: `${siteUrl}/sms-diagnostic/dashboard`,
          }),
        }
      );

      if (!magicLinkResponse.ok) {
        const magicError = await magicLinkResponse.text();
        console.error("Supabase magic link failed:", magicError);
        return new Response(magicError, { status: 500 });
      }

      const magicPayload = (await magicLinkResponse.json()) as {
        action_link?: string;
      };

      if (!magicPayload.action_link) {
        return new Response("Magic link missing.", { status: 500 });
      }

      const resend = new Resend(resendApiKey);
      const sendMagic = await resend.emails.send({
        from: resendFromEmail,
        to: email,
        subject: "Your diagnostic purchase is confirmed",
        text: `Thanks for your purchase.\n\nLog in to your diagnostic dashboard:\n${magicPayload.action_link}\n\nIf you need help, reply to this email.`,
      });

      if (sendMagic.error) {
        console.error("Resend magic link failed:", sendMagic.error);
        return new Response("Login email failed.", { status: 500 });
      }
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
