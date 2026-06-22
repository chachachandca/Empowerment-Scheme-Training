import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const PASSPORT_BUCKET = "applicant-passports";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  if (!_client) {
    _client = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

/**
 * Upload a passport photo file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 * Throws on failure.
 */
export async function uploadPassportPhoto(file: File): Promise<string> {
  const client = getClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `passports/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await client.storage
    .from(PASSPORT_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = client.storage.from(PASSPORT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
