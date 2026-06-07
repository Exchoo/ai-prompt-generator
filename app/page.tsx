"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BsStars, BsLightningCharge, BsClipboard, BsCheck2, BsGem, BsX, 
  BsCodeSlash, BsBriefcase, BsPalette, BsMegaphone, BsCheckSquareFill, BsSquare 
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

// YENİ: Profesyonel Kategoriler ve Alt Hedefler (Checkboxlar)
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
  
  // YENİ: Dinamik Seçim Stateleri
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const router = useRouter();

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
          .select('credits')
          .eq('id', authData.user.id)
          .single();
        if (profile) setCredits(profile.credits);
      } else {
        setUser(null);
        setCredits(null);
      }
    };
    getUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => getUserData());
    return () => authListener.subscription.unsubscribe();
  }, []);

  // Kategori değiştiğinde checkbox'ları sıfırla
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

  const handleGeneratePrompt = async () => {
    if (!promptInput.trim()) return;
    
    if (credits !== null && credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    setPromptOutput("");

    try {
      // YENİ: Seçilen özellikleri bulup API'ye gönderiyoruz
      const featuresToSend = activeCategory.features
        .filter(f => selectedFeatures.includes(f.id))
        .map(f => f.label);

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          promptInput, 
          selectedAnalyst: activeCategory.title, 
          selectedFeatures: featuresToSend // Artık bu veriler backend'e akıyor!
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

      {/* Arka Plan Animasyonları */}
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
        {/* Başlık Alanı */}
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

        {/* Ana İçerik Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full pb-10">
          
          {/* Sol Panel: Girdi Alanı */}
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
              
              {/* Kategori Seçimi */}
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

              {/* Dinamik Checkboxlar */}
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

              <button
                onClick={user ? handleGeneratePrompt : () => router.push('/auth')}
                disabled={isLoading || (user && !promptInput.trim())}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:ring-4 focus:ring-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 hover:shadow-purple-700/40 transform hover:-translate-y-1"
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

          {/* Sağ Panel: Çıktı Alanı */}
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

      {/* PREMIUM YÜKSELTME MODALI */}
      <AnimatePresence>
        {showUpgradeModal && (
          // Modal Kodu Tamamen Aynı Kaldı
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUpgradeModal(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm glass-panel border border-yellow-500/30 rounded-3xl p-8 text-center overflow-hidden shadow-2xl shadow-yellow-500/10">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent blur-sm opacity-50" />
              <button onClick={() => setShowUpgradeModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                <BsX className="text-2xl" />
              </button>
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 mb-6 transform rotate-12">
                <BsGem className="text-3xl text-white transform -rotate-12" />
              </div>
              <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500 mb-2">
                Krediniz Tükendi
              </h3>
              <p className="text-gray-300 text-sm mb-8 font-light leading-relaxed">
                Harika fikirler üretiyorsunuz! Fikir Fabrikasını kullanmaya devam etmek ve Premium özelliklerin kilidini açmak için hesabınızı yükseltin.
              </p>
              <button className="w-full py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                <BsLightningCharge />
                Premium'a Geç (Yakında)
              </button>
              <button onClick={() => setShowUpgradeModal(false)} className="mt-4 text-sm text-gray-400 hover:text-white transition-colors">
                Belki daha sonra
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>       
    </div>
  );
}