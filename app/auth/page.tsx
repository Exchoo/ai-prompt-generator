"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import { BsEnvelope, BsLock, BsArrowRight, BsStars, BsShieldCheck, BsGoogle, BsGithub } from "react-icons/bs";
import Link from "next/link";


export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setSuccessMsg("Giriş başarılı! Yönlendiriliyorsunuz...");
        setTimeout(() => router.push("/"), 1500);
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setSuccessMsg("Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.");
      }
    } catch (error: any) {
      console.error("Auth hatası:", error);
      setErrorMsg(error.message || "Bir hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    // UI için hazırlandı, arka plan entegrasyonu ilerleyen aşamalarda yapılacak
    console.log(`${provider} ile giriş tetiklendi.`);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden font-sans">
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
          <p className="text-gray-400 mt-2 font-light">Fikirlerinize hayat vermek için giriş yapın.</p>
        </div>

        {/* Form Alanı (layout prop'u ile yükseklik değişimleri animasyonlu hale getirildi) */}
        <motion.div layout className="glass-panel rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-purple-500/50 to-transparent blur-sm" />

          <motion.h2 layout className="text-3xl font-bold text-white mb-6 text-center">
            {isLogin ? "Hoş Geldiniz" : "Hesap Oluşturun"}
          </motion.h2>

          <form onSubmit={handleAuth} className="space-y-5">
            <motion.div layout className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
                <BsEnvelope />
              </div>
              <input
                type="email"
                placeholder="E-posta adresiniz"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              />
            </motion.div>

            <motion.div layout className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
                <BsLock />
              </div>
              <input
                type="password"
                placeholder="Şifreniz"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-transparent transition-all"
              />
            </motion.div>

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

            <motion.button
              layout
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3.5 mt-2 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20 group transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <motion.span layout="position">{isLogin ? "Giriş Yap" : "Üye Ol"}</motion.span>
                  <BsArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          {/* Sosyal Giriş Bölümü */}
          <motion.div layout className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-[#0a0f1e] text-gray-400 rounded-full border border-white/5">Veya şununla devam et</span>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button onClick={() => handleSocialLogin('google')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm font-medium text-gray-300">
                <BsGoogle className="text-lg text-white" /> Google
              </button>
              <button onClick={() => handleSocialLogin('github')} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm font-medium text-gray-300">
                <BsGithub className="text-lg text-white" /> GitHub
              </button>
            </div>
          </motion.div>

          <motion.div layout className="mt-6 text-center text-gray-400 text-sm">
            {isLogin ? "Henüz hesabınız yok mu? " : "Zaten bir hesabınız var mı? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrorMsg("");
              }}
              className="text-purple-400 font-semibold hover:text-purple-300 transition-colors focus:outline-none"
            >
              {isLogin ? "Hemen Üye Olun" : "Giriş Yapın"}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}