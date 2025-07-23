'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  const switchLanguage = (newLocale: string) => {
    // Guardar en cookies
    document.cookie = `locale=${newLocale}; path=/; max-age=${60 * 60 * 24 * 365}` // 1 año
    
    // Recargar la página para aplicar el cambio
    window.location.reload()
  }

  return (
    <div className="flex border-2 border-black" style={{ boxShadow: '3px 3px 0 #000000' }}>
      <button 
        onClick={() => switchLanguage('es')}
        className={`px-3 py-2 font-black text-xs uppercase transition-all border-r border-black ${
          locale === 'es' 
            ? 'bg-orange-500 text-black' 
            : 'bg-white text-black hover:bg-yellow-400'
        }`}
      >
        🇪🇸 ES
      </button>
      <button 
        onClick={() => switchLanguage('en')}
        className={`px-3 py-2 font-black text-xs uppercase transition-all ${
          locale === 'en' 
            ? 'bg-orange-500 text-black' 
            : 'bg-white text-black hover:bg-yellow-400'
        }`}
      >
        🇺🇸 EN
      </button>
    </div>
  )
}