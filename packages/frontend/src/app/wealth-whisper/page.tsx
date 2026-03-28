'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopNav } from '@/components/layout/TopNav'
import { useSessionStore } from '@/store/sessionStore'
import { api } from '@/lib/api'

export default function WealthWhisperPage() {
  const [totalAssets, setTotalAssets] = useState('')
  const [annualPension, setAnnualPension] = useState('')
  const [retirementAge, setRetirementAge] = useState('')
  const [retirementYear, setRetirementYear] = useState('')
  const [fixedSpend, setFixedSpend] = useState('')
  const [discretionarySpend, setDiscretionarySpend] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { sessionId, setFinancialData } = useSessionStore()

  const handleSubmit = async () => {
    if (!sessionId || isSubmitting) return
    if (!totalAssets || !retirementAge || !fixedSpend) return

    setIsSubmitting(true)
    const data = {
      totalAssets: parseFloat(totalAssets),
      annualPension: parseFloat(annualPension) || 0,
      targetRetirementAge: parseInt(retirementAge),
      targetRetirementYear: parseInt(retirementYear) || new Date().getFullYear() + (parseInt(retirementAge) - 55),
      fixedAnnualSpend: parseFloat(fixedSpend),
      discretionaryAnnualSpend: parseFloat(discretionarySpend) || 0,
    }

    try {
      await api.saveFinancial(sessionId, data)
      setFinancialData(data)
      router.push('/synthesizing')
    } catch (err) {
      console.error('Failed to save financial data:', err)
      setIsSubmitting(false)
    }
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    if (isNaN(num)) return ''
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(num)
  }

  return (
    <>
      <TopNav activeSection="directives" />
      <main className="pt-24 pb-32 px-6 md:px-24 max-w-5xl mx-auto">
        <header className="mb-24 mt-12">
          <p className="font-label uppercase tracking-[0.4em] text-[10px] text-primary mb-4">
            Chapter VI: Provision
          </p>
          <h2 className="font-headline text-5xl md:text-7xl font-light tracking-tight leading-none text-on-surface max-w-4xl">
            The Wealth Whisper
          </h2>
          <p className="mt-6 font-body text-lg text-secondary max-w-xl leading-relaxed">
            A quiet conversation of numbers and intent. Let us define the weight of your tangible assets today.
          </p>
          <div className="mt-8 h-[1px] w-24 bg-outline-variant/30" />
        </header>

        <div className="space-y-24 max-w-4xl">
          {/* Exchange 1: Assets */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-3">
              <span className="font-label uppercase tracking-widest text-[9px] text-outline opacity-60">The Archivist</span>
            </div>
            <div className="md:col-span-9 space-y-8">
              <blockquote className="font-headline text-2xl italic font-light text-on-surface-variant leading-relaxed">
                &ldquo;In the quiet inventory of one&rsquo;s life, how do you define the weight of your tangible assets today?&rdquo;
              </blockquote>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-3">
                    Total Assets
                  </label>
                  <input
                    type="number"
                    value={totalAssets}
                    onChange={(e) => setTotalAssets(e.target.value)}
                    placeholder="e.g. 1200000"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-headline text-2xl italic py-3 placeholder:text-outline/30"
                  />
                  {totalAssets && (
                    <p className="mt-2 font-body text-sm text-primary">{formatCurrency(totalAssets)}</p>
                  )}
                </div>
                <div>
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-3">
                    Annual Pension
                  </label>
                  <input
                    type="number"
                    value={annualPension}
                    onChange={(e) => setAnnualPension(e.target.value)}
                    placeholder="e.g. 25000"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-headline text-2xl italic py-3 placeholder:text-outline/30"
                  />
                  {annualPension && (
                    <p className="mt-2 font-body text-sm text-primary">{formatCurrency(annualPension)}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Exchange 2: Timing */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-3">
              <span className="font-label uppercase tracking-widest text-[9px] text-outline opacity-60">The Archivist</span>
            </div>
            <div className="md:col-span-9 space-y-8">
              <blockquote className="font-headline text-2xl italic font-light text-on-surface-variant leading-relaxed">
                &ldquo;Consider the sunset of your formal toiler. When does the transition to presence and legacy begin?&rdquo;
              </blockquote>
              <div className="grid grid-cols-2 gap-8">
                <div className="bg-surface-container-low p-8 text-center">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-3">
                    Retirement Age
                  </label>
                  <input
                    type="number"
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(e.target.value)}
                    placeholder="64"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-headline text-5xl text-center py-3 placeholder:text-outline/30"
                  />
                </div>
                <div className="bg-surface-container-low p-8 text-center">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-3">
                    Target Year
                  </label>
                  <input
                    type="number"
                    value={retirementYear}
                    onChange={(e) => setRetirementYear(e.target.value)}
                    placeholder="2032"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-headline text-5xl text-center py-3 placeholder:text-outline/30"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Exchange 3: Spending */}
          <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-3">
              <span className="font-label uppercase tracking-widest text-[9px] text-outline opacity-60">The Archivist</span>
            </div>
            <div className="md:col-span-9 space-y-8">
              <blockquote className="font-headline text-2xl italic font-light text-on-surface-variant leading-relaxed">
                &ldquo;To sustain this rhythm of life, what is the annual requirement? Let us define the cost of your contentment.&rdquo;
              </blockquote>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-low p-8">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-1">
                    Fixed Sustenance
                  </label>
                  <p className="font-body text-[10px] text-outline mb-4">Mortgage, bills, insurance, essentials</p>
                  <input
                    type="number"
                    value={fixedSpend}
                    onChange={(e) => setFixedSpend(e.target.value)}
                    placeholder="e.g. 45000"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-headline text-2xl italic py-3 placeholder:text-outline/30"
                  />
                  {fixedSpend && (
                    <p className="mt-2 font-body text-sm text-primary">{formatCurrency(fixedSpend)}</p>
                  )}
                </div>
                <div className="bg-surface-container-low p-8">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant block mb-1">
                    Discretionary Joy
                  </label>
                  <p className="font-body text-[10px] text-outline mb-4">Travel, hobbies, dining, experiences</p>
                  <input
                    type="number"
                    value={discretionarySpend}
                    onChange={(e) => setDiscretionarySpend(e.target.value)}
                    placeholder="e.g. 30000"
                    className="w-full bg-transparent border-0 border-b border-outline-variant focus:border-primary focus:ring-0 font-headline text-2xl italic py-3 placeholder:text-outline/30"
                  />
                  {discretionarySpend && (
                    <p className="mt-2 font-body text-sm text-primary">{formatCurrency(discretionarySpend)}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Submit */}
          <section className="text-center pt-12 pb-24 border-t border-outline-variant/30">
            <p className="font-headline text-xl italic text-on-surface-variant mb-8">
              The dialogue continues in the Vault.
            </p>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !totalAssets || !retirementAge || !fixedSpend}
              className="px-12 py-5 bg-primary text-on-primary font-label text-xs uppercase tracking-[0.3em] hover:bg-primary-container transition-all duration-500 shadow-lg disabled:opacity-40"
            >
              Archive this Chapter
            </button>
          </section>
        </div>
      </main>
    </>
  )
}
