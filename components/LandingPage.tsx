"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Heading from "./ui/Heading";
import Button from "./ui/Button";
import Card from "./ui/Card";
import Section from "./ui/Section";
import PricingCard from "./ui/PricingCard";
import TestimonialCard, { Testimonial } from "./ui/TestimonialCard";
import GalleryCard, { GalleryItem } from "./ui/GalleryCard";
import { PhotoboothPackage } from "./ui/PackageCard";
import { usePhotoboothStore } from "@/store/usePhotoboothStore";

// Packages Data
const PACKAGES: PhotoboothPackage[] = [
  {
    id: "pkg-basic",
    name: "Basic Session",
    price: "IDR 150k",
    slots: 2,
    prints: "1x Cetak (Kolase)",
    perks: ["File Digital via QR", "Filter Normal & Grayscale", "Sesi 5 Menit"],
  },
  {
    id: "pkg-standard",
    name: "Standard Capture",
    price: "IDR 250k",
    slots: 3,
    prints: "2x Cetak (Kolase)",
    perks: ["File Digital via QR", "Semua Pilihan Filter", "GIF Animasi Premium", "Sesi 10 Menit"],
    popular: true,
  },
  {
    id: "pkg-premium",
    name: "Premium VIP",
    price: "IDR 400k",
    slots: 4,
    prints: "Cetak Sepuasnya",
    perks: ["File Digital via QR", "Custom Frame Premium", "GIF Animasi Premium", "Sesi 15 Menit + Asisten"],
  },
];

// Gallery Showcase Data
const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "gal-1",
    src: "https://images.unsplash.com/photo-1526218626217-dc65a29bb444?auto=format&fit=crop&w=600&h=800&q=80",
    title: "Vintage Couple Collage",
    category: "Standard",
    date: "12 Juni 2026",
  },
  {
    id: "gal-2",
    src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&h=800&q=80",
    title: "Graduation Solo Frame",
    category: "Basic",
    date: "10 Juni 2026",
  },
  {
    id: "gal-3",
    src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&h=800&q=80",
    title: "Birthday Fun GIF Preview",
    category: "Premium",
    date: "08 Juni 2026",
  },
];

// Testimonials Data
const TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    name: "Alya Putri",
    role: "Birthday Party Guest",
    quote: "Hasil foto cepat sekali keluar dan resolusinya tajam! Desain kolase frame-nya premium banget, tidak murahan.",
    rating: 5,
    initials: "AP",
  },
  {
    id: "test-2",
    name: "Rian Kurnia",
    role: "Wedding Organizer",
    quote: "Sangat direkomendasikan untuk event. Proses cetak lancar, filter grayscale-nya artistik banget, mirip studio foto professional.",
    rating: 5,
    initials: "RK",
  },
  {
    id: "test-3",
    name: "Nadia & Dodi",
    role: "Bride & Groom",
    quote: "Para tamu undangan sangat senang dengan fitur scan QR untuk langsung download file asli dan GIF animasinya. Keren abis!",
    rating: 5,
    initials: "ND",
  },
];

export default function LandingPage() {
  const { setAppMode, setKioskPage } = usePhotoboothStore();
  const [selectedPkg, setSelectedPkg] = useState<PhotoboothPackage | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", date: "" });

  const handleOpenBooking = (pkg: PhotoboothPackage) => {
    setSelectedPkg(pkg);
    setIsBookingOpen(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setIsBookingOpen(false);
      setFormData({ name: "", email: "", phone: "", date: "" });
    }, 3000);
  };

  // Launch Kiosk mode directly
  const handleLaunchKiosk = () => {
    setKioskPage(1);
    setAppMode("kiosk");
  };

  // Switch to Admin dashboard
  const handleGoToAdmin = () => {
    setAppMode("admin");
  };

  return (
    <div className="min-h-screen bg-cream text-neutral-900 scroll-smooth selection:bg-primary/20 selection:text-primary">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 w-full px-6 py-4 glass-premium border-b border-light/20 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-cream font-sans font-bold">L</div>
          <span className="font-sans text-body font-black tracking-tight text-neutral-900">
            Lenzy<span className="text-primary italic font-medium">Photo</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#gallery" className="font-sans text-small font-semibold text-neutral-500 hover:text-neutral-900 transition-colors hidden md:inline-block">Galeri</a>
          <a href="#pricing" className="font-sans text-small font-semibold text-neutral-500 hover:text-neutral-900 transition-colors hidden md:inline-block">Paket</a>
          <a href="#testimonials" className="font-sans text-small font-semibold text-neutral-500 hover:text-neutral-900 transition-colors hidden md:inline-block">Ulasan</a>
          <Button variant="primary" size="sm" onClick={() => handleOpenBooking(PACKAGES[1])}>Booking Sekarang</Button>
        </div>
      </nav>

      {/* ── Cinematic Hero ──────────────────────────────────────────────── */}
      <Section spacing="lg" size="lg" className="relative overflow-hidden flex flex-col justify-center items-center text-center">
        {/* Background Decorative Gradient */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex flex-col items-center gap-6"
        >
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 bg-primary/10 border border-primary/20">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="font-sans text-xs font-bold text-primary tracking-widest uppercase">Premium Photobooth Kiosk</span>
          </div>

          <Heading level="display" className="max-w-4xl text-neutral-900">
            Abadikan Momen Berharga Dengan Gaya <span className="text-primary italic font-serif font-normal">Premium</span>
          </Heading>

          <p className="font-sans text-body text-neutral-500 max-w-2xl leading-relaxed">
            Lenzy Photobooth menghadirkan pengalaman foto kiosk berkelas studio dengan kamera DSLR berkualitas tinggi, cetak kilat, filter estetik, serta instant share digital via QR.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4">
            <Button variant="primary" size="lg" onClick={() => handleOpenBooking(PACKAGES[1])}>
              Dapatkan Penawaran
            </Button>
            <Button variant="outline" size="lg" onClick={handleLaunchKiosk}>
              Mulai Kiosk Mode
            </Button>
          </div>
        </motion.div>
      </Section>

      {/* ── Interactive Gallery Section ─────────────────────────────────── */}
      <Section id="gallery" spacing="md" size="lg">
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <Heading level="h2" variant="primary" className="italic font-serif font-normal">Premium Gallery</Heading>
          <Heading level="h3" variant="dark">Koleksi Hasil Foto Lenzy</Heading>
          <p className="font-sans text-body text-neutral-500 max-w-lg">
            Intip beberapa contoh hasil cetak kolase dan GIF animasi berkelas dari para pengunjung kami.
          </p>
        </div>

        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {GALLERY_ITEMS.map((item) => (
            <motion.div
              key={item.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 20 } }
              }}
            >
              <GalleryCard item={item} />
            </motion.div>
          ))}
        </motion.div>
      </Section>

      {/* ── Pricing & Packages Section ───────────────────────────────────── */}
      <Section id="pricing" spacing="md" size="lg">
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <Heading level="h2" variant="primary" className="italic font-serif font-normal">Pricing &amp; Packages</Heading>
          <Heading level="h3" variant="dark">Paket Harga Sewa Photobooth</Heading>
          <p className="font-sans text-body text-neutral-500 max-w-lg">
            Pilih paket yang paling sesuai untuk memeriahkan pesta pernikahan, ulang tahun, atau event corporate Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PACKAGES.map((pkg) => (
            <PricingCard key={pkg.id} pkg={pkg} onBook={handleOpenBooking} />
          ))}
        </div>
      </Section>

      {/* ── Testimonials Section ─────────────────────────────────────────── */}
      <Section id="testimonials" spacing="md" size="lg">
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <Heading level="h2" variant="primary" className="italic font-serif font-normal">Client Reviews</Heading>
          <Heading level="h3" variant="dark">Apa Kata Mereka Tentang Kami?</Heading>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((test) => (
            <TestimonialCard key={test.id} testimonial={test} />
          ))}
        </div>
      </Section>

      {/* ── Footer / Operator Panel Escape ──────────────────────────────── */}
      <footer className="bg-dark text-cream border-t border-primary/20 mt-16 px-6 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-light flex items-center justify-center text-dark font-sans font-bold text-xs">L</div>
              <span className="font-sans text-small font-black tracking-tight">
                Lenzy<span className="text-light italic font-medium">Photo</span>
              </span>
            </div>
            <p className="font-sans text-xs text-cream/40 mt-1">
              &copy; 2026 Lenzy Photobooth. All rights reserved.
            </p>
          </div>

          {/* Quick links & Secret escapes */}
          <div className="flex flex-wrap justify-center gap-6 font-sans text-xs text-cream/65">
            <button onClick={handleLaunchKiosk} className="hover:text-cream hover:underline cursor-pointer">
              Launch Kiosk Mode
            </button>
            <button onClick={handleGoToAdmin} className="hover:text-cream hover:underline cursor-pointer">
              Admin Panel Dashboard
            </button>
            <a href="#gallery" className="hover:text-cream hover:underline">Galeri</a>
            <a href="#pricing" className="hover:text-cream hover:underline">Paket</a>
          </div>
        </div>
      </footer>

      {/* ── Interactive Booking Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {isBookingOpen && selectedPkg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingOpen(false)}
              className="absolute inset-0 bg-dark/60 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative w-full max-w-lg z-10"
            >
              <Card variant="cream" className="p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative bg-white border border-light/30">
                {/* Close Button */}
                <button
                  onClick={() => setIsBookingOpen(false)}
                  className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-900 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-neutral-100"
                  aria-label="Tutup form"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {isSuccess ? (
                  // Success confirmation UI
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-10 gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <Heading level="h3" variant="primary">Booking Berhasil!</Heading>
                    <p className="font-sans text-body text-neutral-500 max-w-xs">
                      Terima kasih, admin kami akan segera menghubungi Anda melalui email/WhatsApp untuk konfirmasi jadwal.
                    </p>
                  </motion.div>
                ) : (
                  // Booking Form UI
                  <>
                    <div>
                      <span className="font-sans text-xs font-semibold text-primary uppercase tracking-wider">
                        Form Booking Sesi
                      </span>
                      <Heading level="h3" variant="dark" className="mt-1">
                        Paket: {selectedPkg.name}
                      </Heading>
                    </div>

                    <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4 font-sans text-body">
                      {/* Name input */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="book-name" className="text-xs font-semibold text-neutral-500">Nama Lengkap</label>
                        <input
                          id="book-name"
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Masukkan nama lengkap Anda"
                          className="w-full px-4 py-3 rounded-xl border border-light/50 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-neutral-900"
                        />
                      </div>

                      {/* Email input */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="book-email" className="text-xs font-semibold text-neutral-500">Alamat Email</label>
                        <input
                          id="book-email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                          className="w-full px-4 py-3 rounded-xl border border-light/50 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-neutral-900"
                        />
                      </div>

                      {/* Phone input */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="book-phone" className="text-xs font-semibold text-neutral-500">Nomor WhatsApp</label>
                        <input
                          id="book-phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="081234567890"
                          className="w-full px-4 py-3 rounded-xl border border-light/50 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-neutral-900"
                        />
                      </div>

                      {/* Date input */}
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="book-date" className="text-xs font-semibold text-neutral-500">Tanggal Acara</label>
                        <input
                          id="book-date"
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-light/50 bg-cream/30 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-neutral-900"
                        />
                      </div>

                      <div className="mt-4">
                        <Button variant="primary" fullWidth type="submit">
                          Konfirmasi Booking
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
