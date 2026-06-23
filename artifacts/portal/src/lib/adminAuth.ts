import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

const ADMIN_EMAILS: string[] = (import.meta.env.VITE_ADMIN_EMAILS as string ?? "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * Sign in with Supabase Auth.
 * Throws if credentials are wrong OR if the user is not in the admin whitelist.
 */
export async function signInAdmin(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) throw new Error(error.message);

  if (!isAdminEmail(data.user?.email)) {
    await supabase.auth.signOut();
    throw new Error("You are not authorized to access the admin portal.");
  }

  return data.user;
}

export async function signOutAdmin(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Returns the current Supabase session user if they are an authorized admin,
 * otherwise returns null.
 */
export async function getAdminUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  if (!isAdminEmail(session.user.email)) {
    await supabase.auth.signOut();
    return null;
  }
  return session.user;
}
