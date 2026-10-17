# مستشفى رُواء التخصصي — Rowaa Specialist Hospital

منصة مستشفى متكاملة لجهة **خيالية**: موقع عام للمرضى + نظام إدارة المستشفى الداخلي (HMS) بمساعدة الذكاء الاصطناعي.
A complete hospital platform for a **fictional** brand: a public website plus an AI-assisted internal hospital management system (HMS).

> **تنبيه / Disclaimer:** هذا نموذج توضيحي وليس جهازاً طبياً ولا يصلح للاستخدام السريري. This demo is **not a medical device**. All names, data and brands are invented.

## المزايا / Features

**الموقع العام / Public site** — عربي افتراضي RTL مع تبديل إلى الإنجليزية
- الرئيسية مع بحث، التخصصات ومراكز التميّز، البحث عن طبيب (تخصص، فرع، جنس، لغة، توفّر)، ملفات الأطباء
- حجز موعد بخطوات: تخصص ← طبيب ← فرع ← موعد ← بيانات المريض ← تأكيد برقم حجز
- الفروع، الباقات والعروض، شركات التأمين، المقالات الصحية، الأخبار، الوظائف مع طلب توظيف
- بوابة المريض التجريبية (مواعيدي، نتائج المختبر، وصفاتي، فواتيري)، دليل الزائر، حقوق المرضى، تواصل، من نحن، الأسئلة الشائعة، شريط الطوارئ

**نظام HMS (`/hms`)** — أدوار: admin, doctor, nurse, reception, lab, radiology, pharmacy, billing
- تسجيل المرضى برقم ملف طبي (MRN)، تقويم المواعيد وطابور العيادات
- لوحة الطوارئ مع فرز مساعَد بالذكاء الاصطناعي (ESI 1–5 بقواعد حتمية + شرح اختياري من نموذج لغوي، يؤكده الطبيب)
- إدارة الأسرّة (أجنحة، غرف، أسرّة، قبول/نقل/تخريج) وتوقّع إشغال 7 أيام بنموذج بسيط قابل للتفسير
- السجل الطبي المختصر: علامات حيوية، تشخيصات ICD-10، ملاحظات، ملخص ذكي، طلبات مختبر وأشعة مع نتائج وتنبيهات شذوذ
- الصيدلية: وصفات، صرف، مخزون وتنبيه إعادة الطلب، فحص تفاعلات دوائية
- الفوترة: رسوم الزيارة، مطالبات التأمين (مسودات)، فواتير نقدية بضريبة 15%
- لوحة المؤشرات ومساعد العمليات الذكي، وسجل تدقيق لكل إنشاء/تعديل

## التقنيات / Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Prisma + SQLite · zod · vitest

## التشغيل في 5 أوامر / Setup in 5 commands

```bash
npm install
cp .env.example .env
npm run db:reset
npm test
npm run dev
```

ثم افتح / then open `http://localhost:3120` — الموقع العام، و`http://localhost:3120/hms` للنظام الداخلي.
على PowerShell استخدم `Copy-Item .env.example .env`.

للإنتاج / Production: `npm run build` ثم `npm start`.

## الدخول الافتراضي / Default login
- المدير / Admin: البريد `ADMIN_EMAIL` وكلمة المرور `ADMIN_PASSWORD` من ملف `.env` (القيم الافتراضية للعرض في `.env.example` — غيّرها قبل أي استخدام حقيقي).
- بقية الموظفين التجريبيين تستعمل `DEMO_STAFF_PASSWORD`، ومريض البوابة `DEMO_PATIENT_PASSWORD` (الهوية الوطنية معروضة في صفحة دخول البوابة).

## الذكاء الاصطناعي / AI
`AiProvider` واجهة؛ المزوّد الافتراضي **تجريبي** (Mock) بلا مفاتيح. يُفعَّل مزوّد حقيقي (متوافق مع OpenAI) فقط عند ضبط `AI_API_KEY`. كل مخرجات الذكاء موسومة وتحتاج تأكيد طبيب. التفاصيل في [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## لقطات الشاشة / Screenshots
تُضاف لقطات الصفحة الرئيسية ولوحة الطوارئ ولوحة الأسرّة هنا. / Screenshots of the home page, ER board and bed board go here.

## بنية المشروع / Structure

```
prisma/            schema.prisma, seed.ts (SQLite file is git-ignored)
src/app/(site)/    public website pages
src/app/hms/       internal HMS (RBAC)
src/app/actions/   server actions (authorize + zod)
src/app/api/       route handlers (contact, applications, triage)
src/lib/           triage, forecast, interactions, billing, slots, rbac, ai
tests/             vitest (logic, triage, API route)
docs/              ARCHITECTURE.md
```

## الرخصة / License
MIT © TechnologyKSA
