"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import Header from "../../../components/Header";
import { 
  BsArrowLeft, BsEye, BsHeart, BsHeartFill, BsChatText, 
  BsPersonCircle, BsClipboard, BsCheck2, BsStars, BsShieldLock, BsSend, BsTrash, 
  BsGem, BsAward
} from "react-icons/bs";
import Link from "next/link";

export default function PromptDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [prompt, setPrompt] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  
  // Etkileşim & Yorum Stateleri
  const [likesCount, setLikesCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [comments, setComments] = useState<any[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  
  // Soft-Gate Stateleri
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetchPromptDetails();
    fetchComments();
    checkUserAndView();
  }, [id]);

  const checkUserAndView = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      const { data: profile } = await supabase.from('profiles').select('username, avatar_url, is_premium').eq('id', user.id).single();
      setUserProfile(profile);
      
      const { data: like } = await supabase.from('likes').select('id').eq('prompt_id', id).eq('user_id', user.id).single();
      if (like) setHasLiked(true);
    }
    
    const { error: rpcError } = await supabase.rpc('increment_view_count', { prompt_row_id: id });
    if (rpcError) {
      const { data } = await supabase.from('prompts').select('views').eq('id', id).single();
      if (data) {
        await supabase.from('prompts').update({ views: (data.views || 0) + 1 }).eq('id', id);
      }
    }
  };

  const fetchPromptDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          *,
          profiles ( email, username, avatar_url, is_premium, subscription_tier ) 
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setPrompt(data);
      
      const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('prompt_id', id);
      setLikesCount(count || 0);
    } catch (error) {
      console.error("Detaylar çekilemedi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles ( email, username, avatar_url, is_premium, subscription_tier )
        `)
        .eq('prompt_id', id)
        .order('created_at', { ascending: true }); 

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error("Yorumlar çekilemedi:", error);
    }
  };

  const handleInteraction = async (type: 'like' | 'comment') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    if (!userProfile?.username) { setShowUsernameModal(true); return; }

    if (type === 'like') {
      if (hasLiked) {
        await supabase.from('likes').delete().eq('prompt_id', id).eq('user_id', user.id);
        setLikesCount(prev => prev - 1);
        setHasLiked(false);
      } else {
        await supabase.from('likes').insert({ prompt_id: id, user_id: user.id });
        setLikesCount(prev => prev + 1);
        setHasLiked(true);
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || isCommentSubmitting) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    if (!userProfile?.username) { setShowUsernameModal(true); return; }

    setIsCommentSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({ prompt_id: id, user_id: user.id, content: commentInput.trim() })
        .select(`*, profiles ( email, username, avatar_url, is_premium, subscription_tier )`)
        .single();

      if (error) throw error;
      setComments(prev => [...prev, data]); 
      setCommentInput("");
    } catch (error) {
      console.error("Yorum gönderilemedi:", error);
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const openDeleteConfirmation = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      const { error } = await supabase.from('comments').delete().eq('id', commentToDelete);
      if (error) throw error;
      setComments(prev => prev.filter(c => c.id !== commentToDelete));
    } catch (error) {
      console.error("Yorum silinemedi:", error);
    } finally {
      setCommentToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const saveUsername = async () => {
    if (!newUsername.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ username: newUsername }).eq('id', user.id);
    if (!error) {
      setUserProfile({ ...userProfile, username: newUsername });
      setShowUsernameModal(false);
    } else {
      alert("Bu kullanıcı adı alınmış olabilir.");
    }
  };

  const handleCopy = () => {
    if(prompt?.ai_output) {
      navigator.clipboard.writeText(prompt.ai_output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-[#060a13]"><div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /></div>;
  if (!prompt) return <div className="min-h-screen flex flex-col items-center justify-center text-white"><h1 className="text-4xl font-bold mb-4">404 - Fikir Bulunamadı</h1><Link href="/explore" className="text-purple-400 hover:text-purple-300">Keşfet'e Dön</Link></div>;

  const authorName = prompt.profiles?.username || prompt.profiles?.email?.split('@')[0] || "Gizemli Yazar";
  const selectedFeatures = prompt.metadata?.selected_features || [];
  
  // YENİ: Veritabanından gelen Premium İstekleri array olarak alıyoruz
  const premiumRequests = prompt.metadata?.premium_requests || [];

  return (
    <div className="relative min-h-screen flex flex-col p-4 sm:p-8 overflow-hidden font-sans pb-24">
      <Header />
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-cyan-600/5 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-purple-600/5 rounded-full blur-[120px] animate-blob animation-delay-2000" />
      </div>

      <div className="z-10 w-full max-w-5xl mx-auto mt-4">
        <Link href="/explore" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm font-medium">
          <BsArrowLeft /> Keşfet'e Dön
        </Link>

        {/* Başlık */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold rounded-md">{prompt.analyst_type}</span>
              <span className="text-gray-500 text-xs">{new Date(prompt.created_at).toLocaleDateString('tr-TR')}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight">"{prompt.user_input}"</h1>
          </div>
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-2 px-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-gray-400" title="Görüntülenme"><BsEye className="text-lg" /><span className="text-sm font-medium">{prompt.views || 0}</span></div>
            <div className="w-px h-6 bg-white/10" />
            <button onClick={() => handleInteraction('like')} className={`flex items-center gap-2 transition-colors ${hasLiked ? 'text-pink-500' : 'text-gray-400 hover:text-pink-400'}`}>
              {hasLiked ? <BsHeartFill className="text-lg drop-shadow-[0_0_10px_rgba(236,72,153,0.5)]" /> : <BsHeart className="text-lg" />}
              <span className="text-sm font-medium">{likesCount}</span>
            </button>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex items-center gap-2 text-gray-400" title="Yorum Sayısı"><BsChatText className="text-lg" /><span className="text-sm font-medium">{comments.length}</span></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 relative">
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 flex items-center gap-2"><BsStars className="text-purple-400" /> Master Prompt</h3>
                <button onClick={handleCopy} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-sm font-medium text-gray-300">
                  {copied ? <BsCheck2 className="text-green-400 text-lg" /> : <BsClipboard className="text-gray-400 text-lg" />}
                  <span className="hidden sm:inline">{copied ? "Kopyalandı" : "Kopyala"}</span>
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300 bg-black/20 p-6 rounded-2xl border border-white/5 custom-scrollbar overflow-x-auto">{prompt.ai_output}</pre>
            </div>
          </div>

          <div className="space-y-6">
            {/* Yazar Kartı */}
            <div className="glass-panel border border-white/10 rounded-3xl p-6">
              <h4 className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-4">Prompt Mimarı</h4>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-white/5 border border-purple-500/30">
                  {prompt.profiles?.avatar_url ? (
                    <img src={prompt.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xl font-bold">{authorName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <p className="text-white font-bold flex items-center gap-1.5">{authorName}{prompt.profiles?.is_premium && <BsShieldLock className="text-yellow-400 text-xs" title="Premium Üye" />}</p>
                  <p className="text-xs text-gray-400">Fikir Fabrikası Üyesi</p>
                </div>
              </div>
            </div>

            {/* YENİ: PREMIUM ÖZEL İSTEKLER LİSTESİ (SADECE VARSA GÖRÜNÜR) */}
            {premiumRequests.length > 0 && (
              <div className="glass-panel border-2 border-yellow-500/30 rounded-3xl p-6 shadow-[0_0_20px_rgba(245,158,11,0.1)] relative overflow-hidden bg-gradient-to-b from-yellow-500/5 to-transparent">
                <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-[30px]" />
                <h4 className="text-xs text-yellow-500/80 uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
                  <BsAward className="text-yellow-400 text-lg" /> Premium Özel Koşullar
                </h4>
                <ul className="space-y-3 relative z-10">
                  {premiumRequests.map((req: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-yellow-100/90 bg-black/40 p-3 rounded-xl border border-yellow-500/20 font-medium">
                      <BsGem className="text-yellow-500 text-sm flex-shrink-0 mt-0.5" />
                      <span className="leading-tight">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Standart Modüller */}
            {selectedFeatures.length > 0 && (
              <div className="glass-panel border border-white/10 rounded-3xl p-6">
                <h4 className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-4">Dahil Edilen Modüller</h4>
                <ul className="space-y-3">
                  {selectedFeatures.map((feat: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300 bg-white/5 p-3 rounded-xl border border-white/5">
                      <BsCheck2 className="text-cyan-400 text-lg flex-shrink-0 mt-0.5" /><span className="leading-tight">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>

        {/* YORUMLAR (FORUM) ALANI */}
        <div className="border-t border-white/10 pt-10 mt-10">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2"><BsChatText className="text-purple-400 text-xl" /> Topluluk Tartışmaları ({comments.length})</h3>

          <form onSubmit={handleCommentSubmit} className="flex gap-4 mb-8 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm group focus-within:border-purple-500/50 transition-colors">
            {/* Yoruma Yazanın Avatarı */}
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 bg-white/5 border border-purple-500/20">
              {userProfile?.avatar_url ? (
                <img src={userProfile.avatar_url} alt="You" className="w-full h-full object-cover" />
              ) : (
                <span className="text-sm font-bold text-purple-300">{userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : "?"}</span>
              )}
            </div>
            <div className="flex-grow flex gap-2">
              <input type="text" placeholder={currentUserId ? "Bu fikir hakkında ne düşünüyorsunuz?" : "Yorum yazmak için giriş yapmalısınız..."} disabled={!currentUserId} value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onClick={() => handleInteraction('comment')} className="w-full bg-transparent border-none text-white text-sm placeholder-gray-500 focus:ring-0 outline-none" />
              <button type="submit" disabled={isCommentSubmitting || !commentInput.trim()} className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center flex-shrink-0">
                {isCommentSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <BsSend />}
              </button>
            </div>
          </form>

          {/* Yorum Listesi ve Yumuşak Paywall (Merak Uyandıran Kademeli Sönümlenme) */}
          <div className="space-y-4 relative">
            {comments.length === 0 ? (
              <p className="text-gray-500 text-sm italic py-4">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
            ) : (
              <>
                <AnimatePresence mode="popLayout">
                  {comments
                    .slice(0, userProfile?.is_premium ? comments.length : 3)
                    .map((comment) => {
                      const cAuthor = comment.profiles?.username || comment.profiles?.email?.split('@')[0] || "Anonim";
                      const isPromptOwner = comment.user_id === prompt.user_id; 
                      const isCommentOwner = comment.user_id === currentUserId; 

                      return (
                        <motion.div key={comment.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="glass-panel border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors rounded-2xl p-5 flex gap-4 relative group">
                          <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${isPromptOwner ? 'border-2 border-purple-500 shadow-lg shadow-purple-500/20' : 'border border-white/10'}`}>
                            {comment.profiles?.avatar_url ? (
                              <img src={comment.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <span className={`text-sm font-bold ${isPromptOwner ? 'text-purple-400' : 'text-gray-400'}`}>{cAuthor.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          
                          <div className="flex-grow space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-200">{cAuthor}</span>
                              {isPromptOwner && <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-[10px] font-bold rounded uppercase tracking-wider">Mimar</span>}
                              {comment.profiles?.is_premium && <BsShieldLock className="text-yellow-400 text-xs" title="Premium Üye" />}
                              <span className="text-[11px] text-gray-500 ml-auto">{new Date(comment.created_at).toLocaleDateString('tr-TR')} {new Date(comment.created_at).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}</span>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed font-light">{comment.content}</p>
                          </div>
                          {isCommentOwner && (
                            <button onClick={() => openDeleteConfirmation(comment.id)} className="absolute right-4 bottom-4 p-1.5 text-gray-600 hover:text-red-400 rounded-lg hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-all" title="Yorumu Sil"><BsTrash className="text-sm" /></button>
                          )}
                        </motion.div>
                      );
                    })}
                </AnimatePresence>

                {!userProfile?.is_premium && comments.length > 3 && (
                  <div className="relative mt-4 rounded-2xl overflow-hidden p-1">
                    <div className="space-y-4 select-none pointer-events-none">
                      <div className="glass-panel border border-white/5 bg-white/[0.01] rounded-2xl p-5 flex gap-4 blur-[2px] opacity-40">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                        <div className="flex-grow space-y-2 mt-1">
                          <div className="w-1/4 h-3 bg-white/20 rounded" />
                          <div className="w-full h-2 bg-white/10 rounded" />
                          <div className="w-5/6 h-2 bg-white/10 rounded" />
                        </div>
                      </div>
                      <div className="glass-panel border border-white/5 bg-white/[0.01] rounded-2xl p-5 flex gap-4 blur-[5px] opacity-15">
                        <div className="w-10 h-10 rounded-full bg-white/10 flex-shrink-0" />
                        <div className="flex-grow space-y-2 mt-1">
                          <div className="w-1/5 h-3 bg-white/20 rounded" />
                          <div className="w-4/5 h-2 bg-white/10 rounded" />
                          <div className="w-2/3 h-2 bg-white/10 rounded" />
                        </div>
                      </div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-[#060a13] via-[#060a13]/85 to-transparent z-10 flex flex-col items-center justify-center pt-6 px-4">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-3 border border-yellow-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
                        <BsShieldLock className="text-xl text-yellow-400" />
                      </div>
                      <h4 className="text-lg sm:text-xl font-bold text-white mb-1 text-center">Topluluğun Tamamına Erişin</h4>
                      <p className="text-gray-400 text-xs sm:text-sm mb-5 max-w-sm text-center font-light">
                        Bu fikir için gizlenmiş <strong className="text-purple-400">{comments.length - 3} değerli analiz</strong> daha var.
                      </p>
                      <button 
                        onClick={() => router.push('/?upgrade=true')} 
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-105 transition-transform flex items-center gap-2 text-sm tracking-wide"
                      >
                        <BsGem /> Tüm yorumlar için Premium Ol
                      </button>
                    </div>

                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer fixed" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="relative w-full max-w-xs glass-panel border border-red-500/20 rounded-2xl p-6 text-center shadow-2xl">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-500/20"><BsTrash className="text-xl text-red-400" /></div>
              <h4 className="text-lg font-bold text-white mb-1">Yorumu Sil?</h4>
              <p className="text-gray-400 text-xs mb-5 font-light">Bu işlem geri alınamaz. Yorumunuz kalıcı olarak silinecektir.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl transition-colors text-xs font-medium">Vazgeç</button>
                <button onClick={confirmDeleteComment} className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors text-xs shadow-lg shadow-red-900/20">Evet, Sil</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUsernameModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowUsernameModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer fixed" />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="relative w-full max-w-sm glass-panel border border-purple-500/30 rounded-3xl p-8 text-center shadow-2xl">
              <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30"><BsPersonCircle className="text-3xl text-purple-400" /></div>
              <h3 className="text-2xl font-bold text-white mb-2">Aramıza Katıl</h3>
              <p className="text-gray-400 text-sm mb-6">Toplulukla etkileşime geçmek ve yorum yazmak için harika bir kullanıcı adı seç.</p>
              <input type="text" placeholder="örn: kodninja" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors mb-4 text-center font-medium" />
              <button onClick={saveUsername} disabled={newUsername.length < 3} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors disabled:opacity-50">Kaydet ve Devam Et</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}