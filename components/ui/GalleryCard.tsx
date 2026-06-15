"use client";

import Card from "./Card";
import { motion } from "framer-motion";
import { useState } from "react";

export interface GalleryItem {
  id: string;
  src: string;
  title: string;
  category: string;
  date: string;
}

interface GalleryCardProps {
  item: GalleryItem;
}

export default function GalleryCard({ item }: GalleryCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="w-full aspect-[3/4] flex"
    >
      <Card
        variant="cream"
        className="w-full relative group cursor-pointer border border-light/25 shadow-sm rounded-2xl flex flex-col p-2 bg-white"
        onClick={() => {}}
      >
        <div
          className="relative w-full h-full overflow-hidden rounded-xl bg-cream flex items-center justify-center"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.src}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out"
            style={{ transform: hovered ? "scale(1.05)" : "scale(1.0)" }}
          />

          {/* Hover Overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-dark/90 via-dark/40 to-transparent flex flex-col justify-end p-5 transition-opacity duration-300 ease-out"
            style={{ opacity: hovered ? 1 : 0 }}
          >
            <span className="text-light text-xs font-sans font-semibold tracking-wider uppercase">
              {item.category}
            </span>
            <h3 className="text-cream text-body font-sans font-bold mt-1">
              {item.title}
            </h3>
            <span className="text-cream/60 text-xs font-sans mt-0.5">
              {item.date}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
