import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "./auth";
import { hasAdminEmail } from "../access/admin";

export const requireAdmin = async (request: Request) => {
  const authHeader = request.headers.get("authorization");
  const user = await getUserFromAuthHeader(authHeader);
  if (!user) {
    return { user: null, response: new NextResponse("Unauthorized.", { status: 401 }) };
  }
  if (!hasAdminEmail(user.email)) {
    return { user: null, response: new NextResponse("Forbidden.", { status: 403 }) };
  }
  return { user, response: null };
};
