export const dynamic = "force-dynamic";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type SupabaseAdminUser = {
  email?: string;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.trim();

  if (!email) {
    return new Response("Missing email.", { status: 400 });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return new Response("Missing Supabase configuration.", { status: 500 });
  }

  const lookupResponse = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`,
    {
      method: "GET",
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    }
  );

  if (!lookupResponse.ok) {
    const errorText = await lookupResponse.text();
    return new Response(errorText, { status: lookupResponse.status });
  }

  const payload = (await lookupResponse.json()) as {
    users?: SupabaseAdminUser[];
  };

  const user = payload.users?.find(
    (candidate) => candidate.email?.toLowerCase() === email.toLowerCase()
  );

  const confirmedAt = user?.email_confirmed_at ?? user?.confirmed_at ?? null;

  return new Response(
    JSON.stringify({
      exists: Boolean(user),
      confirmed: Boolean(confirmedAt),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

