import { NextResponse } from "next/server";

// Contact form disabled due to spam. Restore from git history to re-enable.
export async function POST() {
  return new NextResponse("The contact form is no longer available. Please email ask@hses.com.au.", {
    status: 410,
  });
}
