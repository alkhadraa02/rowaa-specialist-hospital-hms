import { beforeEach, describe, expect, it, vi } from "vitest";

const { create } = vi.hoisted(() => ({
  create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: "msg_12345", ...data })),
}));
vi.mock("@/lib/db", () => ({ prisma: { contactMessage: { create } } }));

import { POST } from "@/app/api/contact/route";

const post = (body: unknown, raw = false) =>
  POST(new Request("http://localhost/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: raw ? (body as string) : JSON.stringify(body) }));

const valid = { name: "سارة العتيبي", email: "sara@example.com", phone: "", subject: "استفسار عن موعد", message: "أرغب في معرفة مواعيد عيادة الجلدية." };

describe("POST /api/contact", () => {
  beforeEach(() => {
    create.mockClear();
  });

  it("stores a valid message and returns 201", async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, id: "msg_12345" });
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].data).toMatchObject({ email: "sara@example.com", phone: null });
  });

  it("rejects malformed JSON with 400", async () => {
    const res = await post("{not json", true);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("invalid_json");
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects invalid fields with 422 and field errors", async () => {
    const res = await post({ ...valid, email: "not-an-email", message: "قصير" });
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe("validation");
    expect(Object.keys(json.fields)).toEqual(expect.arrayContaining(["email", "message"]));
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects oversized messages", async () => {
    const res = await post({ ...valid, message: "x".repeat(2001) });
    expect(res.status).toBe(422);
    expect(create).not.toHaveBeenCalled();
  });
});
