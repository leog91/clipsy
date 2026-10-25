import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, rmSync } from "node:fs";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq } from "drizzle-orm";
import * as schema from "./schema/index";
import { ShelfyGrants } from "../../../apps/web/src/lib/shelfy-grants";
import {
  authorizationParams,
  credentialHash,
  randomCredential,
} from "../../../apps/web/src/lib/shelfy-protocol";

test("authorization trusts only an exact registered callback", () => {
  const params = {
    redirect_uri: "https://shelfy.example/api/clipsy/callback",
    state: randomCredential(),
    code_challenge: randomCredential(),
  };
  assert.deepEqual(
    authorizationParams(params, "https://shelfy.example"),
    params,
  );
  for (const redirect_uri of [
    "https://evil.example/api/clipsy/callback",
    "https://shelfy.example/api/clipsy/callback?evil=1",
    "https://shelfy.example/api/clipsy/callback/",
    "https://shelfy.example.evil.example/api/clipsy/callback",
  ]) {
    assert.throws(() =>
      authorizationParams(
        { ...params, redirect_uri },
        "https://shelfy.example",
      ),
    );
  }
});

test("one-use PKCE grants, ownership, expiry and revocation use isolated SQLite", async () => {
  const filename = `/tmp/opencode/clipsy-grants-${crypto.randomUUID()}.db`;
  const client = createClient({ url: `file:${filename}` });
  const db = drizzle(client, { schema });
  const grants = new ShelfyGrants(db);
  try {
    await client.executeMultiple(
      "CREATE TABLE user (id TEXT PRIMARY KEY, deleted_at INTEGER); INSERT INTO user VALUES ('alice', NULL), ('bob', NULL), ('deleted', 1);",
    );
    const migration = readFileSync(
      new URL(
        "../drizzle-integrations/0000_abnormal_maddog.sql",
        import.meta.url,
      ),
      "utf8",
    );
    await client.executeMultiple(
      migration.replaceAll("--> statement-breakpoint", ""),
    );
    const redirect = "https://shelfy.example/api/clipsy/callback";
    const verifier = randomCredential();
    const code = await grants.approve(
      "alice",
      redirect,
      credentialHash(verifier),
    );
    assert.notEqual(
      (await db.select().from(schema.summaryCode))[0].codeHash,
      code,
    );
    await assert.rejects(() =>
      grants.exchange(code, randomCredential(), redirect),
    );
    await assert.rejects(() =>
      grants.exchange(code, verifier, "https://evil.example/callback"),
    );
    const grant = await grants.exchange(code, verifier, redirect);
    await assert.rejects(() => grants.exchange(code, verifier, redirect));
    assert.equal(await grants.owner(`Bearer ${grant.token}`), "alice");
    assert.equal(await grants.owner(null), null);
    assert.equal(await grants.owner(`Bearer ${randomCredential()}`), null);
    const [access] = await db.select().from(schema.summaryAccess);
    assert.notEqual(access.tokenHash, grant.token);
    assert.deepEqual(await grants.list("bob"), []);
    await grants.disconnect("bob", access.id);
    assert.equal(await grants.owner(`Bearer ${grant.token}`), "alice");
    await grants.disconnect("alice", access.id);
    assert.equal(await grants.owner(`Bearer ${grant.token}`), null);
    await grants.revokeToken(`Bearer ${grant.token}`); // repeated revoke is safe
    const expired = await grants.approve(
      "alice",
      redirect,
      credentialHash(verifier),
    );
    await db.update(schema.summaryCode).set({ expiresAt: Date.now() - 1 });
    await assert.rejects(() => grants.exchange(expired, verifier, redirect));
    await assert.rejects(() =>
      grants.approve("deleted", redirect, credentialHash(verifier)),
    );
    const next = await grants.exchange(
      await grants.approve("alice", redirect, credentialHash(verifier)),
      verifier,
      redirect,
    );
    await db
      .update(schema.user)
      .set({ deletedAt: new Date() })
      .where(eq(schema.user.id, "alice"));
    assert.equal(await grants.owner(`Bearer ${next.token}`), null);
  } finally {
    client.close();
    for (const suffix of ["", "-wal", "-shm"])
      rmSync(filename + suffix, { force: true });
  }
});
