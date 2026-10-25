import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const credential = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const randomCredential = () => randomBytes(32).toString("base64url");
export const credentialHash = (value: string) =>
  createHash("sha256").update(value).digest("base64url");

export function appOrigin(value: string | undefined) {
  const url = new URL(value ?? "");
  const local =
    process.env.NODE_ENV !== "production" &&
    url.protocol === "http:" &&
    ["localhost", "127.0.0.1"].includes(url.hostname);
  if (
    (!local && url.protocol !== "https:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Invalid app origin");
  return url.origin;
}
export function authorizationParams(
  input: Record<string, unknown>,
  shelfyUrl: string | undefined,
) {
  const value = z
    .object({
      redirect_uri: z.string(),
      state: credential,
      code_challenge: credential,
    })
    .strict()
    .parse(input);
  if (value.redirect_uri !== `${appOrigin(shelfyUrl)}/api/clipsy/callback`)
    throw new Error("Untrusted callback");
  return value;
}
export function integrationJson(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store",
      Vary: "Authorization, Cookie",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
export function integrationRedirect(url: string) {
  return new Response(null, {
    status: 303,
    headers: {
      Location: url,
      "Cache-Control": "private, no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
async function boundedText(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const decoder = new TextDecoder();
  let bytes = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8192) throw new Error("Body too large");
      text += decoder.decode(value, { stream: true });
    }
    return text + decoder.decode();
  } finally {
    await reader.cancel();
  }
}
export async function integrationBody(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    throw new Error("JSON required");
  return JSON.parse(await boundedText(request)) as unknown;
}
export async function integrationForm(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.startsWith("application/x-www-form-urlencoded")
  )
    throw new Error("Form required");
  return new URLSearchParams(await boundedText(request));
}
