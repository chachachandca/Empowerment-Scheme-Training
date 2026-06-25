const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export type AdminUser = {
  id: string | number;
  username: string;
  role: string;
  email?: string;
};

/**
 * Sign in by calling the backend, which checks both the local admins
 * table and the Supabase admins table.
 * Throws if credentials are wrong or user is not an appointed admin.
 */
export async function signInAdmin(email: string, password: string): Promise<AdminUser> {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ username: email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? "Login failed. Check your credentials.");
  }

  const data = (await res.json()) as { admin: AdminUser };
  return data.admin;
}

export async function signOutAdmin(): Promise<void> {
  await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

/**
 * Returns the current admin from the backend session, or null if not authenticated.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return (await res.json()) as AdminUser;
  } catch {
    return null;
  }
}
