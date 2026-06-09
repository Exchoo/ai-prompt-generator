"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import { 
  BsPerson, BsLock, BsShieldLock, BsClockHistory, BsCheck2, 
  BsGem, BsArrowRight, BsStars, BsEye, BsClipboard 
} from "react-icons/bs";
import Link from "next/link";

// Konsepte Uygun Fütüristik/Neon Hazır Avatarlar (DiceBear API Kullanarak)
const PREMADE_AVATARS = [
  "https://api.dicebear.com/7.x/bottts/svg?seed=Felix&backgroundColor=65c9ff,b6e3f4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Aneka&backgroundColor=d1c4e9,b39ddb",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Jack&backgroundColor=c8e6c9,a5d6a7",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Mitzi&backgroundColor=ffcc80,ffe082",
  "https://api.dicebear.com/7.x/identicon/svg?seed=TechMinds&backgroundColor=0d1117",
  "https://api.dicebear.com/7.x/identicon/svg?seed=Cyber&backgroundColor=1f2937",
  "https://api.dicebear.com/7.x/micah/svg?seed=Shadow&backgroundColor=ff8a80",
  "https://api.dicebear.com/7.x/micah/svg?seed=Nova&backgroundColor=ea80fc",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Matrix&backgroundColor=000000",
  "https://api.dicebear.com/7.x/shapes/svg?seed=Prism&backgroundColor=312e81",
  "https://api.dicebear.com/7.x/initials/svg?seed=AI&backgroundColor=4f46e5",
  "https://api.dicebear.com/7.x/initials/svg?seed=PRO&backgroundColor=06b6d4"
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [pastPrompts, setPastPrompts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form Stateleri
  const [newPassword, setNewPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        router.push("/auth");
        return;
      }
      setUser(authData.user);

      // Profil bilgilerini getir
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();
      setProfile(profileData);

      // Kullanıcının ürettiği geçmiş promptları getir
      const { data: promptsData } = await supabase
        .from("prompts")
        .select("*")
        .eq("user_id", authData.user.id)
        .order("created_at", { ascending: false });
      setPastPrompts(promptsData || []);

    } catch (err) {
      console.error("Profil verileri çekilemedi:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Avatar Değiştirme Fonksiyonu
  const handleAvatarSelect = async (avatarUrl: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id);

      if (error) throw error;
      setProfile((prev: any) => ({ ...prev, avatar_url: avatarUrl }));
      showNotification("success", "Profil resminiz güncellendi!");
    } catch (err) {
      showNotification("error", "Avatar güncellenirken bir hata oluştu.");
    }
  };

  // Şifre Güncelleme Fonksiyonu
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    setIsPasswordLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setNewPassword("");
      showNotification("success", "Şifreniz başarıyla değiştirildi!");
    } catch (err: any) {
      showNotification("error", err.message || "Şifre güncellenemedi.");
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const showNotification = (type: "success" | "error", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: "", text: "" }), 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a13]">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  const usernameDisplay = profile?.username || user?.email?.split("@")[0] || "Kullanıcı";

  return (
    <div className="relative min-h-screen flex flex-col p-4 sm:p-8 overflow-hidden font-sans pb-24">
      <Header />

      {/* Arka Plan Efektleri */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-20%] right-[-10%] w-[45rem] h-[45rem] bg-purple-600/10 rounded-full blur-[140px] animate-blob" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[35rem] h-[35rem] bg-cyan-600/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>

      {/* Bildirim Kutusu */}
      <AnimatePresence>
        {msg.text && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 rounded-xl border font-medium text-sm shadow-xl flex items-center gap-2 backdrop-blur-md ${
              msg.type === "success" 
                ? "bg-green-500/10 border-green-500/20 text-green-400" 
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {msg.type === "success" && <BsCheck2 className="text-lg" />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="z-10 w-full max-w-6xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: KULLANICI KARTI VE GÜVENLİK */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Kimlik Bilgileri Kartı */}
          <div className="glass-panel border border-white/10 rounded-3xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500" />
            
            <div className="w-24 h-24 mx-auto rounded-full p-1 bg-gradient-to-tr from-purple-500 to-cyan-500 shadow-xl mb-4">
              <div className="w-full h-full bg-[#0d111a] rounded-full flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <BsPerson className="text-4xl text-gray-400" />
                )}
              </div>
            </div>

            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-1.5">
              {usernameDisplay}
              {profile?.is_premium && <BsShieldLock className="text-yellow-400 text-sm" title="Premium Üye" />}
            </h2>
            <p className="text-xs text-gray-500 font-mono mt-1">{user?.email}</p>

            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between text-left">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-bold">Hesap Türü</p>
                <p className="text-sm font-bold text-white capitalize mt-0.5">{profile?.subscription_tier || "free"}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
                <BsGem className="text-yellow-400 text-xs" />
                <span className="text-sm font-bold text-yellow-100">{profile?.credits ?? 0} Kredi</span>
              </div>
            </div>
          </div>

          {/* Şifre Değiştirme Kartı */}
          <div className="glass-panel border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BsLock /> Güvenlik Ayarları
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <input
                type="password"
                placeholder="Yeni Güvenli Şifre"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={isPasswordLoading || newPassword.length < 6}
                className="w-full py-2.5 bg-white/5 hover:bg-purple-600 border border-white/10 text-white font-bold rounded-xl transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isPasswordLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Şifreyi Güncelle"}
              </button>
            </form>
          </div>

        </div>

        {/* SAĞ KOLON: AVATAR SEÇİMİ VE GEÇMİŞ PROMPTLAR */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Avatar Seçim Matrisi */}
          <div className="glass-panel border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BsStars className="text-purple-400" /> Tarzınızı Seçin (Hazır Avatarlar)
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {PREMADE_AVATARS.map((url, i) => {
                const isSelected = profile?.avatar_url === url;
                return (
                  <button
                    key={i}
                    onClick={() => handleAvatarSelect(url)}
                    className={`aspect-square rounded-xl p-1 bg-white/5 hover:bg-white/10 border transition-all duration-200 overflow-hidden flex items-center justify-center relative group ${
                      isSelected ? "border-purple-500 bg-purple-500/10 scale-95 shadow-[0_0_15px_rgba(168,85,247,0.3)]" : "border-white/5"
                    }`}
                  >
                    <img src={url} alt={`Avatar-${i}`} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                        <BsCheck2 className="text-purple-300 text-lg font-bold" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Geçmiş Üretimler Listesi */}
          <div className="glass-panel border border-white/10 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <BsClockHistory /> Geçmiş Üretimleriniz ({pastPrompts.length})
            </h3>
            
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {pastPrompts.length === 0 ? (
                <p className="text-gray-500 text-sm italic py-4">Henüz bir prompt üretmediniz. Fabrika girdilerinizi bekliyor!</p>
              ) : (
                pastPrompts.map((p) => (
                  <div key={p.id} className="bg-white/[0.02] border border-white/5 hover:border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all group relative">
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          {p.analyst_type}
                        </span>
                        <span className="text-[11px] text-gray-500">
                          {new Date(p.created_at).toLocaleDateString("tr-TR")}
                        </span>
                      </div>
                      <p className="text-white font-medium text-sm truncate">"{p.user_input}"</p>
                    </div>

                    <div className="flex items-center gap-2 sm:ml-auto">
                      <Link 
                        href={`/explore/${p.id}`}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                        title="Detayları ve Yorumları Gör"
                      >
                        <BsEye className="text-sm" />
                      </Link>
                      <button
                        onClick={() => handleCopy(p.ai_output, p.id)}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                        title="Promptu Kopyala"
                      >
                        {copiedId === p.id ? <BsCheck2 className="text-green-400 text-sm" /> : <BsClipboard className="text-sm" />}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}