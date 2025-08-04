'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Languages } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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

  // Obtener la bandera del idioma actual
  const getCurrentFlag = () => {
    return locale === 'es' ? '🇪🇸' : '🇺🇸'
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center gap-2 px-3 py-3 bg-white border-2 border-black hover:bg-yellow-400 transition-all font-black"
          style={{ boxShadow: '3px 3px 0 #000000' }}
          title="Cambiar idioma"
        >
          <Languages className="h-4 w-4 text-black" />
          <span className="text-sm">{getCurrentFlag()}</span>
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-40 bg-white border-2 border-black p-1" 
        align="end" 
        style={{ boxShadow: '3px 3px 0 #000000' }}
      >
        <DropdownMenuItem 
          onClick={() => switchLanguage('es')}
          className={`cursor-pointer font-bold px-3 py-2 flex items-center gap-2 ${
            locale === 'es' 
              ? 'bg-orange-500 text-black' 
              : 'text-black hover:bg-yellow-400'
          }`}
        >
          <span className="text-lg">🇪🇸</span>
          <span className="text-sm uppercase">Español</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => switchLanguage('en')}
          className={`cursor-pointer font-bold px-3 py-2 flex items-center gap-2 ${
            locale === 'en' 
              ? 'bg-orange-500 text-black' 
              : 'text-black hover:bg-yellow-400'
          }`}
        >
          <span className="text-lg">🇺🇸</span>
          <span className="text-sm uppercase">English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}