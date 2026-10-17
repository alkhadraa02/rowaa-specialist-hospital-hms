export const ROLES = ["admin", "doctor", "nurse", "reception", "lab", "radiology", "pharmacy", "billing"] as const;
export type Role = (typeof ROLES)[number];

export type Permission =
  | "dashboard.read"
  | "patients.read"
  | "patients.write"
  | "appointments.manage"
  | "er.manage"
  | "er.confirm"
  | "beds.read"
  | "beds.manage"
  | "emr.read"
  | "emr.write"
  | "orders.create"
  | "lab.result"
  | "rad.result"
  | "pharmacy.prescribe"
  | "pharmacy.dispense"
  | "pharmacy.stock"
  | "billing.manage"
  | "audit.read"
  | "ai.use";

const MATRIX: Record<Role, Permission[]> = {
  admin: [
    "dashboard.read", "patients.read", "patients.write", "appointments.manage", "er.manage", "er.confirm", "beds.read", "beds.manage",
    "emr.read", "emr.write", "orders.create", "lab.result", "rad.result", "pharmacy.prescribe", "pharmacy.dispense", "pharmacy.stock",
    "billing.manage", "audit.read", "ai.use",
  ],
  doctor: [
    "dashboard.read", "patients.read", "appointments.manage", "er.manage", "er.confirm", "beds.read", "beds.manage",
    "emr.read", "emr.write", "orders.create", "pharmacy.prescribe", "ai.use",
  ],
  nurse: ["dashboard.read", "patients.read", "appointments.manage", "er.manage", "er.confirm", "beds.read", "beds.manage", "emr.read", "emr.write", "ai.use"],
  reception: ["dashboard.read", "patients.read", "patients.write", "appointments.manage", "er.manage", "beds.read"],
  lab: ["dashboard.read", "patients.read", "emr.read", "lab.result"],
  radiology: ["dashboard.read", "patients.read", "emr.read", "rad.result"],
  pharmacy: ["dashboard.read", "patients.read", "pharmacy.dispense", "pharmacy.stock"],
  billing: ["dashboard.read", "patients.read", "billing.manage"],
};

export function can(role: string | null | undefined, perm: Permission): boolean {
  if (!role || !(role in MATRIX)) return false;
  return MATRIX[role as Role].includes(perm);
}

export function permissionsOf(role: string): Permission[] {
  return role in MATRIX ? MATRIX[role as Role] : [];
}

export const ROLE_LABELS: Record<Role, { ar: string; en: string }> = {
  admin: { ar: "مدير النظام", en: "Administrator" },
  doctor: { ar: "طبيب", en: "Doctor" },
  nurse: { ar: "تمريض", en: "Nurse" },
  reception: { ar: "استقبال", en: "Reception" },
  lab: { ar: "مختبر", en: "Laboratory" },
  radiology: { ar: "أشعة", en: "Radiology" },
  pharmacy: { ar: "صيدلية", en: "Pharmacy" },
  billing: { ar: "محاسبة", en: "Billing" },
};
