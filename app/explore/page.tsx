"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import { 
  BsStars, BsPersonCircle, BsClipboard, BsCheck2, BsSearch, BsFilter,
  BsFire, BsChatText, BsHeartFill, BsEye, BsShieldLock, BsX, BsGem
} from "react-icons/bs";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExplorePage() {
  const router = useRouter();
  const [prompts, setPrompts] = useState<any[]>([]);
  const [trendingPrompts, setTrendingPrompts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filtreleme Stateleri (Artık Trendler filtre değil, vitrin. Varsayılan "newest")
  const [activeFilter, setActiveFilter] = useState<"newest" | "most_liked" | "most_commented" | "most_viewed">("newest");
  const [isPremiumUser, setIsPremiumUser] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  useEffect(() => {
    checkUserStatusAndFetch();
  }, []);

  const checkUserStatusAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('is_premium').eq('id', user.id).single();
      if (profile) setIsPremiumUser(profile.is_premium || false);
    }
    fetchPrompts();
  };

  const fetchPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          profiles ( email, username, avatar_url, is_premium, subscription_tier ),
          likes ( id ),
          comments ( id )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Verileri Matematiksel Olarak İşliyoruz
      const processedData = (data || []).map(p => {
        const likesCount = p.likes ? p.likes.length : 0;
        const commentsCount = p.comments ? p.comments.length : 0;
        const viewsCount = p.views || 0;
        
        // Trend Skoru
        const trendScore = viewsCount + (likesCount * 3) + (commentsCount * 5);
        
        return { ...p, likesCount, commentsCount, viewsCount, trendScore };
      });

      // VİTRİN İÇİN: En yüksek trend skoruna sahip İLK 3 promptu ayır
      const sortedByTrend = [...processedData].sort((a, b) => b.trendScore - a.trendScore);
      setTrendingPrompts(sortedByTrend.slice(0, 3));
      
      // ARŞİV İÇİN: Tüm promptlar (İstersen trendleri buradan çıkarabilirsin ama tutmak arşivi tam gösterir)
      setPrompts(processedData);
    } catch (error) {
      console.error("Keşfet verileri çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // PREMIUM KONTROLLÜ FİLTRE SİSTEMİ
  const handleFilterChange = (filterType: "newest" | "most_liked" | "most_commented" | "most_viewed") => {
    if (filterType !== "newest" && !isPremiumUser) {
      setShowUpgradeModal(true); // Premium Tuzağı!
      return;
    }
    setActiveFilter(filterType);
  };

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
      if (data.url) window.location.href = data.url; 
    } catch (error) {
      console.error("Ödeme ekranı açılamadı:", error);
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  // Ana Izgara (Grid) İçin Filtreleme İşlemi
  let displayedPrompts = prompts.filter(prompt => 
    prompt.user_input?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    prompt.profiles?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeFilter === "most_liked") displayedPrompts.sort((a, b) => b.likesCount - a.likesCount);
  if (activeFilter === "most_commented") displayedPrompts.sort((a, b) => b.commentsCount - a.commentsCount);
  if (activeFilter === "most_viewed") displayedPrompts.sort((a, b) => b.viewsCount - a.viewsCount);
  if (activeFilter === "newest") displayedPrompts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="relative min-h-screen flex flex-col p-4 sm:p-8 overflow-hidden font-sans pb-24">
      <Header />

      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-purple-600/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[10%] left-[-10%] w-[35rem] h-[35rem] bg-cyan-600/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <div className="z-10 w-full max-w-7xl mx-auto flex flex-col gap-10 mt-8">
        
        {/* ================= MERKEZİ BAŞLIK VE ARAMA ================= */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto w-full space-y-6">
          <div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
              Topluluğu <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Keşfet</span>
            </h1>
            <p className="text-gray-400 text-sm md:text-base font-light">
              Fikir Fabrikası ekosistemindeki en parlak zihinlerin ürettiği yapay zeka analizlerini ve iş planlarını inceleyin.
            </p>
          </div>
          
          <div className="relative w-full group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <BsSearch className="text-gray-500 group-focus-within:text-purple-400 transition-colors text-lg" />
            </div>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-full py-4 pl-14 pr-6 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all shadow-2xl shadow-black/20 text-sm"
              placeholder="İş fikri veya yazar adı arayın..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* ================= 🔥 HAFTANIN TRENDLERİ (AFİLLİ VİTRİN KARTLARI) ================= */}
        {!searchQuery && trendingPrompts.length > 0 && (
          <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BsFire className="text-orange-500 text-2xl" /> Haftanın Trendleri
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trendingPrompts.map((prompt, index) => (
                <Link href={`/explore/${prompt.id}`} key={`trend-${prompt.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="glass-panel border-2 border-orange-500/20 hover:border-orange-500/50 rounded-2xl p-6 flex flex-col gap-4 group transition-all duration-300 relative overflow-hidden bg-gradient-to-br from-orange-500/5 to-transparent h-full shadow-[0_0_20px_rgba(249,115,22,0.05)] hover:shadow-[0_0_30px_rgba(249,115,22,0.15)] hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] group-hover:bg-orange-500/20 transition-colors pointer-events-none" />
                    
                    <div className="flex justify-between items-start relative z-10">
                      <span className="px-3 py-1 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 text-orange-400 text-[10px] font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                        <BsFire /> Top 3
                      </span>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(prompt.ai_output, prompt.id); }}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors relative z-20"
                        title="Promptu Kopyala"
                      >
                        {copiedId === prompt.id ? <BsCheck2 className="text-green-400" /> : <BsClipboard />}
                      </button>
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-snug">"{prompt.user_input}"</h3>
                      <p className="text-xs text-gray-400 font-mono line-clamp-2">{prompt.ai_output}</p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-orange-500/10 flex items-center justify-between text-xs text-gray-500 relative z-10">
                      <div className="flex items-center gap-2">
                        {prompt.profiles?.avatar_url ? (
                          <img src={prompt.profiles.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full border border-white/10" />
                        ) : (
                          <BsPersonCircle className="text-lg text-gray-400" />
                        )}
                        <span className="font-medium text-gray-300 truncate max-w-[80px]">
                          {prompt.profiles?.username || prompt.profiles?.email?.split('@')[0] || "Anonim"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-pink-400/80"><BsHeartFill /> {prompt.likesCount}</span>
                        <span className="flex items-center gap-1 text-cyan-400/80"><BsChatText /> {prompt.commentsCount}</span>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

        {/* ================= ARŞİV FİLTRELEME ÇUBUĞU (PREMIUM TUZAKLI) ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <BsStars className="text-purple-400" /> Tüm Fikirler Arşivi
          </h3>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 custom-scrollbar">
            <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10 whitespace-nowrap">
              <BsFilter className="text-gray-500 ml-2 mr-1" />
              
              <button 
                onClick={() => handleFilterChange("newest")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeFilter === "newest" ? "bg-white/10 text-white shadow-md border border-white/10" : "text-gray-400 hover:text-white"}`}
              >
                En Yeniler
              </button>
              
              <button 
                onClick={() => handleFilterChange("most_liked")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeFilter === "most_liked" ? "bg-pink-500/20 text-pink-300 shadow-md border border-pink-500/30" : "text-gray-400 hover:text-white"}`}
              >
                {!isPremiumUser && <BsShieldLock className="text-yellow-500/70" />} Beğenilenler
              </button>
              
              <button 
                onClick={() => handleFilterChange("most_commented")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeFilter === "most_commented" ? "bg-cyan-500/20 text-cyan-300 shadow-md border border-cyan-500/30" : "text-gray-400 hover:text-white"}`}
              >
                {!isPremiumUser && <BsShieldLock className="text-yellow-500/70" />} Tartışılanlar
              </button>

              <button 
                onClick={() => handleFilterChange("most_viewed")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeFilter === "most_viewed" ? "bg-purple-500/20 text-purple-300 shadow-md border border-purple-500/30" : "text-gray-400 hover:text-white"}`}
              >
                {!isPremiumUser && <BsShieldLock className="text-yellow-500/70" />} Çok Okunanlar
              </button>
            </div>
          </div>
        </div>

        {/* ================= ANA IZGARA (GRID) ALANI ================= */}
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : displayedPrompts.length === 0 ? (
          <div className="py-20 text-center glass-panel rounded-3xl border border-white/5 max-w-lg mx-auto w-full">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <BsSearch className="text-2xl text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sonuç Bulunamadı</h3>
            <p className="text-gray-400 text-sm">Arama kriterlerinize uygun bir fikir henüz oluşturulmamış.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {displayedPrompts.map((prompt, index) => (
              <Link href={`/explore/${prompt.id}`} key={`grid-${prompt.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4 }}
                  className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col gap-4 group hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] hover:border-purple-500/30 transition-all duration-300 relative overflow-hidden h-full cursor-pointer"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  <div className="flex justify-between items-start relative z-10">
                    <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-[10px] uppercase tracking-wider font-bold rounded-full group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:text-purple-300 transition-colors">
                      {prompt.analyst_type}
                    </span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopy(prompt.ai_output, prompt.id); }}
                      className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors relative z-20"
                      title="Promptu Kopyala"
                    >
                      {copiedId === prompt.id ? <BsCheck2 className="text-green-400" /> : <BsClipboard />}
                    </button>
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-2 leading-snug">"{prompt.user_input}"</h3>
                    <div className="relative">
                      <p className="text-sm text-gray-400 font-mono line-clamp-3 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                        {prompt.ai_output}
                      </p>
                      <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#0a0f1e] to-transparent group-hover:from-[#0c1222] transition-colors" />
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500 relative z-10">
                    <div className="flex items-center gap-2">
                      {prompt.profiles?.avatar_url ? (
                        <img src={prompt.profiles.avatar_url} alt="Avatar" className="w-6 h-6 rounded-full border border-white/10" />
                      ) : (
                        <BsPersonCircle className="text-gray-400 text-lg" />
                      )}
                      <span className="font-medium text-gray-300 truncate max-w-[100px]">
                        {prompt.profiles?.username || prompt.profiles?.email?.split('@')[0] || "Anonim"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1" title="Görüntülenme"><BsEye /> {prompt.viewsCount}</span>
                      <span className="flex items-center gap-1" title="Beğeni"><BsHeartFill className="text-gray-600 group-hover:text-pink-500 transition-colors" /> {prompt.likesCount}</span>
                      <span className="flex items-center gap-1" title="Yorum"><BsChatText className="text-gray-600 group-hover:text-cyan-400 transition-colors" /> {prompt.commentsCount}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* ================= PREMIUM YÜKSELTME MODALI ================= */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUpgradeModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-md cursor-pointer fixed" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }} className="relative w-full max-w-4xl bg-[#060a13]/95 border border-purple-500/20 rounded-3xl p-6 sm:p-10 text-center shadow-2xl overflow-hidden my-auto">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm" />
              <button onClick={() => setShowUpgradeModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full"><BsX className="text-xl" /></button>

              <div className="mb-8">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <BsShieldLock className="text-3xl text-yellow-400" />
                </div>
                <h3 className="text-3xl font-extrabold text-white mb-2">Gelişmiş Analizlerin Kilidini Aç</h3>
                <p className="text-gray-400 text-sm max-w-md mx-auto font-light">En çok tartışılan ve sektörde ses getiren trend fikirleri filtreleyebilmek için topluluğun Premium üyesi olun.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mt-4 max-w-2xl mx-auto">
                <div className="glass-panel border-2 border-purple-500/40 rounded-2xl p-6 flex flex-col justify-between relative shadow-xl shadow-purple-500/5 bg-gradient-to-b from-purple-500/5 to-transparent">
                  <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold uppercase rounded-full tracking-wider shadow-lg">En Popüler</div>
                  <div>
                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-xs font-semibold rounded-md uppercase tracking-wider">Full Paket</span>
                    <h4 className="text-xl font-bold text-white mt-3">Premium Pro</h4>
                    <div className="mt-4 flex items-baseline text-white"><span className="text-3xl font-extrabold tracking-tight">$9.99</span><span className="ml-1 text-sm font-semibold text-gray-400">/aylık</span></div>
                    <ul className="mt-6 space-y-3 text-xs text-gray-300">
                      <li className="flex items-center gap-2"><BsCheck2 className="text-purple-400 text-lg" /> Her Ay 300 Üretim Kredisi</li>
                      <li className="flex items-center gap-2"><BsCheck2 className="text-purple-400 text-lg" /> Tüm Filtreler ve Yorumlar</li>
                      <li className="flex items-center gap-2"><BsCheck2 className="text-purple-400 text-lg" /> Premium Özel Koşul Hakkı</li>
                    </ul>
                  </div>
                  <button onClick={() => handleUpgrade("premium_pro")} disabled={isCheckoutLoading} className="w-full mt-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl transition-all text-sm text-center shadow-[0_0_15px_rgba(168,85,247,0.3)]">Hemen Katıl</button>
                </div>

                <div className="glass-panel border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative group hover:border-cyan-500/30 transition-colors">
                  <div>
                    <span className="px-2.5 py-1 bg-cyan-500/10 text-cyan-400 text-xs font-semibold rounded-md uppercase tracking-wider">Topluluk Paketi</span>
                    <h4 className="text-xl font-bold text-white mt-3">Forum Lideri</h4>
                    <div className="mt-4 flex items-baseline text-white"><span className="text-3xl font-extrabold tracking-tight">$3.99</span><span className="ml-1 text-sm font-semibold text-gray-400">/aylık</span></div>
                    <ul className="mt-6 space-y-3 text-xs text-gray-300">
                      <li className="flex items-center gap-2"><BsCheck2 className="text-cyan-400 text-lg" /> Tüm Filtreler ve Yorumlar</li>
                      <li className="flex items-center gap-2"><BsCheck2 className="text-cyan-400 text-lg" /> Özel Topluluk Rozeti</li>
                      <li className="text-gray-500 line-through flex items-center gap-2"><BsX className="text-gray-500 text-lg" /> Üretim Kredisi Yok</li>
                    </ul>
                  </div>
                  <button onClick={() => handleUpgrade("forum_only")} disabled={isCheckoutLoading} className="w-full mt-8 py-3 bg-white/5 hover:bg-cyan-600 hover:text-white text-gray-200 font-medium rounded-xl transition-all text-sm text-center">Üye Ol</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}