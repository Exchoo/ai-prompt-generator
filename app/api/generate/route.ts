import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// OpenAI istemcisini başlat
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// FİKİR FABRİKASI: Yapay Zeka Sistem Promptu (Senin vizyonuna göre optimize edildi)
const systemMessageTemplate = `Sen dünya standartlarında bir Prompt Mühendisi ve {analist} uzmanısın. 
Kullanıcının sana verdiği kısa ve ham fikri (Örn: "Mobil oyun yapmak istiyorum") alıp, kullanıcının gidip doğrudan başka bir yapay zekaya (ChatGPT, Claude) yapıştırarak muazzam sonuçlar alabileceği, kopyalamaya hazır PROFESYONEL BİR PROMPT'a dönüştürmelisin.

KURALLAR:
1. Kesinlikle kullanıcıyla sohbet etme. "İşte promptunuz", "Merhaba" gibi giriş/çıkış cümleleri KULLANMA.
2. Çıktın tamamen ChatGPT'ye verilecek bir EMİR formatında olmalı.
3. Kullanıcının eksik bıraktığı detayları köşeli parantez içinde [Buraya Hedef Kitlenizi Yazın] gibi doldurulabilir alanlar olarak bırak.
4. Hedef kitle, gelir modeli, teknoloji yığını, pazarlama stratejisi gibi başlıkları promptun içine analitik bir şekilde yerleştir.
5. Promptun en sonuna her zaman şu cümleyi ekle: "Bu veriler ışığında bana adım adım uygulanabilir bir yol haritası sun."

ÖRNEK ÇIKTI FORMATI:
"Sen uzman bir {analist}'sin. Sana sunduğum şu fikir üzerinde çalışmanı istiyorum: 'KULLANICININ FİKRİ'. 
Lütfen bu fikri aşağıdaki kriterlere göre analiz et:
- Hedef Kitle: [Hedef kitle detayları eklenecek]
- Gelir Modeli: [Örn: Abonelik, reklam vb.]
...
Bu veriler ışığında bana adım adım uygulanabilir bir yol haritası sun."`;

export async function POST(request: Request) {
  try {
    // 1. Supabase SSR İstemcisini Kur ve Oturumu Kontrol Et
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
      return NextResponse.json({ message: 'Yetkisiz işlem. Lütfen giriş yapın.' }, { status: 401 });
    }

    // 2. İstek Verilerini (Body) Al
    const body = await request.json();
    const { promptInput, selectedAnalyst, responseLength } = body;

    if (!promptInput || !selectedAnalyst) {
      return NextResponse.json({ message: 'Eksik bilgi gönderildi.' }, { status: 400 });
    }

    // 3. Veritabanından Kullanıcının Kredisini Kontrol Et
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ message: 'Kullanıcı profili bulunamadı.' }, { status: 404 });
    }

    if (profile.credits <= 0) {
      return NextResponse.json(
        { message: 'Krediniz bitmiştir. Lütfen yarın tekrar deneyin veya hesabınızı yükseltin.' },
        { status: 402 } // 402: Payment Required (Kredi Bitti)
      );
    }

    // 4. OpenAI API'sine İsteği Gönder (Fikir Fabrikası Devrede)
    const fullSystemMessage = systemMessageTemplate.replace('{analist}', selectedAnalyst);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Maksimum performans / minimum maliyet
      messages: [
        { role: "system", content: fullSystemMessage },
        { role: "user", content: promptInput },
      ],
      temperature: 0.7,
      max_tokens: responseLength === 'uzun' ? 1024 : 512,
    });
    
    const generatedPrompt = completion.choices[0].message.content;

    // 5. BAŞARILI SONUÇ: Veritabanı İşlemlerini Yap (Kredi Düş, Log Tut, Promptu Kaydet)
    
    // 5.1: Krediyi 1 Düşür
    await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    // 5.2: Kredi Logu Tut (Ne zaman, kime, ne için kredi harcandı?)
    await supabase
      .from('credit_logs')
      .insert({
        user_id: user.id,
        amount: -1,
        action: 'generate_prompt'
      });

    // 5.3: Gelecekteki "Topluluk/Keşfet" sekmesi için promptu kaydet
    await supabase
      .from('prompts')
      .insert({
        user_id: user.id,
        analyst_type: selectedAnalyst,
        user_input: promptInput,
        ai_output: generatedPrompt,
        is_public: true, // Şimdilik hepsi public, V2'de premiumlar gizleyebilecek
        metadata: { response_length: responseLength }
      });

    // 6. Sonucu Frontend'e Gönder
    return NextResponse.json({ result: generatedPrompt }, { status: 200 });

  } catch (error: any) {
    console.error('API Hatası:', error);
    return NextResponse.json(
      { message: 'İşlem sırasında bir hata oluştu.', error: error.message },
      { status: 500 }
    );
  }
}