import React from 'react'
import { motion } from 'framer-motion'

export default function GlassCard({ children, className = '', animate = true, style = {} }) {
  const Comp = animate ? motion.div : 'div'
  const animProps = animate ? {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.3 },
  } : {}

  return (
    <Comp
      {...animProps}
      className={`glass-card p-5 ${className}`}
      style={style}
    >
      {children}
    </Comp>
  )
}
