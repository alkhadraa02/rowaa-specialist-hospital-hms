import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { fmtDateTime } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "سجل التدقيق" };

export default async function AuditPage() {
  const auth = await authorize("audit.read");
  if ("error" in auth) redirect(auth.error === "unauthenticated" ? "/hms/login" : "/hms");
  const { lang, t } = await getT();
  const rows = await prisma.auditLog.findMany({ orderBy: { at: "desc" }, take: 200 });
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">{t("سجل التدقيق", "Audit log")}</h1>
      <p className="hint">{t("آخر 200 عملية: من فعل ماذا ومتى.", "Latest 200 actions: who did what, and when.")}</p>
      {rows.length === 0 ? (
        <p className="alert alert-info">{t("لا توجد سجلات بعد.", "No entries yet.")}</p>
      ) : (
        <div className="table-wrap">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th scope="col" className="p-2 text-start">{t("الوقت", "Time")}</th>
                <th scope="col" className="p-2 text-start">{t("المستخدم", "User")}</th>
                <th scope="col" className="p-2 text-start">{t("الإجراء", "Action")}</th>
                <th scope="col" className="p-2 text-start">{t("الكيان", "Entity")}</th>
                <th scope="col" className="p-2 text-start">{t("الملخص", "Summary")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-line align-top">
                  <td className="whitespace-nowrap p-2">{fmtDateTime(r.at, lang)}</td>
                  <td className="p-2">{r.userName}{r.role ? ` (${r.role})` : ""}</td>
                  <td className="p-2"><span className="badge badge-info">{r.action}</span></td>
                  <td className="p-2">{r.entity}</td>
                  <td className="p-2">{r.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
