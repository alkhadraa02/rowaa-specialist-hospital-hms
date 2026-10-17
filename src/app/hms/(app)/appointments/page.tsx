import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getT, pick } from "@/lib/i18n";
import { authorize } from "@/lib/session";
import { can } from "@/lib/rbac";
import { addDays, dayKey, fmtDate, fmtTime, parseDayKey, startOfDay } from "@/lib/time";
import { checkInAppointment, setAppointmentStatus, startVisit } from "@/app/actions/appointments";

export const dynamic = "force-dynamic";
export const metadata = { title: "المواعيد وطابور العيادات" };

type Props = { searchParams: Promise<{ day?: string; error?: string }> };

export default async function AppointmentsPage({ searchParams }: Props) {
  const auth = await authorize("appointments.manage");
  if ("error" in auth) redirect("/hms/login");
  const sp = await searchParams;
  const { lang, t } = await getT();
  const day = startOfDay(parseDayKey(sp.day) ?? new Date());
  const items = await prisma.appointment.findMany({
    where: { start: { gte: day, lt: addDays(day, 1) }, ...(auth.user.doctorId ? { doctorId: auth.user.doctorId } : {}) },
    include: { doctor: true, specialty: true, branch: true },
    orderBy: { start: "asc" },
  });
  const queue = items.filter((a) => a.status === "CHECKED_IN").sort((a, b) => (a.queueNo ?? 0) - (b.queueNo ?? 0));
  const statusLabel: Record<string, string> = {
    BOOKED: t("محجوز", "Booked"), CHECKED_IN: t("في الانتظار", "Checked in"), COMPLETED: t("مكتمل", "Completed"), CANCELLED: t("ملغى", "Cancelled"), NO_SHOW: t("لم يحضر", "No-show"),
  };
  const statusClass: Record<string, string> = { BOOKED: "badge-info", CHECKED_IN: "badge-warn", COMPLETED: "badge-ok", CANCELLED: "badge-danger", NO_SHOW: "badge-danger" };
  const canVisit = can(auth.user.role, "emr.write");

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold">{t("المواعيد وطابور العيادات", "Appointments & outpatient queue")}</h1>
      <nav aria-label={t("التنقل بين الأيام", "Day navigation")} className="flex flex-wrap items-center gap-2">
        <Link className="btn btn-ghost btn-sm" href={`/hms/appointments?day=${dayKey(addDays(day, -1))}`}>{t("اليوم السابق", "Previous day")}</Link>
        <span className="badge badge-info">{fmtDate(day, lang)}</span>
        <Link className="btn btn-ghost btn-sm" href={`/hms/appointments?day=${dayKey(addDays(day, 1))}`}>{t("اليوم التالي", "Next day")}</Link>
        <Link className="btn btn-outline btn-sm" href="/hms/appointments">{t("اليوم", "Today")}</Link>
      </nav>
      {sp.error ? <p role="alert" className="alert alert-danger">{t("هذا الموعد غير مرتبط بملف مريض؛ سجّل المريض أولاً.", "This booking is not linked to a patient record; register the patient first.")}</p> : null}

      <section aria-labelledby="q-h" className="card">
        <h2 id="q-h" className="text-lg font-bold">{t("طابور الانتظار", "Waiting queue")} ({queue.length})</h2>
        {queue.length === 0 ? <p className="hint mt-2">{t("لا أحد في الانتظار.", "Nobody is waiting.")}</p> : (
          <ol className="mt-3 grid gap-2">
            {queue.map((a) => (
              <li key={a.id} className="flex min-w-0 items-center justify-between gap-2 rounded-lg border border-line p-2">
                <span className="min-w-0 truncate"><strong>#{a.queueNo}</strong> {a.name} · {pick(lang, a.doctor.nameAr, a.doctor.nameEn)}</span>
                {canVisit ? <form action={startVisit}><input type="hidden" name="appointmentId" value={a.id} /><button type="submit" className="btn btn-primary btn-sm">{t("بدء الزيارة", "Start visit")}</button></form> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="cal-h">
        <h2 id="cal-h" className="mb-2 text-lg font-bold">{t("جدول اليوم", "Day schedule")} ({items.length})</h2>
        {items.length === 0 ? <p className="card hint">{t("لا مواعيد في هذا اليوم.", "No appointments on this day.")}</p> : (
          <div className="table-wrap">
            <table className="w-full text-sm">
              <thead><tr className="text-start"><th className="p-2 text-start">{t("الوقت", "Time")}</th><th className="p-2 text-start">{t("المريض", "Patient")}</th><th className="p-2 text-start">{t("الطبيب", "Doctor")}</th><th className="p-2 text-start">{t("الفرع", "Branch")}</th><th className="p-2 text-start">{t("الحالة", "Status")}</th><th className="p-2 text-start">{t("إجراء", "Action")}</th></tr></thead>
              <tbody>
                {items.map((a) => (
                  <tr key={a.id} className="border-t border-line">
                    <td className="p-2" dir="ltr">{fmtTime(a.start, lang)}</td>
                    <td className="p-2">{a.name}<span className="hint block" dir="ltr">{a.number}</span></td>
                    <td className="p-2">{pick(lang, a.doctor.nameAr, a.doctor.nameEn)}<span className="hint block">{pick(lang, a.specialty.nameAr, a.specialty.nameEn)}</span></td>
                    <td className="p-2">{pick(lang, a.branch.nameAr, a.branch.nameEn)}</td>
                    <td className="p-2"><span className={`badge ${statusClass[a.status] ?? "badge-info"}`}>{statusLabel[a.status] ?? a.status}</span></td>
                    <td className="p-2">
                      {a.status === "BOOKED" ? (
                        <div className="flex flex-wrap gap-1">
                          <form action={checkInAppointment}><input type="hidden" name="appointmentId" value={a.id} /><button type="submit" className="btn btn-primary btn-sm">{t("تسجيل وصول", "Check in")}</button></form>
                          <form action={setAppointmentStatus}><input type="hidden" name="appointmentId" value={a.id} /><input type="hidden" name="status" value="CANCELLED" /><button type="submit" className="btn btn-ghost btn-sm">{t("إلغاء", "Cancel")}</button></form>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
