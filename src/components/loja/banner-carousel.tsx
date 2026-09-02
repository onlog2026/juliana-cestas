"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { activeBanners } from "@/lib/banners";

export function BannerCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = activeBanners.length;

  useEffect(() => {
    if (count < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 5500);
    return () => window.clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  return (
    <section
      className="relative w-full overflow-hidden bg-secondary/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative aspect-[4/5] w-full sm:aspect-[16/9] lg:aspect-[21/8]">
        <div
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {activeBanners.map((banner, i) => (
            <Link
              key={banner.id}
              href={banner.href}
              className="relative h-full w-full shrink-0"
              tabIndex={i === index ? 0 : -1}
              aria-hidden={i === index ? undefined : true}
            >
              <Image
                src={banner.image}
                alt={banner.text}
                fill
                priority={i === 0}
                sizes="100vw"
                className="object-cover"
                style={{ objectPosition: banner.objectPosition }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <p
                className="jc-pop absolute font-display text-xl leading-snug text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)] sm:text-2xl md:text-4xl"
                style={{
                  top: `${banner.textPosition.top}%`,
                  left: `${banner.textPosition.left}%`,
                  maxWidth: `${banner.textPosition.maxWidth}%`,
                  textAlign: banner.textAlign ?? "left",
                }}
              >
                {banner.text}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {count > 1 ? (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {activeBanners.map((banner, i) => (
            <button
              key={banner.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver banner ${i + 1} de ${count}`}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/50"
              }`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
