"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setLang(formData: FormData) {
  const next = formData.get("lang") === "en" ? "en" : "ar";
  (await cookies()).set("lang", next, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  revalidatePath("/", "layout");
}
