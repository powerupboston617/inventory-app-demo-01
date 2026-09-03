"use server";

import { signIn, signOut } from "@/auth";
import { safeFrom } from "@/lib/guards";
import { field } from "@/lib/utils";

export type AuthActionResult = { error?: string };

export async function passwordLogin(formData: FormData): Promise<AuthActionResult> {
  const email = field(formData, "email")?.toLowerCase();
  const password =
    typeof formData.get("password") === "string"
      ? (formData.get("password") as string)
      : "";
  const from = field(formData, "from") ?? "/";
  if (!email || !password) return { error: "Enter your email and password." };

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: safeFrom(from),
    });
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return { error: "Email or password is not right." };
  }
  return { error: "Email or password is not right." };
}

export async function googleLogin(from?: string) {
  await signIn("google", { redirectTo: safeFrom(from) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}
