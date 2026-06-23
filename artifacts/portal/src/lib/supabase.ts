import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const PASSPORT_BUCKET = "applicant-passports";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a passport photo file to Supabase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadPassportPhoto(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `passports/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from(PASSPORT_BUCKET)
    .upload(path, file, { upsert: false, contentType: file.type });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(PASSPORT_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
