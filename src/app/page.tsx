"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield, Zap, RefreshCcw, Globe } from "lucide-react";
import { MOCK_STATS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { CrossChainDeposit } from "@/lib/components/CrossChainDeposit";

function AnimatedCounter({ target, prefix = "$" }: { target: number; prefix?: string }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef<number | undefined>(undefined);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let step = 0;

    ref.current = window.setInterval(() => {
      step++;
      if (step >= steps) {
        setCurrent(target);
        clearInterval(ref.current);
      } else {
        setCurrent(Math.round(increment * step));
      }
    }, duration / steps);

    return () => clearInterval(ref.current);
  }, [target]);

  return (
    <span className="gradient-text" style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
      {prefix}{(current / 1_000_000_000).toFixed(2)}B
    </span>
  );
}

const features = [
  {
    icon: Globe,
    title: "Cross-Chain",
    description: "Earn yield across Solana, Base, and more from a single deposit.",
  },
  {
    icon: Zap,
    title: "Auto-Compound",
    description: "Yields are automatically compounded for maximum returns.",
  },
  {
    icon: Shield,
    title: "Risk-Adjusted",
    description: "Intelligent allocation to the best risk-adjusted strategies.",
  },
  {
    icon: RefreshCcw,
    title: "Gasless Deposits",
    description: "Account abstraction enables zero-gas deposit experience.",
  },
];

const protocols = ["Kamino", "Jito", "Marinade", "Aave", "Aerodrome", "Compound"];

export default function HeroPage() {
  return (
    <div style={{ marginLeft: "-32px", marginTop: "-32px", marginRight: "-32px" }}>
      {/* Hero Section */}
      <section
        className="relative flex flex-col items-center justify-center text-center overflow-hidden"
        style={{
          minHeight: "calc(100vh - var(--topbar-height))",
          padding: "80px 24px",
        }}
      >
        {/* Glow orbs */}
        <div
          className="absolute"
          style={{
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
            top: "-200px",
            left: "10%",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(0,212,255,0.1) 0%, transparent 70%)",
            bottom: "-100px",
            right: "5%",
            filter: "blur(60px)",
          }}
        />

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{
            background: "var(--cyan-glow)",
            border: "1px solid rgba(0, 212, 255, 0.2)",
            color: "var(--cyan)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--green)" }} />
          Live on Solana & Base
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold leading-tight mb-6"
          style={{
            maxWidth: "800px",
            fontFamily: "var(--font-outfit, 'Outfit', sans-serif)",
          }}
        >
          Deposit once.{" "}
          <span className="gradient-text">Earn everywhere.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl mb-10"
          style={{
            color: "var(--text-secondary)",
            maxWidth: "560px",
            lineHeight: 1.7,
          }}
        >
          The unified yield aggregator. Best risk-adjusted yield across chains — automatically compounded.
        </motion.p>

        {/* TVL Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center gap-8 mb-12"
        >
          <div className="text-center">
            <div className="text-4xl md:text-5xl font-bold mb-1">
              <AnimatedCounter target={MOCK_STATS.totalTVL} />
            </div>
            <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Total Value Locked
            </div>
          </div>
          <div
            className="w-px h-12"
            style={{ background: "var(--border)" }}
          />
          <div className="text-center">
            <div
              className="text-4xl md:text-5xl font-bold"
              style={{
                color: "var(--green)",
                fontFamily: "var(--font-outfit, 'Outfit', sans-serif)",
              }}
            >
              {MOCK_STATS.avgAPY.toFixed(1)}%
            </div>
            <div className="text-sm" style={{ color: "var(--text-tertiary)" }}>
              Average APY
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center gap-4"
        >
          <Link href="/vaults">
            <button className="btn-green flex items-center gap-2 text-base">
              Start Earning <ArrowRight size={18} />
            </button>
          </Link>
          <Link href="/analytics">
            <button className="btn-secondary text-base">View Analytics</button>
          </Link>
        </motion.div>

        {/* Cross Chain Bridging Widget */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-16 w-full max-w-4xl px-4"
        >
          <CrossChainDeposit />
        </motion.div>

        {/* Protocol Logos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex items-center gap-6 mt-20"
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            POWERED BY
          </span>
          {protocols.map((name) => (
            <span
              key={name}
              className="text-sm font-medium px-3 py-1 rounded-full"
              style={{
                color: "var(--text-tertiary)",
                background: "var(--glass)",
                border: "1px solid var(--border)",
              }}
            >
              {name}
            </span>
          ))}
        </motion.div>
      </section>

      {/* Features Section */}
      <section
        className="py-24 px-8"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-4"
            style={{ fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}
          >
            Why <span className="gradient-text">OmniYield</span>?
          </h2>
          <p
            className="text-center mb-16"
            style={{ color: "var(--text-secondary)", maxWidth: "480px", margin: "0 auto 64px" }}
          >
            Built for serious DeFi users who demand the best yield without managing multiple positions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="glass-card p-6 flex flex-col items-start gap-4"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{
                    background: "var(--cyan-glow)",
                    color: "var(--cyan)",
                  }}
                >
                  <feature.icon size={20} />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section
        className="py-16 px-8"
        style={{ borderTop: "1px solid var(--border)", background: "var(--bg-secondary)" }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { label: "Total Value Locked", value: formatCurrency(MOCK_STATS.totalTVL) },
            { label: "Total Users", value: MOCK_STATS.totalUsers.toLocaleString() },
            { label: "Yield Distributed", value: formatCurrency(MOCK_STATS.totalYieldDistributed) },
            { label: "Active Vaults", value: MOCK_STATS.vaultCount.toString() },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                className="text-2xl font-bold mb-1"
                style={{
                  fontFamily: "var(--font-outfit, 'Outfit', sans-serif)",
                  color: "var(--text-primary)",
                }}
              >
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
