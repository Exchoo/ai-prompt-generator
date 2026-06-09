"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BsStars, BsLightningCharge, BsClipboard, BsCheck2, BsGem, BsX, 
  BsCodeSlash, BsBriefcase, BsPalette, BsMegaphone, BsCheckSquareFill, BsSquare, BsShieldLock 
} from "react-icons/bs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Header from "../components/Header";

// Typewriter efekti
function useTypewriter(texts: string[], delay = 80, pause = 2000) {
  const [text, setText] = useState("");
  const [index, setIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPremiumPanelOpen, setIsPremiumPanelOpen] = useState(false);

  useEffect(() => {
    const currentText = texts[index];
    if (isDeleting) {
      if (text === "") {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % texts.length);
      } else {
        setTimeout(() => setText(currentText.substring(0, text.length - 1)), delay / 2);
      }
    } else {
      if (text === currentText) {
        setTimeout(() => setIsDeleting(true), pause);
      } else {
        setTimeout(() => setText(currentText.substring(0, text.length + 1)), delay);
      }
    }
  }, [text, isDeleting, index, texts, delay, pause]);

  return text;
}

const CATEGORIES = [
  {
    id: "yazilim",
    title: "Yazılım & Sistem Mimarı",
    icon: <BsCodeSlash />,
    features: [
      { id: "f1", label: "Sistem Panelleri ve Kullanıcı Rolleri" },
      { id: "f2", label: "Veritabanı Şeması (Tablolar ve İlişkiler)" },
      { id: "f3", label: "Teknoloji Yığını ve API Mimarisi" }
    ]
  },
  {
    id: "girisim",
    title: "Girişim & İş Geliştirme",
    icon: <BsBriefcase />,
    features: [
      { id: "f4", label: "Maliyet ve Kar-Zarar Tablosu (Yol Haritası)" },
      { id: "f5", label: "Gelir Modelleri (Monetization)" },
      { id: "f6", label: "Rakip ve Pazar Analizi" }
    ]
  },
  {
    id: "tasarim",
    title: "Ürün Tasarımcısı (UI/UX)",
    icon: <BsPalette />,
    features: [
      { id: "f7", label: "Kullanıcı Yolculuğu (User Journey)" },
      { id: "f8", label: "Renk Paleti ve Tasarım Dili" },
      { id: "f9", label: "Ekran Wireframe Hiyerarşisi" }
    ]
  },
  {
    id: "pazarlama",
    title: "Pazarlama & Büyüme",
    icon: <BsMegaphone />,
    features: [
      { id: "f10", label: "Hedef Kitle Personası" },
      { id: "f11", label: "Lansman ve SEO Stratejisi" },
      { id: "f12", label: "Sosyal Medya İçerik Takvimi" }
    ]
  }
];

export default function HomePage() {
  const [promptInput, setPromptInput] = useState("");
  const [promptOutput, setPromptOutput] = useState("");
  
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  // YENİ: Premium Özel İstek Stateleri
  const [premiumRequests, setPremiumRequests] = useState<string[]>(["", "", ""]);
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [isPremiumPanelOpen, setIsPremiumPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const router = useRouter();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const handleUpgrade = async (planType: string) => {
    setIsCheckoutLoading(true);
    try {
      const response = await fetch('/api/checkout', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planType }) 
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      if (data.url) {
        window.location.href = data.url; 
      }
    } catch (error) {
      console.error("Ödeme ekranı açılamadı:", error);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const placeholders = [
    "Yemeksepeti gibi çok panelli bir teslimat sistemi...",
    "Kahve dükkanı açmak için iş planı...",
    "Yapay zeka tabanlı bir B2B SaaS fikri...",
    "Sürdürülebilir mimari projeler için pazar yeri..."
  ];
  const animatedPlaceholder = useTypewriter(placeholders);

  useEffect(() => {
    const getUserData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUser(authData.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, is_premium') // is_premium çekiliyor
          .eq('id', authData.user.id)
          .single();
          
        if (profile) {
          setCredits(profile.credits);
          setIsPremiumUser(profile.is_premium || false); // YENİ: Premium kontrolü
        }
      } else {
        setUser(null);
        setCredits(null);
        setIsPremiumUser(false);
      }
    };
    getUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => getUserData());
    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleOpenModal = () => setShowUpgradeModal(true);
    window.addEventListener("openUpgradeModal", handleOpenModal);

    const params = new URLSearchParams(window.location.search);
    if (params.get("upgrade") === "true") {
      setShowUpgradeModal(true);
      router.replace("/", { scroll: false });
    }

    return () => {
      window.removeEventListener("openUpgradeModal", handleOpenModal);
    };
  }, [router]);

  const handleCategoryChange = (category: any) => {
    setActiveCategory(category);
    setSelectedFeatures([]);
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  // YENİ: Premium Input Değişim Fonksiyonu
  const handlePremiumRequestChange = (index: number, value: string) => {
    const updated = [...premiumRequests];
    updated[index] = value;
    setPremiumRequests(updated);
  };

  const handleGeneratePrompt = async () => {
    if (!promptInput.trim()) return;
    
    if (credits !== null && credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    setPromptOutput("");

    try {
      const featuresToSend = activeCategory.features
        .filter(f => selectedFeatures.includes(f.id))
        .map(f => f.label);

      // YENİ: Sadece dolu olan premium istekleri filtreleyip API'ye gönderiyoruz
      const premiumToSend = isPremiumUser ? premiumRequests.filter(r => r.trim() !== "") : [];

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          promptInput, 
          selectedAnalyst: activeCategory.title, 
          selectedFeatures: featuresToSend,
          premiumRequests: premiumToSend // Backend'e giden yeni veri
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 402) {
          setShowUpgradeModal(true);
          throw new Error("Krediniz tükendi.");
        }
        throw new Error(data.message);
      }

      setPromptOutput(data.result);
      setCredits(prev => prev !== null ? prev - 1 : prev);
      window.dispatchEvent(new Event("creditsUpdated"));

    } catch (error: any) {
      console.error("Hata:", error);
      if (error.message !== "Krediniz tükendi.") {
        setPromptOutput(error.message || "Beklenmeyen bir hata oluştu.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(promptOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 overflow-hidden font-sans">
      <Header />

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-purple-600/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[35rem] h-[35rem] bg-blue-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[20%] w-[45rem] h-[45rem] bg-cyan-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="z-10 w-full max-w-7xl mx-auto flex flex-col gap-8"
      >
        <div className="text-center space-y-4 mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm text-cyan-300 font-medium mb-4"
          >
            <BsStars className="text-lg" />
            <span>Yapay Zeka Destekli Fikir Motoru</span>
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 drop-shadow-sm">
            Fikrini Mükemmel <br className="hidden md:block"/> Prompt'a Dönüştür
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            Hedefini seç, detayları belirle ve yapay zeka araçları için optimize edilmiş eşsiz bir yol haritası elde et.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full pb-10">
          
          <motion.div 
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="glass-panel rounded-2xl p-6 flex flex-col gap-6 relative group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
            
            <textarea
              className="w-full h-32 sm:h-40 bg-transparent border-none text-white text-lg placeholder-gray-500 focus:ring-0 resize-none outline-none leading-relaxed"
              placeholder={animatedPlaceholder}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
            />

            <div className="space-y-6 mt-auto">
              
              <div>
                <p className="text-sm text-gray-400 mb-3 ml-1 font-medium">1. Uzmanlık Alanı Seçin</p>
                <div className="grid grid-cols-2 gap-3">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 border text-left ${
                        activeCategory.id === cat.id
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className="leading-tight">{cat.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-[120px]">
                <p className="text-sm text-gray-400 mb-3 ml-1 font-medium flex items-center justify-between">
                  <span>2. Özel İstekler (İsteğe Bağlı)</span>
                  <span className="text-xs text-purple-400/70 bg-purple-500/10 px-2 py-1 rounded-md">{selectedFeatures.length} Seçildi</span>
                </p>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeCategory.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-2"
                  >
                    {activeCategory.features.map((feature) => {
                      const isSelected = selectedFeatures.includes(feature.id);
                      return (
                        <button
                          key={feature.id}
                          onClick={() => toggleFeature(feature.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-200 border text-left ${
                            isSelected 
                              ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-100" 
                              : "bg-black/20 border-white/5 text-gray-400 hover:bg-white/5 hover:text-gray-300"
                          }`}
                        >
                          <div className={`text-lg transition-colors ${isSelected ? "text-cyan-400" : "text-gray-500"}`}>
                            {isSelected ? <BsCheckSquareFill /> : <BsSquare />}
                          </div>
                          {feature.label}
                        </button>
                      );
                    })}
                  </motion.div>
                </AnimatePresence>
              </div>

             
              {/* YENİ: AÇILIR-KAPANIR (ACCORDION) PREMIUM ÖZEL İSTEK PANELİ */}
              <div className="mt-4 border-t border-white/5 pt-6 relative">
                {/* Accordion Başlığı / Tetikleyici */}
                <button 
                  onClick={() => {
                    if (!isPremiumUser) {
                      setShowUpgradeModal(true); // Free kullanıcı tıklarsa direkt satın almaya yolla!
                    } else {
                      setIsPremiumPanelOpen(!isPremiumPanelOpen); // Premium ise aç/kapat
                    }
                  }}
                  className="w-full flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-yellow-500/20">
                      <BsGem className="text-[9px]" /> Premium
                    </span>
                    <h4 className="text-sm font-bold text-gray-300 group-hover:text-white transition-colors tracking-wide">Özel Koşul ve Talimatlar (İsteğe Bağlı)</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isPremiumUser && <BsShieldLock className="text-yellow-500/70" />}
                    <div className={`text-gray-500 transition-transform duration-300 ${isPremiumPanelOpen ? 'rotate-180' : ''}`}>
                      ▼
                    </div>
                  </div>
                </button>

                {/* Accordion İçeriği (Sadece açıkken ve Premiumken görünür) */}
                <AnimatePresence>
                  {isPremiumPanelOpen && isPremiumUser && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 grid grid-cols-1 gap-3 bg-black/20 border border-white/5 p-4 rounded-2xl mt-3">
                        {[0, 1, 2].map((idx) => (
                          <input
                            key={idx}
                            type="text"
                            maxLength={150}
                            placeholder={idx === 0 ? 'Örn: Hedef kitlem Z kuşağı girişimcileri olsun.' : idx === 1 ? 'Reklam bütçesi analizi katmanını detaylı ekle.' : 'Risk faktörlerini madde madde analiz et.'}
                            value={premiumRequests[idx]}
                            onChange={(e) => handlePremiumRequestChange(idx, e.target.value)}
                            className="w-full bg-black/40 border border-white/5 focus:border-yellow-500/40 rounded-xl py-2.5 px-4 text-xs sm:text-sm text-gray-200 placeholder-gray-600 outline-none transition-all font-light"
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={user ? handleGeneratePrompt : () => router.push('/auth')}
                disabled={isLoading || (user && !promptInput.trim())}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:ring-4 focus:ring-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 hover:shadow-purple-700/40 transform hover:-translate-y-1 mt-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Fabrika Çalışıyor...</span>
                  </div>
                ) : (
                  <>
                    <BsLightningCharge className="text-lg" />
                    <span>{user ? "Prompt Üret" : "Kullanmak İçin Giriş Yap"}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="glass-panel rounded-2xl p-6 flex flex-col relative h-full min-h-[400px]"
          >
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
              <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <BsStars className="text-purple-400" /> Kopyalamaya Hazır Prompt
              </h3>
              <button
                onClick={handleCopy}
                disabled={!promptOutput}
                className="p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-30 rounded-lg hover:bg-white/10"
                title="Kopyala"
              >
                {copied ? <BsCheck2 className="text-green-400 text-xl" /> : <BsClipboard className="text-lg" />}
              </button>
            </div>

            <div className="flex-grow overflow-auto custom-scrollbar relative">
              {!promptOutput && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 font-light text-center px-8 gap-4">
                  <BsCodeSlash className="text-4xl opacity-20" />
                  <p>Sol taraftan fikrinizi, uzmanlık alanınızı ve özel isteklerinizi belirleyin. ChatGPT'ye emir verecek profesyonel promptunuz burada oluşacaktır.</p>
                </div>
              )}
              {promptOutput && (
                <motion.pre 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-200"
                >
                  {promptOutput}
                </motion.pre>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md cursor-pointer fixed"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className="relative w-full max-w-4xl bg-[#060a13]/90 border border-purple-500/20 rounded-3xl p-6 sm:p-10 text-center shadow-2xl overflow-hidden my-auto"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm" />
              
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full"
              >
                <BsX className="text-xl" />
              </button>

              <div className="mb-8">
                <h3 className="text-3xl font-extrabold text-white mb-2">
                  Planınızı Seçin ve <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Üretmeye Devam Edin</span>
                </h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto font-light">
                  İhtiyacınıza en uygun paketi seçerek Fikir Fabrikası'nın ve topluluğun tüm sınırlarını kaldırın.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mt-4">
                
                <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative group hover:border-blue-500/30 transition-colors">
                  <div>
                    <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 text-xs font-semibold rounded-md uppercase tracking-wider">Kredi Paketi</span>
                    <h4 className="text-xl font-bold text-white mt-3">10 kredi Paketi</h4>
                    <p className="text-gray-400 text-xs mt-1 font-light">Sadece üretim yapmak isteyen bağımsız geliştiriciler için.</p>
                    <div className="mt-4 flex items-baseline text-white">
                      <span className="text-3xl font-extrabold tracking-tight">$5.99</span>
                      <span className="ml-1 text-sm font-semibold text-gray-400">/tek seferlik</span>
                    </div>
                    <ul className="mt-6 space-y-3 text-xs text-gray-300">
                      <li className="flex items-center gap-2"><BsCheck2 className="text-blue-400 text-lg" /> 10 Yeni Prompt Üretim Kredisi</li>
                      <li className="flex items-center gap-2"><BsCheck2 className="text-blue-400 text-lg" /> Tüm Analist Türlerine Erişim</li>
                      <li className="text-gray-500 line-through flex items-center gap-2"><BsX className="text-gray-500 text-lg" /> Forum Premium Rozeti</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleUpgrade("kredi_100")}
                    disabled={isCheckoutLoading}
                    className="w-full mt-8 py-3 bg-white/5 hover:bg-blue-600 hover:text-white text-gray-200 font-medium rounded-xl transition-all text-sm text-center"
                  >
                    Satın Al
                  </button>
                </div>

                <div className="glass-panel border-2 border-purple-500/40 rounded-2xl p-6 flex flex-col justify-between relative shadow-xl shadow-purple-500/5 bg-gradient-to-b from-purple-500/5 to-transparent">
                  <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-lg">En Popüler</div>
                  <div>
                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded-md uppercase tracking-wider">Full Paket (Abonelik)</span>
                    <h4 className="text-xl font-bold text-white mt-3">Premium Pro</h4>
                    <p className="text-gray-400 text-xs mt-1 font-light">Fikirlerini hem üretmek hem de toplulukla büyütmek isteyenler için.</p>
                    <div className="mt-4 flex items-baseline text-white">
                      <span className="text-3xl font-extrabold tracking-tight">$9.99</span>
                      <span className="ml-1 text-sm font-semibold text-gray-400">/aylık</span>
                    </div>
                    <ul className="mt-6 space-y-3 text-xs text-gray-300">
                      <li className="flex items-center gap-2"><BsCheck2 className="text-purple-400 text-lg" /> Her Ay 300 Üretim Kredisi</li>
                      <li className="flex items-center gap-2"><BsCheck2 className="text-purple-400 text-lg" /> Forumda Öne Çıkan Profil & Yorumlar</li>
                      <li className="flex items-center gap-2"><BsCheck2 className="text-purple-400 text-lg" /> Altın "Premium" Üye Rozeti</li>
                      <li className="flex items-center gap-2"><BsCheck2 className="text-purple-400 text-lg" /> Premium Özel Koşul Ekleme Hakkı</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleUpgrade("premium_pro")}
                    disabled={isCheckoutLoading}
                    className="w-full mt-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all text-sm text-center shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  >
                    Hemen Katıl
                  </button>
                </div>

                <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative group hover:border-cyan-500/30 transition-colors">
                  <div>
                    <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-md uppercase tracking-wider">Topluluk Paketi</span>
                    <h4 className="text-xl font-bold text-white mt-3">Forum Özel Üyelik</h4>
                    <p className="text-gray-400 text-xs mt-1 font-light">Kredi ihtiyacı olmayan, sadece networking ve iş geliştirmeye odaklananlar için.</p>
                    <div className="mt-4 flex items-baseline text-white">
                      <span className="text-3xl font-extrabold tracking-tight">$4.99</span>
                      <span className="ml-1 text-sm font-semibold text-gray-400">/aylık</span>
                    </div>
                    <ul className="mt-6 space-y-3 text-xs text-gray-300">
                      <li className="flex items-center gap-2"><BsCheck2 className="text-cyan-400 text-lg" /> Sınırsız Forum Paylaşımı & Yorum</li>
                      <li className="flex items-center gap-2"><BsCheck2 className="text-cyan-400 text-lg" /> Diğer Girişimcilere Özel Mesaj/Yorum</li>
                      <li className="flex items-center gap-2"><BsCheck2 className="text-cyan-400 text-lg" /> Mavi "Topluluk Lideri" Rozeti</li>
                      <li className="text-gray-500 line-through flex items-center gap-2"><BsX className="text-gray-500 text-lg" /> Premium Özel Koşul Hakkı</li>
                    </ul>
                  </div>
                  <button 
                    onClick={() => handleUpgrade("forum_only")}
                    disabled={isCheckoutLoading}
                    className="w-full mt-8 py-3 bg-white/5 hover:bg-cyan-600 hover:text-white text-gray-200 font-medium rounded-xl transition-all text-sm text-center"
                  >
                    Üye Ol
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>       
    </div>
  );
}