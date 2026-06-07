"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BsStars, BsLightningCharge, BsClipboard, BsCheck2, BsGem, BsX } from "react-icons/bs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import Header from "../components/Header"; // YENİ: Akıllı Header'ımızı içe aktardık

// Typewriter efekti için custom hook
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

export default function HomePage() {
  const [promptInput, setPromptInput] = useState("");
  const [promptOutput, setPromptOutput] = useState("");
  const [selectedAnalyst, setSelectedAnalyst] = useState("Yazılım Analisti");
  const [responseLength, setResponseLength] = useState("standart");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Ana sayfanın kendi içindeki mantığı için kullanıcı ve kredi durumları (Header kendi içinde de tutuyor)
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const router = useRouter();

  const analystOptions = ["Yazılım Analisti", "İş Analisti", "Girişimci Analisti", "Görsel Analist"];
  
  const placeholders = [
    "Bir mobil yarış oyunu tasarlamak istiyorum...",
    "Kahve dükkanı açmak için iş planı...",
    "Yapay zeka tabanlı bir SaaS fikri...",
    "Sürdürülebilir bir mimari proje konsepti..."
  ];
  const animatedPlaceholder = useTypewriter(placeholders);

  // Oturum Kontrolü (Formu kilitlemek veya açmak için)
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

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      getUserData();
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Prompt Üretme İşlemi (API İsteği)
  const handleGeneratePrompt = async () => {
    if (!promptInput.trim()) return;
    
    if (credits !== null && credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }

    setIsLoading(true);
    setPromptOutput("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptInput, selectedAnalyst, responseLength }),
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
      
      // YENİ: Kredi düştüğünde Header bileşeninin de haberdar olması için sinyal gönderiyoruz
      window.dispatchEvent(new Event("creditsUpdated"));

    } catch (error: any) {
      console.error("Hata:", error);
      if (error.message !== "Krediniz tükendi.") {
        setPromptOutput(error.message || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Panoya Kopyalama İşlemi
  const handleCopy = () => {
    navigator.clipboard.writeText(promptOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start p-4 sm:p-8 overflow-hidden font-sans">
      
      {/* YENİ: Tek satırda tüm Header'ı çağırdık! Eski kalabalık kodlar gitti. */}
      <Header />

      {/* Arka Plan Animasyonları */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
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
            Sadece birkaç kelimeyle fikrini anlat, yapay zeka araçları için optimize edilmiş, detaylı ve profesyonel bir yol haritası elde et.
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
              className="w-full h-48 sm:h-64 bg-transparent border-none text-white text-lg placeholder-gray-500 focus:ring-0 resize-none outline-none leading-relaxed"
              placeholder={animatedPlaceholder}
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
            />

            <div className="space-y-4 mt-auto">
              <div>
                <p className="text-sm text-gray-400 mb-3 ml-1">Uzmanlık Alanı Seçin</p>
                <div className="flex flex-wrap gap-2">
                  {analystOptions.map((analist) => (
                    <button
                      key={analist}
                      onClick={() => setSelectedAnalyst(analist)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
                        selectedAnalyst === analist
                          ? "bg-purple-500/20 border-purple-500/50 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                          : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200"
                      }`}
                    >
                      {analist}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dinamik Buton */}
              <button
                onClick={user ? handleGeneratePrompt : () => router.push('/auth')}
                disabled={isLoading || (user && !promptInput.trim())}
                className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:ring-4 focus:ring-purple-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 hover:shadow-purple-700/40 transform hover:-translate-y-1"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analiz Ediliyor...</span>
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
                <BsStars className="text-purple-400" /> Yapay Zeka Çıktısı
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
                <div className="absolute inset-0 flex items-center justify-center text-gray-600 font-light text-center px-4">
                  Oluşturulan profesyonel prompt burada görüntülenecektir.
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Arka plan bulanıklığı */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpgradeModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            />
            
            {/* Modal İçeriği */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass-panel border border-yellow-500/30 rounded-3xl p-8 text-center overflow-hidden shadow-2xl shadow-yellow-500/10"
            >
              {/* İç Işıklandırma */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent blur-sm opacity-50" />
              
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
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
              
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="mt-4 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Belki daha sonra
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>       
    </div>
  );
}