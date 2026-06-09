"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";
import { BsLock, BsArrowRight, BsStars, BsShieldCheck } from "react-icons/bs";
import Link from "next/link";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  // Supabase'in şifre sıfırlama linkinden gelen geçici oturumu dinliyoruz
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Eğer link geçersizse veya süresi dolmuşsa giriş ekranına at
        router.push('/auth');
      }
    };
    checkSession();
  }, [router]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) throw error;

      setSuccessMsg("Şifreniz başarıyla güncellendi! Ana sayfaya yönlendiriliyorsunuz...");
      
      // Şifre değiştikten sonra kullanıcı zaten giriş yapmış sayılır, ana sayfaya yolluyoruz
      setTimeout(() => {
        router.push("/");
      }, 2000);

    } catch (error: any) {
      console.error("Şifre güncelleme hatası:", error);
      setErrorMsg(error.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans">
      {/* Arka Plan Animasyonları */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[40%] w-[35rem] h-[35rem] bg-purple-600/20 rounded-full blur-[100px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[20%] w-[40rem] h-[40rem] bg-cyan-600/20 rounded-full blur-[100px] animate-blob animation-delay-2000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:opacity-80 transition-opacity">
            <BsStars className="text-purple-400" />
            AI Prompt Generator
          </Link>
          <p className="text-gray-400 mt-2 font-light">Lütfen yeni şifrenizi belirleyin.</p>
        </div>

        <motion.div layout className="glass-panel rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent blur-sm" />

          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            Yeni Şifre Oluştur
          </h2>

          <form onSubmit={handleUpdatePassword} className="space-y-5">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
                <BsLock />
              </div>
              <input
                type="password"
                placeholder="Yeni Şifreniz (En az 6 karakter)"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              />
            </div>

            <AnimatePresence mode="popLayout">
              {errorMsg && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-red-400 text-sm text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">
                  {errorMsg}
                </motion.div>
              )}
              {successMsg && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="text-green-400 text-sm text-center bg-green-500/10 py-2 rounded-lg border border-green-500/20 flex items-center justify-center gap-2">
                  <BsShieldCheck /> {successMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={isLoading || password.length < 6}
              className="w-full py-3.5 mt-2 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 group transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Şifreyi Güncelle</span>
                  <BsArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </div>
  );
}