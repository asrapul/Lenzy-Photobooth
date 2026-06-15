"use client";

import Card from "./Card";
import Button from "./Button";
import Heading from "./Heading";
import { motion } from "framer-motion";

export interface PhotoboothPackage {
  id: string;
  name: string;
  price: string;
  slots: number;
  prints: string;
  perks: string[];
  popular?: boolean;
}

interface PackageCardProps {
  pkg: PhotoboothPackage;
  onSelect?: (pkg: PhotoboothPackage) => void;
  selected?: boolean;
}

export default function PackageCard({ pkg, onSelect, selected = false }: PackageCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-full max-w-sm flex"
    >
      <Card
        variant={selected ? "dark" : "cream"}
        className={`w-full flex flex-col justify-between p-6 border-2 relative ${
          selected ? "border-primary" : "border-light/30"
        } ${pkg.popular && !selected ? "ring-2 ring-primary/20" : ""}`}
      >
        {pkg.popular && (
          <div className="absolute top-4 right-4 bg-primary text-cream font-sans text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            Terpopuler
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <span className={`text-small font-sans font-semibold tracking-wider uppercase ${selected ? "text-light" : "text-primary"}`}>
              Paket Photobooth
            </span>
            <Heading level="h3" variant={selected ? "light" : "dark"} className="mt-1">
              {pkg.name}
            </Heading>
          </div>

          <div className="flex items-baseline gap-1">
            <span className={`text-h1 font-extrabold ${selected ? "text-cream" : "text-neutral-900"}`}>
              {pkg.price}
            </span>
            <span className={`text-small font-sans ${selected ? "text-cream/60" : "text-neutral-500"}`}>
              /sesi
            </span>
          </div>

          {/* Divider */}
          <div className={`h-px w-full ${selected ? "bg-cream/10" : "bg-neutral-900/10"}`} />

          {/* Perks list */}
          <ul className="flex flex-col gap-3 font-sans text-body">
            <li className="flex items-center gap-2.5">
              <svg className={`w-5 h-5 flex-shrink-0 ${selected ? "text-light" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className={selected ? "text-cream/90" : "text-neutral-900"}>
                <strong>{pkg.slots}x</strong> Sesi Pemotretan
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <svg className={`w-5 h-5 flex-shrink-0 ${selected ? "text-light" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className={selected ? "text-cream/90" : "text-neutral-900"}>
                Cetak <strong>{pkg.prints}</strong>
              </span>
            </li>
            {pkg.perks.map((perk, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <svg className={`w-5 h-5 flex-shrink-0 ${selected ? "text-light" : "text-primary"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className={selected ? "text-cream/80" : "text-neutral-500"}>
                  {perk}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {onSelect && (
          <div className="mt-8">
            <Button
              variant={selected ? "secondary" : "primary"}
              fullWidth
              onClick={() => onSelect(pkg)}
              aria-label={`Pilih paket ${pkg.name}`}
            >
              Pilih Paket
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
