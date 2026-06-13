import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Flux implicite : la session (access_token / refresh_token) arrive
    // dans le fragment d'URL (#access_token=...) après confirmation email.
    // detectSessionInUrl traite ce hash automatiquement au chargement,
    // AVANT que le code applicatif (useEffect) ne s'exécute.
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
})
