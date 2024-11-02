import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

let client: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export const createClient = () => {
  if (client) return client;

  client = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: "public",
      },
      auth: {
        persistSession: false, // Since we're not using auth
      },
    }
  );

  return client;
};
