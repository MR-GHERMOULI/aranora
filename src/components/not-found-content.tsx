"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Home,
  ArrowRight,
  Search,
  Briefcase,
  FileText,
  HelpCircle,
  Mail,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

const quickLinks = [
  {
    label: "Homepage",
    href: "/",
    icon: Home,
    description: "Back to the main page",
  },
  {
    label: "Features",
    href: "/#features",
    icon: Sparkles,
    description: "Explore what we offer",
  },
  {
    label: "Pricing",
    href: "/pricing",
    icon: FileText,
    description: "View our plans",
  },
  {
    label: "Contact Us",
    href: "/contact",
    icon: Mail,
    description: "Get in touch with us",
  },
];

export default function NotFoundContent() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-20">
      {/* ── Animated Background Orbs ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-32 -right-32 w-[420px] h-[420px] rounded-full bg-brand-primary/[0.06] blur-3xl"
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 20, 0],
            scale: [1, 1.05, 0.95, 1],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-secondary/[0.05] blur-3xl"
          animate={{
            x: [0, -30, 20, 0],
            y: [0, 20, -20, 0],
            scale: [1, 0.95, 1.05, 1],
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        <motion.div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] rounded-full bg-brand-primary/[0.03] blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, var(--foreground) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* ── Main Content ── */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Animated 404 Number */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            duration: 0.8,
            ease: [0.21, 0.47, 0.32, 0.98],
          }}
          className="relative mb-4"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Glow behind the number */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            animate={{ opacity: isHovered ? 0.3 : 0.1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="w-64 h-64 rounded-full bg-brand-primary/20 blur-[80px]" />
          </motion.div>

          <motion.h1
            className="relative text-[10rem] sm:text-[13rem] lg:text-[16rem] font-black leading-none tracking-tighter select-none"
            style={{
              background:
                "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-light) 40%, var(--brand-secondary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
            animate={
              isHovered
                ? {
                    textShadow: [
                      "0 0 0px transparent",
                      "0 0 40px rgba(74, 222, 128, 0.3)",
                      "0 0 0px transparent",
                    ],
                  }
                : {}
            }
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            404
          </motion.h1>
        </motion.div>

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive text-sm font-semibold mb-6 border border-destructive/20">
            <HelpCircle className="h-4 w-4" />
            Page Not Found
          </div>
        </motion.div>

        {/* Title & Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4 tracking-tight">
            Oops! This page has{" "}
            <span className="bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              wandered off
            </span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-lg mx-auto leading-relaxed mb-10">
            The page you&apos;re looking for doesn&apos;t exist or has been
            moved. Let&apos;s get you back on track.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Button
            size="lg"
            asChild
            className="bg-brand-primary hover:bg-brand-primary-light text-base px-8 py-6 shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 transition-all hover:scale-[1.02]"
          >
            <Link href="/">
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="text-base px-8 py-6 border-border hover:bg-muted/50 transition-all"
          >
            <Link href="/contact">
              <Mail className="mr-2 h-5 w-5" />
              Contact Support
            </Link>
          </Button>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="section-divider mb-12"
        />

        {/* Quick Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
            Quick Navigation
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickLinks.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.8 + i * 0.1 }}
              >
                <Link
                  href={link.href}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border card-brand-hover"
                >
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 dark:from-brand-primary/20 dark:to-brand-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <link.icon className="h-5 w-5 text-brand-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground group-hover:text-brand-primary transition-colors">
                      {link.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">
                      {link.description}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Bottom hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="mt-12 text-sm text-muted-foreground"
        >
          Think this is a mistake?{" "}
          <Link
            href="/contact"
            className="text-brand-primary hover:underline font-medium inline-flex items-center gap-1"
          >
            Let us know <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
