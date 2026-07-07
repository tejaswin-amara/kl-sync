import * as React from "react"
import { motion, HTMLMotionProps } from "framer-motion"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode
  className?: string
  glowIntensity?: "low" | "medium" | "high"
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, glowIntensity = "low", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl p-6",
          className
        )}
        whileHover={{ y: -2 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...props}
      >
        {/* Subtle top glare */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        
        {/* Optional animated glow element */}
        {glowIntensity !== "low" && (
          <div className={cn(
            "pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            glowIntensity === "medium" ? "bg-white/5" : "bg-white/10 blur-md"
          )} />
        )}
        
        {children}
      </motion.div>
    )
  }
)
GlassCard.displayName = "GlassCard"
