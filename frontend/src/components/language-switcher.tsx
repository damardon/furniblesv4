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
    <div className="flex items-center space-x-4">
      <button 
        onClick={() => switchLanguage('es')}
        className={`text-sm transition-colors ${
          locale === 'es' 
            ? 'text-orange-600 dark:text-orange-400 font-semibold' 
            : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
        }`}
      >
        🇪🇸 ES
      </button>
      <span className="text-gray-300">|</span>
      <button 
        onClick={() => switchLanguage('en')}
        className={`text-sm transition-colors ${
          locale === 'en' 
            ? 'text-orange-600 dark:text-orange-400 font-semibold' 
            : 'text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'
        }`}
      >
        🇺🇸 EN
      </button>
    </div>
  )
}