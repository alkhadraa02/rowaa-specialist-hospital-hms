import { prisma } from "./db";
import { dayKey } from "./time";
import { splitBilling, sumCharges } from "./billing";

/**
 * Turn all uninvoiced charges of an encounter into a bill.
 * Insured patients: payer claim draft (80%) + patient co-pay invoice with 15% VAT.
 * Cash patients: one invoice with 15% VAT.
 */
export async function invoiceEncounter(encounterId: string, at: Date = new Date(), markPaid = false) {
  const enc = await prisma.encounter.findUnique({
    where: { id: encounterId },
    include: { patient: true, charges: { where: { invoiced: false } } },
  });
  if (!enc || enc.charges.length === 0) return null;
  const subtotal = sumCharges(enc.charges);
  const insured = Boolean(enc.patient.insurer);
  const split = splitBilling(subtotal, insured);

  const seq = (await prisma.invoice.count()) + 1;
  const number = `INV-${dayKey(at).replace(/-/g, "")}-${String(seq).padStart(4, "0")}`;
  const invoice = await prisma.invoice.create({
    data: {
      number,
      patientId: enc.patientId,
      encounterId: enc.id,
      type: split.type,
      subtotal: split.invoice.subtotal,
      vat: split.invoice.vat,
      total: split.invoice.total,
      status: markPaid ? "PAID" : "ISSUED",
      paidAt: markPaid ? at : null,
      createdAt: at,
    },
  });
  let claim = null;
  if (insured && split.claimAmount > 0) {
    const cseq = (await prisma.claim.count()) + 1;
    claim = await prisma.claim.create({
      data: {
        number: `CLM-${dayKey(at).replace(/-/g, "")}-${String(cseq).padStart(4, "0")}`,
        patientId: enc.patientId,
        encounterId: enc.id,
        insurer: enc.patient.insurer!,
        amount: split.claimAmount,
        status: "DRAFT",
        createdAt: at,
      },
    });
  }
  await prisma.charge.updateMany({ where: { encounterId: enc.id, invoiced: false }, data: { invoiced: true } });
  return { invoice, claim };
}
