import { prisma } from "./db";
import type { StaffUser } from "./session";

export type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "LOGOUT" | "CONFIRM" | "AI";

/** Every create/update in the HMS writes one row: who, what, when. */
export async function audit(
  user: Pick<StaffUser, "id" | "name" | "role"> | null,
  action: AuditAction,
  entity: string,
  entityId: string | null,
  summary: string,
) {
  await prisma.auditLog.create({
    data: {
      userId: user?.id ?? null,
      userName: user?.name ?? "system",
      role: user?.role ?? null,
      action,
      entity,
      entityId,
      summary: summary.slice(0, 500),
    },
  });
}
