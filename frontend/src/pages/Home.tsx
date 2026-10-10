import { useEffect } from "react";
import Lenis from "lenis";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { DEFAULT_CONFIG } from "@/lib/types";
import type { ServiceConfig } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { FeatureBento } from "@/components/FeatureBento";
import { ServiceAreas } from "@/components/ServiceAreas";
import { Footer } from "@/components/Footer";

export default function Home() {
  const { data: config } = useQuery({
    queryKey: ["config"],
    queryFn: () => apiGet<ServiceConfig>("/config"),
    staleTime: 60_000,
  });
  const cfg = config ?? DEFAULT_CONFIG;

  useEffect(() => {
    const lenis = new Lenis({ duration: 1.15 });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground antialiased">
      <div className="grain-overlay" aria-hidden="true" />
      <Navbar config={cfg} />
      <main>
        <Hero config={cfg} />
        <Marquee />
        <FeatureBento />
        <ServiceAreas config={cfg} />
      </main>
      <Footer config={cfg} />
    </div>
  );
}
