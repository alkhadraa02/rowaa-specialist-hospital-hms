// Smoke test for the HMS staff login and a few protected pages (default http://127.0.0.1:3120).
// Reads ADMIN_EMAIL / ADMIN_PASSWORD from the environment (see .env.example).
// Usage: node --env-file=.env scripts/smoke-hms.mjs [baseUrl]
const base = process.argv[2] || "http://127.0.0.1:3120";
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error("FAIL: set ADMIN_EMAIL and ADMIN_PASSWORD (node --env-file=.env ...)");
  process.exit(1);
}

let failed = false;
const check = (ok, msg) => {
  console.log(ok ? "ok:" : "FAIL:", msg);
  if (!ok) failed = true;
};

const page = await (await fetch(`${base}/hms/login`)).text();
const actionField = page.match(/name="(\$ACTION_ID_[^"]+)"/);
check(!!actionField, "login form exposes a server action");

if (actionField) {
  const fd = new FormData();
  fd.append(actionField[1], "");
  fd.append("email", email);
  fd.append("password", password);
  const res = await fetch(`${base}/hms/login`, { method: "POST", body: fd, redirect: "manual" });
  const cookies = res.headers.getSetCookie().map((c) => c.split(";")[0]);
  check(res.status === 303 && (res.headers.get("location") || "").endsWith("/hms"), `login redirects to /hms (status ${res.status})`);
  check(cookies.length > 0, "session cookie issued");

  const cookie = cookies.join("; ");
  for (const p of ["/hms", "/hms/patients", "/hms/er", "/hms/beds", "/hms/appointments", "/hms/encounters", "/hms/orders", "/hms/pharmacy", "/hms/billing", "/hms/audit"]) {
    const r = await fetch(`${base}${p}`, { headers: { cookie }, redirect: "manual" });
    check(r.status === 200, `${p} => ${r.status}`);
  }

  const t = await fetch(`${base}/api/hms/triage`, {
    method: "POST",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ complaint: "chest pain", ageYears: 62, vitals: { hr: 130, sbp: 85, rr: 26, spo2: 90, temp: 37.2 }, lang: "en" }),
  });
  const tj = await t.json().catch(() => ({}));
  check(t.status === 200, `triage API => ${t.status} ${JSON.stringify(tj).slice(0, 160)}`);
}

process.exit(failed ? 1 : 0);
