import Stripe from "stripe";

export const dynamic = "force-dynamic";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const setupPriceId = process.env.STRIPE_SETUP_PRICE_ID;
const codesPriceId = process.env.STRIPE_CODES_PRICE_ID;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

export async function POST(request: Request) {
  if (!stripeSecretKey || !setupPriceId || !codesPriceId || !siteUrl) {
    return new Response(
      JSON.stringify({ error: "Missing Stripe configuration." }),
      { status: 500 }
    );
  }

  let quantity = 1;
  try {
    const body = (await request.json()) as { quantity?: number };
    if (body.quantity && Number.isFinite(body.quantity)) {
      quantity = Math.max(1, Math.min(500, Math.floor(body.quantity)));
    }
  } catch {
    quantity = 1;
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2023-10-16",
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    ui_mode: "embedded",
    allow_promotion_codes: true,
    return_url: `${siteUrl}/sms-diagnostic/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    line_items: [
      {
        price: setupPriceId,
        quantity: 1,
      },
      {
        price: codesPriceId,
        quantity,
        adjustable_quantity: {
          enabled: true,
          minimum: 1,
        },
      },
    ],
  });

  return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });
}
