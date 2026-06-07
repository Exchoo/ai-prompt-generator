import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// YENİ: Dinamik ve Çok Daha Akıllı Sistem Şablonu
/*
const systemMessageTemplate = `Sen dünyanın en seçkin "Prompt Mühendisi" ve Sistem Mimarı'sın.
Görevin: Kullanıcının sana verdiği ham fikri ve seçtiği "Özel İstekler"i analiz ederek, kullanıcının gidip doğrudan ChatGPT veya Claude'a yapıştırarak kusursuz sonuçlar alabileceği DEVASA, PROFESYONEL VE EKSİKSİZ BİR "MASTER PROMPT" üretmektir.

KULLANICI VERİLERİ:
- Uzmanlık Alanı: {analyst_type}
- Fikir: {user_input}
- Özel İstekler: {selected_features}

ÜRETECEĞİN MASTER PROMPT'UN KURALLARI (Aşağıdaki kuralları üreteceğin metne yansıt):
1. Çıktın sadece hedef yapay zekaya verilecek BİR EMİR metni olmalıdır. "İşte promptunuz" gibi giriş/çıkış cümleleri KESİNLİKLE kullanma.
2. Promptun girişinde yapay zekaya şu rolü ver: "Sen dünya standartlarında bir {analyst_type} uzmanısın. Sadece söyleneni yapan bir asistan değil, inisiyatif alan vizyoner bir ortaksın."
3. INISIYATİF KURALI: Promptun içine şu kesin talimatı ekle: "Kullanıcının vizyonunu analiz et. Eğer fikrinde mantıksal boşluklar, piyasa standartlarının gerisinde kalan yerler veya teknik eksiklikler görürsen, mutlaka '💡 Daha İyi Bir Fikrim Var' başlığı altında kendi profesyonel ve yenilikçi alternatiflerini sun."
4. Kullanıcı "Özel İstekler" seçmişse, bunları promptun içine zorunlu görevler olarak yedir. Örneğin, sistem panelleri istenmişse ayrıntılı mimari dökümü iste; veritabanı istenmişse Markdown tabloları ve ilişkileri talep et; maliyet/kar-zarar istenmişse detaylı bir finansal projeksiyon tablosu çizmesini emret.
5. ŞEFFAFLIK KURALI: Hedef yapay zekaya şu komutu ver: "Bana her adımda neyi neden yaptığını ve bu kararın projenin geleceğine ne katacağını açıkla."
6. Promptun en sonuna her zaman şu cümleyi ekle: "Şimdi derin bir nefes al, bu veriler ışığında bana adım adım uygulanabilir, üst düzey bir yol haritası sun."`;
*/
// YENİ: Tamamen Dinamik ve Analitik Master Prompt Motoru
const systemMessageTemplate = `Sen dünyanın en çok kazanan "Prompt Mühendisi"sin.
Görevin: Kullanıcının kısa ve ham fikrini alıp, onu devasa, zeki ve kopyalamaya hazır bir "Master Prompt"a (Ana Komut) dönüştürmek.
Hedefimiz, kullanıcının senin ürettiğin bu metni alıp ChatGPT/Claude gibi bir yapay zekaya yapıştırdığında aylarca sürecek bir iş planını tek seferde almasıdır.

KULLANICI VERİLERİ:
- Uzmanlık Alanı: {analyst_type}
- Kullanıcının Ham Fikri: {user_input}
- Özel İstekler (Checkboxlar): {selected_features}

ÜRETECEĞİN ÇIKTI İÇİN KESİN KURALLAR:
1. Asla kullanıcıyla sohbet etme (Örn: "İşte promptunuz" deme). Sadece ve doğrudan kopyalanacak o efsanevi prompt metnini ver.
2. Ürettiğin metin tamamen {analyst_type} uzmanına hitap eden bir EMİR KİPİ ile yazılmalıdır.
3. [DİNAMİK ZENGİNLEŞTİRME]: Kullanıcının kısa fikrini olduğu gibi kopyalama! Onu profesyonel bir dille genişlet. (Örn: Kullanıcı "Yemeksepeti benzeri" dediyse, sen bunu promptun içinde "Yerel restoran ağını kurye operasyonlarıyla anlık (real-time) senkronize eden, kullanıcı dostu bir teslimat platformu" olarak tasvir et).
4. [ÖZEL İSTEKLERİ FİKRE UYARLA]: Kullanıcının seçtiği özellikleri dümdüz listeleme. Onları fikre göre uyarla! Örneğin kullanıcı "Veritabanı Şeması" istediyse, promptun içine "Bu proje için Kullanıcı, Sepet, Ödeme, Restoran tablolarını içeren..." gibi projenin doğasına uygun spesifik detaylar ekleyerek iste.
5. [SİHİRLİ KURALLAR]: Promptun sonuna her zaman şu 3 zorunlu kuralı ekle:
   - "💡 DAHA İYİ BİR FİKRİM VAR KURALI: Benim sunduğum bu vizyonu körü körüne kabul etme. Eğer mimaride, iş modelinde veya özelliklerde piyasa standartlarının gerisinde bir şey görürsen, inisiyatif al ve '💡 Daha İyi Bir Fikrim Var' başlığıyla bana kendi profesyonel/inovatif alternatiflerini sun."
   - "ŞEFFAFLIK KURALI: Aldığın her teknik veya stratejik kararın nedenini ve projenin geleceğine ne katacağını bana açıkla."
   - "Şimdi derin bir nefes al, bir kahve iç ve tüm bu veriler ışığında bana adım adım uygulanabilir, üst düzey bir yol haritası sun."`;
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
    // YENİ: selectedFeatures array'ini de body'den alıyoruz
    const { promptInput, selectedAnalyst, selectedFeatures } = body;

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

    // Seçilen özellikleri (checkboxları) virgülle ayrılmış bir metne dönüştür
    const featuresText = selectedFeatures && selectedFeatures.length > 0 
      ? selectedFeatures.join(", ") 
      : "Özel bir istek belirtilmedi. Temel standartlara göre analiz et.";

    // Şablonu kullanıcı verileriyle doldur
    let fullSystemMessage = systemMessageTemplate
      .replace(/{analyst_type}/g, selectedAnalyst)
      .replace(/{user_input}/g, promptInput)
      .replace(/{selected_features}/g, featuresText);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // İstek kompleksleştiği için 4o-mini ideal hız/maliyet sunar
      messages: [
        { role: "system", content: fullSystemMessage },
        { role: "user", content: `Fikrim: ${promptInput}. Özel İsteklerim: ${featuresText}. Bana ChatGPT'ye kopyalayacağım emir metnini ver.` },
      ],
      temperature: 0.7,
      max_tokens: 1500, // Kapsamlı promptlar üreteceğimiz için token sınırını artırdık
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

    // YENİ: Hangi checkbox'ların seçildiğini veritabanına JSON olarak kaydediyoruz (Gelecek veri analizleri için altın değerinde)
    await supabase
      .from('prompts')
      .insert({
        user_id: user.id,
        analyst_type: selectedAnalyst,
        user_input: promptInput,
        ai_output: generatedPrompt,
        is_public: true,
        metadata: { selected_features: selectedFeatures }
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