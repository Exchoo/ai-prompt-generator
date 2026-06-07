"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BsSearch, BsClipboard, BsCheck2, BsPersonCircle } from "react-icons/bs";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header"; // YENİ: Akıllı Header Eklendi

export default function ExplorePage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchPublicPrompts();
  }, []);

  const fetchPublicPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select(`
          id,
          user_input,
          ai_output,
          analyst_type,
          created_at,
          profiles ( email )
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPrompts(data || []);
    } catch (error) {
      console.error("Promptlar çekilirken hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredPrompts = prompts.filter(p => 
    p.user_input.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.analyst_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative min-h-screen flex flex-col p-4 sm:p-8 overflow-hidden font-sans">
      
      {/* YENİ: Akıllı Header Bileşenimiz */}
      <Header />

      {/* Arka Plan Animasyonları */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none fixed">
        <div className="absolute top-[-10%] right-[-10%] w-[40rem] h-[40rem] bg-cyan-600/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-20%] left-[10%] w-[45rem] h-[45rem] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000" />
      </div>

      <div className="z-10 w-full max-w-7xl mx-auto">
        
        {/* Başlık ve Arama */}
        <div className="text-center space-y-6 mb-16 mt-8">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Topluluk Fikirlerini <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Keşfet</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto font-light">
            Diğer kullanıcıların ürettiği en iyi yapay zeka promptlarını inceleyin, kopyalayın ve kendi projelerinizde kullanın.
          </p>
          
          <div className="max-w-xl mx-auto relative group mt-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-purple-400 transition-colors">
              <BsSearch />
            </div>
            <input
              type="text"
              placeholder="Fikir veya analist türü ara... (Örn: oyun, kahve, iş analisti)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all shadow-lg"
            />
          </div>
        </div>

        {/* Prompt Grid (Duvar Yapısı) */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {filteredPrompts.map((prompt, index) => (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="glass-panel rounded-2xl p-6 flex flex-col gap-4 group hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold rounded-full">
                    {prompt.analyst_type}
                  </span>
                  <button
                    onClick={() => handleCopy(prompt.ai_output, prompt.id)}
                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    title="Promptu Kopyala"
                  >
                    {copiedId === prompt.id ? <BsCheck2 className="text-green-400" /> : <BsClipboard />}
                  </button>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2" title={prompt.user_input}>
                    "{prompt.user_input}"
                  </h3>
                  <div className="relative">
                    <p className="text-sm text-gray-400 font-mono line-clamp-4 leading-relaxed">
                      {prompt.ai_output}
                    </p>
                    <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-[#0a0f1e]/80 to-transparent" />
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2 text-xs text-gray-500">
                  <BsPersonCircle className="text-gray-400" />
                  <span>{prompt.profiles?.email?.split('@')[0] || "Anonim"}</span>
                  <span className="ml-auto">
                    {new Date(prompt.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {!isLoading && filteredPrompts.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            Aradığınız kritere uygun fikir bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}