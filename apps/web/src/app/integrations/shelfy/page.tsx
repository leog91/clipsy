import type { Metadata } from "next";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { authorizationParams } from "@/lib/shelfy-protocol";
import { IntegrationSignIn } from "@/components/integration-sign-in";

export const metadata: Metadata = {
  title: "Connect Shelfy · Clipsy",
  // Preserve Origin on same-origin consent POSTs; no-referrer makes it "null".
  // Cross-origin navigation still receives no referrer details.
  referrer: "same-origin",
  robots: { index: false, follow: false },
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let params;
  try {
    params = authorizationParams(await searchParams, process.env.SHELFY_URL);
  } catch {
    return (
      <main className="max-w-lg mx-auto p-6">
        <h1 className="text-xl">Cannot connect Shelfy</h1>
        <p>
          This request is invalid or the trusted Shelfy URL is not configured.
          Start again from Shelfy’s Account screen.
        </p>
      </main>
    );
  }
  const session = await auth.api.getSession({ headers: await headers() });
  return (
    <main className="max-w-lg mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Connect Shelfy</h1>
      {!session ? (
        <IntegrationSignIn />
      ) : (
        <>
          <p>
            Signed in to Clipsy as <strong>{session.user.email}</strong>.
          </p>
          <p>
            Allow <strong>{new URL(params.redirect_uri).origin}</strong> to read
            your video, collection and subscription counts?
          </p>
          <p>
            No video titles, URLs, passwords or editing access will be shared.
            Access expires after 90 days. You can disconnect in either app.
          </p>
          <form
            method="post"
            action="/api/integrations/shelfy/approve"
            className="flex gap-3"
          >
            {Object.entries(params).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <button
              name="decision"
              value="approve"
              className="min-h-11 rounded bg-blue-600 px-4"
            >
              Allow counts access
            </button>
            <button
              name="decision"
              value="deny"
              className="min-h-11 rounded border px-4"
            >
              Cancel
            </button>
          </form>
        </>
      )}
    </main>
  );
}
