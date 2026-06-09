"use client";

import React, { useState, useEffect } from "react";
import { BsStars, BsGem, BsPersonCircle, BsBoxArrowRight, BsPlusLg, BsGear } from "react-icons/bs";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [credits, setCredits] = useState<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const getUserData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUser(authData.user);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('credits, username, avatar_url')
          .eq('id', authData.user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
          setCredits(profileData.credits);
        }
      } else {
        setUser(null);
        setProfile(null);
        setCredits(null);
      }
    };

    getUserData();

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
    router.refresh();
  };

  const usernameDisplay = profile?.username || user?.email?.split('@')[0] || "Kullanıcı";

  return (
    <header className="z-50 w-full max-w-7xl mx-auto flex justify-between items-center mb-8 mt-4 relative px-4">
      {/* Sol Kısım: Logo (SENİN ESKİ VE ŞIK TASARIMIN) */}
      <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 hover:opacity-80 transition-opacity">
        <BsStars className="text-purple-400" />
        <span className="hidden sm:inline">AI Prompt Generator</span>
      </Link>

      {/* Sağ Kısım: Butonlar ve Profil */}
      <div className="flex items-center gap-3 sm:gap-4">
        
        {/* Keşfet Butonu */}
        {pathname !== "/explore" && (
          <Link 
            href="/explore" 
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-full transition-all text-sm font-medium text-purple-300"
          >
            <BsStars /> <span className="hidden sm:inline">Keşfet</span>
          </Link>
        )}

        {/* Ana Sayfa Butonu */}
        {pathname === "/explore" && (
          <Link 
            href="/" 
            className="px-5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all text-sm font-medium text-gray-300 backdrop-blur-md"
          >
            Ana Sayfa
          </Link>
        )}

        {/* Kredi Göstergesi & Yükseltme Butonu */}
        {user && credits !== null && (
          <button 
            onClick={() => {
              if (pathname === "/") window.dispatchEvent(new Event("openUpgradeModal"));
              else router.push("/?upgrade=true");
            }}
            className="group relative flex items-center justify-center h-10 w-28 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 hover:from-yellow-500/20 hover:to-orange-500/20 border border-yellow-500/20 hover:border-yellow-400/50 rounded-full transition-all duration-300 shadow-[0_0_0_rgba(234,179,8,0)] hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] overflow-hidden"
          >
            <div className="absolute flex items-center gap-2 transition-all duration-300 group-hover:-translate-y-8 opacity-100 group-hover:opacity-0">
              <BsGem className="text-yellow-400 text-xs" />
              <span className="text-sm font-bold text-yellow-100">{credits} Kredi</span>
            </div>
            <div className="absolute flex items-center gap-2 transition-all duration-300 translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100">
              <BsPlusLg className="text-yellow-400 text-[13px] font-extrabold" />
              <span className="text-sm font-bold text-yellow-300 tracking-wide">Yükselt</span>
            </div>
          </button>
        )}

        {/* ŞIK PROFİL DROPDOWN MENÜSÜ (YENİ EKLENEN KISIM) */}
        {user ? (
          <div className="relative group py-2">
            {/* Hover Tetikleyici Alan */}
            <div className="flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 px-3 py-1.5 rounded-full transition-colors">
              <div className="w-7 h-7 rounded-full bg-[#0d111a] border border-purple-500/30 overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <BsPersonCircle className="text-lg text-purple-400" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-200 hidden sm:block max-w-[100px] truncate">
                {usernameDisplay}
              </span>
            </div>

            {/* Açılan Menü (Hover ile görünür) */}
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#0a0f1e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-2 group-hover:translate-y-0 transition-all duration-300 overflow-hidden z-50">
              <div className="p-3 border-b border-white/5">
                <p className="text-xs text-gray-500 font-medium">Giriş yapıldı</p>
                <p className="text-sm text-white font-bold truncate" title={user.email}>{user.email}</p>
              </div>
              <div className="p-2 flex flex-col gap-1">
                <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors">
                  <BsGear className="text-purple-400" /> Profilim
                </Link>
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors w-full text-left">
                  <BsBoxArrowRight className="text-red-400" /> Çıkış Yap
                </button>
              </div>
            </div>
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