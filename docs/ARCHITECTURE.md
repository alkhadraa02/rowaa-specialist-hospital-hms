# Architecture — Rowaa Specialist Hospital platform / معمارية منصة مستشفى رُواء التخصصي

> **Not a medical device.** This is a fictional demo. All data, names and brands are invented. Nothing here is validated for clinical use.
> **ليس جهازاً طبياً.** هذا نموذج توضيحي لجهة خيالية؛ كل البيانات مُختلقة ولا يصلح للاستخدام السريري.

## 1. Modules

| Module | Location | Notes |
|---|---|---|
| Public site | `src/app/(site)` | Home, specialties, doctors with filters, multi-step booking, branches, packages, insurance, articles, news, careers, portal, guides, FAQ. Arabic default (RTL) with English toggle. |
| Patient portal | `src/app/(site)/portal` | Demo patient: appointments, lab results, prescriptions, invoices. |
| HMS | `src/app/hms/(app)` | Dashboard, patients, appointments and queue, ER board, beds, encounters (EMR-lite), orders, pharmacy, billing, audit log. |
| Server actions | `src/app/actions` | Every mutation re-checks the permission with `authorize()` and validates input with zod. |
| Domain logic | `src/lib` | `triage`, `forecast`, `interactions`, `billing`, `slots`, `rbac`, `ai`, `catalog` — pure functions covered by vitest. |

## 2. Data model (Prisma + SQLite)

- **Access:** `User`, `Session` (hashed password, httpOnly session cookie), roles: admin, doctor, nurse, reception, lab, radiology, pharmacy, billing.
- **Directory:** `Branch`, `Specialty`, `Doctor`, `DoctorBranch`.
- **Care:** `Patient` (MRN), `Appointment`, `Encounter` (OPD/ER/IPD, vitals, notes, triage and AI fields), `Icd10`, `Diagnosis`, `Order` (lab/radiology, results and flags).
- **Beds:** `Ward`, `Room`, `Bed`, `Admission`, `AdmissionEvent`.
- **Pharmacy:** `Drug` (stock and reorder level), `DrugInteraction`, `Prescription`.
- **Money:** `Charge`, `Invoice` (15% VAT on cash invoices), `Claim` (draft → submitted → approved/rejected → paid).
- **Governance:** `AuditLog` — user, action, entity and time for every create/update.
- **Content:** `Package`, `Insurer`, `ArticleCategory`, `Article`, `News`, `Job`, `JobApplication`, `ContactMessage`.

## 3. How AI stays assistive (human in the loop)

1. **Deterministic first.** ER triage (ESI-style 1–5) is computed by explicit rules from vitals and complaint; the reasons are stored and shown. The occupancy forecast is a simple, explainable model (recent admissions/discharges and the weekday pattern).
2. **LLM is optional.** `AiProvider` is an interface. The default is `MockAiProvider`, which answers from computed data. `HttpAiProvider` (OpenAI-compatible) is used only when `AI_API_KEY` is set.
3. **Labelled.** Every AI output is shown with an "AI-generated — needs clinician review" label and the provider name.
4. **Confirmed.** A triage level becomes official only when a clinician confirms it (`confirmTriage`); an AI note summary stays "awaiting confirmation" until a clinician confirms it. AI never writes diagnoses, orders or prescriptions.
5. **Audited.** AI calls and confirmations are written to the audit log.
6. **Safety nets are rules, not AI.** The drug-interaction check comes from a seeded table; a contraindicated pair is blocked and a lesser interaction requires an explicit override that is recorded.

## 4. Security

Hashed passwords, httpOnly cookie sessions, RBAC on every route and action, zod validation on every input, security headers in `next.config` (CSP, frame-ancestors, nosniff, Referrer-Policy, no `X-Powered-By`). Secrets live in `.env` only; `.env` is git-ignored.

## 5. What a real deployment would need

- **NPHIES** integration for eligibility, pre-authorization and claims (the claim drafts here are only a local workflow).
- **HL7 v2 / FHIR R4** interfaces (Patient, Encounter, Observation, MedicationRequest, ServiceRequest) with LIS/RIS/PACS and a national terminology service (SNOMED CT, LOINC, ICD-10-AM).
- **PDPL compliance** (Saudi Personal Data Protection Law): lawful basis and consent, data-subject rights, retention, breach notification, in-Kingdom hosting, encryption at rest and in transit, field-level access logging, a DPO.
- **Production database** (PostgreSQL), backups and recovery, high availability, SSO/MFA, monitoring.
- **Clinical governance and regulatory review** (SFDA software-as-medical-device assessment for any decision-support feature), clinical safety validation, and licensed drug-interaction and terminology content.
