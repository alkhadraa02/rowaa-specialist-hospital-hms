import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { applicationSchema } from "@/lib/validation";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", fields: parsed.error.flatten().fieldErrors }, { status: 422 });
  }
  const d = parsed.data;
  const job = await prisma.job.findUnique({ where: { id: d.jobId } });
  if (!job || !job.open) return NextResponse.json({ error: "job_closed" }, { status: 404 });
  const row = await prisma.jobApplication.create({
    data: { jobId: d.jobId, name: d.name, email: d.email, phone: d.phone, cover: d.cover || null },
  });
  return NextResponse.json({ ok: true, id: row.id }, { status: 201 });
}
