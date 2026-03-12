'use client';
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import GoLiveSection from "@/components/landing/GoLiveSection";
import BenchmarkSection from "@/components/landing/BenchmarkSection";
import SocialStatsSection from "@/components/landing/SocialStatsSection";
import PricingSection from "@/components/landing/PricingSection";
import Footer from "@/components/landing/Footer";
import { authClient } from "@/lib/auth-client"


const SectionDivider = ({ variant = "green" }: { variant?: "green" | "yellow" | "peach" }) => {
  const colors = {
    green: "from-transparent via-green-badge/20 to-transparent",
    yellow: "from-transparent via-accent/20 to-transparent",
    peach: "from-transparent via-destructive/10 to-transparent",
  };
  return (
    <div className="relative h-px w-full overflow-hidden">
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        className={`h-px w-full bg-linear-to-r ${colors[variant]}`}
      />
    </div>
  );
};

const Index = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const signinwithgoogle = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
      scopes: ["https://www.googleapis.com/auth/drive"],// if drive.file then it will only give access to files created by the app from a particular device
    })
  }

  // Global progress bar
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-hidden relative">
      {/* Scroll progress indicator */}
      <motion.div
        style={{ scaleX, transformOrigin: "left" }}
        className="fixed top-0 left-0 right-0 h-1 bg-linear-to-r from-green-badge via-accent to-green-badge z-50"
      />

      <HeroSection signinwithgoogle={signinwithgoogle} />
      <SectionDivider variant="green" />
      <FeaturesSection />
      <SectionDivider variant="yellow" />
      <GoLiveSection />
      <SectionDivider variant="peach" />
      <BenchmarkSection />
      <SectionDivider variant="green" />
      <SocialStatsSection />
      <SectionDivider variant="peach" />
      <PricingSection />
      <Footer signinwithgoogle={signinwithgoogle} />
    </div>
  );
};

export default Index;
