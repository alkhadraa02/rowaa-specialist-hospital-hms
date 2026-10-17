import { NextResponse } from "next/server";
import { authorize } from "@/lib/session";
import { triageRequestSchema } from "@/lib/validation";
import { suggestTriage, formatReasons, TRIAGE_LABELS } from "@/lib/triage";
import { getAiProvider, AI_LABEL } from "@/lib/ai";
import { audit } from "@/lib/audit";

/** Deterministic triage suggestion; `?explain=1` adds an AI explanation. Always a suggestion, never a decision. */
export async function POST(req: Request) {
  const auth = await authorize("er.manage");
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.error === "unauthenticated" ? 401 : 403 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = triageRequestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "validation", issues: parsed.error.issues.map((i) => i.message) }, { status: 400 });
  const { complaint, ageYears, vitals, lang } = parsed.data;
  const result = suggestTriage({ ageYears, complaint, vitals });
  const payload: Record<string, unknown> = {
    level: result.level,
    label: TRIAGE_LABELS[result.level],
    reasons: formatReasons(result.reasons, lang),
    requiresConfirmation: true,
  };
  if (new URL(req.url).searchParams.get("explain") === "1") {
    if (!("user" in auth) || !(await import("@/lib/rbac")).can(auth.user.role, "ai.use")) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    const out = await getAiProvider().explainTriage({ level: result.level, reasons: formatReasons(result.reasons, lang), complaint, ageYears, vitals, lang });
    payload.ai = { text: out.text, provider: out.provider, mock: out.mock, label: AI_LABEL[lang] };
    await audit(auth.user, "AI", "TriagePreview", null, `AI triage explanation (${out.provider})`);
  }
  return NextResponse.json(payload);
}
