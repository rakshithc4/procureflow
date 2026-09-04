"use client"

// Trimmed from Skiper UI's skiper37 ("Animated number") — a count-up that
// runs once when it scrolls into view, built on NumberFlow + Motion.
// https://skiper-ui.com — free component, attribution per its license.
import { useRef, useState } from "react"
import { motion, useReducedMotion, type Variants } from "motion/react"
import NumberFlow from "@number-flow/react"

export function AnimatedNumber({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const [display, setDisplay] = useState(0)
  const hasAnimated = useRef(false)
  const reduceMotion = useReducedMotion()

  return (
    <motion.span
      onViewportEnter={() => {
        if (hasAnimated.current || reduceMotion) {
          setDisplay(value)
          return
        }
        hasAnimated.current = true
        setDisplay(value)
      }}
      viewport={{ once: true }}
      className={className}
    >
      <NumberFlow value={display} transformTiming={{ duration: 600, easing: "ease-out" }} />
    </motion.span>
  )
}

export const statCardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.05, ease: "easeOut" },
  }),
}
