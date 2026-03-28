'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { useSessionStore } from '@/store/sessionStore'
import { api } from '@/lib/api'

const ACTIVITY_OPTIONS = [
  {
    key: 'explorer' as const,
    label: 'The Explorer',
    description: 'Highly Active: Hiking, cycling, and travel.',
  },
  {
    key: 'harmonist' as const,
    label: 'The Harmonist',
    description: 'Moderately Active: Golf, gardening, and long walks.',
  },
  {
    key: 'observer' as const,
    label: 'The Observer',
    description: 'Relaxed: Cooking, reading, and culture.',
  },
]

export default function HealthEnergyPage() {
  const [selected, setSelected] = useState<'explorer' | 'harmonist' | 'observer' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { sessionId, setActivityLevel } = useSessionStore()

  const handleSubmit = async () => {
    if (!selected || !sessionId || isSubmitting) return
    setIsSubmitting(true)
    try {
      await api.saveHealth(sessionId, selected)
      setActivityLevel(selected)
      router.push('/canvas-moment')
    } catch (err) {
      console.error('Failed to save health selection:', err)
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <TopNav activeSection="directives" />
      <main className="min-h-screen pt-32 pb-24 px-6 md:px-24 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        {/* Left: Image */}
        <div className="lg:col-span-5 relative">
          <div className="aspect-[4/5] bg-surface-container-highest overflow-hidden relative shadow-2xl">
            <div className="w-full h-full bg-gradient-to-br from-primary-container/30 to-surface-container-high flex items-center justify-center">
              <span className="font-headline text-8xl italic text-primary/20">V</span>
            </div>
            <div className="absolute bottom-8 -right-4 bg-white px-8 py-4 shadow-xl border-l-4 border-primary">
              <span className="block font-label text-[10px] tracking-[0.3em] uppercase text-on-surface-variant mb-1">Status</span>
              <span className="font-headline text-xl italic text-primary">Vitality Peak</span>
            </div>
          </div>
          <div className="absolute -top-10 -left-10 w-32 h-32 border-t border-l border-outline-variant opacity-30 hidden md:block" />
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-7 space-y-12">
          <header className="space-y-6">
            <div className="inline-block px-4 py-1 border border-outline-variant">
              <span className="font-label text-[10px] uppercase tracking-[0.25em] text-primary">Chapter IV: Vitality</span>
            </div>
            <h1 className="font-headline text-5xl md:text-7xl leading-tight tracking-tight text-on-surface">
              How physical do you want <span className="italic">this life</span> to be?
            </h1>
            <p className="font-body text-lg text-secondary leading-relaxed max-w-xl">
              Define the cadence of your daily movements. Your health directive ensures your monograph reflects the energy you intend to manifest.
            </p>
          </header>

          <div className="space-y-4">
            {ACTIVITY_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => setSelected(option.key)}
                className={`group w-full text-left p-8 transition-all duration-500 flex items-center justify-between ${
                  selected === option.key
                    ? 'bg-surface-container-highest border-l-4 border-primary'
                    : 'bg-surface-container-low hover:bg-surface-container-highest'
                }`}
              >
                <div className="space-y-2">
                  <span className={`font-label text-[10px] uppercase tracking-[0.2em] transition-colors ${
                    selected === option.key ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'
                  }`}>
                    {option.label}
                  </span>
                  <h3 className="font-headline text-2xl text-on-surface">{option.description}</h3>
                </div>
                <span className={`material-symbols-outlined transition-transform group-hover:translate-x-2 ${
                  selected === option.key ? 'text-primary' : 'text-outline-variant group-hover:text-primary'
                }`} style={selected === option.key ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {selected === option.key ? 'check_circle' : 'arrow_forward'}
                </span>
              </button>
            ))}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center gap-8">
            <button
              onClick={handleSubmit}
              disabled={!selected || isSubmitting}
              className="w-full sm:w-auto px-12 py-5 bg-primary text-on-primary font-label text-xs uppercase tracking-[0.3em] hover:bg-primary-container transition-all duration-500 shadow-lg disabled:opacity-40"
            >
              Commit to Archive
            </button>
            <button
              onClick={() => router.back()}
              className="font-label text-xs uppercase tracking-[0.2em] text-secondary hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-1"
            >
              Review Previous Chapter
            </button>
          </div>
        </div>
      </main>
    </>
  )
}
