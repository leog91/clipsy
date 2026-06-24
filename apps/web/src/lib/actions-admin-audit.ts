"use server";

import { getDb, eq, count, desc, like, or } from "@clipsy/db";
import { auditLogs, user } from "@clipsy/db/schema";
import { requireAdmin } from "@/lib/admin";

export async function logAdminAction({
  action,
  targetType,
  targetId,
  details,
}: {
  action: string;
  targetType: string;
  targetId: string;
  details?: string;
}) {
  const adminSession = await requireAdmin();

  const db = getDb();

  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    adminId: adminSession.user.id,
    action,
    targetType,
    targetId,
    details: details ?? null,
    createdAt: new Date(),
  });
}

export async function listAuditLogs({
  page = 1,
  search = "",
}: {
  page?: number;
  search?: string;
} = {}) {
  await requireAdmin();

  const db = getDb();
  const limit = 50;
  const offset = (page - 1) * limit;

  const searchCond = search
    ? or(
        like(auditLogs.action, `%${search}%`),
        like(auditLogs.targetType, `%${search}%`),
        like(auditLogs.targetId, `%${search}%`),
        like(auditLogs.details, `%${search}%`),
      )
    : undefined;

  const baseQuery = db
    .select({
      id: auditLogs.id,
      adminId: auditLogs.adminId,
      action: auditLogs.action,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      details: auditLogs.details,
      createdAt: auditLogs.createdAt,
      adminName: user.name,
      adminEmail: user.email,
    })
    .from(auditLogs)
    .innerJoin(user, eq(auditLogs.adminId, user.id));

  const baseCount = db.select({ count: count() }).from(auditLogs);

  const query = searchCond ? baseQuery.where(searchCond) : baseQuery;
  const countQuery = searchCond ? baseCount.where(searchCond) : baseCount;

  const [logs, totalResult] = await Promise.all([
    query.orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset),
    countQuery,
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
