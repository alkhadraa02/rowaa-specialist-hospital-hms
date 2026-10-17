import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { contactSchema } from "@/lib/validation";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const d = parsed.data;
  const row = await prisma.contactMessage.create({
    data: { name: d.name, email: d.email, phone: d.phone || null, subject: d.subject, message: d.message },
  });
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
