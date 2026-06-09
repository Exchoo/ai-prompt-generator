import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia', //stripe api versiyonunu güncelledik, yeni özellikler ve güvenlik iyileştirmeleri için
});

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {}
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ message: 'Lütfen önce giriş yapın.' }, { status: 401 });
    }

    const { planType } = await request.json();

    let priceId = '';
    let mode: 'payment' | 'subscription' = 'subscription'; // Varsayılan abonelik

    // Gelen plan tipine göre Price ID ve Modu belirliyoruz
    switch (planType) {
      case 'kredi_100':
        priceId = process.env.NEXT_PUBLIC_STRIPE_CREDIT_PRICE_ID!;
        mode = 'payment'; // Kredi paketi tek seferliktir!
        break;
      case 'premium_pro':
        priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!;
        mode = 'subscription'; // Aylık
        break;
      case 'forum_only':
        priceId = process.env.NEXT_PUBLIC_STRIPE_FORUM_PRICE_ID!;
        mode = 'subscription'; // Aylık
        break;
      default:
        return NextResponse.json({ message: 'Geçersiz paket türü.' }, { status: 400 });
    }

    if (!priceId) {
      return NextResponse.json({ message: 'Fiyat ID bulunamadı. Lütfen sistem yöneticisiyle görüşün.' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode, // Dinamik Mod (payment veya subscription)
      success_url: `${appUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?canceled=true`,
      client_reference_id: user.id, // Supabase User ID'sini Stripe'a gömüyoruz (Webhook için çok önemli)
      metadata: {
        user_id: user.id,
        plan_type: planType // Hangi paketin alındığını webhook'a söylüyoruz
      }
    });

    return NextResponse.json({ url: session.url }, { status: 200 });

  } catch (error: any) {
    console.error('Stripe Checkout Hatası:', error);
    return NextResponse.json({ message: 'Ödeme sayfası oluşturulamadı.' }, { status: 500 });
  }
}