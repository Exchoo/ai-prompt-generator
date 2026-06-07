"use client";

import React, { useState, useEffect } from "react";
import { BsStars, BsGem, BsPersonCircle, BsBoxArrowRight } from "react-icons/bs";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname(); // Hangi sayfada olduğumuzu anlamak için

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

    // Promp üretildiğinde kredinin güncellenmesi için özel eventi dinle
    const handleCreditUpdate = () => getUserData();
    window.addEventListener("creditsUpdated", handleCreditUpdate);

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      getUserData();
    });

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("creditsUpdated", handleCreditUpdate);
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
    router.refresh();
  };

  return (
    <header className="z-50 w-full max-w-7xl mx-auto flex justify-between items-center mb-8 mt-4 relative px-4">
      {/* Sol Kısım: Logo */}
      <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:opacity-80 transition-opacity">
        <BsStars className="text-purple-400" />
        <span className="hidden sm:inline">AI Prompt Generator</span>
      </Link>

      {/* Sağ Kısım: Butonlar ve Profil */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Keşfet Butonu (Keşfet sayfasındayken gizlenir) */}
        {pathname !== "/explore" && (
          <Link 
            href="/explore" 
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-full transition-all text-sm font-medium text-purple-300"
          >
            <BsStars /> <span className="hidden sm:inline">Keşfet</span>
          </Link>
        )}

        {/* Ana Sayfa Butonu (Sadece Keşfet sayfasındayken görünür) */}
        {pathname === "/explore" && (
          <Link 
            href="/" 
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm font-medium text-gray-300 backdrop-blur-md"
          >
            Ana Sayfa
          </Link>
        )}

        {/* Kredi Göstergesi (Sadece giriş yapıldıysa) */}
        {user && credits !== null && (
          <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-full">
            <BsGem className="text-yellow-400 text-xs" />
            <span className="text-sm font-bold text-yellow-100">{credits} Kredi</span>
          </div>
        )}

        {/* Profil Menüsü veya Giriş Butonu */}
        {user ? (
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm font-medium text-gray-300 backdrop-blur-md"
            >
              <BsPersonCircle className="text-lg text-purple-400" />
              <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
            </button>

            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 mt-2 w-48 bg-[#0a0f1e] border border-white/10 rounded-2xl shadow-xl overflow-hidden backdrop-blur-xl"
              >
                <div className="px-4 py-3 border-b border-white/10">
                  <p className="text-xs text-gray-400">Giriş yapıldı</p>
                  <p className="text-sm text-white font-medium truncate" title={user.email}>{user.email}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <BsBoxArrowRight /> Çıkış Yap
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <Link 
            href="/auth" 
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full transition-all text-sm font-medium text-white backdrop-blur-md flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            Giriş Yap
          </Link>
        )}
      </div>
    </header>
  );
}