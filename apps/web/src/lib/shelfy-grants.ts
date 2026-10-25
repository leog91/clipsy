import { and, eq, gt, isNull, type Database } from "@clipsy/db";
import { summaryCode, summaryAccess, user } from "@clipsy/db/schema";
import {
  credential,
  credentialHash,
  randomCredential,
} from "./shelfy-protocol";

export class ShelfyGrants {
  constructor(private db: Database) {}

  async activeUser(owner: string) {
    const [account] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.id, owner), isNull(user.deletedAt)))
      .limit(1);
    return Boolean(account);
  }
  async approve(owner: string, redirectUri: string, challenge: string) {
    if (!(await this.activeUser(owner))) throw new Error("Unauthorized");
    const code = randomCredential();
    await this.db
      .insert(summaryCode)
      .values({
        codeHash: credentialHash(code),
        userId: owner,
        redirectUri,
        challenge,
        expiresAt: Date.now() + 5 * 60_000,
      });
    return code;
  }
  async exchange(code: string, verifier: string, redirectUri: string) {
    credential.parse(code);
    credential.parse(verifier);
    return this.db.transaction(async (tx) => {
      const [grant] = await tx
        .delete(summaryCode)
        .where(
          and(
            eq(summaryCode.codeHash, credentialHash(code)),
            eq(summaryCode.challenge, credentialHash(verifier)),
            eq(summaryCode.redirectUri, redirectUri),
            gt(summaryCode.expiresAt, Date.now()),
          ),
        )
        .returning();
      if (!grant) throw new Error("Invalid code");
      const [account] = await tx
        .select({ id: user.id })
        .from(user)
        .where(and(eq(user.id, grant.userId), isNull(user.deletedAt)))
        .limit(1);
      if (!account) throw new Error("Unauthorized");
      const token = randomCredential();
      const expiresAt = Date.now() + 90 * 86400_000;
      await tx
        .insert(summaryAccess)
        .values({
          id: crypto.randomUUID(),
          tokenHash: credentialHash(token),
          userId: grant.userId,
          clientOrigin: new URL(redirectUri).origin,
          createdAt: Date.now(),
          expiresAt,
        });
      return { token, expiresAt };
    });
  }
  async owner(authorization: string | null) {
    const token = this.bearer(authorization);
    if (!token) return null;
    const [grant] = await this.db
      .select({ userId: summaryAccess.userId })
      .from(summaryAccess)
      .innerJoin(user, eq(summaryAccess.userId, user.id))
      .where(
        and(
          eq(summaryAccess.tokenHash, credentialHash(token)),
          gt(summaryAccess.expiresAt, Date.now()),
          isNull(user.deletedAt),
        ),
      )
      .limit(1);
    return grant?.userId ?? null;
  }
  bearer(authorization: string | null) {
    if (!authorization?.startsWith("Bearer ")) return null;
    const parsed = credential.safeParse(authorization.slice(7));
    return parsed.success ? parsed.data : null;
  }
  async revokeToken(authorization: string | null) {
    const token = this.bearer(authorization);
    if (!token) throw new Error("Unauthorized");
    // Idempotent, including already-revoked and expired credentials.
    await this.db
      .delete(summaryAccess)
      .where(eq(summaryAccess.tokenHash, credentialHash(token)));
  }
  async list(owner: string) {
    if (!(await this.activeUser(owner))) throw new Error("Unauthorized");
    return this.db
      .select({
        id: summaryAccess.id,
        clientOrigin: summaryAccess.clientOrigin,
        expiresAt: summaryAccess.expiresAt,
      })
      .from(summaryAccess)
      .where(eq(summaryAccess.userId, owner));
  }
  async disconnect(owner: string, id: string) {
    if (!(await this.activeUser(owner))) throw new Error("Unauthorized");
    await this.db
      .delete(summaryAccess)
      .where(and(eq(summaryAccess.userId, owner), eq(summaryAccess.id, id)));
  }
}
