"use client"

// Trimmed from Skiper UI's skiper89 ("Scroll progress 001") — a draggable
// circular scroll-position indicator, fixed to the corner of the viewport.
// https://skiper-ui.com — free component, attribution per its license.
import { useState } from "react"
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion"
import NumberFlow from "@number-flow/react"

const RADIUS = 18
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const [percent, setPercent] = useState(0)
  const reduceMotion = useReducedMotion()

  const clamped = useTransform(scrollYProgress, (v) => Math.min(Math.max(v, 0), 1))
  const asPercent = useTransform(clamped, (v) => Math.round(v * 100))
  useMotionValueEvent(asPercent, "change", setPercent)

  return (
    <motion.div
      role="region"
      aria-label="Scroll progress"
      drag={!reduceMotion}
      dragMomentum={false}
      dragElastic={0.15}
      className="group fixed bottom-5 right-5 z-40 hidden items-center gap-1 cursor-grab active:cursor-grabbing sm:flex"
    >
      <NumberFlow
        value={percent}
        suffix="%"
        className="absolute top-1 -translate-y-full px-3 text-xs font-medium tabular-nums text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
      />
      <div className="flex size-11 items-center justify-center rounded-2xl border border-border bg-card/60 text-status-approved-fg backdrop-blur">
        <svg className="size-9" viewBox="0 0 48 48" role="presentation">
          <circle cx="24" cy="24" r={RADIUS} stroke="currentColor" strokeWidth="3" className="opacity-25" fill="none" />
          <motion.circle
            cx="24"
            cy="24"
            r={RADIUS}
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            style={{ pathLength: clamped, rotate: -90, transformOrigin: "50% 50%" }}
          />
        </svg>
      </div>
    </motion.div>
  )
}
