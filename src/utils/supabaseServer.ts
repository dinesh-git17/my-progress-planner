import { createClient } from '@supabase/supabase-js';

export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Prevent client-side usage
if (typeof window !== 'undefined') {
  throw new Error(
    'SECURITY ERROR: Cannot use service role key on client-side!',
  );
}

export default supabaseServer;
