'use client'

import Link from 'next/link'

interface TopNavProps {
  activeSection?: 'heritage' | 'directives' | 'legacy'
}

export function TopNav({ activeSection = 'directives' }: TopNavProps) {
  return (
    <nav className="bg-surface fixed top-0 left-0 w-full flex justify-between items-center px-10 py-6 z-50">
      <Link href="/" className="font-headline text-2xl tracking-tighter text-on-surface">
        The Archivist
      </Link>
      <div className="hidden md:flex space-x-12">
        {['Heritage', 'Directives', 'Legacy'].map((item) => (
          <span
            key={item}
            className={`font-headline font-light tracking-tight text-lg cursor-pointer transition-colors duration-300 ${
              activeSection === item.toLowerCase()
                ? 'text-primary font-medium'
                : 'text-on-surface/60 hover:text-primary'
            }`}
          >
            {item}
          </span>
        ))}
      </div>
      <button className="text-primary">
        <span className="material-symbols-outlined">menu</span>
      </button>
    </nav>
  )
}
