import { createAnonServerClient } from "./server";

export type AdminAuthResult = {
  userId: string;
  email: string;
};

export const getUserFromAuthHeader = async (authHeader?: string | null) => {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  if (!token) return null;

  const supabase = createAnonServerClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return { userId: data.user.id, email: data.user.email ?? "" };
};
