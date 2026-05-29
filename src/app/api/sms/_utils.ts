import { getUserFromToken } from "@/app/api/portal/_utils";
import { createServiceRoleClient } from "@/lib/supabase/server";

export type SmsAuthResult =
  | {
      ok: true;
      user: {
        id: string;
        email: string;
      };
      supabase: ReturnType<typeof createServiceRoleClient>;
    }
  | {
      ok: false;
      response: Response;
    };

export const getSmsAuth = async (request: Request): Promise<SmsAuthResult> => {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "").trim();

  if (!token) {
    return { ok: false, response: Response.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  try {
    const user = await getUserFromToken(token);
    return {
      ok: true,
      user,
      supabase: createServiceRoleClient(),
    };
  } catch {
    return { ok: false, response: Response.json({ error: "Unauthorized." }, { status: 401 }) };
  }
};

export const getOwnedSmsMap = async (
  supabase: ReturnType<typeof createServiceRoleClient>,
  mapId: string,
  userId: string
) => {
  const { data, error } = await supabase
    .schema("sms")
    .from("maps")
    .select("id,user_id,name,description,status,canvas_generated,created_at,updated_at")
    .eq("id", mapId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Unable to load system map.");
  }

  return data;
};

export const sanitizeText = (value: unknown, maxLength: number) => {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!text) return "";
  return text.length > maxLength ? text.slice(0, maxLength).trimEnd() : text;
};
