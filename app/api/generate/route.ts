import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// UZMANLIK ALANINA GÖRE ÖZELLEŞTİRİLMİŞ PROMPT SÖZLÜĞÜ
const EXPERT_PROMPTS: Record<string, string> = {
  "Yazılım & Sistem Mimarı": `Sen dünyanın en çok kazanan "Yazılım ve Sistem Mimarı"sın.
Görevin: Kullanıcının fikrini alıp, frontend, backend, veritabanı şeması ve API yapısını içeren devasa bir teknik "Master Prompt"a dönüştürmek.
ÖZEL KURALLAR: Çıktında mutlaka veri tablolarını (ilişkileriyle birlikte), kullanılacak teknoloji yığınını (Tech Stack) ve güvenlik/ölçeklenebilirlik katmanlarını emret. Yazılım mimarisi dışında gereksiz pazarlama terimlerine girme.`,

  "Girişim & İş Geliştirme": `Sen silikon vadisinin en acımasız "Girişim ve İş Geliştirme (BizDev) Uzmanı"sın.
Görevin: Kullanıcının ham fikrini alıp; gelir modelleri, pazar analizi, B2B/B2C metrikleri ve yatırımcı sunumu (Pitch Deck) kıvamında bir "Master Prompt"a dönüştürmek.
ÖZEL KURALLAR: Çıktında mutlaka aylık yakım hızı (Burn Rate), CAC (Müşteri Edinme Maliyeti) LTV tahminleri ve SWOT analizini zorunlu kıl. Fikrin nerede batabileceğini sorgulayan risk analizleri eklet.`,

  "Ürün Tasarımcısı (UI/UX)": `Sen Apple ve Airbnb standartlarında çalışan bir "Ürün Tasarımcısı (UI/UX)"sın.
Görevin: Kullanıcının fikrini alıp; kullanıcı yolculuğu (User Journey Map), ekran hiyerarşileri, renk paleti psikolojisi ve Wireframe yapısını içeren bir "Master Prompt"a dönüştürmek.
ÖZEL KURALLAR: Çıktında onboarding (sisteme alışma) sürecindeki pürüzleri nasıl sıfıra indireceğini, empty state (boş ekran) tasarımlarını ve renk kodlarını (HEX) zorunlu olarak iste.`,

  "Pazarlama & Büyüme": `Sen dünyaca ünlü bir "Growth Hacker ve Pazarlama Dehası"sın.
Görevin: Kullanıcının fikrini alıp; lansman stratejisi, SEO, sosyal medya hunisi (Funnel) ve viral büyüme döngülerini (Viral Loop) içeren bir "Master Prompt"a dönüştürmek.
ÖZEL KURALLAR: Çıktında hedef kitle personasını (yaş, ilgi alanı, acı noktası), haftalık içerik takvimini ve düşük bütçeli gerilla pazarlama taktiklerini zorunlu olarak emret.`
};

// ORTAK VE TEMEL KURALLAR (Her promptun sonuna eklenir)
const BASE_RULES = `
KULLANICI VERİLERİ:
- Kullanıcının Ham Fikri: {user_input}
- Modüller: {selected_features}

ÜRETECEĞİN ÇIKTI İÇİN KESİN KURALLAR:
1. Asla kullanıcıyla sohbet etme. Sadece kopyalanacak o efsanevi prompt metnini ver.
2. Ürettiğin metin tamamen bir yapay zekaya hitap eden EMİR KİPİ ile yazılmalıdır.
3. [DİNAMİK ZENGİNLEŞTİRME]: Kullanıcının kısa fikrini genişlet ve vizyon kat!
4. [SİHİRLİ KURALLAR]: Promptun sonuna şu 3 zorunlu kuralı ekle:
   - "💡 DAHA İYİ BİR FİKRİM VAR: Benim sunduğum bu vizyonu körü körüne kabul etme. Eksik görürsen inisiyatif al ve alternatif sun."
   - "ŞEFFAFLIK: Kararlarının nedenini bana açıkla."
   - "Şimdi derin bir nefes al, tüm bu veriler ışığında adım adım uygulanabilir haritayı sun."`;


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
      return NextResponse.json({ message: 'Lütfen prompt oluşturmak için giriş yapın.' }, { status: 401 });
    }

    const body = await request.json();
    // YENİ: premiumRequests verisini de body'den alıyoruz
    const { promptInput, selectedAnalyst, selectedFeatures, premiumRequests } = body;

    if (!promptInput || !selectedAnalyst) {
      return NextResponse.json({ message: 'Eksik bilgi gönderildi.' }, { status: 400 });
    }

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
        { message: 'Krediniz bitmiştir. Lütfen hesabınızı yükseltin.' },
        { status: 402 } 
      );
    }

    const featuresText = selectedFeatures && selectedFeatures.length > 0 
      ? selectedFeatures.join(", ") 
      : "Özel bir istek belirtilmedi. Temel standartlara göre analiz et.";

   // Seçilen kategoriye ait özel prompt şablonunu çek, bulamazsa default bir metin ver
    const expertTemplate = EXPERT_PROMPTS[selectedAnalyst] || EXPERT_PROMPTS["Girişim & İş Geliştirme"];
    
    // Uzmanlık şablonu ile temel kuralları birleştir
    let fullSystemMessage = expertTemplate + BASE_RULES
      .replace(/{user_input}/g, promptInput)
      .replace(/{selected_features}/g, featuresText);

    // YENİ: EĞER PREMIUM İSTEK VARSA ŞABLONUN SONUNA ENJEKTE ET
    if (premiumRequests && premiumRequests.length > 0) {
      fullSystemMessage += `\n\n⚠️ [KRİTİK PREMIUM KULLANICI TALEPLERİ]:
Aşağıdaki maddeler doğrudan projenin sahibinin sana ilettiği "Özel İstekler"dir. Bu kurallara KESİNLİKLE uymalı, analizi bu talepler etrafında şekillendirmelisin:
${premiumRequests.map((req: string, i: number) => `${i + 1}. ${req}`).join("\n")}`;
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        { role: "system", content: fullSystemMessage },
        { role: "user", content: `Fikrim: ${promptInput}. Özel İsteklerim: ${featuresText}. Bana ChatGPT'ye kopyalayacağım emir metnini ver.` },
      ],
      temperature: 0.7,
      max_tokens: 1500, 
    });
    
    const generatedPrompt = completion.choices[0].message.content;

    await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id);

    await supabase
      .from('credit_logs')
      .insert({
        user_id: user.id,
        amount: -1,
        action: 'generate_prompt'
      });

    // YENİ: premium_requests array'ini metadata json objesine kaydediyoruz ki detay sayfasında sergileyebilelim!
    await supabase
      .from('prompts')
      .insert({
        user_id: user.id,
        analyst_type: selectedAnalyst,
        user_input: promptInput,
        ai_output: generatedPrompt,
        is_public: true,
        metadata: { 
          selected_features: selectedFeatures,
          premium_requests: premiumRequests || [] 
        }
      });

    return NextResponse.json({ result: generatedPrompt }, { status: 200 });

  } catch (error: any) {
    console.error('API Hatası:', error);
    return NextResponse.json(
      { message: 'İşlem sırasında bir hata oluştu.', error: error.message },
      { status: 500 }
    );
  }
}