"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import { 
  BsShieldCheck, BsPeople, BsChatRightText, BsLightbulb, 
  BsGem, BsTrash, BsPencilSquare, BsCheck2, BsXCircle 
} from "react-icons/bs";

export default function AdminDashboard() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"stats" | "users" | "prompts" | "comments">("stats");
  
  // Data Stateleri
  const [stats, setStats] = useState({ totalUsers: 0, totalPrompts: 0, totalComments: 0, totalCredits: 0 });
  const [users, setUsers] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Düzenleme Modal Stateleri
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newCredits, setNewCredits] = useState<number>(0);
  const [newTier, setNewTier] = useState<string>("free");

  // Arama/Filtreleme Stateleri
  const [userSearch, setUserSearch] = useState("");
  const [promptSearch, setPromptSearch] = useState("");
  const [commentSearch, setCommentSearch] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
    
    if (profile && profile.is_admin) {
      setIsAdmin(true);
      fetchAllAdminData();
    } else {
      setIsAdmin(false);
      router.push("/"); // Yetkisiz kullanıcıyı ana sayfaya fırlat
    }
  };

  const fetchAllAdminData = async () => {
    setIsLoading(true);
    try {
      // 1. İstatistikleri Çekme
      const { count: userCount } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: promptCount } = await supabase.from("prompts").select("*", { count: "exact", head: true });
      const { count: commentCount } = await supabase.from("comments").select("*", { count: "exact", head: true });
      const { data: creditData } = await supabase.from("profiles").select("credits");
      const sumCredits = creditData?.reduce((acc, curr) => acc + (curr.credits || 0), 0) || 0;

      setStats({
        totalUsers: userCount || 0,
        totalPrompts: promptCount || 0,
        totalComments: commentCount || 0,
        totalCredits: sumCredits
      });

      // 2. Detaylı Listeleri Çekme
      const { data: usersList } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: promptsList } = await supabase.from("prompts").select("*, profiles(username, email)").order("created_at", { ascending: false });
      const { data: commentsList } = await supabase.from("comments").select("*, prompts(user_input), profiles(username, email)").order("created_at", { ascending: false });

      setUsers(usersList || []);
      setPrompts(promptsList || []);
      setComments(commentsList || []);

    } catch (err) {
      console.error("Admin verileri yüklenirken hata:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // KULLANICI DÜZENLEME (Kredi & Paket Yükleme)
  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      const isPremium = newTier !== "free";
      const { error } = await supabase
        .from("profiles")
        .update({ 
          credits: newCredits, 
          subscription_tier: newTier,
          is_premium: isPremium 
        })
        .eq("id", editingUser.id);

      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, credits: newCredits, subscription_tier: newTier, is_premium: isPremium } : u));
      setEditingUser(null);
      alert("Kullanıcı hakları başarıyla güncellendi!");
    } catch (err) {
      alert("Güncelleme başarısız oldu.");
    }
  };

  // PROMPT SİLME (Moderatör Gücü)
  const handleDeletePrompt = async (id: string) => {
    if (!confirm("Bu promptu ve ona bağlı tüm yorumları kalıcı olarak silmek istediğinize emin misiniz?")) return;
    await supabase.from("prompts").delete().eq("id", id);
    setPrompts(prev => prev.filter(p => p.id !== id));
  };

  // YORUM SİLME (Moderatör Gücü)
  const handleDeleteComment = async (id: string) => {
    if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
    await supabase.from("comments").delete().eq("id", id);
    setComments(prev => prev.filter(c => c.id !== id));
  };

  // Real-time Filtreleme Algoritmaları
  const filteredUsers = users.filter(u => 
    u.username?.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPrompts = prompts.filter(p => 
    p.user_input?.toLowerCase().includes(promptSearch.toLowerCase()) ||
    p.profiles?.username?.toLowerCase().includes(promptSearch.toLowerCase()) ||
    p.profiles?.email?.toLowerCase().includes(promptSearch.toLowerCase())
  );

  const filteredComments = comments.filter(c => 
    c.content?.toLowerCase().includes(commentSearch.toLowerCase()) ||
    c.profiles?.username?.toLowerCase().includes(commentSearch.toLowerCase()) ||
    c.prompts?.user_input?.toLowerCase().includes(commentSearch.toLowerCase())
  );

  if (isAdmin === null || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060a13]">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex flex-col p-4 sm:p-8 overflow-hidden font-sans pb-24">
      <Header />

      <div className="z-10 w-full max-w-6xl mx-auto mt-4">
        {/* Üst Yönetici Başlığı */}
        <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-6">
          <div className="w-10 h-10 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-center text-red-400">
            <BsShieldCheck className="text-xl" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Yönetim Kontrol Paneli</h1>
            <p className="text-xs text-gray-500">Fikir Fabrikası Canlı Ekosistem İzleme Katmanı</p>
          </div>
        </div>

        {/* SIDEBAR / TABS SEÇİM ALANI */}
        <div className="flex flex-wrap gap-2 mb-8 bg-white/5 p-1.5 rounded-2xl border border-white/5 max-w-md">
          <button onClick={() => setActiveTab("stats")} className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "stats" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-gray-400 hover:text-white"}`}><BsShieldCheck /> Özet</button>
          <button onClick={() => setActiveTab("users")} className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "users" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-gray-400 hover:text-white"}`}><BsPeople /> Üyeler</button>
          <button onClick={() => setActiveTab("prompts")} className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "prompts" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-gray-400 hover:text-white"}`}><BsLightbulb /> Promptlar</button>
          <button onClick={() => setActiveTab("comments")} className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "comments" ? "bg-purple-600 text-white shadow-lg shadow-purple-900/30" : "text-gray-400 hover:text-white"}`}><BsChatRightText /> Yorumlar</button>
        </div>

        {/* ================= TAB 1: ÖZET VE KPI DASHBOARD ================= */}
        {activeTab === "stats" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="glass-panel border border-white/5 rounded-2xl p-5 flex items-center gap-4"><div className="w-12 h-12 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center text-xl"><BsPeople /></div><div><p className="text-gray-500 text-[11px] uppercase font-bold">Toplam Üye</p><h3 className="text-2xl font-extrabold text-white mt-0.5">{stats.totalUsers}</h3></div></div>
            <div className="glass-panel border border-white/5 rounded-2xl p-5 flex items-center gap-4"><div className="w-12 h-12 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl flex items-center justify-center text-xl"><BsLightbulb /></div><div><p className="text-gray-500 text-[11px] uppercase font-bold">Üretilen Fikir</p><h3 className="text-2xl font-extrabold text-white mt-0.5">{stats.totalPrompts}</h3></div></div>
            <div className="glass-panel border border-white/5 rounded-2xl p-5 flex items-center gap-4"><div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl flex items-center justify-center text-xl"><BsChatRightText /></div><div><p className="text-gray-500 text-[11px] uppercase font-bold">Yorum Tartışma</p><h3 className="text-2xl font-extrabold text-white mt-0.5">{stats.totalComments}</h3></div></div>
            <div className="glass-panel border border-white/5 rounded-2xl p-5 flex items-center gap-4"><div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-xl flex items-center justify-center text-xl"><BsGem /></div><div><p className="text-gray-500 text-[11px] uppercase font-bold">Dolaşan Kredi</p><h3 className="text-2xl font-extrabold text-white mt-0.5">{stats.totalCredits}</h3></div></div>
          </div>
        )}

        {/* ================= TAB 2: ÜYE / KULLANICI YÖNETİMİ ================= */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Arama Kutusu */}
            <input
              type="text"
              placeholder="Üye adı veya e-posta adresi ile filtrele..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <div className="glass-panel border border-white/10 rounded-3xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02] text-gray-400 font-bold text-xs uppercase tracking-wider">
                    <th className="p-4 sm:p-5">Üye / Bilgi</th>
                    <th className="p-4 sm:p-5">Plan Seviyesi</th>
                    <th className="p-4 sm:p-5">Mevcut Kredi</th>
                    <th className="p-4 sm:p-5">Kayıt Tarihi</th>
                    <th className="p-4 sm:p-5 text-right">Müdahale</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-gray-300 divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="p-4 sm:p-5"><p className="font-bold text-white">{u.username || "Nickname Yok"}</p><p className="text-xs text-gray-500 font-mono mt-0.5">{u.email || "E-posta bulunamadı"}</p></td>
                      <td className="p-4 sm:p-5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${u.is_premium ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-gray-500/10 text-gray-400'}`}>{u.subscription_tier || "free"}</span></td>
                      <td className="p-4 sm:p-5 font-bold text-yellow-100">{u.credits ?? 0} Kredi</td>
                      <td className="p-4 sm:p-5 text-xs text-gray-500">{new Date(u.created_at).toLocaleDateString('tr-TR')}</td>
                      <td className="p-4 sm:p-5 text-right">
                        <button onClick={() => { setEditingUser(u); setNewCredits(u.credits || 0); setNewTier(u.subscription_tier || "free"); }} className="p-2 text-purple-400 hover:text-white bg-purple-500/10 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-bold"><BsPencilSquare /> Düzenle</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB 3: PROMPT / FİKİR MODERASYONU ================= */}
        {activeTab === "prompts" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Fikir içeriği veya yazar adına göre filtrele..."
              value={promptSearch}
              onChange={(e) => setPromptSearch(e.target.value)}
              className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors mb-2"
            />
            {filteredPrompts.map((p) => (
              <div key={p.id} className="glass-panel border border-white/5 bg-white/[0.01] rounded-2xl p-5 flex items-start justify-between gap-4 group">
                <div className="space-y-2 max-w-[85%]">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-0.5 bg-purple-500/10 text-purple-300 font-bold rounded uppercase">{p.analyst_type}</span>
                    <span>Yazar: <strong>{p.profiles?.username || p.profiles?.email?.split('@')[0]}</strong></span>
                    <span>Görüntülenme: <strong>{p.views || 0}</strong></span>
                  </div>
                  <h4 className="text-white font-bold text-sm">"{p.user_input}"</h4>
                </div>
                <button onClick={() => handleDeletePrompt(p.id)} className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><BsTrash className="text-base" /></button>
              </div>
            ))}
          </div>
        )}
{/* ================= TAB 4: FORUM YORUM MODERASYONU ================= */}
        {activeTab === "comments" && (
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Yorum içeriği veya yazan kişiye göre filtrele..."
              value={commentSearch}
              onChange={(e) => setCommentSearch(e.target.value)}
              className="w-full max-w-md bg-white/5 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors mb-2"
            />
            {filteredComments.map((c) => (
              <div key={c.id} className="glass-panel border border-white/5 bg-white/[0.01] rounded-2xl p-5 flex items-start justify-between gap-4 group">
                <div className="space-y-1.5 max-w-[85%]">
                  <div className="text-xs text-gray-500 flex flex-wrap items-center gap-2">
                    <span className="font-bold text-gray-300">{c.profiles?.username || c.profiles?.email?.split('@')[0]}</span>
                    <span>Hangi Fikre: <strong className="text-purple-400 truncate max-w-[150px]">"{c.prompts?.user_input}"</strong></span>
                    <span>{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                  </div>
                  <p className="text-sm text-gray-300 font-light">{c.content}</p>
                </div>
                <button onClick={() => handleDeleteComment(c.id)} className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"><BsTrash className="text-base" /></button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ================= KREDİ & ABONELİK ENJEKSİYON MODALI (DÜZENLEME) ================= */}
      {editingUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div onClick={() => setEditingUser(null)} className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer fixed" />
          <div className="relative w-full max-w-sm glass-panel border border-purple-500/20 rounded-3xl p-6 sm:p-8 text-left shadow-2xl">
            <button onClick={() => setEditingUser(null)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><BsXCircle className="text-xl" /></button>
            <h3 className="text-xl font-bold text-white mb-1">Hesap Müdahalesi</h3>
            <p className="text-xs text-gray-400 mb-6 font-mono truncate">{editingUser.email}</p>
            
            <div className="space-y-5">
              {/* Kredi Inputu */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Bakiye Ayarı (Kredi)</label>
                <input type="number" value={newCredits} onChange={(e) => setNewCredits(Number(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 text-white font-bold outline-none focus:border-purple-500 transition-colors" />
              </div>

              {/* Paket/Abonelik Seçimi */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Abonelik Kadet Türü</label>
                <select value={newTier} onChange={(e) => setNewTier(e.target.value)} className="w-full bg-[#0a0f1e] border border-white/10 rounded-xl py-2.5 px-4 text-white font-medium outline-none focus:border-purple-500 transition-colors">
                  <option value="free">Free (Ücretsiz Üye)</option>
                  <option value="pro">Pro (Premium Pro Üye)</option>
                  <option value="forum_leader">Forum Leader (Topluluk Lideri)</option>
                </select>
              </div>

              <button onClick={handleUpdateUser} className="w-full mt-2 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"><BsCheck2 className="text-lg" /> Değişiklikleri Kaydet</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}