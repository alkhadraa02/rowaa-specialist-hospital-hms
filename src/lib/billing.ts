export const VAT_RATE = 0.15;
export const COPAY_RATE = 0.2;

export type ChargeLike = { qty: number; unitPrice: number };

const r2 = (n: number) => Math.round(n * 100) / 100;

export function sumCharges(charges: ChargeLike[]) {
  return r2(charges.reduce((s, c) => s + c.qty * c.unitPrice, 0));
}

export function cashInvoice(subtotal: number) {
  const s = r2(subtotal);
  const vat = r2(s * VAT_RATE);
  return { subtotal: s, vat, total: r2(s + vat) };
}

/**
 * Insured encounters: the payer is billed through a claim draft (80% by default);
 * the patient's co-pay share is a cash invoice with 15% VAT.
 */
export function splitBilling(subtotal: number, insured: boolean) {
  const s = r2(subtotal);
  if (!insured) return { claimAmount: 0, invoice: cashInvoice(s), type: "CASH" as const };
  const claimAmount = r2(s * (1 - COPAY_RATE));
  return { claimAmount, invoice: cashInvoice(r2(s - claimAmount)), type: "COPAY" as const };
}
