import { NextResponse } from "next/server";
import { authorize } from "@/lib/session";
import { opsQuestionSchema } from "@/lib/validation";
import { computeOps } from "@/lib/kpis";
import { getAiProvider, AI_LABEL } from "@/lib/ai";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  const auth = await authorize("ai.use");
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === "unauthenticated" ? 401 : 403 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = opsQuestionSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  const { kpis } = await computeOps();
  const provider = getAiProvider();
  const out = await provider.answerOps(parsed.data.question, kpis, parsed.data.lang);
  await audit(auth.user, "AI", "OpsAssistant", null, `Q: ${parsed.data.question.slice(0, 120)} (${out.provider})`);
  return NextResponse.json({ answer: out.text, provider: out.provider, mock: out.mock, label: AI_LABEL[parsed.data.lang] });
}
