"use client"
import { motion } from "framer-motion"

export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8"
    >
      {children}
    </motion.div>
  )
}
