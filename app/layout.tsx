import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fikir Fabrikası | Yapay Zeka Destekli İş Planı ve Prompt Jeneratörü",
  description: "Fikirlerinizi saniyeler içinde devasa iş planlarına, yazılım mimarilerine ve pazarlama stratejilerine dönüştürün. Dünyanın en zeki prompt mühendisliği aracı.",
  keywords: ["yapay zeka", "prompt oluşturucu", "iş planı", "girişimcilik", "yazılım mimarisi", "chatgpt prompt", "ai tools"],
  authors: [{ name: "Fikir Fabrikası Ekibi" }],
  openGraph: {
    title: "Fikir Fabrikası | AI Prompt Jeneratörü",
    description: "Sıradan bir fikri, kopyalamaya hazır profesyonel bir yol haritasına dönüştürün.",
    url: "https://fikirfabrikasi.com", // Canlıya alınca kendi domainini buraya yaz
    siteName: "Fikir Fabrikası",
    images: [
      {
        url: "https://images.unsplash.com/photo-1633265486064-086b219458ce?q=80&w=1200&auto=format&fit=crop", // Afilli bir neon arka plan resmi
        width: 1200,
        height: 630,
        alt: "Fikir Fabrikası Önizleme",
      },
    ],
    locale: "tr_TR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Fikir Fabrikası | AI Prompt Jeneratörü",
    description: "Sıradan bir fikri, kopyalamaya hazır profesyonel bir yol haritasına dönüştürün.",
    images: ["https://images.unsplash.com/photo-1633265486064-086b219458ce?q=80&w=1200&auto=format&fit=crop"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} bg-[#060a13] text-white min-h-screen selection:bg-purple-500/30`}>
        {children}
      </body>
    </html>
  );
}