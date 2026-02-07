"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"

const IMAGES = [
  {
    src: "/images/DSC08614.jpg",
    alt: "Flota AMEL en operación",
  },
  {
    src: "/images/DSC08621.jpg",
    alt: "Unidad AMEL en ruta",
  },
  {
    src: "/images/DSC08636.jpg",
    alt: "Operación especializada AMEL",
  },
  {
    src: "/images/Copia%20de%20trailer%201%20atardecer.png",
    alt: "Unidad AMEL al atardecer",
  },
  {
    src: "/images/Copia%20de%20trailer%201%20nublado.png",
    alt: "Unidad AMEL en día nublado",
  },
  {
    src: "/images/Copia%20de%20trailer%20en%20desierto.png",
    alt: "Unidad AMEL en ruta desértica",
  },
]

export function InteractiveHero() {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = useMemo(() => IMAGES[activeIndex], [activeIndex])

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % IMAGES.length)
    }, 4500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="relative overflow-hidden rounded-xl border border-white/10">
        <Image
          src={active.src}
          alt={active.alt}
          width={1000}
          height={600}
          className="h-[280px] w-full object-cover transition-all duration-700"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {IMAGES.slice(0, 6).map((img, idx) => {
          const isActive = idx === activeIndex
          return (
            <button
              key={img.src}
              onClick={() => setActiveIndex(idx)}
              className={`relative overflow-hidden rounded-lg border transition-all ${
                isActive ? "border-[#FFDE18] ring-2 ring-[#FFDE18]/40" : "border-white/10 hover:border-white/40"
              }`}
              aria-label={`Ver imagen ${idx + 1}`}
              type="button"
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={300}
                height={200}
                className={`h-[80px] w-full object-cover ${isActive ? "opacity-100" : "opacity-70"}`}
              />
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-white/70">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 transition-transform hover:-translate-y-1">
          <div className="uppercase">Seguridad</div>
          <div className="text-lg font-black text-[#FFDE18]">100%</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 transition-transform hover:-translate-y-1">
          <div className="uppercase">Puntualidad</div>
          <div className="text-lg font-black text-[#FFDE18]">24/7</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 transition-transform hover:-translate-y-1">
          <div className="uppercase">Cobertura</div>
          <div className="text-lg font-black text-[#FFDE18]">Nacional</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 transition-transform hover:-translate-y-1">
          <div className="uppercase">Flota</div>
          <div className="text-lg font-black text-[#FFDE18]">Especializada</div>
        </div>
      </div>
    </div>
  )
}
