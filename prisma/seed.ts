import { prisma } from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import { suggestTriage, type Vitals } from "../src/lib/triage";
import { MockAiProvider } from "../src/lib/ai";
import { LAB_TESTS, RAD_TESTS, flagResult, labByCode, radByCode } from "../src/lib/catalog";
import { invoiceEncounter } from "../src/lib/billing-service";
import { addDays, dayKey, riyadhDate, riyadhParts, startOfDay } from "../src/lib/time";
import {
  ARTICLES, ARTICLE_CATEGORIES, BRANCHES, COMPLAINTS_OPD, DEFAULT_CONSULT_ER, DRUGS, FAMILY, FIRST_F, FIRST_M, ICD10,
  INSURERS, INTERACTIONS, JOBS, NEWS, PACKAGES, SPECIALTIES,
} from "./seed-data";

try { process.loadEnvFile(".env"); } catch { /* env may already be set */ }

let s = 20261017;
const rnd = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ri = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
function pick<T>(arr: readonly T[]): T { return arr[Math.floor(rnd() * arr.length)]; }
const r2 = (n: number) => Math.round(n * 100) / 100;
const MIN = 60000;

const now = new Date();
const today0 = startOfDay(now);
const spanMin = Math.max(30, Math.floor((now.getTime() - today0.getTime()) / MIN) - 1);
const ago = (m: number) => new Date(now.getTime() - Math.min(m, spanMin) * MIN);
const cap = (d: Date) => (d.getTime() > now.getTime() - MIN ? new Date(now.getTime() - MIN) : d);

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@rowaa.example";
  const adminPass = process.env.ADMIN_PASSWORD;
  const staffPass = process.env.DEMO_STAFF_PASSWORD;
  const patientPass = process.env.DEMO_PATIENT_PASSWORD;
  if (!adminPass || !staffPass || !patientPass) throw new Error("Set ADMIN_PASSWORD, DEMO_STAFF_PASSWORD and DEMO_PATIENT_PASSWORD in .env (see .env.example).");

  for (const m of ["auditLog", "session", "admissionEvent", "admission", "claim", "invoice", "charge", "prescription", "order", "diagnosis", "appointment", "encounter",
    "bed", "room", "ward", "doctorBranch", "doctor", "patient", "user", "jobApplication", "job", "contactMessage", "news", "article", "articleCategory",
    "insurer", "package", "drugInteraction", "drug", "icd10", "specialty", "branch"] as const) {
    await (prisma[m] as unknown as { deleteMany: () => Promise<unknown> }).deleteMany();
  }

  // ---- public content
  const branches = [];
  for (const b of BRANCHES) branches.push(await prisma.branch.create({ data: b }));
  const specs = [];
  for (const [slug, nameAr, nameEn, icon, isCenter, descAr, descEn, servicesAr, servicesEn] of SPECIALTIES)
    specs.push(await prisma.specialty.create({ data: { slug, nameAr, nameEn, icon, isCenter, descAr, descEn, servicesAr, servicesEn } }));
  for (const [nameAr, nameEn, tier, noteAr, noteEn] of INSURERS) await prisma.insurer.create({ data: { nameAr, nameEn, tier, noteAr, noteEn } });
  for (const [slug, nameAr, nameEn, descAr, descEn, itemsAr, itemsEn, price, offerPrice, audience] of PACKAGES)
    await prisma.package.create({ data: { slug, nameAr, nameEn, descAr, descEn, itemsAr, itemsEn, price, offerPrice, audience } });
  const cats: Record<string, string> = {};
  for (const [slug, nameAr, nameEn] of ARTICLE_CATEGORIES) cats[slug] = (await prisma.articleCategory.create({ data: { slug, nameAr, nameEn } })).id;
  for (const [slug, cat, titleAr, titleEn, excerptAr, excerptEn, bodyAr, bodyEn, authorAr, authorEn, readMin, daysAgo] of ARTICLES)
    await prisma.article.create({ data: { slug, categoryId: cats[cat], titleAr, titleEn, excerptAr, excerptEn, bodyAr: bodyAr.join("\n\n"), bodyEn: bodyEn.join("\n\n"), authorAr, authorEn, readMin, publishedAt: addDays(today0, -daysAgo) } });
  for (const [slug, titleAr, titleEn, excerptAr, excerptEn, bodyAr, bodyEn, daysAgo] of NEWS)
    await prisma.news.create({ data: { slug, titleAr, titleEn, excerptAr, excerptEn, bodyAr, bodyEn, publishedAt: addDays(today0, -daysAgo) } });
  JOBS.forEach(() => undefined);
  for (const [slug, titleAr, titleEn, dept, deptEn, city, cityEn, type, descAr, descEn, reqAr, reqEn] of JOBS)
    await prisma.job.create({ data: { slug, titleAr, titleEn, dept, deptEn, city, cityEn, type, descAr, descEn, reqAr, reqEn, postedAt: addDays(today0, -ri(2, 25)) } });
  for (const [code, nameEn, nameAr, category] of ICD10) await prisma.icd10.create({ data: { code, nameEn, nameAr, category } });
  const drugs = [];
  for (const [generic, name, nameAr, form, strength, stock, reorderLevel, unitPrice] of DRUGS)
    drugs.push(await prisma.drug.create({ data: { generic, name, nameAr, form, strength, stock, reorderLevel, unitPrice } }));
  for (const [genericA, genericB, severity, noteAr, noteEn] of INTERACTIONS) await prisma.drugInteraction.create({ data: { genericA, genericB, severity, noteAr, noteEn } });
  const icdMap = new Map(ICD10.map((r) => [r[0], r]));

  // ---- doctors (40) and staff users
  const docs: { id: string; fee: number; nameAr: string; specialtyId: string; branchIds: string[]; days: number[]; start: number; end: number; branchHours: Record<string, [string, number, number]> }[] = [];
  for (let i = 0; i < 40; i++) {
    const male = i % 100 < 58 || i < 3;
    const [fa, fe] = male ? FIRST_M[(i * 3) % FIRST_M.length] : FIRST_F[(i * 3) % FIRST_F.length];
    const [la, le] = FAMILY[(i * 5 + 3) % FAMILY.length];
    const spec = specs[i % specs.length];
    const consultant = i % 3 === 0;
    const fee = consultant ? ri(380, 600) : ri(200, 380);
    const bIdx = i % 3 === 0 ? [0, 1] : i % 3 === 1 ? [0] : [i % 2 === 0 ? 2 : 1, 0].slice(0, 1 + (i % 2));
    const days = pickDays(i);
    const start = 8 + (i % 3), end = 15 + (i % 4);
    const d = await prisma.doctor.create({
      data: {
        slug: `dr-${fe.toLowerCase()}-${le.toLowerCase().replace(/[^a-z]/g, "")}-${i + 1}`, nameAr: `د. ${fa} ${la}`, nameEn: `Dr. ${fe} ${le}`, gender: male ? "M" : "F",
        titleAr: consultant ? "استشاري" : "أخصائي", titleEn: consultant ? "Consultant" : "Specialist", specialtyId: spec.id,
        languages: i % 4 === 0 ? "ar,en,ur" : i % 4 === 1 ? "ar,en" : i % 4 === 2 ? "ar,en,fr" : "ar",
        experience: ri(6, 26), fee, rating: r2(4.2 + rnd() * 0.75), reviews: ri(25, 420),
        bioAr: `${consultant ? "استشاري" : "أخصائي"} ${spec.nameAr} في مستشفى رُواء، يهتم بالتشخيص الدقيق وشرح الخطة العلاجية للمريض وأسرته بوضوح.`,
        bioEn: `${consultant ? "Consultant" : "Specialist"} in ${spec.nameEn} at Rowaa, focused on accurate diagnosis and explaining the treatment plan clearly to patients and their families.`,
        educationAr: `بكالوريوس الطب والجراحة، وزمالة ${spec.nameAr}، وعضوية الهيئة السعودية للتخصصات الصحية (بيانات خيالية).`,
        educationEn: `MBBS, fellowship in ${spec.nameEn}, Saudi Commission for Health Specialties member (fictional record).`,
      },
    });
    const branchHours: Record<string, [string, number, number]> = {};
    for (const bi of bIdx) {
      await prisma.doctorBranch.create({ data: { doctorId: d.id, branchId: branches[bi].id, days: days.join(","), startHour: start, endHour: end } });
      branchHours[branches[bi].id] = [days.join(","), start, end];
    }
    docs.push({ id: d.id, fee, nameAr: d.nameAr, specialtyId: spec.id, branchIds: bIdx.map((b) => branches[b].id), days, start, end, branchHours });
  }
  const users: Record<string, { id: string; name: string }> = {};
  const staff: [string, string, string, string, string][] = [
    ["admin", adminEmail, "مدير النظام", "System Administrator", adminPass],
    ["doctor", "doctor@rowaa.example", docs[0].nameAr, "Doctor", staffPass],
    ["nurse", "nurse@rowaa.example", "الممرضة هيا الحازمي", "Nurse Haya Al-Hazmi", staffPass],
    ["reception", "reception@rowaa.example", "موظفة الاستقبال دانة اليامي", "Receptionist Dana Al-Yami", staffPass],
    ["lab", "lab@rowaa.example", "أخصائي المختبر ماجد الخطيب", "Lab Technologist Majed Al-Khatib", staffPass],
    ["radiology", "radiology@rowaa.example", "فني الأشعة بدر النجار", "Radiographer Badr Al-Najjar", staffPass],
    ["pharmacy", "pharmacy@rowaa.example", "الصيدلي طارق العمري", "Pharmacist Tariq Al-Omari", staffPass],
    ["billing", "billing@rowaa.example", "محللة الفوترة منى باعشن", "Billing Analyst Muna Baashen", staffPass],
  ];
  for (const [role, email, name, nameEn, pass] of staff) {
    const u = await prisma.user.create({ data: { email, name, nameEn, role, passwordHash: hashPassword(pass) } });
    users[role] = { id: u.id, name };
  }
  await prisma.doctor.update({ where: { id: docs[0].id }, data: { userId: users.doctor.id } });

  // ---- patients (200)
  const pts: { id: string; insurer: string | null; ageY: number }[] = [];
  for (let i = 0; i < 200; i++) {
    const male = i % 2 === 0;
    const demo = i === 0;
    const [fa, fe] = demo ? ["ريم", "Reem"] : male ? pick(FIRST_M) : pick(FIRST_F);
    const [la, le] = demo ? ["الدوسري", "Al-Dosari"] : pick(FAMILY);
    const ageY = demo ? 34 : ri(1, 84);
    const insurer = demo || rnd() < 0.62 ? pick(INSURERS)[0] : null;
    const p = await prisma.patient.create({
      data: {
        mrn: `RW-${String(i + 1).padStart(6, "0")}`, nameAr: `${fa} ${la}`, nameEn: `${fe} ${le}`,
        nationalId: `${male && !demo ? "1" : "1"}${String(100000000 + ((i * 102931) % 900000000)).slice(0, 9)}`.replace(/^(.)/, i % 5 === 0 ? "2" : "1"),
        gender: demo ? "F" : male ? "M" : "F", dob: new Date(now.getTime() - ageY * 365.25 * 86400000 - ri(0, 300) * 86400000),
        phone: `05${ri(0, 9)}${String(ri(1000000, 9999999))}`, email: demo ? "reem.demo@example.com" : null,
        insurer, policyNo: insurer ? `POL-${ri(100000, 999999)}` : null, passwordHash: demo ? hashPassword(patientPass) : null,
        bloodType: pick(["A+", "A-", "B+", "O+", "O+", "O-", "AB+"]), allergies: rnd() < 0.15 ? pick(["البنسلين", "الأسبرين", "المكسرات"]) : null,
      },
    });
    pts.push({ id: p.id, insurer, ageY });
  }

  // ---- wards, rooms, beds
  const wardDefs: [number, string, string, string, number, number][] = [
    [0, "الطوارئ", "Emergency", "ER", 4, 2], [0, "العناية المركزة", "ICU", "ICU", 4, 2], [0, "الباطنة", "Medical", "MEDICAL", 8, 2],
    [0, "الجراحة", "Surgical", "SURGICAL", 7, 2], [0, "الولادة", "Maternity", "MATERNITY", 5, 2],
    [1, "الطوارئ", "Emergency", "ER", 3, 2], [1, "الباطنة", "Medical", "MEDICAL", 6, 2], [1, "الجراحة", "Surgical", "SURGICAL", 4, 2],
  ];
  const beds: { id: string; wardType: string; branchId: string }[] = [];
  for (const [bi, name, nameEn, type, rooms, per] of wardDefs) {
    const w = await prisma.ward.create({ data: { branchId: branches[bi].id, name, nameEn, type } });
    for (let r = 1; r <= rooms; r++) {
      const room = await prisma.room.create({ data: { wardId: w.id, name: `${type[0]}${r}0${bi + 1}` } });
      for (let b = 1; b <= per; b++) {
        const bed = await prisma.bed.create({ data: { roomId: room.id, label: `${room.name}-${String.fromCharCode(64 + b)}` } });
        beds.push({ id: bed.id, wardType: type, branchId: branches[bi].id });
      }
    }
  }

  // ---- helpers
  const emDoc = docs.find((d) => d.specialtyId === specs.find((x) => x.slug === "emergency")!.id) ?? docs[0];
  const mk = async (enc: { id: string; patientId: string }, kind: "LAB" | "RAD", code: string, orderedAt: Date, done: boolean, by: string) => {
    const lab = kind === "LAB" ? labByCode(code)! : null;
    const rad = kind === "RAD" ? radByCode(code)! : null;
    const base = { encounterId: enc.id, patientId: enc.patientId, kind, code, name: lab?.name ?? rad!.name, orderedAt, orderedBy: by, priority: rnd() < 0.2 ? "URGENT" : "ROUTINE" };
    await prisma.charge.create({ data: { encounterId: enc.id, patientId: enc.patientId, description: lab?.name ?? rad!.name, category: kind, unitPrice: lab?.price ?? rad!.price, createdAt: orderedAt } });
    if (!done) return prisma.order.create({ data: { ...base, status: "ORDERED", unit: lab?.unit, refLow: lab?.refLow, refHigh: lab?.refHigh } });
    const resultedAt = cap(new Date(orderedAt.getTime() + (kind === "LAB" ? ri(22, 85) : ri(35, 120)) * MIN));
    if (lab) {
      const x = rnd();
      const value = r2(x < 0.72 ? lab.refLow + rnd() * (lab.refHigh - lab.refLow) : x < 0.93 ? lab.refHigh * (1.05 + rnd() * 0.25) : (lab.critHigh ?? lab.refHigh * 1.6) * 1.02);
      return prisma.order.create({ data: { ...base, status: "RESULTED", resultedAt, value, unit: lab.unit, refLow: lab.refLow, refHigh: lab.refHigh, flag: flagResult(value, lab), resultedBy: users.lab.name } });
    }
    return prisma.order.create({ data: { ...base, status: "RESULTED", resultedAt, flag: "N", resultText: pick(["لا توجد علامات حادة.", "تغيّرات طفيفة مرتبطة بالعمر.", "لا كسور ظاهرة."]), resultedBy: users.radiology.name } });
  };
  const rx = async (enc: { id: string; patientId: string }, generic: string, at: Date, dispensed: boolean, by: string, note?: string) => {
    const d = drugs.find((x) => x.generic === generic)!;
    const days = ri(3, 14), qty = pick([10, 14, 20, 30]);
    await prisma.charge.create({ data: { encounterId: enc.id, patientId: enc.patientId, description: `${d.name} ${d.strength}`, category: "PHARMACY", qty, unitPrice: d.unitPrice, createdAt: at } });
    await prisma.prescription.create({
      data: { encounterId: enc.id, patientId: enc.patientId, drugId: d.id, dose: d.strength, frequency: pick(["مرتين يومياً", "مرة يومياً", "ثلاث مرات يومياً"]), days, qty,
        status: dispensed ? "DISPENSED" : "PENDING", prescribedAt: at, dispensedAt: dispensed ? cap(new Date(at.getTime() + ri(10, 50) * MIN)) : null, prescribedBy: by, dispensedBy: dispensed ? users.pharmacy.name : null, interactionNote: note ?? null },
    });
  };
  const dx = async (encounterId: string, code: string, primary = true) => {
    const r = icdMap.get(code)!;
    await prisma.diagnosis.create({ data: { encounterId, code, nameEn: r[1], nameAr: r[2], isPrimary: primary } });
  };
  const apptSeq = { n: 0 };
  const booked = new Set<string>();
  const appt = async (patientIdx: number | null, d: (typeof docs)[number], branchId: string, start: Date, status: string, queueNo?: number) => {
    const key = `${d.id}-${start.getTime()}`;
    if (booked.has(key)) return;
    booked.add(key);
    const p = patientIdx === null ? null : await prisma.patient.findUnique({ where: { id: pts[patientIdx].id } });
    const nm = p?.nameAr ?? `${pick(FIRST_M)[0]} ${pick(FAMILY)[0]}`;
    await prisma.appointment.create({
      data: { number: `RW-A${dayKey(now).replace(/-/g, "").slice(2)}${String(++apptSeq.n).padStart(3, "0")}`, patientId: p?.id ?? null, doctorId: d.id, branchId, specialtyId: d.specialtyId, start, status, name: nm, phone: p?.phone ?? `05${ri(10000000, 99999999)}`, nationalId: p?.nationalId ?? null, queueNo: queueNo ?? null, checkedInAt: status === "CHECKED_IN" || status === "COMPLETED" ? cap(new Date(start.getTime() - 10 * MIN)) : null },
    });
  };
  const slotAt = (d: (typeof docs)[number], dayOffset: number) => {
    const base = addDays(today0, dayOffset);
    const p = riyadhParts(base);
    const mins = (d.start * 60) + 30 * ri(0, (d.end - d.start) * 2 - 1);
    return { start: riyadhDate(p.y, p.m, p.d, Math.floor(mins / 60), mins % 60), dow: p.dow };
  };

  const opdVisit = async (pIdx: number, startedAt: Date, closed: boolean, docIdx?: number) => {
    const d = docs[docIdx ?? ri(0, docs.length - 1)];
    const branchId = d.branchIds[0];
    const [complaint, code, labs, rads, rxs] = pick(COMPLAINTS_OPD);
    const seenAt = cap(new Date(startedAt.getTime() + ri(8, 35) * MIN));
    const enc = await prisma.encounter.create({
      data: { patientId: pts[pIdx].id, doctorId: d.id, branchId, type: "OPD", status: closed ? "CLOSED" : "OPEN", chiefComplaint: complaint, startedAt, seenAt, endedAt: closed ? cap(new Date(seenAt.getTime() + ri(10, 30) * MIN)) : null,
        hr: ri(64, 96), sbp: ri(108, 142), dbp: ri(66, 90), rr: ri(14, 19), spo2: ri(95, 99), temp: r2(36.4 + rnd() * 0.9), pain: ri(0, 4), weight: ri(52, 98), notes: `${complaint}. فحص سريري دون علامات خطر. خطة العلاج وشرح المتابعة للمريض.` },
    });
    await prisma.charge.create({ data: { encounterId: enc.id, patientId: enc.patientId, description: "كشف طبيب", category: "CONSULT", unitPrice: d.fee, createdAt: startedAt } });
    await dx(enc.id, code);
    for (const l of labs) await mk(enc, "LAB", l, seenAt, closed || rnd() < 0.6, d.nameAr);
    for (const r of rads) await mk(enc, "RAD", r, seenAt, closed || rnd() < 0.5, d.nameAr);
    for (const g of rxs) await rx(enc, g, seenAt, closed || rnd() < 0.5, d.nameAr);
    if (closed && rnd() < 0.85) await invoiceEncounter(enc.id, enc.endedAt ?? now, rnd() < 0.7);
    return enc;
  };

  // ---- today's outpatient activity (32 visits) with matching appointments
  for (let i = 0; i < 32; i++) {
    const closed = i < 20;
    const startedAt = ago(closed ? ri(120, spanMin) : ri(5, 90));
    const pIdx = ri(1, 199);
    const enc = await opdVisit(pIdx, startedAt, closed);
    const d = docs.find((x) => x.id === enc.doctorId)!;
    const half = new Date(Math.round(startedAt.getTime() / (30 * MIN)) * 30 * MIN);
    await appt(pIdx, d, d.branchIds[0], half, closed ? "COMPLETED" : "CHECKED_IN", closed ? undefined : i - 19);
  }

  // ---- ER board
  const ai = new MockAiProvider();
  const erCases: { c: string; age: number; v: Vitals; labs: string[]; rads: string[] }[] = [
    { c: "ألم في الصدر", age: 58, v: { hr: 102, sbp: 150, rr: 20, spo2: 96, temp: 36.8, gcs: 15, pain: 7 }, labs: ["TROP", "HGB"], rads: ["XR-CHEST"] },
    { c: "التواء في الكاحل", age: 24, v: { hr: 82, sbp: 122, rr: 16, spo2: 99, temp: 36.7, gcs: 15, pain: 5 }, labs: [], rads: ["XR-ANKLE"] },
    { c: "حمى وسعال منذ 3 أيام", age: 41, v: { hr: 112, sbp: 118, rr: 22, spo2: 93, temp: 38.9, gcs: 15, pain: 3 }, labs: ["WBC", "CRP", "LACT"], rads: ["XR-CHEST"] },
    { c: "تجديد وصفة دواء", age: 36, v: { hr: 74, sbp: 120, rr: 15, spo2: 99, temp: 36.6, gcs: 15, pain: 0 }, labs: [], rads: [] },
    { c: "ألم في البطن منذ الصباح", age: 29, v: { hr: 94, sbp: 126, rr: 18, spo2: 98, temp: 37.6, gcs: 15, pain: 6 }, labs: ["WBC", "CRP"], rads: ["US-ABD"] },
    { c: "جرح قطعي في اليد", age: 33, v: { hr: 86, sbp: 128, rr: 16, spo2: 99, temp: 36.7, gcs: 15, pain: 4 }, labs: [], rads: [] },
    { c: "ضيق في التنفس", age: 67, v: { hr: 118, sbp: 138, rr: 28, spo2: 88, temp: 37.2, gcs: 15, pain: 2 }, labs: ["HGB", "TROP"], rads: ["XR-CHEST"] },
    { c: "حمى عند طفل", age: 3, v: { hr: 150, sbp: 96, rr: 30, spo2: 97, temp: 39.1, gcs: 15, pain: 2 }, labs: ["WBC", "CRP"], rads: [] },
    { c: "صداع شديد مفاجئ", age: 45, v: { hr: 88, sbp: 168, rr: 17, spo2: 98, temp: 36.8, gcs: 14, pain: 9 }, labs: ["GLU", "NA"], rads: ["CT-HEAD"] },
    { c: "التهاب حلق", age: 22, v: { hr: 90, sbp: 118, rr: 16, spo2: 99, temp: 37.9, gcs: 15, pain: 3 }, labs: [], rads: [] },
    { c: "حرقان في البول", age: 38, v: { hr: 84, sbp: 116, rr: 16, spo2: 99, temp: 37.4, gcs: 15, pain: 4 }, labs: ["WBC", "CREA"], rads: [] },
    { c: "ألم في الظهر بعد سقوط", age: 52, v: { hr: 92, sbp: 134, rr: 17, spo2: 98, temp: 36.7, gcs: 15, pain: 7 }, labs: [], rads: ["XR-WRIST"] },
    { c: "دوخة وإغماء", age: 71, v: { hr: 48, sbp: 86, rr: 18, spo2: 95, temp: 36.5, gcs: 14, pain: 1 }, labs: ["GLU", "K", "HGB"], rads: [] },
    { c: "تقيؤ وإسهال", age: 27, v: { hr: 104, sbp: 108, rr: 18, spo2: 98, temp: 37.8, gcs: 15, pain: 4 }, labs: ["K", "NA", "CREA"], rads: [] },
    { c: "طفح جلدي", age: 19, v: { hr: 78, sbp: 120, rr: 15, spo2: 99, temp: 36.7, gcs: 15, pain: 1 }, labs: [], rads: [] },
    { c: "ألم في الركبة بعد الرياضة", age: 26, v: { hr: 76, sbp: 124, rr: 15, spo2: 99, temp: 36.6, gcs: 15, pain: 5 }, labs: [], rads: [] },
  ];
  const erDx: Record<number, string> = { 0: "R07.9", 1: "S93.4", 2: "J18.9", 3: "Z76.0", 4: "R10.4", 5: "S61.9", 6: "J45.909", 7: "R50.9", 8: "R51", 9: "J02.9", 10: "N39.0", 11: "M54.5", 12: "R55", 13: "A09", 14: "L20.9", 15: "M25.57" };
  let summaryDone = 0;
  for (let i = 0; i < erCases.length; i++) {
    const cs = erCases[i];
    const waiting = i < 5, inTreat = i >= 5 && i < 8;
    const arrival = waiting ? ago(ri(6, 80)) : inTreat ? ago(ri(40, 120)) : ago(ri(100, spanMin));
    const tri = suggestTriage({ ageYears: cs.age, complaint: cs.c, vitals: cs.v });
    const waitMin = tri.level === 1 ? 0 : tri.level === 2 ? ri(3, 10) : tri.level === 3 ? ri(15, 45) : ri(30, 85);
    const seenAt = waiting ? null : cap(new Date(arrival.getTime() + waitMin * MIN));
    const pIdx = ri(1, 199);
    const confirmed = !(waiting && i === 0) && !(waiting && i === 3);
    const aiOut = await ai.explainTriage({ level: tri.level, reasons: tri.reasons.map((r) => r.ar), complaint: cs.c, ageYears: cs.age, vitals: cs.v as Record<string, number>, lang: "ar" });
    const closed = !waiting && !inTreat;
    const enc = await prisma.encounter.create({
      data: { patientId: pts[pIdx].id, doctorId: waiting ? null : emDoc.id, branchId: branches[0].id, type: "ER", status: closed ? "CLOSED" : "OPEN", chiefComplaint: cs.c, startedAt: arrival, seenAt,
        endedAt: closed && seenAt ? cap(new Date(seenAt.getTime() + ri(40, 160) * MIN)) : null, disposition: closed ? pick(["DISCHARGED", "DISCHARGED", "ADMITTED", "REFERRED"]) : null,
        hr: cs.v.hr, sbp: cs.v.sbp, rr: cs.v.rr, spo2: cs.v.spo2, temp: cs.v.temp, gcs: cs.v.gcs, pain: cs.v.pain,
        triageSuggested: tri.level, triageFinal: confirmed ? tri.level : null, triageReasons: JSON.stringify(tri.reasons),
        triageAi: JSON.stringify({ text: aiOut.text, provider: aiOut.provider, mock: aiOut.mock }), triageConfirmedBy: confirmed ? users.nurse.name : null, triageConfirmedAt: confirmed ? cap(new Date(arrival.getTime() + 4 * MIN)) : null },
    });
    await prisma.charge.create({ data: { encounterId: enc.id, patientId: enc.patientId, description: "كشف طوارئ", category: "CONSULT", unitPrice: DEFAULT_CONSULT_ER, createdAt: arrival } });
    await dx(enc.id, erDx[i]);
    for (const l of cs.labs) await mk(enc, "LAB", l, arrival, closed || (inTreat && rnd() < 0.5), emDoc.nameAr);
    for (const r of cs.rads) await mk(enc, "RAD", r, arrival, closed, emDoc.nameAr);
    if (closed && summaryDone < 2) {
      const sm = await ai.summarizeNote({ complaint: cs.c, vitals: cs.v as Record<string, number>, diagnoses: [icdMap.get(erDx[i])![2]], notes: "تقييم أولي وعلاج الأعراض ومتابعة العلامات الحيوية", orders: [...cs.labs, ...cs.rads], lang: "ar" });
      await prisma.encounter.update({ where: { id: enc.id }, data: { aiSummary: sm.text, aiSummaryBy: sm.provider, aiSummaryConfirmed: summaryDone === 0 ? emDoc.nameAr : null } });
      summaryDone++;
    }
    if (closed) await invoiceEncounter(enc.id, enc.endedAt ?? now, rnd() < 0.6);
  }

  // ---- inpatients (occupancy), recent discharges, bed statuses
  const wardBeds = beds.slice();
  let pi = 120, active = 0;
  for (let i = 0; i < wardBeds.length; i++) {
    const b = wardBeds[i];
    if (i % 17 === 5) { await prisma.bed.update({ where: { id: b.id }, data: { status: "CLEANING" } }); continue; }
    if (i === 40) { await prisma.bed.update({ where: { id: b.id }, data: { status: "MAINTENANCE" } }); continue; }
    if (rnd() > (b.wardType === "ICU" ? 0.8 : b.wardType === "ER" ? 0.3 : 0.7)) continue;
    const admittedAt = new Date(now.getTime() - (ri(0, 6) * 24 * 60 + ri(10, 600)) * MIN);
    const d = docs[ri(0, docs.length - 1)];
    const code = pick(["I21.9", "J18.9", "K35.80", "K80.20", "N20.0", "I63.9", "E11.9", "O80", "S52.50", "A41.9"]);
    const enc = await prisma.encounter.create({ data: { patientId: pts[pi].id, doctorId: d.id, branchId: b.branchId, type: "IPD", status: "OPEN", chiefComplaint: icdMap.get(code)![2], startedAt: admittedAt } });
    await dx(enc.id, code);
    await prisma.charge.create({ data: { encounterId: enc.id, patientId: pts[pi].id, description: "إقامة وتنويم (يوم)", category: "ROOM", qty: Math.max(1, Math.round((now.getTime() - admittedAt.getTime()) / 86400000)), unitPrice: b.wardType === "ICU" ? 3200 : 950, createdAt: admittedAt } });
    const adm = await prisma.admission.create({ data: { patientId: pts[pi].id, bedId: b.id, encounterId: enc.id, diagnosis: icdMap.get(code)![2], admittedAt, expectedDischarge: rnd() < 0.65 ? addDays(today0, ri(1, 7)) : null } });
    await prisma.admissionEvent.create({ data: { admissionId: adm.id, type: "ADMIT", toBedId: b.id, byName: users.nurse.name, at: admittedAt, note: "قبول المريض في الجناح" } });
    await prisma.bed.update({ where: { id: b.id }, data: { status: "OCCUPIED" } });
    pi++; active++;
  }
  for (let k = 0; k < 14; k++) {
    const b = pick(beds);
    const admittedAt = new Date(now.getTime() - ri(2, 8) * 86400000);
    const dischargedAt = new Date(admittedAt.getTime() + ri(1, 3) * 86400000);
    if (dischargedAt > now) continue;
    const enc = await prisma.encounter.create({ data: { patientId: pts[pi].id, doctorId: docs[ri(0, 39)].id, branchId: b.branchId, type: "IPD", status: "CLOSED", chiefComplaint: "تنويم", startedAt: admittedAt, endedAt: dischargedAt } });
    const adm = await prisma.admission.create({ data: { patientId: pts[pi].id, bedId: b.id, encounterId: enc.id, status: "DISCHARGED", diagnosis: "تنويم", admittedAt, dischargedAt } });
    await prisma.admissionEvent.create({ data: { admissionId: adm.id, type: "ADMIT", toBedId: b.id, byName: users.nurse.name, at: admittedAt } });
    await prisma.admissionEvent.create({ data: { admissionId: adm.id, type: "DISCHARGE", fromBedId: b.id, byName: users.doctor.name, at: dischargedAt } });
    pi = Math.min(pi + 1, 199);
  }

  // ---- demo patient history (portal), interaction demo, appointments
  await opdVisit(0, addDays(today0, -21), true, 0);
  await opdVisit(0, addDays(today0, -9), true, 3);
  const warf = await prisma.encounter.create({ data: { patientId: pts[3].id, doctorId: docs[0].id, branchId: branches[0].id, type: "OPD", status: "CLOSED", chiefComplaint: "متابعة رجفان أذيني", startedAt: addDays(today0, -12), endedAt: addDays(today0, -12) } });
  await rx(warf, "warfarin", addDays(today0, -12), true, docs[0].nameAr);
  const pain = await prisma.encounter.create({ data: { patientId: pts[3].id, doctorId: docs[1].id, branchId: branches[0].id, type: "OPD", status: "OPEN", chiefComplaint: "ألم في الركبة", startedAt: ago(30) } });
  const hit = INTERACTIONS.find((r) => r[0] === "warfarin" && r[1] === "ibuprofen")!;
  await rx(pain, "ibuprofen", ago(15), false, docs[1].nameAr, `MAJOR: ${hit[3]} / ${hit[4]}`);
  await appt(0, docs[0], docs[0].branchIds[0], (() => { for (let o = 2; o < 14; o++) { const sl = slotAt(docs[0], o); if (docs[0].days.includes(sl.dow)) return sl.start; } return addDays(today0, 3); })(), "BOOKED");
  for (let k = 0; k < 70; k++) {
    const d = pick(docs);
    const off = ri(-10, 8);
    const sl = slotAt(d, off);
    if (!d.days.includes(sl.dow)) continue;
    const past = sl.start < now;
    await appt(rnd() < 0.7 ? ri(1, 199) : null, d, d.branchIds[0], sl.start, past ? pick(["COMPLETED", "COMPLETED", "NO_SHOW"]) : "BOOKED");
  }

  // ---- audit log
  const ev: [string, string, string, string][] = [["reception", "CREATE", "Patient", "تسجيل ملف مريض جديد"], ["nurse", "CREATE", "Encounter", "فتح زيارة طوارئ وتسجيل العلامات الحيوية"], ["nurse", "CONFIRM", "Triage", "تأكيد مستوى الفرز"], ["doctor", "UPDATE", "Encounter", "تحديث الملاحظات السريرية والتشخيص"], ["lab", "UPDATE", "Order", "إدخال نتيجة مختبر"], ["pharmacy", "UPDATE", "Prescription", "صرف وصفة"], ["billing", "CREATE", "Invoice", "إصدار فاتورة"]];
  for (let i = 0; i < 40; i++) {
    const [role, action, entity, summary] = ev[i % ev.length];
    await prisma.auditLog.create({ data: { userId: users[role].id, userName: users[role].name, role, action, entity, summary, at: ago(ri(1, spanMin)) } });
  }
  await prisma.auditLog.create({ data: { userName: "system", action: "CREATE", entity: "Seed", summary: "تحميل بيانات تجريبية خيالية", at: now } });

  const c = {
    doctors: await prisma.doctor.count(), patients: await prisma.patient.count(), encounters: await prisma.encounter.count(), beds: await prisma.bed.count(),
    activeAdmissions: active, invoices: await prisma.invoice.count(), appointments: await prisma.appointment.count(), labTests: LAB_TESTS.length, radTests: RAD_TESTS.length,
  };
  console.log("seeded", JSON.stringify(c));
}

function pickDays(i: number): number[] {
  const sets = [[0, 1, 2, 3, 4], [0, 2, 4], [1, 3, 5], [0, 1, 2, 3], [2, 3, 4, 5, 6]];
  return sets[i % sets.length];
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
