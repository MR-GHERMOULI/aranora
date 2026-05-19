"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X, ArrowRight, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileMenuProps {
  siteName: string;
  navCtaText: string;
}

export default function MobileMenu({ siteName, navCtaText }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close menu on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const links = [
    { label: "Tools", href: "/tools" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Testimonials", href: "/#testimonials" },
    { label: "Affiliates", href: "/#affiliates" },
    { label: "Blog", href: "/blog" },
  ];

  return (
    <div className="md:hidden flex items-center">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle main menu"
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
      >
        {isOpen ? <X className="h-6 w-6 animate-in fade-in zoom-in-50 duration-200" /> : <Menu className="h-6 w-6 animate-in fade-in duration-200" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 top-16 bg-background/60 backdrop-blur-md z-40"
            />

            {/* Slide-out Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-16 bottom-0 w-full max-w-xs bg-background border-l border-border shadow-2xl p-6 z-50 flex flex-col justify-between"
            >
              <div className="flex flex-col gap-6">
                <nav className="flex flex-col gap-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                    Navigation
                  </p>
                  {links.map((link, idx) => (
                    <motion.div
                      key={link.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className="text-lg font-medium text-foreground hover:text-brand-primary transition-colors flex items-center justify-between py-2 border-b border-border/40 hover:border-brand-primary/20"
                      >
                        {link.label}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-brand-primary" />
                      </Link>
                    </motion.div>
                  ))}
                </nav>
              </div>

              {/* CTAs at the bottom of drawer */}
              <div className="flex flex-col gap-3 mt-auto">
                <Button
                  variant="outline"
                  asChild
                  className="w-full justify-center text-base py-6 rounded-xl"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/login" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" /> Log in
                  </Link>
                </Button>
                <Button
                  asChild
                  className="w-full justify-center bg-brand-primary hover:bg-brand-primary-light text-base py-6 rounded-xl shadow-lg shadow-brand-primary/25"
                  onClick={() => setIsOpen(false)}
                >
                  <Link href="/signup">
                    {navCtaText} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
