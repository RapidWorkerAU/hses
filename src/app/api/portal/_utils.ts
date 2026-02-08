const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const getSupabaseConfig = () => ({
  supabaseUrl,
  supabaseServiceRoleKey,
  supabaseAnonKey,
});

export const getUserIdFromToken = async (token: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration.");
  }

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Invalid session.");
  }

  const payload = (await response.json()) as { id?: string };
  if (!payload.id) {
    throw new Error("Missing user id.");
  }

  return payload.id;
};

export const getAccountIdsForUser = async (userId: string) => {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase configuration.");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/account_users?select=account_id&user_id=eq.${userId}`,
    {
      headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to load account mapping.");
  }

  const rows = (await response.json()) as Array<{ account_id: string }>;
  const isUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );

  return rows
    .map((row) => row.account_id)
    .filter((value): value is string => Boolean(value && value !== "undefined" && isUuid(value)));
};

