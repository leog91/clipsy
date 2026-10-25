import { z } from "zod";
import { getDb } from "@clipsy/db";
import { auth } from "@/lib/auth";
import { ShelfyGrants } from "@/lib/shelfy-grants";
import {
  appOrigin,
  authorizationParams,
  credential,
  integrationBody,
  integrationForm,
  integrationJson as json,
  integrationRedirect,
} from "@/lib/shelfy-protocol";

type Context = { params: Promise<{ action: string }> };
export async function GET(request: Request, context: Context) {
  if ((await context.params).action !== "connections")
    return json({ error: "Not found" }, 404);
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return json({ error: "Unauthorized" }, 401);
    return json({
      connections: await new ShelfyGrants(getDb()).list(session.user.id),
    });
  } catch {
    return json({ error: "Connections unavailable" }, 503);
  }
}
export async function POST(request: Request, context: Context) {
  const { action } = await context.params;
  try {
    const grants = new ShelfyGrants(getDb());
    if (action === "token") {
      const body = z
        .object({
          code: credential,
          verifier: credential,
          redirect_uri: z.string(),
        })
        .strict()
        .parse(await integrationBody(request));
      if (
        body.redirect_uri !==
        `${appOrigin(process.env.SHELFY_URL)}/api/clipsy/callback`
      )
        return json({ error: "Invalid grant" }, 400);
      return json(
        await grants.exchange(body.code, body.verifier, body.redirect_uri),
      );
    }
    if (action === "revoke") {
      await grants.revokeToken(request.headers.get("authorization"));
      return json({ revoked: true });
    }
    if (!["approve", "disconnect"].includes(action))
      return json({ error: "Not found" }, 404);
    if (
      request.headers.get("origin") !== appOrigin(process.env.BETTER_AUTH_URL)
    )
      return json({ error: "Invalid origin" }, 403);
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return json({ error: "Unauthorized" }, 401);
    if (action === "disconnect") {
      const { id } = z
        .object({ id: z.string().uuid() })
        .strict()
        .parse(await integrationBody(request));
      await grants.disconnect(session.user.id, id);
      return json({ disconnected: true });
    }
    if (Number(request.headers.get("content-length")) > 8192)
      return json({ error: "Request too large" }, 413);
    const form = await integrationForm(request);
    const params = authorizationParams(
      {
        redirect_uri: form.get("redirect_uri"),
        state: form.get("state"),
        code_challenge: form.get("code_challenge"),
      },
      process.env.SHELFY_URL,
    );
    const url = new URL(params.redirect_uri);
    url.searchParams.set("state", params.state);
    if (form.get("decision") === "approve") {
      url.searchParams.set(
        "code",
        await grants.approve(
          session.user.id,
          params.redirect_uri,
          params.code_challenge,
        ),
      );
    } else {
      url.searchParams.set("error", "access_denied");
    }
    return integrationRedirect(url.href);
  } catch {
    return json(
      {
        error: "Connection request failed or expired. Start again from Shelfy.",
      },
      400,
    );
  }
}
