"use client";

import Card from "./Card";
import Button from "./Button";
import Heading from "./Heading";
import { PhotoboothPackage } from "./PackageCard";
import { motion } from "framer-motion";

interface PricingCardProps {
  pkg: PhotoboothPackage;
  onBook: (pkg: PhotoboothPackage) => void;
}

export default function PricingCard({ pkg, onBook }: PricingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-full flex"
    >
      <Card
        variant="cream"
        className={`w-full flex flex-col justify-between p-8 border border-light/45 relative shadow-md hover:shadow-lg transition-shadow bg-[#FFFDF9] rounded-2xl ${
          pkg.popular ? "ring-2 ring-primary/35 border-primary/20" : ""
        }`}
      >
        {pkg.popular && (
          <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-cream font-sans text-xs font-semibold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm">
            Populer
          </div>
        )}

        <div className="flex flex-col gap-6">
          <div>
            <h4 className="font-sans text-small font-bold text-primary tracking-wider uppercase">
              {pkg.name}
            </h4>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-h2 font-black text-neutral-900">{pkg.price}</span>
              <span className="text-small font-sans text-neutral-500">/ event</span>
            </div>
          </div>

          <p className="font-sans text-body text-neutral-500 leading-relaxed">
            Sangat cocok untuk {pkg.name === "Basic" ? "acara kecil & intim" : pkg.name === "Standard" ? "acara ulang tahun & arisan" : "pernikahan & event korporat besar"}.
          </p>

          <div className="h-px bg-light/25 w-full" />

          <ul className="flex flex-col gap-4 font-sans text-body">
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-neutral-900">
                <strong>{pkg.slots}x</strong> Sesi Pemotretan
              </span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-neutral-900">
                Cetak <strong>{pkg.prints}</strong>
              </span>
            </li>
            {pkg.perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-neutral-500">{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <Button
            variant={pkg.popular ? "primary" : "outline"}
            fullWidth
            onClick={() => onBook(pkg)}
            aria-label={`Book package ${pkg.name}`}
          >
            Pesan Sekarang
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
