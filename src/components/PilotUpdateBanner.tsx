'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink } from 'lucide-react'

interface PilotUpdate {
  id: string
  date: string
  title: string
  description: string
  impact: 'high' | 'fix'
}

const DISMISSED_KEY = 'ray-updates-dismissed'

function getDismissed(): string[] {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]')
  } catch {
    return []
  }
}

function dismissUpdate(id: string) {
  const dismissed = getDismissed()
  if (!dismissed.includes(id)) {
    dismissed.push(id)
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed))
  }
}

export default function PilotUpdateBanner() {
  const [update, setUpdate] = useState<PilotUpdate | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    async function checkUpdates() {
      try {
        const res = await fetch('/api/updates')
        if (!res.ok) return
        const { updates } = await res.json() as { updates: PilotUpdate[] }

        // Find the most recent high-impact update that hasn't been dismissed
        const dismissed = getDismissed()
        const unseen = updates.find(
          (u: PilotUpdate) => u.impact === 'high' && !dismissed.includes(u.id)
        )

        if (unseen) {
          setUpdate(unseen)
          // Small delay so it doesn't flash immediately on load
          setTimeout(() => setVisible(true), 1500)
        }
      } catch {
        // Silently fail — updates banner is non-critical
      }
    }

    checkUpdates()
  }, [])

  const handleDismiss = () => {
    if (update) dismissUpdate(update.id)
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && update && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="fixed top-20 left-4 right-4 z-40 sm:left-auto sm:right-6 sm:max-w-sm"
        >
          <div className="rounded-sm border border-clay/20 bg-linen/95 backdrop-blur-xl p-4 shadow-lg">
            {/* Header row */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide bg-clay/15 text-clay px-2 py-0.5 rounded-full">
                  Pilot Update
                </span>
                <span className="text-[10px] text-warm-grey">{update.date}</span>
              </div>
              <button
                onClick={handleDismiss}
                aria-label="Dismiss"
                className="text-warm-grey hover:text-charcoal transition-colors shrink-0 mt-0.5"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm font-bold text-charcoal leading-snug mb-1.5">
              {update.title}
            </p>
            <p className="text-xs text-charcoal/70 leading-relaxed line-clamp-3">
              {update.description}
            </p>

            {/* Link */}
            <a
              href="https://ray-research-info.vercel.app/updates"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-clay hover:text-charcoal transition-colors"
            >
              Read more <ExternalLink size={12} strokeWidth={1.5} />
            </a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
