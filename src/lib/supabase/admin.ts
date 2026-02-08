import { NextResponse } from "next/server";
import { getUserFromAuthHeader } from "./auth";

export const requireAdmin = async (request: Request) => {
  const authHeader = request.headers.get("authorization");
  const user = await getUserFromAuthHeader(authHeader);
  if (!user) {
    return { user: null, response: new NextResponse("Unauthorized.", { status: 401 }) };
  }
  return { user, response: null };
};
