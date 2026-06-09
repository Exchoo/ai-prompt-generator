import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia', 
});

// Güvenliği aşarak doğrudan veritabanına veri yazabilmek için Service Role Key kullanıyoruz
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // DİKKAT: Bu key env dosyasında olmalı!
);

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    // Webhook'un gerçekten Stripe'dan geldiğini doğruluyoruz (Siber Güvenlik)
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error(`Webhook imza hatası: ${error.message}`);
    return NextResponse.json({ error: 'Geçersiz İmza' }, { status: 400 });
  }

  try {
    // 1. İLK KEZ SATIN ALMA VEYA ABONELİK BAŞLATMA
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id; // Bizim sistemdeki user.id
      const planType = session.metadata?.plan_type;

      if (userId && planType) {
        let addedCredits = 0;
        let isPremium = false;
        let tier = 'free';

        if (planType === 'kredi_100') { addedCredits = 100; tier = 'free'; }
        if (planType === 'premium_pro') { addedCredits = 300; isPremium = true; tier = 'pro'; }
        if (planType === 'forum_only') { addedCredits = 0; isPremium = true; tier = 'forum_leader'; }

        // Mevcut krediyi öğren
        const { data: profile } = await supabaseAdmin.from('profiles').select('credits').eq('id', userId).single();
        const currentCredits = profile?.credits || 0;

        // Kullanıcının paketini ve kredisini güncelle
        await supabaseAdmin.from('profiles').update({
          credits: currentCredits + addedCredits,
          is_premium: isPremium,
          subscription_tier: tier,
        }).eq('id', userId);
      }
    }

    // 2. HER AY ABONELİK YENİLENDİĞİNDE (OTOMATİK KREDİ YÜKLEME)
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Faturanın abonelik yenilemesinden geldiğini doğrula (ilk ödeme değilse)
      if (invoice.billing_reason === 'subscription_cycle') {
        // Stripe Müşteri ID'si üzerinden bizim veritabanındaki kullanıcıyı bulmamız gerekir.
        // V1.0 için bu adım manuel de yönetilebilir ancak kod altyapısı buradadır.
        // Not: Gerçek hayatta checkout anında 'stripe_customer_id'yi profiles tablosuna kaydetmek gerekir.
        console.log("Abonelik yenilendi. Fatura ID:", invoice.id);
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook İşleme Hatası:', error);
    return NextResponse.json({ error: 'Webhook işlenemedi' }, { status: 500 });
  }
}