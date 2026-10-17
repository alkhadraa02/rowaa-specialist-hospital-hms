export type LabTest = {
  code: string; name: string; nameAr: string; unit: string;
  refLow: number; refHigh: number; critLow?: number; critHigh?: number; price: number;
};

export const LAB_TESTS: LabTest[] = [
  { code: "HGB", name: "Hemoglobin", nameAr: "الهيموغلوبين", unit: "g/dL", refLow: 12, refHigh: 17.5, critLow: 7, critHigh: 20, price: 35 },
  { code: "WBC", name: "White blood cells", nameAr: "كريات الدم البيضاء", unit: "x10³/µL", refLow: 4, refHigh: 11, critLow: 2, critHigh: 30, price: 35 },
  { code: "PLT", name: "Platelets", nameAr: "الصفائح الدموية", unit: "x10³/µL", refLow: 150, refHigh: 400, critLow: 50, critHigh: 1000, price: 35 },
  { code: "GLU", name: "Glucose (random)", nameAr: "سكر الدم", unit: "mg/dL", refLow: 70, refHigh: 140, critLow: 40, critHigh: 500, price: 25 },
  { code: "CREA", name: "Creatinine", nameAr: "الكرياتينين", unit: "mg/dL", refLow: 0.6, refHigh: 1.3, critHigh: 4, price: 40 },
  { code: "K", name: "Potassium", nameAr: "البوتاسيوم", unit: "mmol/L", refLow: 3.5, refHigh: 5.1, critLow: 2.8, critHigh: 6.2, price: 30 },
  { code: "NA", name: "Sodium", nameAr: "الصوديوم", unit: "mmol/L", refLow: 135, refHigh: 145, critLow: 120, critHigh: 160, price: 30 },
  { code: "TROP", name: "Troponin I", nameAr: "تروبونين", unit: "ng/mL", refLow: 0, refHigh: 0.04, critHigh: 0.4, price: 90 },
  { code: "CRP", name: "C-reactive protein", nameAr: "بروتين سي التفاعلي", unit: "mg/L", refLow: 0, refHigh: 5, price: 45 },
  { code: "HBA1C", name: "HbA1c", nameAr: "السكر التراكمي", unit: "%", refLow: 4, refHigh: 5.6, critHigh: 14, price: 70 },
  { code: "ALT", name: "ALT", nameAr: "إنزيم الكبد ALT", unit: "U/L", refLow: 7, refHigh: 56, price: 30 },
  { code: "LACT", name: "Lactate", nameAr: "اللاكتات", unit: "mmol/L", refLow: 0.5, refHigh: 2.2, critHigh: 4, price: 55 },
];

export type RadTest = { code: string; name: string; nameAr: string; modality: string; price: number };

export const RAD_TESTS: RadTest[] = [
  { code: "XR-CHEST", name: "Chest X-ray", nameAr: "أشعة سينية للصدر", modality: "XR", price: 120 },
  { code: "XR-ANKLE", name: "Ankle X-ray", nameAr: "أشعة سينية للكاحل", modality: "XR", price: 100 },
  { code: "XR-WRIST", name: "Wrist X-ray", nameAr: "أشعة سينية للمعصم", modality: "XR", price: 100 },
  { code: "CT-HEAD", name: "CT head (non-contrast)", nameAr: "أشعة مقطعية للرأس", modality: "CT", price: 650 },
  { code: "CT-ABD", name: "CT abdomen and pelvis", nameAr: "أشعة مقطعية للبطن والحوض", modality: "CT", price: 900 },
  { code: "US-ABD", name: "Abdominal ultrasound", nameAr: "سونار البطن", modality: "US", price: 250 },
  { code: "MRI-LSP", name: "MRI lumbar spine", nameAr: "رنين مغناطيسي للفقرات القطنية", modality: "MRI", price: 1100 },
];

export function labByCode(code: string) {
  return LAB_TESTS.find((t) => t.code === code);
}
export function radByCode(code: string) {
  return RAD_TESTS.find((t) => t.code === code);
}

export type ResultFlag = "N" | "L" | "H" | "LL" | "HH";

export function flagResult(value: number, t: { refLow: number; refHigh: number; critLow?: number | null; critHigh?: number | null }): ResultFlag {
  if (t.critHigh != null && value >= t.critHigh) return "HH";
  if (t.critLow != null && value <= t.critLow) return "LL";
  if (value > t.refHigh) return "H";
  if (value < t.refLow) return "L";
  return "N";
}

export const FLAG_TEXT: Record<ResultFlag, { ar: string; en: string }> = {
  N: { ar: "طبيعي", en: "Normal" },
  L: { ar: "منخفض", en: "Low" },
  H: { ar: "مرتفع", en: "High" },
  LL: { ar: "منخفض حرج", en: "Critical low" },
  HH: { ar: "مرتفع حرج", en: "Critical high" },
};
