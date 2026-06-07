import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
//Web uygulamalarında güvenlik duvarı Middleware (Ara Katman) ile örülür. Kullanıcı bir sayfaya veya API'ye gitmek istediğinde, istek önce Middleware'e çarpar. Middleware, "Bu kişinin bileti (giriş izni) var mı?" diye bakar. Varsa geçirir, yoksa kapıdan geri çevirir.
export async function middleware(request: NextRequest) {
  // 1. İsteği bir sonraki adıma iletmek için hazırlık yap
  let supabaseResponse = NextResponse.next({
    request,
  })

  // 2. Supabase SSR İstemcisini oluştur (Çerezleri/Cookies okumak için)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Kullanıcının oturum durumunu (Token) kontrol et
  const { data: { user } } = await supabase.auth.getUser()

  // --- GÜVENLİK KURALLARI ---

  // Kural 1: Ziyaretçi API'ye istek atmaya çalışıyorsa engelle! (401 Unauthorized)
  if (request.nextUrl.pathname.startsWith('/api/generate') && !user) {
    return NextResponse.json(
      { message: 'Lütfen prompt oluşturmak için giriş yapın.' },
      { status: 401 }
    )
  }

  // Kural 2: Zaten giriş yapmış kullanıcı /auth sayfasına girmek isterse ana sayfaya at
  if (request.nextUrl.pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Her şey yolundaysa isteğin geçmesine izin ver
  return supabaseResponse
}

// Middleware'in hangi sayfalarda çalışacağını belirliyoruz
// (Statik dosyalar, resimler ve Next.js iç dosyaları hariç her yerde çalışır)
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}