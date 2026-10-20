// Quote form disabled due to spam. Restore from git history to re-enable.
export async function POST() {
  return new Response("The online quote form is no longer available. Please email ask@hses.com.au.", {
    status: 410,
  });
}
