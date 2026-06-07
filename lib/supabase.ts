import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase ortam değişkenleri (env) eksik. Lütfen .env.local dosyasını kontrol edin.')
}

// createClient yerine createBrowserClient kullanıyoruz!
// Bu sayede giriş yapıldığında oturum bilgisi otomatik olarak Tarayıcı Çerezlerine (Cookies) yazılır.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)