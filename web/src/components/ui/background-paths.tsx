"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";

function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 14 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 1 + i * 0.06,
  }));

  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0">
      <svg className="h-full w-full text-white" viewBox="0 0 696 316" fill="none" aria-hidden="true">
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.1 + path.id * 0.02}
            pathLength={1}
            initial={{ opacity: 0.35 }}
            animate={reduceMotion ? { opacity: 0.4 } : { opacity: [0.22, 0.5, 0.22] }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { duration: 8 + (path.id % 4) * 2, repeat: Infinity, ease: "easeInOut" }
            }
          />
        ))}
      </svg>
    </div>
  );
}

// Signature hero treatment: animated flowing paths behind a big letter-in
// title, with real page content (e.g. the sign-in card) composed below via
// `children` — this component only owns the backdrop, never form logic.
export function BackgroundPaths({ title, children }: { title: string; children?: ReactNode }) {
  const words = title.split(" ");
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden px-4">
      <div className="absolute inset-0">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <motion.h1
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-2 text-5xl font-bold tracking-tighter sm:text-6xl"
        >
          {words.map((word, wordIndex) => (
            <span key={wordIndex} className="mr-3 inline-block last:mr-0">
              {word.split("").map((letter, letterIndex) => (
                <motion.span
                  key={`${wordIndex}-${letterIndex}`}
                  initial={reduceMotion ? false : { y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{
                    delay: reduceMotion ? 0 : wordIndex * 0.1 + letterIndex * 0.03,
                    type: "spring",
                    stiffness: 150,
                    damping: 25,
                  }}
                  className="inline-block bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent"
                >
                  {letter}
                </motion.span>
              ))}
            </span>
          ))}
        </motion.h1>

        {children && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="mt-6 w-full"
          >
            {children}
          </motion.div>
        )}
      </div>
    </div>
  );
}
