import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 1. Ağır kütüphaneler (Supabase vs.) kullanmadan sadece Çerezleri (Cookies) okuyoruz
  const cookies = request.cookies.getAll();
  const hasAuthCookie = cookies.some(cookie => cookie.name.includes('-auth-token'));

  // 2. GÜVENLİK KURALLARI
  // Ziyaretçi prompt üretmeye çalışıyorsa engelle
  if (request.nextUrl.pathname.startsWith('/api/generate') && !hasAuthCookie) {
    return NextResponse.json(
      { message: 'Lütfen prompt oluşturmak için giriş yapın.' },
      { status: 401 }
    )
  }

  // Giriş yapmış biri /auth sayfasına giderse ana sayfaya yönlendir
  if (request.nextUrl.pathname.startsWith('/auth') && hasAuthCookie) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Sorun yoksa geçişe izin ver
  return NextResponse.next()
}

// Middleware'in çalışacağı yollar
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}