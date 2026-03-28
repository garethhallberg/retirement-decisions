'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { useSessionStore } from '@/store/sessionStore'
import { api } from '@/lib/api'

const CATEGORY_COLORS: Record<string, string> = {
  activity: 'bg-primary/10 text-primary',
  travel: 'bg-tertiary/10 text-tertiary',
  creative: 'bg-inverse-primary/20 text-on-primary-container',
  cultural: 'bg-secondary-container text-on-secondary-container',
  social: 'bg-primary-fixed/30 text-on-primary-fixed-variant',
}

export default function CanvasMomentPage() {
  const [isGenerating, setIsGenerating] = useState(true)
  const router = useRouter()
  const { sessionId, canvasCards, setCanvasCards } = useSessionStore()

  useEffect(() => {
    if (!sessionId || canvasCards.length > 0) {
      setIsGenerating(false)
      return
    }

    const generate = async () => {
      try {
        const { cards } = await api.generateCanvas(sessionId)
        setCanvasCards(cards.map((card: any, i: number) => ({
          id: card.id || crypto.randomUUID(),
          title: card.title,
          description: card.description,
          category: card.category,
          imageQuery: card.imageQuery,
          sequenceOrder: i + 1,
        })))
      } catch (err) {
        console.error('Failed to generate canvas:', err)
      } finally {
        setIsGenerating(false)
      }
    }

    generate()
  }, [sessionId])

  // Asymmetric grid positions
  const gridClasses = [
    'md:col-span-8',
    'md:col-span-4 md:mt-24',
    'md:col-span-5 md:col-start-2',
    'md:col-span-4',
    'md:col-span-6 md:col-start-4',
  ]

  return (
    <>
      <TopNav activeSection="directives" />
      <main className="pt-24 pb-32 px-6 md:px-24 max-w-6xl mx-auto">
        <header className="mb-24 mt-12">
          <p className="font-label uppercase tracking-[0.4em] text-[10px] text-primary mb-4">
            Chapter V: Synthesis
          </p>
          <h2 className="font-headline text-5xl md:text-7xl font-light tracking-tight leading-none text-on-surface max-w-4xl">
            The Canvas <span className="italic">Moment</span>
          </h2>
          <p className="mt-6 font-body text-lg text-secondary max-w-xl leading-relaxed">
            A distillation of your aspirations, assembled as living documents. These cards serve as the architectural blueprints for your next chapter.
          </p>
          <div className="mt-8 h-[1px] w-24 bg-outline-variant/30" />
        </header>

        {isGenerating ? (
          <div className="text-center py-24">
            <p className="font-headline text-2xl italic text-on-surface-variant animate-pulse">
              The Archivist is distilling your conversation...
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {canvasCards.map((card, index) => (
                <div
                  key={card.id}
                  className={`${gridClasses[index] || 'md:col-span-4'} group`}
                >
                  <div className="bg-surface-container-low overflow-hidden transition-all duration-500 hover:shadow-xl">
                    {/* Image placeholder */}
                    <div className="aspect-[16/10] bg-surface-container-high overflow-hidden">
                      <div className="w-full h-full bg-gradient-to-br from-primary/5 to-surface-container-highest flex items-center justify-center group-hover:scale-105 transition-transform duration-700">
                        <span className="font-headline text-6xl italic text-primary/10">
                          {card.title.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="p-8">
                      <span className={`inline-block px-3 py-1 text-[10px] font-label uppercase tracking-widest mb-4 ${CATEGORY_COLORS[card.category] || 'bg-surface-container text-secondary'}`}>
                        {card.category}
                      </span>
                      <h3 className="font-headline text-2xl text-on-surface mb-3">{card.title}</h3>
                      <p className="font-body text-sm text-secondary leading-relaxed">{card.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-16 text-center space-y-6">
              <p className="font-headline text-xl italic text-on-surface-variant">
                Does this feel right? Anything missing?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <button
                  onClick={() => router.push('/wealth-whisper')}
                  className="px-12 py-5 bg-primary text-on-primary font-label text-xs uppercase tracking-[0.3em] hover:bg-primary-container transition-all duration-500 shadow-lg"
                >
                  Archive & Proceed
                </button>
                <button className="font-label text-xs uppercase tracking-[0.2em] text-secondary hover:text-primary transition-colors border-b border-transparent hover:border-primary pb-1">
                  Refine Details
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </>
  )
}
